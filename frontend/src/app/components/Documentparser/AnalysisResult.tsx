import { AnalysisResult as Result, GrammarError } from "../../../api/documentParser";


interface AnalysisResultProps {
  result: AnalysisResult;
}

const severityColor: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  Major: "bg-orange-50 text-orange-700 border-orange-200",
  Minor: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function AnalysisResultView({ result }: AnalysisResultProps) {
  return (
    <div className="space-y-6 rounded-md border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {result.filename ?? "Pasted text"} · {result.word_count} words
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {result.overall_score}/100 · Grade {result.grade}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700">{result.summary}</p>

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-md bg-red-50 p-2 text-red-700">
          {result.critical_count} critical
        </div>
        <div className="rounded-md bg-orange-50 p-2 text-orange-700">
          {result.major_count} major
        </div>
        <div className="rounded-md bg-yellow-50 p-2 text-yellow-700">
          {result.minor_count} minor
        </div>
      </div>

      {result.grammar_errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-800">Grammar and phrasing</h3>
          {result.grammar_errors.map((err) => (
            <div
              key={err.id}
              className={`rounded-md border p-3 text-sm ${severityColor[err.severity] ?? "border-gray-200 bg-gray-50"}`}
            >
              <p className="font-medium">{err.type}</p>
              <p className="mt-1">
                <span className="line-through">{err.original}</span>{" "}
                → <span className="font-medium">{err.suggestion}</span>
              </p>
              <p className="mt-1 text-xs opacity-80">{err.explanation}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-800">Strengths</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-800">Improve</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
            {result.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-800">Visa checklist</h3>
        <ul className="mt-1 space-y-1 text-sm text-gray-600">
          {Object.entries(result.visa_checklist).map(([key, present]) => (
            <li key={key} className="flex items-center gap-2">
              <span className={present ? "text-green-600" : "text-gray-400"}>
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