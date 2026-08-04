# Visa Guide

Visa Guide is a role-based web application for visa aspirants and consultancies. The current implementation includes Django authentication, JWT-based APIs, a chatbot service, document parsing, and a React frontend.

## Current service layout

The repository now runs as a small multi-service system:

- Main Django backend on port 8000
  - Serves REST APIs and chat WebSocket connections through Django Channels.
- Notifications socket service on port 8003
  - Socket.IO server in [backend/socketio_server.py](backend/socketio_server.py).
- Chatbot service on port 8001
  - FastAPI-based inference service in [backend/ModelInference](backend/ModelInference).
- Document parser service on port 8002
  - FastAPI-based parser service in [backend/document_parser_v2](backend/document_parser_v2).
- Frontend on port 5173
  - Vite + React app in [frontend](frontend).

## Tech stack

- Backend: Django, Django REST Framework, SimpleJWT, Channels
- Frontend: React + Vite + TypeScript
- Database: SQLite by default, or PostgreSQL when `DATABASE_URL` is provided

## Environment variables

Keep secrets in local environment files and do not commit them.

### Backend
Put these in [backend/.env](backend/.env) when required:

- `SECRET_KEY`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

If `DATABASE_URL` is not set, Django falls back to the local SQLite database at [backend/db.sqlite3](backend/db.sqlite3).

### Frontend
If the frontend needs to target a different backend or service URL, add these values to [frontend/.env.local](frontend/.env.local):

- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_CHATBOT_URL=http://localhost:8001`
- `VITE_PARSER_URL=http://localhost:8002`

## Project structure

- [backend](backend): Django backend project
  - [backend/visa_backend](backend/visa_backend): Django settings, ASGI config, and URL routing
  - [backend/authentication](backend/authentication): auth model, serializers, views, and verification logic
  - [backend/chat](backend/chat): Django Channels chat/WebSocket consumer and routing
  - [backend/requirements.txt](backend/requirements.txt): Python dependencies for the Django backend
- [backend/ModelInference](backend/ModelInference): chatbot service and embedding/RAG logic
- [backend/document_parser_v2](backend/document_parser_v2): document parser service
- [frontend](frontend): React frontend

## Local setup

If you already have a backend virtual environment, activate it and continue from there. If not, create one first.

### 1) Backend environment

#### Git Bash / WSL

```bash
cd backend
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
```

#### PowerShell

```powershell
cd backend
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
```

### 2) Run the main Django backend

This is the main application server and should run on port 8000
```bash
cd backend
source .venv/Scripts/activate
python manage.py runserver 8000
```

### 3) Run the profile visit notification socket service

Open a second terminal.

```bash
cd backend
source .venv/Scripts/activate
python socketio_server.py
```

By default the socket service listens on port 8003.

### 4) Run the chatbot service

Open a third terminal.

```bash
cd backend/ModelInference
python -m pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

### 5) Run the document parser service

Open a third terminal.

```bash
cd backend/document_parser_v2
python -m pip install -r requirements.txt
docker compose up -d
uvicorn main:app --reload --port 8002
```

The parser service depends on a local LanguageTool container. The `docker compose up -d` step starts it before the FastAPI app.

### 5) Run the frontend

Open a fourth terminal.

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173.

## Main endpoints

Base path: `/api/`

Auth endpoints:
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/login/refresh/`
- `POST /api/auth/password-reset/`
- `POST /api/auth/password-reset/confirm/`

## Notes

- Frontend auth state is stored in browser local storage (`accessToken`, `refreshToken`, `authRole`, and `authUser`).
- CORS is configured for the local Vite ports in the Django settings.
- The chatbot and document parser services are separate from the main Django backend and should be started in addition to it.

## Gitignore

Useful local files to keep out of version control:

- `.env`, `*.env`, and service-specific env files such as [backend/.env](backend/.env) and [frontend/.env.local](frontend/.env.local)
- Virtual environments such as `.venv/` and `venv/`
- Local databases such as [backend/db.sqlite3](backend/db.sqlite3) and [backend/ModelInference/chroma_db/chroma.sqlite3](backend/ModelInference/chroma_db/chroma.sqlite3)
- Node modules and frontend build artifacts in [frontend](frontend)
