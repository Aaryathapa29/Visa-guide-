"""
app.py — FastAPI backend for Visa Guide Chatbot (College Project)
=================================================================
LLM:      Groq — free tier, uses llama-3.3-70b
Embeddings: sentence-transformers — local, no API
Vector DB:  ChromaDB — local
Chat logs:  PostgreSQL

Run: uvicorn app:app --reload --port 8000
"""

import os
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

from rag import RAGEngine, detect_country

load_dotenv()  # reads your .env file

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/visa_chatbot"
)

# Groq model — free tier, very fast
GROQ_MODEL = "llama-3.3-70b-versatile"

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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances (created on startup)
groq_client: Groq         | None = None
rag_engine:  RAGEngine    | None = None


# ── PostgreSQL helpers ────────────────────────────────────────────────────────
def get_db_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    """Create tables if they don't exist. Called once on startup."""
    try:
        conn = get_db_conn()
        cur  = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id         SERIAL PRIMARY KEY,
                role       VARCHAR(10)  NOT NULL,
                message    TEXT         NOT NULL,
                country    VARCHAR(30),
                created_at TIMESTAMP    DEFAULT NOW()
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("[db] PostgreSQL table ready ✓")
    except Exception as e:
        print(f"[db] Could not connect to PostgreSQL: {e}")
        print("[db] Chat will still work — just won't save history.")


def save_to_db(role: str, message: str, country: str | None = None):
    """Save a message to PostgreSQL. Silently skips if DB is unavailable."""
    try:
        conn = get_db_conn()
        cur  = conn.cursor()
        cur.execute(
            "INSERT INTO chat_history (role, message, country) VALUES (%s, %s, %s)",
            (role, message, country),
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass  # don't crash if DB is down


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


# ── Request/Response models ───────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

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


# ── POST /chat ────────────────────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    require_ready()

    message = req.message.strip()
    if not message:
        raise HTTPException(400, "Message cannot be empty.")
    if len(message) > 1000:
        raise HTTPException(400, "Message too long. Keep it under 1000 characters.")

    country = detect_country(message)

    # Save user message to PostgreSQL
    save_to_db("user", message, country)

    # Off-topic guard
    if not is_visa_question(message):
        answer = (
            "I can only help with student visa questions for USA, Australia, and Canada. "
            "Try asking about required documents, processing times, fees, or application steps!"
        )
        save_to_db("bot", answer)
        return ChatResponse(answer=answer)

    # Retrieve relevant chunks from ChromaDB
    try:
        context = rag_engine.build_context(message)
    except Exception as e:
        raise HTTPException(502, f"Retrieval error: {e}")

    # Build the prompt
    user_prompt = (
        f"Here is relevant information from visa documents:\n\n"
        f"{context}\n\n"
        f"---\n\n"
        f"Student's question: {message}"
    )

    # Call Groq LLM (free)
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=700,
            temperature=0.3,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(502, f"Groq LLM error: {e}")

    # Save bot answer to PostgreSQL
    save_to_db("bot", answer, country)

    return ChatResponse(answer=answer, country=country)


# ── POST /upload (ACCEPTANCE CRITERIA) ────────────────────────────────────────
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


# ── GET /history ──────────────────────────────────────────────────────────────
@app.get("/history")
def history(limit: int = 50):
    """Returns the last N messages from PostgreSQL."""
    try:
        conn = get_db_conn()
        cur  = conn.cursor()
        cur.execute(
            "SELECT role, message, country, created_at "
            "FROM chat_history ORDER BY created_at DESC LIMIT %s",
            (limit,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"messages": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(503, f"Database unavailable: {e}")