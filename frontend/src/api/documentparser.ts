// frontend/src/api/documentParser.ts
// Separate from api.ts — this talks to FastAPI (port 8001), not Django (port 8000)

const PARSER_URL = import.meta.env.VITE_PARSER_URL ?? "http://localhost:8001";

// ── Types ─────────────────────────────────────────────────────────

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

export interface AnalysisResult {
  filename?: string;
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
}

// ── API calls ─────────────────────────────────────────────────────

// For file uploads (PDF, DOCX, TXT)
export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${PARSER_URL}/api/v1/analyze/file`, {
    method: "POST",
    body: form,
    // Do NOT set Content-Type header manually here — 
    // fetch sets it automatically with the correct boundary for FormData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "File analysis failed");
  }
  return res.json();
}

// For pasted plain text
export async function analyzeText(text: string): Promise<AnalysisResult> {
  const res = await fetch(`${PARSER_URL}/api/v1/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Text analysis failed");
  }
  return res.json();
}