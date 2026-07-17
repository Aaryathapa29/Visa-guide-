"""
app/routers/documents.py (v3 — final)
Pipeline:
  0. classifier   -> reject non-visa documents immediately
  1. extractor    -> raw text from file
  2. spaCy        -> structure facts (dates, money, country, passive voice)
  3. LanguageTool -> grammar/spelling/punctuation errors
  4. Gemini AI    -> tone + visa persuasiveness
  5. AI Detector  -> AI-generated content detection with % score
"""
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.schemas import TextAnalyzeRequest
from app.services.extractor import extract_text
from app.services.nlp_processor import analyse_with_spacy, build_visa_checklist
from app.services.grammar_checker import check_grammar
from app.services.ai_analyzer import ai_tone_and_visa_check
from app.services.document_classifier import classify_document
from app.services.ai_detector import detect_ai_content
from app.services.storage import get_analysis_history, save_analysis_result

router = APIRouter(prefix="/api/v1/analyze", tags=["documents"])
MAX_FILE_SIZE_MB = 5


def _score_and_grade(critical: int, major: int, minor: int) -> tuple[int, str]:
    """Capped scoring — no single error category wipes out the full score."""
    critical_penalty = min(critical * 10, 40)
    major_penalty    = min(major * 5,    30)
    minor_penalty    = min(minor * 2,    20)

    score = 100 - critical_penalty - major_penalty - minor_penalty
    score = max(0, min(100, score))

    if score >= 85:   grade = "A"
    elif score >= 70: grade = "B"
    elif score >= 55: grade = "C"
    elif score >= 40: grade = "D"
    else:             grade = "F"
    return score, grade


async def _run_pipeline(text: str, filename: str | None = None) -> dict:

    # ── Step 0: Reject empty text ──
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text to analyze.")

    # ── Step 1: Classify — reject non-visa documents immediately ──
    classification = classify_document(text)
    if not classification["accepted"]:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "unsupported_document",
                "document_type": classification["document_type"],
                "message": classification["reason"],
            }
        )

    # ── Step 2: spaCy NLP — extract structure facts ──
    spacy_data = analyse_with_spacy(text)

    # ── Step 3: LanguageTool — grammar/spelling/punctuation ──
    grammar_errors = await check_grammar(text)

    # ── Step 4: Gemini — tone + visa persuasiveness ──
    ai_data = ai_tone_and_visa_check(
        text, spacy_data, grammar_error_count=len(grammar_errors)
    )

    # ── Step 5: AI Detection — detect AI-generated content ──
    ai_detection = detect_ai_content(text)

    # ── Score calculation ──
    critical = sum(1 for e in grammar_errors if e["severity"] == "Critical")
    major    = sum(1 for e in grammar_errors if e["severity"] == "Major")
    minor    = sum(1 for e in grammar_errors if e["severity"] == "Minor")
    score, grade = _score_and_grade(critical, major, minor)

    return {
        "filename": filename,
        "document_type": classification["document_type"],
        "extracted_text_preview": text[:300],
        "word_count": spacy_data["token_count"],
        "char_count": len(text),
        "spacy_metrics": {
            "sentence_count":      spacy_data["sentence_count"],
            "avg_sentence_length": spacy_data["avg_sentence_length"],
            "passive_voice_count": spacy_data["passive_voice_count"],
            "entity_types_found":  spacy_data["entity_types_found"],
            "token_count":         spacy_data["token_count"],
            "stop_word_ratio":     spacy_data["stop_word_ratio"],
        },
        "visa_checklist":  build_visa_checklist(spacy_data),
        "grammar_errors":  grammar_errors,
        "critical_count":  critical,
        "major_count":     major,
        "minor_count":     minor,
        "overall_score":   score,
        "grade":           grade,
        "ai_detection":    ai_detection,   # ← AI detection result with % score
        **ai_data,   # tone_analysis, visa_specific_issues, strengths, improvements, summary
    }


@router.post("/file")
async def analyze_file(file: UploadFile = File(...)):
    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_FILE_SIZE_MB}MB)."
        )
    text = extract_text(file_bytes, file.filename or "")
    result = await _run_pipeline(text, filename=file.filename)
    save_analysis_result(result, client_id=None, filename=file.filename)
    return result


@router.post("/text")
async def analyze_text(payload: TextAnalyzeRequest):
    result = await _run_pipeline(payload.text)
    save_analysis_result(result, client_id=payload.client_id, filename=None)
    return result


@router.get("/history")
async def analysis_history(client_id: str | None = None, limit: int = 10):
    return get_analysis_history(client_id=client_id, limit=limit)


@router.get("/demo")
async def demo():
    sample = (
        "Dear Visa Officer, I am writing to request a tourist visa to visit the "
        "United States for two weeks in July 2026. I work as a software engineer "
        "at Leapfrog Technology in Kathmandu, Nepal, and I will return to my job "
        "after the trip. I have attached my bank statement showing NPR 1,500,000 "
        "in my account as financial proof."
    )
    return await _run_pipeline(sample, filename="demo_sample.txt")