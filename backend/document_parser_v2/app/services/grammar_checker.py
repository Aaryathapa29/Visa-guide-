"""
app/services/grammar_checker.py
Calls a LanguageTool server (self-hosted via Docker, or the public API)
and converts its response into the same error format your frontend
already expects (id, type, severity, original, suggestion, explanation).

Self-hosted (recommended, free, no rate limit you don't control):
    LT_API_URL=http://localhost:8010/v2/check

Public LanguageTool API (free tier, rate-limited, fine for early testing):
    LT_API_URL=https://api.languagetool.org/v2/check
"""
import os
import uuid
import httpx

LT_API_URL = os.getenv("LT_API_URL", "http://localhost:8010/v2/check")

# Maps LanguageTool's internal rule categories to your UI's error "type"
CATEGORY_MAP = {
    "TYPOS": "Spelling",
    "GRAMMAR": "Grammar",
    "PUNCTUATION": "Punctuation",
    "STYLE": "Word Choice",
    "CASING": "Grammar",
    "CONFUSED_WORDS": "Word Choice",
    "REDUNDANCY": "Sentence Structure",
}

# LanguageTool doesn't label severity itself — we infer it from the category.
SEVERITY_MAP = {
    "TYPOS": "Critical",
    "GRAMMAR": "Major",
    "CONFUSED_WORDS": "Major",
    "PUNCTUATION": "Minor",
    "CASING": "Minor",
    "STYLE": "Minor",
    "REDUNDANCY": "Minor",
}


async def check_grammar(text: str, language: str = "en-US") -> list[dict]:
    """Sends text to LanguageTool and returns a normalized error list."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                LT_API_URL,
                data={"text": text, "language": language},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise RuntimeError(f"LanguageTool request failed: {exc}")

        data = response.json()

    errors = []
    for match in data.get("matches", []):
        category_id = match.get("rule", {}).get("category", {}).get("id", "STYLE")
        offset = match["offset"]
        length = match["length"]
        original = text[offset: offset + length]

        replacements = match.get("replacements", [])
        suggestion = replacements[0]["value"] if replacements else "(no suggestion)"

        errors.append({
            "id": str(uuid.uuid4())[:8],
            "type": CATEGORY_MAP.get(category_id, "Grammar"),
            "severity": SEVERITY_MAP.get(category_id, "Minor"),
            "original": original,
            "suggestion": suggestion,
            "explanation": match.get("message", "Grammar issue detected."),
        })

    return errors
