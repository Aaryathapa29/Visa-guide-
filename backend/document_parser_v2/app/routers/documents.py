"""
app/routers/documents.py (v2)
Pipeline now:
  1. extractor    -> raw text from file
  2. spaCy        -> structure facts (dates, money, country, passive voice)
  3. LanguageTool -> grammar/spelling/punctuation errors (FREE, rule-based)
  4. AI           -> tone + visa persuasiveness only (cheap, focused call)
"""
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.schemas import TextAnalyzeRequest
from app.services.extractor import extract_text
from app.services.nlp_processor import analyse_with_spacy, build_visa_checklist
from app.services.grammar_checker import check_grammar
from app.services.ai_analyzer import ai_tone_and_visa_check

router = APIRouter(prefix="/api/v1/analyze", tags=["documents"])
MAX_FILE_SIZE_MB = 5


def _score_and_grade(critical: int, major: int, minor: int) -> tuple[int, str]:
    """Deterministic scoring with capped penalties so real documents
    don't unfairly hit F just from minor/moderate grammar issues."""
    # Cap each category so no single type can wipe out the whole score
    critical_penalty = min(critical * 10, 40)  # max 40 points lost for critical
    major_penalty = min(major * 5, 30)          # max 30 points lost for major
    minor_penalty = min(minor * 2, 20)          # max 20 points lost for minor

    score = 100 - critical_penalty - major_penalty - minor_penalty
    score = max(0, min(100, score))

    if score >= 85:
        grade = "A"
    elif score >= 70:
        grade = "B"
    elif score >= 55:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"
    return score, grade


async def _run_pipeline(text: str, filename: str | None = None) -> dict:
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text to analyze.")

    spacy_data = analyse_with_spacy(text)
    grammar_errors = await check_grammar(text)
    ai_data = ai_tone_and_visa_check(text, spacy_data, grammar_error_count=len(grammar_errors))

    critical = sum(1 for e in grammar_errors if e["severity"] == "Critical")
    major = sum(1 for e in grammar_errors if e["severity"] == "Major")
    minor = sum(1 for e in grammar_errors if e["severity"] == "Minor")
    score, grade = _score_and_grade(critical, major, minor)

    return {
        "filename": filename,
        "extracted_text_preview": text[:300],
        "word_count": spacy_data["token_count"],
        "char_count": len(text),
        "spacy_metrics": {
            "sentence_count": spacy_data["sentence_count"],
            "avg_sentence_length": spacy_data["avg_sentence_length"],
            "passive_voice_count": spacy_data["passive_voice_count"],
            "entity_types_found": spacy_data["entity_types_found"],
            "token_count": spacy_data["token_count"],
            "stop_word_ratio": spacy_data["stop_word_ratio"],
        },
        "visa_checklist": build_visa_checklist(spacy_data),
        "grammar_errors": grammar_errors,
        "critical_count": critical,
        "major_count": major,
        "minor_count": minor,
        "overall_score": score,
        "grade": grade,
        **ai_data,  # tone_analysis, visa_specific_issues, strengths, improvements, summary
    }


@router.post("/file")
async def analyze_file(file: UploadFile = File(...)):
    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_FILE_SIZE_MB}MB).")

    text = extract_text(file_bytes, file.filename or "")
    return await _run_pipeline(text, filename=file.filename)


@router.post("/text")
async def analyze_text(payload: TextAnalyzeRequest):
    return await _run_pipeline(payload.text)


@router.get("/demo")
async def demo():
    sample = (
        "Dear Visa Officer, I am writing to request a tourist visa to visit the "
        "United States for two weeks in July 2026. I work as a software engineer "
        "at Leapfrog Technology in Kathmandu, Nepal, and I will return to my job "
        "after the trip. I have attached my bank statement showing sufficient funds."
    )
    return await _run_pipeline(sample, filename="demo_sample.txt")
