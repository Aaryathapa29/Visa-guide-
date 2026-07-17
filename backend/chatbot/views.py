"""
views.py - chatbot HTTP endpoints (DRF)
=======================================
Ports the four FastAPI endpoints (/chat, /upload, /health, /history) to Django
REST Framework, keeping the exact request/response shapes the frontend expects.

These endpoints are public: authentication_classes is empty (no JWT parsing) and
permission_classes is empty (AllowAny). With no SessionAuthentication in play,
DRF does not enforce CSRF, so the React app can POST directly.
"""

import re
import tempfile
from pathlib import Path

from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import ChatMessage
from .rag import detect_country

MAX_MESSAGE_LEN = 1000


def _dash_free(text: str) -> str:
    """Guarantee no em/en dashes reach the UI, whatever the model produced."""
    return (
        text.replace(" — ", ", ")
            .replace(" – ", ", ")
            .replace("—", "-")
            .replace("–", "-")
    )


class ChatView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not services.is_ready():
            return Response(
                {"detail": "Server not ready. Add GROQ_API_KEY to backend/.env and restart."},
                status=503,
            )

        data = request.data or {}
        message = str(data.get("message", "")).strip()
        if not message:
            return Response({"detail": "Message cannot be empty."}, status=400)
        if len(message) > MAX_MESSAGE_LEN:
            return Response({"detail": "Message too long. Keep it under 1000 characters."}, status=400)

        session_id = (str(data.get("session_id") or "default")).strip() or "default"

        # Prior conversation turns: prefer client-supplied turns (works even
        # without a DB), otherwise fall back to server-side history.
        raw_history = data.get("history")
        if raw_history:
            turns = [
                {"role": t.get("role", "user"), "text": str(t.get("text", "")).strip()}
                for t in raw_history[-10:]
                if str(t.get("text", "")).strip()
            ]
        else:
            turns = [
                {"role": "assistant" if h["sender"] in ("assistant", "bot") else "user",
                 "text": h["message"]}
                for h in services.get_chat_history(session_id, limit=10)
            ]

        # History-aware retrieval: rewrite follow-ups ("what about Canada?") into a
        # standalone query so the vector search uses conversation context, not just
        # the last message. Plain, self-contained questions skip the rewrite.
        retrieval_query = message
        if turns and services.looks_like_followup(message):
            retrieval_query = services.condense_query(turns, message)
        country = detect_country(retrieval_query)

        # Retrieve relevant chunks -> numbered context + structured sources.
        try:
            engine = services.get_rag_engine()
            context, sources = engine.build_context(message, retrieval_query=retrieval_query)
        except Exception as e:
            return Response({"detail": f"Retrieval error: {e}"}, status=502)

        user_prompt = (
            "Answer the student's question using ONLY the numbered CONTEXT passages below. "
            "If the context has no relevant passages, answer from your general knowledge and say so. "
            "Cite the passages you use with [n] markers.\n\n"
            f"CONTEXT:\n{context}\n\n"
            "---\n\n"
            f"Student's question: {message}"
        )

        try:
            answer = services.call_groq(services.SYSTEM_PROMPT, user_prompt, history=turns)
        except services.GroqError as e:
            return Response({"detail": str(e)}, status=502)

        answer = _dash_free(answer)

        # Only return sources the model actually cited; else return all retrieved.
        cited = {int(n) for n in re.findall(r"\[(\d+)\]", answer)}
        shown = [s for s in sources if s["n"] in cited] or sources

        services.save_message(session_id, "user", message)
        services.save_message(session_id, "assistant", answer)

        return Response({"answer": answer, "country": country, "sources": shown}, status=200)


class UploadView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Accept a PDF/Markdown/TXT document, chunk it, embed locally, store it."""
        if not services.is_ready():
            return Response(
                {"detail": "Server not ready. Add GROQ_API_KEY to backend/.env and restart."},
                status=503,
            )

        upload = request.FILES.get("file")
        country = str(request.data.get("country", "")).strip()

        if upload is None:
            return Response({"detail": "No file provided."}, status=400)
        if country not in services.ALLOWED_COUNTRIES:
            return Response(
                {"detail": f"country must be one of {services.ALLOWED_COUNTRIES}. Got: '{country}'"},
                status=400,
            )
        name = (upload.name or "").lower()
        if not name.endswith(services.ALLOWED_UPLOAD_EXTS):
            return Response(
                {"detail": f"Only these file types are accepted: {', '.join(services.ALLOWED_UPLOAD_EXTS)}"},
                status=400,
            )

        suffix = Path(name).suffix or ".pdf"
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in upload.chunks():
                    tmp.write(chunk)
                tmp_path = Path(tmp.name)
            engine = services.get_rag_engine()
            chunks_stored = engine.ingest_uploaded_document(
                tmp_path, country, original_name=upload.name
            )
            tmp_path.unlink(missing_ok=True)
        except Exception as e:
            return Response({"detail": f"Ingest failed: {e}"}, status=500)

        stats = engine.stats()
        return Response(
            {
                "message": f"'{upload.name}' successfully ingested for {country}.",
                "country": country,
                "chunks_stored": chunks_stored,
                "total_chunks": stats["total_chunks"],
            },
            status=200,
        )


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        # Report readiness WITHOUT forcing the heavy RAG engine to load. Stats are
        # only included once the engine has already been initialized by a request.
        stats = services._rag_engine.stats() if services._rag_engine is not None else {}
        return Response(
            {
                "status": "ok",
                "configured": services.is_ready(),
                "rag_ready": services._rag_engine is not None,
                "llm": services.GROQ_MODEL,
                **stats,
            }
        )


class HistoryView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 50))
        except (TypeError, ValueError):
            limit = 50
        limit = max(1, min(limit, 200))

        qs = ChatMessage.objects.all()
        session_id = request.query_params.get("session_id")
        if session_id:
            qs = qs.filter(session_id=session_id)

        rows = qs.order_by("-timestamp")[:limit]
        messages = [
            {
                "session_id": r.session_id,
                "sender": r.sender,
                "message": r.message,
                "timestamp": r.timestamp.isoformat(),
            }
            for r in rows
        ]
        return Response({"messages": messages})
