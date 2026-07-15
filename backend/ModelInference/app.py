"""
app.py — FastAPI backend for Visa Guide Chatbot (College Project)
=================================================================
LLM:      Groq — free tier, uses llama-3.3-70b
Embeddings: sentence-transformers — local, no API
Vector DB:  ChromaDB — local
Chat logs:  PostgreSQL

Run: uvicorn app:app --reload --port 8001
"""

import os
import shutil
import tempfile
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import psycopg2

from rag import RAGEngine, detect_country, embed

load_dotenv()  # reads your .env file
from database import save_message, get_chat_history

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/visa_chatbot"
)

# Groq model — free tier, very fast
GROQ_MODEL = "llama3-8b-8192"

SYSTEM_PROMPT = """You are a visa guidance assistant for a college student project.
Only answer questions about student visas, immigration, documents, application steps,
and study abroad for USA, Australia, and Canada.

Rules:
- Answer using ONLY the context provided. Never invent fees, dates, or requirements.
- If the context does not have the answer, say "I don't have that information — please check the official website."
- Always remind users to verify on official government websites since rules change.
- Be concise and friendly. Use bullet points when listing multiple things.
- If asked something unrelated to student visas or study abroad, politely decline.
- Do not give legal advice.

Official websites:
  USA:       https://travel.state.gov
  Australia: https://immi.homeaffairs.gov.au
  Canada:    https://www.canada.ca/en/immigration-refugees-citizenship.html
"""

# Keywords that indicate a visa-related question
VISA_KEYWORDS = [
    "visa", "study", "student", "university", "college", "canada", "australia",
    "usa", "america", "application", "document", "passport", "interview",
    "ielts", "toefl", "scholarship", "immigration", "permit", "tuition",
    "bank", "financial", "processing", "sevis", "i-20", "coe", "dli",
    "opt", "cpt", "gic", "subclass 500", "f-1", "study permit", "oshc",
    "how long", "how much", "do i need", "what is", "fee", "cost", "requirement",
]

ALLOWED_COUNTRIES = ["USA", "Australia", "Canada"]

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Visa Guide Chatbot — College Project", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection(name="documents")

# Global instances (created on startup)
groq_client: Groq         | None = None
rag_engine:  RAGEngine    | None = None


# ── PostgreSQL helpers ────────────────────────────────────────────────────────

def get_db_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    """Check the database connection on startup."""
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
    print("STEP 3 - RAG engine created")

    init_db()
    print("STEP 4 - Database initialized")

    print("[app] Ready ✓")


# ── Request/Response models ───────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer:  str
    country: str | None = None


class UploadResponse(BaseModel):
    message:       str
    country:       str
    chunks_stored: int
    total_chunks:  int


# ── Helpers ───────────────────────────────────────────────────────────────────
def is_visa_question(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in VISA_KEYWORDS)


def require_ready():
    if not groq_client or not rag_engine:
        raise HTTPException(
            503,
            detail="Server not ready. Add GROQ_API_KEY to your .env file and restart."
        )


def build_chroma_context(question: str, top_k: int = 3) -> str:
    query_embedding = embed([question])[0]
    results = chroma_collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents", [])
    metadatas = results.get("metadatas", [])
    distances = results.get("distances", [])

    if not documents or not documents[0]:
        return "No relevant documents were found in the knowledge base."

    chunks = []
    for doc, meta, dist in zip(documents[0], metadatas[0], distances[0]):
        source = meta.get("source", "unknown") if isinstance(meta, dict) else "unknown"
        country = meta.get("country", "Unknown") if isinstance(meta, dict) else "Unknown"
        relevance = round(1 - dist, 4) if isinstance(dist, float) else None
        score_text = f" (relevance: {relevance})" if relevance is not None else ""
        chunks.append(f"[Source: {country} / {source}]{score_text}
{doc}")

    return "

---

".join(chunks)


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

    history_messages = get_chat_history(session_id, limit=10)
    history_block = "
".join(
        f"{item['sender']}: {item['message']}" for item in history_messages
    ) if history_messages else "No prior conversation history."

    context_block = build_chroma_context(message, top_k=3)
    system_prompt = (
        f"{SYSTEM_PROMPT}

"
        f"Relevant document context:
{context_block}

"
        f"Conversation history:
{history_block}"
    )

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            max_tokens=700,
            temperature=0.3,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(502, f"Groq LLM error: {e}")

    save_message(session_id, "user", message)
    save_message(session_id, "assistant", answer)

    return ChatResponse(answer=answer, country=country)


@app.post("/upload", response_model=UploadResponse)
async def upload(
    file:    UploadFile = File(...),
    country: str        = Form(...),
):
    """
    Acceptance criteria endpoint:
      1. Accept a PDF upload
      2. Extract and chunk the text
      3. Generate embeddings locally
      4. Store in ChromaDB
    """
    require_ready()

    if country not in ALLOWED_COUNTRIES:
        raise HTTPException(400, f"country must be one of {ALLOWED_COUNTRIES}. Got: '{country}'")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        chunks_stored = rag_engine.ingest_uploaded_pdf(tmp_path, country)
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
