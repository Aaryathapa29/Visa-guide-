"""
app.py — FastAPI backend for the Visa Guide Chatbot.

Run with: uvicorn app:app --reload --port 8000
(Run from inside the backend/ folder.)
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

from rag import RAGEngine

# ── Config ───────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CHAT_MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = """You are a visa guidance assistant. Answer only questions related to student visas, 
immigration processes, required documents, application procedures, scholarships, and study abroad 
guidance for the USA, the UK, and Canada (the countries covered by this knowledge base). If 
information is unavailable in the provided context, state that clearly rather than guessing. 
Do not provide legal advice.

Guidelines:
- Base your answer strictly on the provided context chunks retrieved from official visa guide PDFs.
- If the context doesn't contain the answer, say so plainly and suggest checking the official 
  government immigration website for that country.
- Never invent visa requirements, fees, or processing times.
- Always remind the user that requirements can change and they should verify details on the 
  relevant official government website before making decisions.
- Be concise and use bullet points or numbered steps where helpful.
- If the question is unrelated to student visas, immigration, or study abroad topics, politely 
  decline and explain that you can only help with visa and study abroad guidance.
"""

OFFICIAL_LINKS = {
    "USA": "https://travel.state.gov",
    "UK": "https://www.gov.uk/student-visa",
    "Canada": "https://www.canada.ca/en/immigration-refugees-citizenship.html",
}

RELEVANT_KEYWORDS = [
    "visa", "study", "student", "university", "college", "canada", "uk", "britain",
    "usa", "america", "united states", "united kingdom", "application", "document",
    "passport", "interview", "ielts", "toefl", "scholarship", "immigration", "permit",
    "tuition", "living cost", "bank", "financial", "processing", "work permit",
    "sevis", "i-20", "cas", "dli", "opt", "cpt", "gic", "tier 4", "f-1", "study permit",
    "how long", "how much", "can i", "do i need", "what is", "requirements", "fee",
]

# ── App & RAG engine setup ────────────────────────────────────────────────────
app = FastAPI(title="Visa Guide Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client: OpenAI | None = None
rag_engine: RAGEngine | None = None


@app.on_event("startup")
async def startup():
    global client, rag_engine
    if not OPENAI_API_KEY:
        print("[app] WARNING: OPENAI_API_KEY is not set. /chat will return an error until it is.")
        return
    client = OpenAI(api_key=OPENAI_API_KEY)
    rag_engine = RAGEngine(client)  # builds or loads cached embeddings from backend/embeddings/


# ── Models ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


# ── Helpers ──────────────────────────────────────────────────────────────────
def is_relevant_question(message: str) -> bool:
    msg = message.lower()
    return any(kw in msg for kw in RELEVANT_KEYWORDS)


def relevant_links(context: str) -> str:
    links = [f"- {country}: {url}" for country, url in OFFICIAL_LINKS.items() if country in context]
    return "\n".join(links) if links else "\n".join(f"- {c}: {u}" for c, u in OFFICIAL_LINKS.items())


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Visa Guide Chatbot API is running. POST your question to /chat."}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "rag_loaded": rag_engine is not None,
        "chunks_indexed": len(rag_engine.chunks) if rag_engine else 0,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(message) > 1000:
        raise HTTPException(status_code=400, detail="Message too long — keep it under 1000 characters.")
    if client is None or rag_engine is None:
        raise HTTPException(
            status_code=500,
            detail="Server is not configured. Set the OPENAI_API_KEY environment variable and restart."
        )

    if not is_relevant_question(message):
        return ChatResponse(
            answer=(
                "I'm specialized in student visa and study abroad guidance for the USA, the UK, "
                "and Canada. That question seems to be outside my scope — feel free to ask me about "
                "visa documents, processing times, financial requirements, interviews, or application "
                "steps for these countries!"
            )
        )

    try:
        context = rag_engine.build_context(message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Retrieval error: {str(e)}")

    user_prompt = (
        f"Context retrieved from official visa guide documents:\n\n{context}\n\n"
        f"---\n\n"
        f"Relevant official websites to mention if appropriate:\n{relevant_links(context)}\n\n"
        f"---\n\n"
        f"User's question: {message}"
    )

    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=700,
            temperature=0.3,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return ChatResponse(answer=answer)
