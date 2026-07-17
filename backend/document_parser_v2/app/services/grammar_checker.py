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
import re
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

# LanguageTool doesn't label severity itself, we infer it from the category.
SEVERITY_MAP = {
    "TYPOS": "Critical",
    "GRAMMAR": "Major",
    "CONFUSED_WORDS": "Major",
    "PUNCTUATION": "Minor",
    "CASING": "Minor",
    "STYLE": "Minor",
    "REDUNDANCY": "Minor",
}

# FIX 1: Nepali proper nouns that LanguageTool incorrectly flags as spelling errors
IGNORED_WORDS = {
    "lalitpur", "tribhuvan", "kathmandu", "shrestha", "thapa",
    "sharma", "nepal", "nepali", "leapfrog", "bagmati", "pokhara",
    "bahadur", "rijal", "poudel", "adhikari", "bhattarai", "pradhan",
    "gurung", "tamang", "rai", "limbu", "magar", "lama", "bajracharya",
    "maharjan", "shrestha", "joshi", "karki", "khatri", "basnet",
    "biratnagar", "janakpur", "bharatpur", "dharan", "butwal",
    "tribhuvan", "pashupatinath", "swayambhunath", "boudhanath",
    "sindhuli", "makwanpur", "chitwan", "solukhumbu", "mustang",
    "npr", "nrs",
}

# FIX 2: LanguageTool rule IDs that produce false positives in cover letters
IGNORED_RULE_IDS = {
    "ENGLISH_WORD_REPEAT_BEGINNING_RULE",  # "I → Furthermore, I", normal in cover letters
    "COMMA_PARENTHESIS_WHITESPACE",        # cosmetic comma rules
    "UPPERCASE_SENTENCE_START",            # false positives on names/addresses
    "WHITESPACE_RULE",                     # whitespace formatting, not a grammar error
    "DOUBLE_PUNCTUATION",                  # minor punctuation cosmetics
}


def build_fallback_grammar_errors(text: str, reason: str | None = None) -> list[dict]:
    """Provide a basic, local fallback when LanguageTool is unavailable."""
    errors: list[dict] = []
    if not text or not text.strip():
        return errors

    if re.search(r"\s{2,}", text):
        errors.append({
            "id": str(uuid.uuid4())[:8],
            "type": "Punctuation",
            "severity": "Minor",
            "original": "double spaces",
            "suggestion": "Use a single space between words.",
            "explanation": "Extra spacing was detected in the text.",
        })

    if re.search(r"\b([A-Za-z]+)\s+\1\b", text, re.IGNORECASE):
        errors.append({
            "id": str(uuid.uuid4())[:8],
            "type": "Word Choice",
            "severity": "Minor",
            "original": "repeated word",
            "suggestion": "Remove the duplicate word or rephrase the sentence.",
            "explanation": "A repeated word was detected in the text.",
        })

    if re.search(r"[A-Za-z]{20,}", text) and not re.search(r"[.!?]\s+[A-Z]", text):
        errors.append({
            "id": str(uuid.uuid4())[:8],
            "type": "Punctuation",
            "severity": "Major",
            "original": "long sentence",
            "suggestion": "Split the sentence or add clearer punctuation.",
            "explanation": "The text contains a long sentence that may benefit from clearer punctuation.",
        })

    if not errors and reason:
        errors.append({
            "id": str(uuid.uuid4())[:8],
            "type": "Grammar",
            "severity": "Minor",
            "original": "grammar engine unavailable",
            "suggestion": "Review the text manually or reconnect LanguageTool.",
            "explanation": f"The grammar engine could not run: {reason}",
        })

    return errors


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
            return build_fallback_grammar_errors(text, str(exc))

        data = response.json()

    errors = []
    for match in data.get("matches", []):
        category_id = match.get("rule", {}).get("category", {}).get("id", "STYLE")
        rule_id = match.get("rule", {}).get("id", "")
        offset = match["offset"]
        length = match["length"]
        original = text[offset: offset + length]

        # FIX 1: Skip known Nepali proper nouns flagged as spelling errors
        if original.lower() in IGNORED_WORDS:
            continue

        # FIX 2: Skip known false-positive rule IDs
        if rule_id in IGNORED_RULE_IDS:
            continue

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