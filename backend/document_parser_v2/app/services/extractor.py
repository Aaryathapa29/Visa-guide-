"""
app/services/extractor.py
Extracts raw text from PDF, DOCX, and TXT files.
"""
import io
from fastapi import HTTPException

import pdfplumber
from docx import Document


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Detects file type by extension and returns plain text."""
    lower = filename.lower()

    if lower.endswith(".pdf"):
        return _extract_pdf(file_bytes)

    if lower.endswith(".docx"):
        return _extract_docx(file_bytes)

    if lower.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
    )


def _extract_pdf(file_bytes: bytes) -> str:
    text_chunks = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_chunks.append(page_text)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {exc}")

    text = "\n".join(text_chunks).strip()
    if not text:
        raise HTTPException(
            status_code=422,
            detail="No extractable text found in PDF (it may be a scanned image).",
        )
    return text


def _extract_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read DOCX: {exc}")

    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    if not text.strip():
        raise HTTPException(status_code=422, detail="DOCX file appears to be empty.")
    return text
