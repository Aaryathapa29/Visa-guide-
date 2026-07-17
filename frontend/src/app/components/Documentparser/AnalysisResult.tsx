import type { AnalysisResult } from "../../../api/documentparser";

interface AnalysisResultProps {
  result: AnalysisResult;
  onReset?: () => void;
}

const severityColor: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  Major:    "bg-orange-50 text-orange-700 border-orange-200",
  Minor:    "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function AnalysisResultView({ result, onReset }: AnalysisResultProps) {
  const ai = result.ai_detection;

  // Color based on AI detection risk level
  const aiBg    = ai?.risk_level === "High"   ? "#fef2f2"
                : ai?.risk_level === "Medium" ? "#fffbeb"
                : "#f0fdf4";
  const aiBorder = ai?.risk_level === "High"   ? "#fecaca"
                 : ai?.risk_level === "Medium" ? "#fde68a"
                 : "#bbf7d0";
  const aiBadge  = ai?.risk_level === "High"   ? "#dc2626"
                 : ai?.risk_level === "Medium" ? "#d97706"
                 : "#16a34a";

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 p-6 bg-white">

      {/* ── Score header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {result.filename ?? "Pasted text"} · {result.word_count} words
            {result.document_type && (
              <span
                className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "#eef2ff", color: "#0a1f44" }}
              >
                {result.document_type === "cover_letter" ? "Cover Letter" : "SOP"}
              </span>
            )}
          </p>
          <p className="text-2xl font-bold text-[#0a1f44] mt-1">
            {result.overall_score}/100 · Grade {result.grade}
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-[#0a1f44] hover:bg-slate-50"
          >
            Analyze another letter
          </button>
        )}
      </div>

      {/* ── Summary ── */}
      {result.summary &&
        !/AI reviewer could not run|GEMINI_API_KEY is not configured/i.test(result.summary) && (
        <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
      )}

      {/* ── Error counts ── */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-md bg-red-50 p-3 text-red-700 font-semibold">
          {result.critical_count} critical
        </div>
        <div className="rounded-md bg-orange-50 p-3 text-orange-700 font-semibold">
          {result.major_count} major
        </div>
        <div className="rounded-md bg-yellow-50 p-3 text-yellow-700 font-semibold">
          {result.minor_count} minor
        </div>
      </div>

      {/* ── AI Detection Badge ── */}
      {ai && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: aiBg, border: `1px solid ${aiBorder}` }}
        >
          {/* Header row with percentage bar */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-700">🤖 AI Detection</span>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: aiBadge, color: "white" }}
            >
              {ai.confidence_score}% AI
            </span>
          </div>

          {/* Progress bar showing AI probability */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${ai.confidence_score}%`,
                background: aiBadge,
              }}
            />
          </div>

          {/* Verdict */}
          <p className="text-sm font-semibold" style={{ color: aiBadge }}>
            {ai.verdict}
          </p>

          {/* Scale labels */}
          <div className="flex justify-between text-xs text-slate-400">
            <span>0% Human</span>
            <span>50% Mixed</span>
            <span>100% AI</span>
          </div>

          {/* AI signatures found */}
          {ai.detected_signatures?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "#dc2626" }}>
                ⚠️ AI Signatures Found:
              </p>
              <ul className="space-y-1">
                {ai.detected_signatures.map((s, i) => (
                  <li key={i} className="text-xs text-red-700">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Human elements found */}
          {ai.human_elements?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "#16a34a" }}>
                ✅ Human Elements Found:
              </p>
              <ul className="space-y-1">
                {ai.human_elements.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Grammar errors ── */}
      {result.grammar_errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0a1f44]">Grammar and phrasing</h3>
          {result.grammar_errors.map((err) => (
            <div
              key={err.id}
              className={`rounded-md border p-3 text-sm ${severityColor[err.severity] ?? "border-slate-200 bg-slate-50"}`}
            >
              <p className="font-semibold">{err.type}</p>
              <p className="mt-1">
                <span className="line-through">{err.original}</span>{" "}
                → <span className="font-medium">{err.suggestion}</span>
              </p>
              <p className="mt-1 text-xs opacity-75">{err.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Strengths and improvements ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-[#0a1f44]">Strengths</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
            {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#0a1f44]">Improve</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
            {result.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      {/* ── Visa checklist ── */}
      <div>
        <h3 className="text-sm font-semibold text-[#0a1f44]">Visa checklist</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {Object.entries(result.visa_checklist).map(([key, present]) => (
            <li key={key} className="flex items-center gap-2">
              <span className={present ? "text-green-600 font-semibold" : "text-slate-400"}>
                {present ? "✓" : "○"}
              </span>
              {key.replace(/_/g, " ").replace("has ", "")}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}