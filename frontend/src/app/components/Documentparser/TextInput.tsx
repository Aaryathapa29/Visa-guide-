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
      <div className="flex justify-between text-sm text-slate-600">
        <span>{wordCount} words</span>
        <button
          type="button"
          onClick={() => { setText(""); setError(null); }}
          disabled={!text || loading}
          className="font-medium hover:underline disabled:opacity-40 text-blue-600"
        >
          Clear
        </button>
      </div>

      <textarea
        className="w-full rounded-lg border border-slate-300 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0a1f44] text-[#0a1f44]"
        style={{ minHeight: "200px" }}
        placeholder="Paste your cover letter here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        rows={10}
      />

      {error && (
        <p className="text-sm font-medium text-red-600">⚠️ {error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || wordCount < 30}
        className="w-full rounded-md py-3 px-4 text-sm font-semibold text-white bg-[#0a1f44] disabled:opacity-50 transition-all"
      >
        {loading ? "Analyzing..." : "Analyze Letter →"}
      </button>
    </div>
  );
}