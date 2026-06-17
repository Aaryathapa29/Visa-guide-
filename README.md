# Visa Guide

This repository contains a Python backend and a React/Vite frontend for the Visa Guide project.

## Project Layout

- `backend/` contains the FastAPI app, RAG helper, PDFs, and backend-only dependencies
- `backend/requirements/requirements.txt` contains the Python packages needed for the backend
- `frontend/` contains the React/Vite user interface

## Git Ignore Rules

The repository ignores generated and machine-local files that should not be committed:

- `frontend/node_modules/` and `node_modules/` for installed JavaScript dependencies
- `frontend/dist/` and `frontend/.vite/` for frontend build output and Vite cache
- `backend/.venv/` and `venv/` for local Python virtual environments
- `backend/embeddings/` for the generated FAISS vector store
- `__pycache__/`, `backend/__pycache__/`, and `*.pyc` for Python bytecode caches
- `.pytest_cache/`, `.mypy_cache/`, and `.ruff_cache/` for tool caches
- `.env`, `.env.*`, `backend/.env`, and `backend/.env.*` for local environment secrets
- `.DS_Store` for macOS metadata files

## Frontend

The frontend app lives in [frontend/README.md](frontend/README.md).

## Backend Setup

Install backend dependencies from [backend/requirements/requirements.txt](backend/requirements/requirements.txt).