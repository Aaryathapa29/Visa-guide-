"""
app/services/nlp_processor.py
Runs cheap, deterministic NLP checks with spaCy BEFORE the AI call.
This keeps the AI prompt short/focused and gives you free structured facts.
"""
import spacy

_nlp = None  # lazy-loaded singleton so the model loads once per process


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def analyse_with_spacy(text: str) -> dict:
    nlp = get_nlp()
    doc = nlp(text)

    sentences = list(doc.sents)
    tokens = [t for t in doc if not t.is_space]

    # Passive voice: spaCy tags passive auxiliaries as "auxpass" (or nsubjpass/aux:pass
    # depending on model version) — auxpass covers the common case.
    passive_count = sum(1 for t in doc if t.dep_ in ("auxpass", "nsubjpass"))

    # Named entities — used to build the visa checklist
    entity_types = sorted({ent.label_ for ent in doc.ents})
    entities_by_type = {}
    for ent in doc.ents:
        entities_by_type.setdefault(ent.label_, []).append(ent.text)

    avg_sentence_length = (len(tokens) / len(sentences)) if sentences else 0.0
    stop_words = sum(1 for t in doc if t.is_stop)
    stop_word_ratio = (stop_words / len(tokens)) if tokens else 0.0

    return {
        "sentence_count": len(sentences),
        "avg_sentence_length": round(avg_sentence_length, 1),
        "passive_voice_count": passive_count,
        "entity_types_found": entity_types,
        "entities_by_type": entities_by_type,
        "token_count": len(tokens),
        "stop_word_ratio": round(stop_word_ratio, 2),
        "has_country_mention": "GPE" in entity_types or "NORP" in entity_types,
        "has_money_mention": "MONEY" in entity_types,
        "has_date_mention": "DATE" in entity_types,
        "has_organization": "ORG" in entity_types,
    }


def build_visa_checklist(spacy_data: dict) -> dict:
    return {
        "has_destination_country": spacy_data["has_country_mention"],
        "has_financial_proof": spacy_data["has_money_mention"],
        "has_travel_dates": spacy_data["has_date_mention"],
        "has_employer_mention": spacy_data["has_organization"],
    }
