"""
app/services/document_classifier.py
Strict classifier — accepts ONLY visa cover letters and study-abroad SOPs.
Medical, legal, business, and all other document types are rejected.
"""

# ── HARD REJECTION — these signals immediately reject the document ──
# If ANY 2 of these are found, document is rejected regardless of other content
HARD_REJECT_SIGNALS = [
    # Medical
    "patient", "diagnosis", "prescription", "symptoms", "dosage",
    "milligrams", "physician", "hospital", "clinic", "mbbs", "md degree",
    "medical license", "residency program", "internship hospital",
    "clinical rotation", "clinical medicine", "lumbar puncture",
    "thoracocentesis", "thoracentesis", "myocardial", "diabetic ketoacidosis",
    "pneumonia", "ecg", "mri scan", "ct scan", "cbc", "lft", "rft", "abg",
    "usmle", "acls", "bls certification", "american heart association",
    "antimicrobial", "microbiological", "medical college", "medical practice",
    "healthcare delivery", "consultant physician", "medical consultations",
    "prescribing", "emergency department", "cardiology", "nephrology",
    "lupus erythematosus", "goodpasture", "culture and sensitivity",
    "internal medicine", "surgical", "pathology",
    # Legal
    "plaintiff", "defendant", "hereby", "whereas", "court order",
    "affidavit", "legal notice", "attorney", "jurisdiction",
    "deed", "notary", "sworn statement",
    # Business/Finance
    "invoice", "purchase order", "quotation", "balance sheet",
    "profit and loss", "quarterly report", "tax return",
    "audit report", "shareholder", "dividend",
    # Technical/Code
    "function(", "import numpy", "import pandas", "def main",
    "class ", "SELECT * FROM", "<!DOCTYPE", "<html>",
    "console.log", "git commit",
    # Academic research papers
    "abstract:", "keywords:", "bibliography",
    "doi:", "issn:", "peer-reviewed journal",
    "methodology:", "literature review",
]

# ── VISA COVER LETTER signals — need at least 2 ──
COVER_LETTER_SIGNALS = [
    "visa officer", "tourist visa", "student visa", "work visa",
    "business visa", "b1 visa", "b2 visa", "schengen visa",
    "visa application", "dear visa", "consular officer",
    "embassy", "consulate", "visitor visa", "travel visa",
    "i am writing to request a visa",
    "i am writing to apply for a visa",
    "request for visa", "apply for a visa",
    "intent to return", "return to my home country",
    "overstay", "port of entry",
    "duration of stay", "purpose of visit",
    "travel itinerary", "return flight",
    "bank statement", "financial proof",
    "ties to home country", "home country",
    "departure date", "arrival date",
    "travel dates", "travel expenses",
    "accommodation expenses",
    "no intention of overstaying",
]

# ── STUDY ABROAD SOP signals — need at least 2 ──
# Must be clearly about studying abroad, not medical/law school
SOP_STUDY_SIGNALS = [
    "statement of purpose",
    "dear admissions committee",
    "i am applying to",
    "i wish to pursue",
    "i intend to pursue",
    "master of science", "master of arts", "master's degree",
    "bachelor of science", "bachelor of arts", "bachelor's degree",
    "phd program", "doctoral program", "graduate program",
    "postgraduate program",
    "ms in", "msc in", "mba program",
    "computer science", "information technology",
    "software engineering", "data science",
    "mechanical engineering", "civil engineering",
    "electrical engineering", "business administration",
    "economics", "finance", "management",
    "academic background", "academic journey",
    "research interest", "research experience",
    "career goal", "career objective",
    "higher education",
    "gpa of", "cgpa of", "gre score", "ielts score", "toefl score",
    "i graduated from", "i completed my degree",
    "study in", "study abroad",
    "tuition fee", "scholarship",
    "student visa", "f1 visa", "tier 4 visa",
    "university of", "institute of technology",
    "after completing my degree i will return",
    "contribute to my home country",
]


def classify_document(text: str) -> dict:
    """
    Strictly accepts only visa cover letters and study-abroad SOPs.
    Rejects medical, legal, business, technical, and all other documents.
    """
    lower = text.lower()
    word_count = len(text.split())

    # ── Reject documents that are too short ──
    if word_count < 80:
        return {
            "accepted": False,
            "document_type": "too_short",
            "reason": (
                f"Document is too short ({word_count} words). "
                "A valid visa cover letter or SOP should be at least 100 words."
            ),
        }

    # ── Hard rejection check — runs FIRST before anything else ──
    # Even 2 medical/legal/technical signals = immediate rejection
    hard_hits = [s for s in HARD_REJECT_SIGNALS if s in lower]
    if len(hard_hits) >= 2:
        return {
            "accepted": False,
            "document_type": "unsupported",
            "reason": (
                f"This document appears to be a {_detect_doc_type(hard_hits)} document, "
                f"not a visa cover letter or Statement of Purpose. "
                f"Only visa cover letters and study-abroad SOPs are accepted."
            ),
        }

    # ── Single hard rejection signal — still reject ──
    if len(hard_hits) == 1:
        return {
            "accepted": False,
            "document_type": "unsupported",
            "reason": (
                "This document does not appear to be a visa cover letter or SOP. "
                "Only visa cover letters and study-abroad SOPs are accepted."
            ),
        }

    # ── Count positive signals ──
    cover_hits = [s for s in COVER_LETTER_SIGNALS if s in lower]
    sop_hits = [s for s in SOP_STUDY_SIGNALS if s in lower]

    # ── Accept as visa cover letter ──
    if len(cover_hits) >= 2:
        return {
            "accepted": True,
            "document_type": "cover_letter",
            "reason": "Visa cover letter detected.",
        }

    # ── Accept as study-abroad SOP ──
    if len(sop_hits) >= 2:
        return {
            "accepted": True,
            "document_type": "sop",
            "reason": "Study-abroad Statement of Purpose detected.",
        }

    # ── Not enough signals — reject ──
    return {
        "accepted": False,
        "document_type": "unsupported",
        "reason": (
            "This document was not recognized as a visa cover letter or "
            "Statement of Purpose. Please upload a visa cover letter or "
            "a study-abroad SOP only."
        ),
    }


def _detect_doc_type(hard_hits: list) -> str:
    """Helper to give a friendlier rejection reason."""
    medical = ["patient", "diagnosis", "mbbs", "physician", "hospital",
               "clinical", "usmle", "medical", "ecg", "mri"]
    legal = ["plaintiff", "defendant", "affidavit", "attorney", "court"]
    technical = ["function(", "import numpy", "SELECT * FROM", "<!DOCTYPE"]

    medical_count = sum(1 for h in hard_hits if any(m in h for m in medical))
    legal_count = sum(1 for h in hard_hits if any(l in h for l in legal))
    tech_count = sum(1 for h in hard_hits if any(t in h for t in technical))

    if medical_count >= legal_count and medical_count >= tech_count:
        return "medical"
    if legal_count >= tech_count:
        return "legal"
    return "technical"