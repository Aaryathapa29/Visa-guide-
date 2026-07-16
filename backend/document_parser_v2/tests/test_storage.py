import os
import importlib


def test_save_and_get_analysis_history(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")

    if "app.services.storage" in importlib.sys.modules:
        del importlib.sys.modules["app.services.storage"]

    from app.services.storage import get_analysis_history, save_analysis_result

    result = {
        "filename": "demo.pdf",
        "extracted_text_preview": "Sample text",
        "word_count": 2,
        "char_count": 12,
        "overall_score": 90,
        "grade": "A",
        "summary": "Looks good",
        "grammar_errors": [],
        "strengths": ["Clear"],
        "improvements": ["Add more detail"],
        "tone_analysis": {"formality": "formal", "confidence": "high", "clarity": "good"},
        "visa_specific_issues": [],
        "critical_count": 0,
        "major_count": 0,
        "minor_count": 0,
        "visa_checklist": {"has_destination_country": True, "has_financial_proof": False, "has_travel_dates": False, "has_employer_mention": True},
    }

    assert save_analysis_result(result, client_id="client-1", filename="demo.pdf") is True
    history = get_analysis_history("client-1")

    assert len(history) == 1
    assert history[0]["result_data"]["grade"] == "A"
    assert history[0]["result_data"]["filename"] == "demo.pdf"
