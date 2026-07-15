# Visa Guide

Visa Guide is a role-based web application for visa aspirants and consultancies. The current implementation focuses on signup and login flows, consultancy verification, protected home screens, and password reset support.

## Tech Stack

- Backend: Django, Django REST Framework, SimpleJWT
- Frontend: React + Vite + TypeScript
- Database: SQLite by default, or PostgreSQL when the corresponding environment variables are provided

## Environment Variables

Sensitive values should be kept local in environment files and never committed.

### Backend
Set these in `backend/.env` when needed:

- `SECRET_KEY`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `RESEND_API_KEY`

If PostgreSQL settings are not present, Django will fall back to the local SQLite database at `backend/db.sqlite3`.

### Frontend
If the frontend needs to target a different backend URL, add it to `frontend/.env.local`:

- `VITE_API_BASE_URL=http://localhost:8000`

If this is not set, the frontend uses `http://localhost:8000` by default.

## Project Structure

- `backend/`: Django backend project
  - `backend/visa_backend/`: Django settings and URL configuration
  - `backend/authentication/`: user model, auth views/serializers, and verification logic
  - `backend/requirements/requirements.txt`: backend Python dependencies
- `frontend/`: active React frontend
  - `frontend/src/app/`: main app screens and UI components
  - `frontend/src/api.ts`: shared Axios client for backend requests
- `backend/Model Inference/` and `backend/ModelInference/`: separate model-related utilities and experiments

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

Use a single virtual environment at the repository root.

### Backend

```bash
python -m venv .venv
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\Activate.ps1      # Windows PowerShell

pip install -r backend/requirements/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000`.

Optional admin user:

```bash
python manage.py createsuperuser
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

## Notes

- Frontend auth state is stored in browser local storage (`accessToken`, `refreshToken`, `authRole`, and `authUser`).
- CORS is configured for the local Vite ports in Django settings.
- The model-inference modules are separate from the main authentication and UI flow.
