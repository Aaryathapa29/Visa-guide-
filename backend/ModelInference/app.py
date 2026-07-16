"""
app.py — FastAPI backend for Visa Guide Chatbot
================================================
LLM:        Groq — free tier, llama-3.3-70b (with a fast fallback model)
Embeddings: sentence-transformers — local, no API
Vector DB:  ChromaDB — local
Chat logs:  PostgreSQL (SQLAlchemy, see database.py) — degrades gracefully

Run: uvicorn app:app --reload --port 8001
"""

import os
import re
import shutil
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import psycopg2

from rag import RAGEngine, detect_country

load_dotenv()  # reads your .env file
from database import save_message, get_chat_history

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/visa_chatbot"
)

# Groq model — currently supported names
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FALLBACK_GROQ_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant")

SYSTEM_PROMPT = """You are **Visa Guide**, a friendly assistant that helps students understand
the process of getting a student visa for the **USA (F-1)**, **Australia (Subclass 500)**, and
**Canada (study permit)**.

## How to answer
- **When the numbered CONTEXT contains relevant passages:** answer using ONLY that context, treat it
  as your source of truth, cite the passages you use with `[n]`, and never invent fees, dates,
  amounts, or requirements.
- **When the CONTEXT has no relevant passages** (for example it says "No relevant information
  found"): you may answer from your own general knowledge. In that case, add a brief note that this
  is general guidance not drawn from the official documents, do NOT invent citation numbers, and
  remind the user to confirm the details on the official government website.
- **Use the conversation history** provided below to stay consistent and to understand follow-up
  questions (for example "what about Canada?" asked right after a question about the USA).
- Money, dates, and rules change often. When you give a specific fee or figure, remind the user to
  **verify it on the official government website**.

## Citations (required)
- Every factual sentence that uses the context must end with a citation marker like `[1]`, `[2]`
  that matches the numbered passage(s) you used. Cite multiple when relevant, e.g. `[1][3]`.
- Only cite numbers that actually appear in the provided context. Never fabricate citation numbers.
- Do not add a "Sources" section yourself — the app renders sources separately.

## Formatting (Markdown)
- Respond in clean **GitHub-flavored Markdown** (headings, bullet/numbered lists, tables, bold).
- Use bullet lists for requirements/documents and numbered lists for step-by-step processes.
- Bold the key terms (fees, form names, thresholds). Keep paragraphs short.
- Do **not** use em dashes (—) or en dashes (–). Use commas, periods, parentheses, or hyphens (-).

## Scope & tone
- Stay on topic: student visas, immigration steps, documents, finances, work rights, and studying
  abroad for the USA, Australia, and Canada only. Politely decline anything unrelated.
- Respond to greetings warmly and briefly. You provide **general information, not legal advice**.

## Official websites
- USA:       https://travel.state.gov
- Australia: https://immi.homeaffairs.gov.au
- Canada:    https://www.canada.ca/en/immigration-refugees-citizenship.html
"""

ALLOWED_COUNTRIES = ["USA", "Australia", "Canada"]
ALLOWED_UPLOAD_EXTS = (".pdf", ".md", ".markdown", ".txt")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Visa Guide Chatbot", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances (created on startup)
groq_client: Groq         | None = None
rag_engine:  RAGEngine    | None = None


# ── PostgreSQL helpers (for /history read endpoint) ───────────────────────────
def get_db_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    try:
        conn = get_db_conn()
        conn.close()
        print("[db] PostgreSQL connection ready ✓")
    except Exception as e:
        print(f"[db] Could not connect to PostgreSQL: {e}")
        print("[db] Chat will still work — just won't save history.")


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global groq_client, rag_engine

    if not GROQ_API_KEY:
        print("[app] WARNING: GROQ_API_KEY not set in .env!")
        return

    print("STEP 1 - Startup begins")
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("STEP 2 - Groq client created")
    rag_engine = RAGEngine()
    print("STEP 3 - RAG engine ready")
    init_db()
    print("STEP 4 - Database checked")
    print("[app] Ready ✓")


# ── Request/Response models ───────────────────────────────────────────────────
class Turn(BaseModel):
    role: str = "user"   # "user" or "bot"/"assistant"
    text: str = ""


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    # Optional recent conversation turns supplied by the client. When present they
    # are used as memory even if the database is unavailable.
    history: list[Turn] | None = None


class Source(BaseModel):
    n:       int
    title:   str
    source:  str
    country: str
    url:     str = ""
    score:   float
    snippet: str = ""


class ChatResponse(BaseModel):
    answer:  str
    country: str | None = None
    sources: list[Source] = []


class UploadResponse(BaseModel):
    message:       str
    country:       str
    chunks_stored: int
    total_chunks:  int


