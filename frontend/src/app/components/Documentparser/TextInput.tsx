import { useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  loading: boolean;
}

export default function TextInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  function handleSubmit() {
    if (wordCount < 30) {
      setError(`Please enter at least 30 words. Currently: ${wordCount} words.`);
      return;
    }
    setError(null);
    onSubmit(text.trim());
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm" style={{ color: "#5a6e8a" }}>
        <span>{wordCount} words</span>
        <button
          type="button"
          onClick={() => { setText(""); setError(null); }}
          disabled={!text || loading}
          className="font-medium hover:underline disabled:opacity-40"
          style={{ color: "#2563eb" }}
        >
          Clear
        </button>
      </div>

      <textarea
        className="w-full rounded-2xl border p-4 text-sm resize-none focus:outline-none focus:ring-2"
        style={{
          borderColor: "#e2e8f0",
          color: "#0d1b3e",
          minHeight: "200px",
        }}
        placeholder="Paste your cover letter here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        rows={10}
      />

      {error && (
        <p className="text-sm font-medium" style={{ color: "#dc2626" }}>⚠️ {error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || wordCount < 5}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all"
        style={{ background: "#0d1b3e" }}
      >
        {loading ? "Analyzing..." : "Analyze Letter →"}
      </button>
    </div>
  );
}