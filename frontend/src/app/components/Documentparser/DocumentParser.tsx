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
      const data = await analyzeFile(file);
      setResult(data);
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
      const data = await analyzeText(text);
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Detect if error is a document type rejection from classifier
  function isUnsupportedDoc(msg: string): boolean {
    return (
      msg.includes("does not appear") ||
      msg.includes("not recognized") ||
      msg.includes("medical document") ||
      msg.includes("legal document") ||
      msg.includes("technical document") ||
      msg.includes("business") ||
      msg.includes("too short") ||
      msg.includes("study-abroad SOPs are accepted") ||
      msg.includes("Only visa cover letters")
    );
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
          📄 Cover Letter & SOP Checker
        </h2>
        <p className="text-sm mt-2 text-slate-600">
          Analyze grammar, tone, AI detection, and visa-specific requirements instantly.
        </p>
      </div>

      {/* Accepted formats notice */}
      <div
        className="rounded-lg px-4 py-2 text-xs font-medium"
        style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
      >
        ✅ Accepted documents: Visa Cover Letters and Study-Abroad SOPs only
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

      {/* Error display */}
      {error && (
        <div className="rounded-xl p-4 text-sm space-y-2"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          {isUnsupportedDoc(error) ? (
            <>
              <p className="font-bold text-red-700">❌ Unsupported Document Type</p>
              <p className="text-red-600">{error}</p>
              <div
                className="rounded-lg px-3 py-2 text-xs mt-2"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
              >
                <p className="font-semibold">✅ Accepted documents:</p>
                <p>• Visa Cover Letters (tourist, student, work, business visa)</p>
                <p>• Study-Abroad Statements of Purpose (SOPs)</p>
                <p className="mt-1 font-semibold">❌ Not accepted:</p>
                <p>• Medical reports, doctor's SOPs, residency applications</p>
                <p>• Legal documents, court orders, affidavits</p>
                <p>• Business reports, invoices, financial statements</p>
                <p>• Research papers, technical documents, code files</p>
                <p>• Any document under 100 words</p>
              </div>
            </>
          ) : (
            <p className="text-red-700 font-medium">
              ❌ {error} — make sure FastAPI is running on port 8002.
            </p>
          )}
        </div>
      )}

    </div>
  );
}