# ── Helpers ───────────────────────────────────────────────────────────────────
def require_ready():
    if not groq_client or not rag_engine:
        raise HTTPException(
            503,
            detail="Server not ready. Add GROQ_API_KEY to your .env file and restart."
        )


def _call_groq(system_prompt: str, user_prompt: str) -> str:
    """Call Groq with a primary model and a fast fallback if the first errors."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt},
    ]
    try:
        resp = groq_client.chat.completions.create(
            model=GROQ_MODEL, messages=messages, max_tokens=900, temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as first_error:
        try:
            resp = groq_client.chat.completions.create(
                model=FALLBACK_GROQ_MODEL, messages=messages, max_tokens=900, temperature=0.3,
            )
            return resp.choices[0].message.content.strip()
        except Exception as fallback_error:
            raise HTTPException(
                502, f"Groq LLM error: {first_error} | fallback: {fallback_error}"
            ) from fallback_error


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Visa Guide Chatbot is running!", "docs": "/docs"}


@app.get("/health")
def health():
    stats = rag_engine.stats() if rag_engine else {}
    return {
        "status":    "ok",
        "rag_ready": rag_engine is not None,
        "llm":       GROQ_MODEL,
        **stats,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    require_ready()

    message = req.message.strip()
    if not message:
        raise HTTPException(400, "Message cannot be empty.")
    if len(message) > 1000:
        raise HTTPException(400, "Message too long. Keep it under 1000 characters.")

    session_id = (req.session_id or "default").strip() or "default"
    country = detect_country(message)

    # Conversation memory: prefer client-supplied turns (works even without a DB),
    # otherwise fall back to server-side history stored in PostgreSQL.
    if req.history:
        turns = [t for t in req.history[-10:] if t.text.strip()]
        history_block = "\n".join(
            f"{'assistant' if t.role in ('bot', 'assistant') else 'user'}: {t.text.strip()}"
            for t in turns
        )
    else:
        history_messages = get_chat_history(session_id, limit=10)
        history_block = "\n".join(
            f"{item['sender']}: {item['message']}" for item in history_messages
        )
    history_block = history_block or "No prior conversation history."

    # Retrieve relevant chunks → numbered context + structured sources
    try:
        context, sources = rag_engine.build_context(message)
    except Exception as e:
        raise HTTPException(502, f"Retrieval error: {e}")

    user_prompt = (
        "Answer the student's question using ONLY the numbered CONTEXT passages below. "
        "If the context has no relevant passages, answer from your general knowledge and say so. "
        "Cite the passages you use with [n] markers.\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"Conversation so far:\n{history_block}\n\n"
        "---\n\n"
        f"Student's question: {message}"
    )

    answer = _call_groq(SYSTEM_PROMPT, user_prompt)

    # Guarantee no em/en dashes reach the UI, whatever the model produced.
    answer = answer.replace(" — ", ", ").replace(" – ", ", ").replace("—", "-").replace("–", "-")

    # Only return sources the model actually cited; else return all retrieved.
    cited = {int(n) for n in re.findall(r"\[(\d+)\]", answer)}
    shown = [s for s in sources if s["n"] in cited] or sources

    save_message(session_id, "user", message)
    save_message(session_id, "assistant", answer)

    return ChatResponse(answer=answer, country=country, sources=shown)


@app.post("/upload", response_model=UploadResponse)
async def upload(
    file:    UploadFile = File(...),
    country: str        = Form(...),
):
    """Accept a PDF/Markdown/TXT document, chunk it, embed locally, store in ChromaDB."""
    require_ready()

    if country not in ALLOWED_COUNTRIES:
        raise HTTPException(400, f"country must be one of {ALLOWED_COUNTRIES}. Got: '{country}'")
    name = (file.filename or "").lower()
    if not name.endswith(ALLOWED_UPLOAD_EXTS):
        raise HTTPException(400, f"Only these file types are accepted: {', '.join(ALLOWED_UPLOAD_EXTS)}")

    suffix = Path(name).suffix or ".pdf"
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)
        chunks_stored = rag_engine.ingest_uploaded_document(tmp_path, country, original_name=file.filename)
        tmp_path.unlink(missing_ok=True)
    except Exception as e:
        raise HTTPException(500, f"Ingest failed: {e}")

    stats = rag_engine.stats()
    return UploadResponse(
        message=f"'{file.filename}' successfully ingested for {country}.",
        country=country,
        chunks_stored=chunks_stored,
        total_chunks=stats["total_chunks"],
    )


@app.get("/history")
def history(limit: int = 50):
    """Returns the last N messages from PostgreSQL."""
    try:
        conn = get_db_conn()
        cur  = conn.cursor()
        cur.execute(
            "SELECT session_id, sender, message, timestamp "
            "FROM chat_history ORDER BY timestamp DESC LIMIT %s",
            (limit,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"messages": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(503, f"Database unavailable: {e}")
