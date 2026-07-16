import { useState } from "react";
import { analyzeFile, analyzeText } from "../../../api/documentParser";
import type { AnalysisResult } from "../../../api/documentParser";
import UploadZone from "./UploadZone";
import TextInput from "./TextInput";
import AnalysisResultView from "./AnalysisResult";

type Mode = "upload" | "text";

export default function DocumentParser({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("upload");
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
    <div className="rounded-3xl bg-white p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0d1b3e" }}>
          📄 Cover Letter Checker
        </h2>
        <p className="text-sm mt-1" style={{ color: "#5a6e8a" }}>
          Analyze grammar, tone, and visa-specific requirements instantly.
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: "#eef4ff" }}
      >
        {(["upload", "text"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
            style={
              mode === m
                ? { background: "#0d1b3e", color: "white" }
                : { color: "#5a6e8a" }
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
        <div
          className="rounded-xl p-4 text-sm font-medium"
          style={{ background: "#fef2f2", color: "#dc2626" }}
        >
          ❌ {error} — make sure the document parser is running on port 8002 and Docker is open.
        </div>
      )}
    </div>
  );
}