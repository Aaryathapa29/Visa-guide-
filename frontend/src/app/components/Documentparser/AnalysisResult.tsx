import type { AnalysisResult } from "../../../api/documentparser";

interface AnalysisResultProps {
  result: AnalysisResult;
  onReset?: () => void;
}

const severityColor: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  Major: "bg-orange-50 text-orange-700 border-orange-200",
  Minor: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function AnalysisResultView({ result, onReset }: AnalysisResultProps) {
  const grammarErrors = result.grammar_errors ?? [];
  const strengths = result.strengths ?? [];
  const improvements = result.improvements ?? [];
  const visaChecklist = result.visa_checklist ?? {};
  const summary = result.summary ?? "";

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 p-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {result.filename ?? "Pasted text"} · {result.word_count} words
          </p>
          <p className="text-2xl font-semibold text-[#0a1f44]">
            {result.overall_score}/100 · Grade {result.grade}
          </p>
        </div>
        {onReset && (
          <div>
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Analyze another
            </button>
          </div>
        )}
      </div>

      {summary && (
        <p className="text-sm text-gray-700">{summary}</p>
      )}

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

      {grammarErrors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-800">Grammar and phrasing</h3>
          {grammarErrors.map((err) => (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-800">Strengths</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-800">Improve</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
            {improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-800">Visa checklist</h3>
        <ul className="mt-1 space-y-1 text-sm text-gray-600">
          {Object.entries(visaChecklist).map(([key, present]) => (
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