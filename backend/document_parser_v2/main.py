"""
main.py (v2)
Run with: uvicorn main:app --reload --port 8002
Requires LanguageTool running first: docker compose up -d
"""
import os
from pathlib import Path

from dotenv import load_dotenv

PARSER_DIR = Path(__file__).resolve().parent
BACKEND_DIR = PARSER_DIR.parent
load_dotenv(PARSER_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents

app = FastAPI(title="Visa Document Parser API v2 (LanguageTool + spaCy + AI)")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "document-parser-v2"}
