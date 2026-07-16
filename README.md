# Visa Guide

Visa Guide is a role-based web application for visa aspirants and consultancies. The current implementation focuses on signup and login flows, consultancy verification, protected home screens, password reset support, and future booking/chat integration.

## Team Ownership

The repository is now organized so each contributor has a clear area of responsibility:

- Person A — chatbot-related work
  - Reserved area: [backend/chatbot](backend/chatbot)
  - Active implementation remains in [backend/ModelInference](backend/ModelInference) and [backend/socketio_server.py](backend/socketio_server.py)
- Person B — document parsing work
  - Reserved area: [backend/document_parser](backend/document_parser)
  - Active implementation remains in [backend/document_parser_v2](backend/document_parser_v2)
- You — UI/UX, auth integration, and future feature integration
  - Active area: [frontend/src](frontend/src)
  - Backend integration points: [backend/authentication](backend/authentication)

No implementation files for Person A or Person B were changed as part of this structure update.

## Tech Stack

- Backend: Django, Django REST Framework, SimpleJWT
- Frontend: React + Vite + TypeScript
- Database: SQLite by default, or PostgreSQL when the corresponding environment variables are provided

## Environment Variables

Sensitive values should be kept local in environment files and never committed.

### Backend
Set these in `backend/.env` when needed:

- `SECRET_KEY`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS`

If PostgreSQL settings are not present in `DATABASE_URL`, Django will fall back to the local SQLite database at `backend/db.sqlite3`.

### Frontend
If the frontend needs to target a different backend or service URL, add it to `frontend/.env.local`:

- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_CHATBOT_URL=http://localhost:8001`
- `VITE_PARSER_URL=http://localhost:8002`

If these are not set, the frontend uses the default local URLs.

## Project Structure

- `backend/`: Django backend project
  - `backend/visa_backend/`: Django settings and URL configuration
  - `backend/authentication/`: user model, auth views/serializers, and verification logic
  - `backend/requirements.txt`: Django backend Python dependencies
- `backend/ModelInference/`: chatbot FastAPI service and ChromaDB RAG integration
  - `backend/ModelInference/requirements.txt`: chatbot service dependencies
- `backend/document_parser_v2/`: document parser FastAPI service
  - `backend/document_parser_v2/requirements.txt`: parser service dependencies
- `frontend/`: active React frontend
  - `frontend/src/app/`: main app screens and UI components
  - `frontend/src/api.ts`: shared Axios client for backend requests

## Authentication Flow

### Signup
- Aspirant signup creates a verified `student` user.
- Consultancy signup creates a `consultancy` user with `is_verified=False`.
- Consultancy signup requires `office_name` and `license_number`.

### Consultancy Verification
- Admin can review and approve or reject consultancy accounts in Django Admin.
- Consultancy login remains blocked until the account is verified.

### Login
- Login uses email, password, and the selected role.
- The backend returns JWT `access` and `refresh` tokens plus the user role.
- The frontend redirects users to the aspirant or consultancy home based on the role.

### Logout
- Logout clears stored auth/session values from local storage.
- The user is returned to the role-based selection page.

## API Endpoints

Base path: `/api/`

Auth endpoints:
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/login/refresh/`
- `POST /api/auth/password-reset/`
- `POST /api/auth/password-reset/confirm/`

## Local Setup

Use separate Python virtual environments for each backend service.

> For Git Bash on Windows, use `source .venv/Scripts/activate` to activate the virtual environment instead of PowerShell's `Activate.ps1`.

### Main Django backend

#### Git Bash / WSL

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

#### PowerShell

```powershell
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### Chatbot service

#### Git Bash / WSL

```bash
cd backend/ModelInference
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

#### PowerShell

```powershell
cd backend/ModelInference
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

### Document parser service

#### Git Bash / WSL

```bash
cd backend/document_parser_v2
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

#### PowerShell

```powershell
cd backend/document_parser_v2
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

From the repository root, this also works:

```bash
npm run dev
```

### Environment files

Create local `.env` files in the relevant service folders and keep them out of version control. Example values should be documented in `.env.example` if you add one.

## Notes

- Frontend auth state is stored in browser local storage (`accessToken`, `refreshToken`, `authRole`, and `authUser`).
- CORS is configured for the local Vite ports in Django settings.
- The model-inference modules are separate from the main authentication and UI flow.
