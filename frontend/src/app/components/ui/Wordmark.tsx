import { Globe } from "lucide-react";

export default function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <Globe className="w-4 h-4 text-white" />
      </div>
      <span className="text-white font-bold tracking-tight" style={{ fontSize: "1rem" }}>
        VisaGuide
      </span>
    </div>
  );
}
