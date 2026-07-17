import { useState } from "react";
import { analyzeFile, analyzeText } from "../../../api/documentparser";
import type { AnalysisResult } from "../../../api/documentparser";
import UploadZone from "./UploadZone";
import TextInput from "./TextInput";
import AnalysisResultView from "./AnalysisResult";

type Mode = "upload" | "text";

export default function DocumentParser({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyzeFile(file));
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleText(text: string) {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyzeText(text));
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl bg-white shadow-2xl overflow-hidden">
        <AnalysisResultView
          result={result}
          onReset={() => { setResult(null); setError(null); }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_-8px_rgba(10,31,68,.18)] space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0a1f44]">
          Cover Letter Checker
        </h2>
        <p className="text-sm mt-2 text-slate-600">
          Analyze grammar, tone, and visa-specific requirements instantly.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1.5 rounded-lg bg-slate-100">
        {(["upload", "text"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 rounded-md py-2 px-3 text-sm font-semibold transition-all"
            style={
              mode === m
                ? { background: "#0a1f44", color: "white" }
                : { color: "#64748b" }
            }
          >
            {m === "upload" ? "📎 Upload File" : "✏️ Paste Text"}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode === "upload"
        ? <UploadZone onFile={handleFile} loading={loading} />
        : <TextInput onSubmit={handleText} loading={loading} />
      }

      {/* Error */}
      {error && (
        <div className="rounded-lg p-4 text-sm font-medium bg-red-50 text-red-700">
          ❌ {error}, make sure the parser backend is running on port 8002 and LanguageTool/Docker is available if you want full grammar checks.
        </div>
      )}
    </div>
  );
}