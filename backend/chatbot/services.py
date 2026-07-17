"""
services.py - chatbot config, lazy clients, and chat-history helpers
====================================================================
Everything heavy (Groq client, RAG engine) is created lazily on first use so
Django starts up fast. Chat history is stored via the Django ORM (ChatMessage)
instead of the old SQLAlchemy/PostgreSQL layer.
"""

import logging

from django.conf import settings

from .rag import RAGEngine
from .models import ChatMessage

logger = logging.getLogger("chatbot")

# ── Config (read from Django settings, which loads backend/.env) ───────────────
GROQ_API_KEY        = getattr(settings, "GROQ_API_KEY", None)
GROQ_MODEL          = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
FALLBACK_GROQ_MODEL = getattr(settings, "GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant")

ALLOWED_COUNTRIES    = ["USA", "Australia", "Canada"]
ALLOWED_UPLOAD_EXTS  = (".pdf", ".md", ".markdown", ".txt")

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
- **When the country is ambiguous** (the user asks about "a student visa" without naming USA,
  Australia, or Canada), ask one brief clarifying question naming the three supported countries
  before answering in depth.
- **When comparing countries**, structure the answer so each country is easy to scan, using short
  per-country sections or a compact table.

## Citations (required)
- Every factual sentence that uses the context must end with a citation marker like `[1]`, `[2]`
  that matches the numbered passage(s) you used. Cite multiple when relevant, e.g. `[1][3]`.
- Only cite numbers that actually appear in the provided context. Never fabricate citation numbers.
- Do not add a "Sources" section yourself; the app renders sources separately.

## Formatting (Markdown)
- Respond in clean **GitHub-flavored Markdown** (headings, bullet/numbered lists, tables, bold).
- Use bullet lists for requirements/documents and numbered lists for step-by-step processes.
- Bold the key terms (fees, form names, thresholds). Keep paragraphs short.
- Do **not** use long dashes of any kind. Use commas, periods, parentheses, or hyphens (-) instead.

## Scope & tone
- Stay on topic: student visas, immigration steps, documents, finances, work rights, and studying
  abroad for the USA, Australia, and Canada only. Politely decline anything unrelated.
- Respond to greetings warmly and briefly. You provide **general information, not legal advice**.

## Official websites
- USA:       https://travel.state.gov
- Australia: https://immi.homeaffairs.gov.au
- Canada:    https://www.canada.ca/en/immigration-refugees-citizenship.html
"""


# ── Lazy singletons ───────────────────────────────────────────────────────────
_groq_client = None
_rag_engine = None


def is_ready() -> bool:
    """The chatbot can answer only if a Groq API key is configured."""
    return bool(GROQ_API_KEY)


def get_groq_client():
    """Create the Groq client once, on first use."""
    global _groq_client
    if _groq_client is None:
        if not GROQ_API_KEY:
            return None
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client created")
    return _groq_client


def get_rag_engine() -> RAGEngine:
    """Build the RAG engine (embedding model + ChromaDB) once, on first use.

    The first call is slow (it loads the embedding model and, on a fresh machine,
    embeds the knowledge base into ChromaDB). Every call after that is instant.
    """
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    return _rag_engine


# ── Groq call with fallback ───────────────────────────────────────────────────
class GroqError(Exception):
    """Raised when both the primary and fallback Groq models fail."""


def _to_messages(system_prompt: str, user_prompt: str, history=None) -> list[dict]:
    """Assemble a proper chat messages array: system, prior turns, then the
    current turn. Passing real user/assistant turns (instead of stuffing them
    into one text blob) gives the model genuine multi-turn context."""
    messages = [{"role": "system", "content": system_prompt}]
    for t in (history or []):
        text = str(t.get("text", "")).strip()
        if not text:
            continue
        role = "assistant" if t.get("role") in ("bot", "assistant") else "user"
        messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": user_prompt})
    return messages


def call_groq(system_prompt: str, user_prompt: str, history=None) -> str:
    """Call Groq with a primary model and a fast fallback if the first errors."""
    client = get_groq_client()
    if client is None:
        raise GroqError("GROQ_API_KEY is not configured.")

    messages = _to_messages(system_prompt, user_prompt, history)
    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL, messages=messages, max_tokens=900, temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as first_error:
        try:
            resp = client.chat.completions.create(
                model=FALLBACK_GROQ_MODEL, messages=messages, max_tokens=900, temperature=0.3,
            )
            return resp.choices[0].message.content.strip()
        except Exception as fallback_error:
            raise GroqError(
                f"Groq LLM error: {first_error} | fallback: {fallback_error}"
            ) from fallback_error


# ── History-aware retrieval ───────────────────────────────────────────────────
# Deictic / follow-up cues that signal the message leans on earlier turns and so
# makes a poor standalone search query on its own (for example "what about there?").
_FOLLOWUP_CUES = (
    "what about", "how about", "what if", "and ", "also", "instead", "same",
    " it", "it ", "its ", "they", "them", "there", "that", "those", "this",
)
_CONDENSE_SYSTEM = (
    "You rewrite a user's follow-up into a single standalone search query for a student-visa "
    "knowledge base covering the USA, Australia, and Canada. Use the conversation to resolve "
    "references like 'it', 'there', or 'that country', and name the specific country when it is "
    "implied. Reply with ONLY the rewritten query, no preamble."
)


def looks_like_followup(message: str) -> bool:
    """Heuristic: does this message depend on earlier turns (so retrieval should
    be rewritten with context)? Short messages and deictic phrases qualify."""
    m = message.lower().strip()
    if len(m.split()) <= 5:
        return True
    return any(cue in m for cue in _FOLLOWUP_CUES)


def condense_query(history, message: str) -> str:
    """Rewrite a follow-up into a standalone retrieval query using conversation
    context. Falls back to the raw message on any error or missing history."""
    client = get_groq_client()
    if client is None:
        return message
    convo = "\n".join(
        f"{'assistant' if t.get('role') in ('bot', 'assistant') else 'user'}: "
        f"{str(t.get('text', '')).strip()}"
        for t in (history or [])
        if str(t.get("text", "")).strip()
    )
    if not convo:
        return message
    prompt = f"Conversation:\n{convo}\n\nFollow-up question: {message}\n\nStandalone search query:"
    try:
        resp = client.chat.completions.create(
            model=FALLBACK_GROQ_MODEL,
            messages=[
                {"role": "system", "content": _CONDENSE_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=80,
            temperature=0,
        )
        return resp.choices[0].message.content.strip() or message
    except Exception:
        return message


# ── Chat history (Django ORM) ─────────────────────────────────────────────────
def save_message(session_id: str, sender: str, message: str) -> None:
    """Persist one turn. Never raises; history is best-effort."""
    try:
        ChatMessage.objects.create(session_id=session_id, sender=sender, message=message)
    except Exception as exc:
        logger.warning("Could not save chat message: %s", exc)


def get_chat_history(session_id: str, limit: int = 10) -> list[dict]:
    """Return the last `limit` turns for a session, oldest first."""
    try:
        rows = (
            ChatMessage.objects
            .filter(session_id=session_id)
            .order_by("-timestamp")[:limit]
        )
        items = [
            {
                "session_id": r.session_id,
                "sender": r.sender,
                "message": r.message,
                "timestamp": r.timestamp,
            }
            for r in rows
        ]
        return list(reversed(items))
    except Exception as exc:
        logger.warning("Could not read chat history: %s", exc)
        return []
