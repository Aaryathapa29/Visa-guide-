import { useState } from "react";
import { FileText, FileSearch, Sparkles } from "lucide-react";
import { ModalOverlay, ModalHeader } from "../ui/ModalOverlay";
import { ACCENT, MID } from "../ui/theme";

const FEEDBACK = [
  {
    type: "error" as const,
    text: "Opening paragraph lacks a clear statement of purpose for the visa application.",
  },
  {
    type: "warning" as const,
    text: "Financial evidence section could be strengthened with specific figures.",
  },
  {
    type: "success" as const,
    text: "Ties to home country (employment, family) are clearly articulated.",
  },
  {
    type: "success" as const,
    text: "Language is formal and professional throughout.",
  },
];

const FEEDBACK_STYLES = {
  error: { bg: "#fff1f2", border: "#fecdd3", dot: "#ef4444", text: "#991b1b" },
  warning: { bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", text: "#92400e" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", text: "#14532d" },
};

export default function DocumentAnalysisCard({ onClose }: { onClose: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader
        icon={<FileSearch className="w-4 h-4 text-white" />}
        title="Document Analysis"
        subtitle="Automated cover letter feedback"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ background: "#f5f7fb" }}>
        {!uploaded ? (
          /* Drop zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); setUploaded(true); }}
            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 gap-4 transition-colors cursor-pointer"
            style={{
              borderColor: dragging ? ACCENT : "#c7d8f0",
              background: dragging ? "#eef4ff" : "#fff",
            }}
            onClick={() => setUploaded(true)}
            role="button"
            aria-label="Upload cover letter"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setUploaded(true)}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "#eef2fb" }}
            >
              <FileText className="w-7 h-7" style={{ color: ACCENT }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: "#0d1b3e" }}>Drop your cover letter here</p>
              <p className="text-sm mt-1" style={{ color: "#5a6e8a" }}>PDF, DOCX or TXT — click to browse</p>
            </div>
            <div
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#0d1b3e", color: "#fff" }}
            >
              Choose File
            </div>
          </div>
        ) : (
          /* Analysis results */
          <div className="space-y-4">
            {/* File chip */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "#fff", border: "1px solid #dce6f5" }}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#0d1b3e" }}>
                    cover_letter_canada.pdf
                  </div>
                  <div className="text-xs" style={{ color: "#5a6e8a" }}>Analysed just now</div>
                </div>
              </div>
              <button
                onClick={() => setUploaded(false)}
                className="text-xs hover:underline"
                style={{ color: "#5a6e8a" }}
              >
                Remove
              </button>
            </div>

            {/* Feedback items */}
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#0d1b3e" }}>AI Feedback</h4>
              <div className="space-y-2.5">
                {FEEDBACK.map((f, i) => {
                  const s = FEEDBACK_STYLES[f.type];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ background: s.bg, border: `1px solid ${s.border}` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: s.dot }}
                      />
                      <p className="text-sm" style={{ color: s.text }}>{f.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score */}
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "#eef4ff", border: "1px solid #bfdbfe" }}
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: ACCENT }} />
              <p className="text-sm" style={{ color: MID }}>
                Overall score: <strong>72 / 100</strong> — Good foundation. Address the flagged items
                to strengthen your application.
              </p>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
