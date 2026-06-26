"""
app/services/ai_analyzer.py (v3 - Gemini, free tier)
Uses Google's Gemini API instead of OpenAI — free, no credit card needed
(1,500 requests/day on gemini-2.5-flash as of mid-2026).
Get a free key at: https://aistudio.google.com/app/apikey
"""
import json
import os
import re

import google.generativeai as genai
from fastapi import HTTPException

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash"

SYSTEM_PROMPT = """You are a visa cover-letter reviewer. You will receive a letter and
some pre-computed facts (grammar error count already found separately, entity facts).
Do NOT look for grammar/spelling errors — that's handled elsewhere. Focus only on
TONE and VISA PERSUASIVENESS.

Return ONLY valid JSON, no markdown fences, no commentary before or after:
{
  "tone_analysis": {
    "formality": "Formal|Semi-Formal|Informal",
    "confidence": "Confident|Neutral|Weak",
    "clarity": "Clear|Moderate|Unclear"
  },
  "visa_specific_issues": ["<short issue>", "..."],
  "strengths": ["<short phrase>", "..."],
  "improvements": ["<short phrase>", "..."],
  "summary": "<2-3 sentence overview of the letter as a visa document>"
}

visa_specific_issues should flag things like: weak ties to home country, no stated
intent to return, missing financial proof reference, vague travel purpose, overly
informal tone for an official document.
"""


def _extract_json(raw: str) -> dict:
    """Gemini sometimes wraps JSON in ```json fences despite instructions — strip them."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def ai_tone_and_visa_check(text: str, spacy_data: dict, grammar_error_count: int) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Get a free key at "
                   "https://aistudio.google.com/app/apikey and add it to .env",
        )

    context = f"""Facts already computed elsewhere (do not recheck):
- Grammar/spelling errors already found by LanguageTool: {grammar_error_count}
- Mentions destination/home country: {spacy_data['has_country_mention']}
- Mentions money/financial proof: {spacy_data['has_money_mention']}
- Mentions specific dates: {spacy_data['has_date_mention']}
- Passive voice count: {spacy_data['passive_voice_count']}
"""

    try:
        model = genai.GenerativeModel(
            MODEL_NAME,
            system_instruction=SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"},
        )
        response = model.generate_content(f"Letter:\n\n{text}\n\n{context}")
        return _extract_json(response.text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please retry.")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI tone analysis failed: {exc}")