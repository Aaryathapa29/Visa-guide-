# chatbot — Visa Guide RAG chatbot (Django app)

This app is the chatbot, merged into Django from the former standalone FastAPI
service (`backend/ModelInference`). It serves the same endpoints the frontend
already used, now under the Django backend instead of a separate server on :8001.

## Endpoints (mounted at `/api/chatbot/`)

| Method | Path                     | Purpose                                  |
|--------|--------------------------|------------------------------------------|
| POST   | `/api/chatbot/chat`      | Ask a question. Body: `{message, session_id?, history?}` |
| POST   | `/api/chatbot/upload`    | Ingest a PDF/MD/TXT doc. Multipart: `file`, `country` |
| GET    | `/api/chatbot/health`    | Readiness + vector-store stats           |
| GET    | `/api/chatbot/history`   | Recent chat turns                        |

## Layout

- `rag.py` — RAG engine: chunk, embed (sentence-transformers), store/retrieve (ChromaDB).
- `services.py` — config, lazy Groq + RAG singletons, the LLM call, chat-history helpers.
- `views.py` — DRF views for the four endpoints.
- `models.py` — `ChatMessage` (chat history; replaces the old SQLAlchemy table).
- `data/` — the visa knowledge base (ingested into ChromaDB on first use).
- `chroma_db/` — derived vector store, gitignored, rebuilt locally.

## Fast startup (why the model does not load on boot)

The heavy libraries (torch via sentence-transformers, chromadb) are imported
inside functions, and the embedding model + ChromaDB collection are created on
the FIRST chat/upload request, not at import time. So `runserver` and every
`manage.py` command stay fast. The first chat request is slower (it loads the
model and, on a fresh machine, embeds the knowledge base); every request after
that is instant.

## Config

Set `GROQ_API_KEY` in `backend/.env` (already gitignored). Optional overrides:
`GROQ_MODEL`, `GROQ_FALLBACK_MODEL`.
