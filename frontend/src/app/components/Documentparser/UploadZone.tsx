import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
}

export default function UploadZone({ onFile, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): string | null {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".docx", ".txt"].includes(ext))
      return "Only PDF, DOCX, or TXT files are supported.";
    if (file.size > 5 * 1024 * 1024) return "File must be under 5MB.";
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    onFile(file);
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">
              Analyzing your document...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl">📄</span>
            <p className="font-semibold text-[#0a1f44]">
              {dragging ? "Drop your file here" : "Drag & drop your cover letter"}
            </p>
            <p className="text-sm text-slate-600">
              PDF, DOCX, or TXT — max 5MB
            </p>
            <button
              type="button"
              className="mt-2 rounded-md px-5 py-2 text-sm font-semibold text-white bg-[#0a1f44]"
            >
              Browse File
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}