import { X } from "lucide-react";
import { ACCENT, DARK } from "./theme";

export function ModalOverlay({
  onClose,
  wide,
  children,
}: {
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxWidth: wide ? 560 : 420, height: 560, background: "#fff" }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 flex-shrink-0"
      style={{ background: DARK, borderRadius: "1rem 1rem 0 0" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: ACCENT }}
        >
          {icon}
        </div>
        <div>
          <div className="text-white font-semibold text-sm">{title}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {subtitle}
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-white/50 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
