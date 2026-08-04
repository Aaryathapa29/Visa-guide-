"""
app/services/ai_detector.py
Detects whether a cover letter or SOP was AI-generated
using Gemini with a specialized auditor prompt.
Returns confidence_score (0-100%) with detailed signatures.
"""
import json
import os
import re

import google.generativeai as genai
from fastapi import HTTPException

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are an expert document auditor detecting AI-generated visa cover letters and SOPs. You must be accurate and fair — do NOT over-flag human writing.

CRITICAL CALIBRATION RULES:
- Repetition of phrases (e.g. "United States of America" used many times) = HUMAN signal, not AI
- Simple, informal, or slightly awkward language = HUMAN signal
- Use of "I promise", "I want to", "I'm really" = HUMAN signal
- Short, direct sentences without complex structure = HUMAN signal
- AI-generated text is typically polished, uses varied vocabulary, and avoids repetition
- A score above 70% should ONLY be given if you find multiple strong AI clichés AND structural rigidity

Score guide:
- 0-20%: Clearly human — simple language, repetition, informal tone, specific personal details
- 21-40%: Likely human — mostly natural but some polished phrases
- 41-60%: Mixed — some AI patterns but also human elements
- 61-80%: Likely AI — multiple clichés, rigid structure, low specificity
- 81-100%: Very likely AI — heavy clichés, perfectly uniform paragraphs, generic content

AI signatures to look for (must find MULTIPLE to score high):
1. Words like "delve", "testament", "beacon", "foster", "leverage", "furthermore", "moreover", "in conclusion", "passionate about", "dynamic landscape", "it is worth noting"
2. Perfectly uniform paragraph lengths with parallel sentence structures
3. Generic philosophical opening hook ("In today's world...", "Throughout my journey...")
4. Zero specific personal details — everything is vague and could apply to anyone
5. The classic "AI Pivot": generic intro then "My journey began when..."

Return ONLY raw JSON with NO markdown, NO backticks:
{
  "is_ai_generated": true or false,
  "confidence_score": number 0-100,
  "detected_signatures": ["specific AI patterns found — be specific"],
  "human_elements": ["specific human details found"]
}"""


def _extract_json(raw: str) -> dict:
    """Strip markdown fences if Gemini wraps response despite instructions."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def detect_ai_content(text: str) -> dict:
    """
    Sends document to Gemini AI auditor.
    Returns confidence_score (0-100) + verdict + detected signatures.
    """
    if not GEMINI_API_KEY:
        # Return a safe fallback instead of crashing the whole pipeline
        return {
            "is_ai_generated": False,
            "confidence_score": 0,
            "verdict": "AI detection unavailable — GEMINI_API_KEY not configured",
            "risk_level": "None",
            "detected_signatures": [],
            "human_elements": [],
        }

    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"},
        )
        response = model.generate_content(
            f"Analyze this document for AI generation:\n\n{text[:3000]}"
            # Limit to 3000 chars to save tokens — enough for detection
        )
        result = _extract_json(response.text)

        # Add human-readable verdict based on confidence score
        score = result.get("confidence_score", 0)
        if score >= 75:
            verdict = "Very likely AI-generated"
            risk = "High"
        elif score >= 50:
            verdict = "Possibly AI-assisted"
            risk = "Medium"
        elif score >= 25:
            verdict = "Mostly human-written"
            risk = "Low"
        else:
            verdict = "Human-written"
            risk = "None"

        result["verdict"] = verdict
        result["risk_level"] = risk
        return result

    except json.JSONDecodeError:
        return {
            "is_ai_generated": False,
            "confidence_score": 0,
            "verdict": "AI detection could not parse response — retry",
            "risk_level": "None",
            "detected_signatures": [],
            "human_elements": [],
        }
    except Exception as exc:
        return {
            "is_ai_generated": False,
            "confidence_score": 0,
            "verdict": f"AI detection failed: {str(exc)[:100]}",
            "risk_level": "None",
            "detected_signatures": [],
            "human_elements": [],
        }