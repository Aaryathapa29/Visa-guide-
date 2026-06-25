# Visa Guide

Visa Guide is a role-based web application for visa aspirants and consultancies.

The current implementation in this repository focuses on:
- role-based signup and login
- manual admin verification for consultancy accounts
- role-based homepage redirection after login
- logout back to the role selection page

## Tech Stack

- Backend: Django + Django REST Framework + SimpleJWT
- Frontend: React + Vite + TypeScript
- Database: SQLite (`backend/db.sqlite3`)

## Project Structure

- `backend/`: Django backend project
  - `backend/visa_backend/`: Django project settings and URLs
  - `backend/authentication/`: custom user model, auth serializers/views, and admin verification actions
  - `backend/requirements/requirements.txt`: backend Python dependencies
- `frontend/`: React frontend
  - `frontend/src/app/`: app screens and components
  - `frontend/src/api.ts`: axios API client (`http://127.0.0.1:8000/api/`)
- `backend/Model Inference/`: separate model-inference utilities (not required for auth flow)

## Authentication Flow

### 1. Signup
- Aspirant signup creates a `student` user and marks it verified.
- Consultancy signup creates a `consultancy` user with `is_verified=False`.
- Consultancy signup requires `organisation_type` and `license_number`.

### 2. Consultancy Verification
- Admin reviews consultancy accounts in Django Admin (`/admin/`).
- Admin can approve/reject consultancies using actions in the User admin.
- Consultancy login is blocked until `is_verified=True`.

### 3. Login
- Login uses email + password + selected role.
- Backend returns JWT `access` and `refresh` tokens plus user role payload.
- Frontend redirects users to:
  - aspirant home for `student`
  - consultancy home for `consultancy`

### 4. Logout
- Logout clears stored auth/session keys from local storage.
- User is returned to the role-based selection/signup page.

## API Endpoints (Auth)

Base path: `/api/auth/`

- `POST /register/`
- `POST /login/`
- `POST /login/refresh/`

## Local Setup

Use a single shared virtual environment at the repository root.

### Backend (Django)

1. Create and activate virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\Activate.ps1      # Windows PowerShell
```

2. Install backend dependencies:

```bash
pip install -r backend/requirements/requirements.txt
```

3. Apply migrations:

```bash
cd backend
python manage.py migrate
```

4. (Optional) Create admin user:

```bash
python manage.py createsuperuser
```

5. Run backend server:

```bash
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend (React)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Notes

- Frontend auth state is stored in local storage (`accessToken`, `refreshToken`, `authRole`, `authUser`).
- CORS is configured for `http://localhost:5173` in Django settings.
- The model-inference module is intentionally separate from auth and homepage routing.
