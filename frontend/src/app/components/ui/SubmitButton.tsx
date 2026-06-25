import { useState } from "react";
import { ChevronRight } from "lucide-react";

export default function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      style={{
        background: hovered
          ? "linear-gradient(135deg, #1a3a6b 0%, #1e4080 100%)"
          : "linear-gradient(135deg, #0d1b3e 0%, #1a3a6b 100%)",
        color: "#fff",
        boxShadow: hovered
          ? "0 8px 24px rgba(13,27,62,0.35)"
          : "0 4px 14px rgba(13,27,62,0.25)",
        transform: hovered ? "translateY(-1px)" : "none",
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      aria-label={label}
    >
      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{label}</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  );
}
