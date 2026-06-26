"""
app/schemas.py (v2)
"""
from pydantic import BaseModel
from typing import List, Optional


class TextAnalyzeRequest(BaseModel):
    text: str
    client_id: Optional[str] = None


class GrammarError(BaseModel):
    id: str
    type: str
    severity: str
    original: str
    suggestion: str
    explanation: str


class ToneAnalysis(BaseModel):
    formality: str
    confidence: str
    clarity: str


class SpacyMetrics(BaseModel):
    sentence_count: int
    avg_sentence_length: float
    passive_voice_count: int
    entity_types_found: List[str]
    token_count: int
    stop_word_ratio: float


class VisaChecklist(BaseModel):
    has_destination_country: bool
    has_financial_proof: bool
    has_travel_dates: bool
    has_employer_mention: bool


class AnalysisResult(BaseModel):
    filename: Optional[str] = None
    extracted_text_preview: str
    word_count: int
    char_count: int
    spacy_metrics: SpacyMetrics
    overall_score: int
    grade: str
    summary: str
    grammar_errors: List[GrammarError]
    strengths: List[str]
    improvements: List[str]
    tone_analysis: ToneAnalysis
    visa_specific_issues: List[str]
    critical_count: int
    major_count: int
    minor_count: int
    visa_checklist: Optional[VisaChecklist] = None
