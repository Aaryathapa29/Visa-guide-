// src/api/documentparser.ts
// Calls FastAPI document parser (port 8002), separate from Django (port 8000)

const PARSER_URL = import.meta.env.VITE_PARSER_URL ?? "http://localhost:8002";
// Must set in frontend/.env: VITE_PARSER_URL=http://localhost:8002

// ── Types ──────────────────────────────────────────────────────────────────

export interface GrammarError {
  id: string;
  type: string;
  severity: "Critical" | "Major" | "Minor";
  original: string;
  suggestion: string;
  explanation: string;
}

export interface VisaChecklist {
  has_destination_country: boolean;
  has_financial_proof: boolean;
  has_travel_dates: boolean;
  has_employer_mention: boolean;
}

export interface AiDetection {
  is_ai_generated: boolean;
  confidence_score: number;
  verdict: string;
  risk_level: "High" | "Medium" | "Low" | "None";
  detected_signatures: string[];
  human_elements: string[];
}

export interface AnalysisResult {
  filename?: string;
  document_type: string;
  word_count: number;
  char_count: number;
  overall_score: number;
  grade: string;
  summary: string;
  grammar_errors: GrammarError[];
  strengths: string[];
  improvements: string[];
  tone_analysis: {
    formality: string;
    confidence: string;
    clarity: string;
  };
  visa_specific_issues: string[];
  critical_count: number;
  major_count: number;
  minor_count: number;
  visa_checklist: VisaChecklist;
  ai_detection?: AiDetection;
}

// ── API calls ──────────────────────────────────────────────────────────────

export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${PARSER_URL}/api/v1/analyze/file`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    // Classifier returns nested object: { "error": "unsupported_document", "message": "..." }
    if (typeof detail === "object" && detail?.message) {
      throw new Error(detail.message);
    }
    throw new Error(typeof detail === "string" ? detail : "File analysis failed");
  }
  return res.json();
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const res = await fetch(`${PARSER_URL}/api/v1/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    if (typeof detail === "object" && detail?.message) {
      throw new Error(detail.message);
    }
    throw new Error(typeof detail === "string" ? detail : "Text analysis failed");
  }
  return res.json();
}