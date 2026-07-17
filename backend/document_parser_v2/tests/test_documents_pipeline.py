import pytest

from app.routers import documents


@pytest.mark.asyncio
async def test_run_pipeline_returns_ai_detection(monkeypatch):
    monkeypatch.setattr(documents, "classify_document", lambda text: {"accepted": True, "document_type": "cover_letter", "reason": None})
    monkeypatch.setattr(documents, "analyse_with_spacy", lambda text: {
        "token_count": 10,
        "sentence_count": 2,
        "avg_sentence_length": 5.0,
        "passive_voice_count": 0,
        "entity_types_found": ["PERSON"],
        "stop_word_ratio": 0.1,
        "has_country_mention": True,
        "has_money_mention": False,
        "has_date_mention": False,
    })
    monkeypatch.setattr(documents, "build_visa_checklist", lambda spacy_data: {
        "has_destination_country": True,
        "has_financial_proof": False,
        "has_travel_dates": False,
        "has_employer_mention": False,
    })
    monkeypatch.setattr(documents, "check_grammar", lambda text: [])
    monkeypatch.setattr(documents, "ai_tone_and_visa_check", lambda text, spacy_data, grammar_error_count: {
        "tone_analysis": {"formality": "Formal", "confidence": "Confident", "clarity": "Clear"},
        "visa_specific_issues": ["Issue"],
        "strengths": ["Strength"],
        "improvements": ["Improvement"],
        "summary": "A strong summary",
    })
    monkeypatch.setattr(documents, "detect_ai_content", lambda text: {"is_ai_generated": False, "confidence_score": 10, "detected_signatures": [], "human_elements": []})

    result = await documents._run_pipeline("This is a visa cover letter")

    assert result["ai_detection"]["is_ai_generated"] is False
    assert result["summary"] == "A strong summary"
