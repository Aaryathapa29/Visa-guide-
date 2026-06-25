import { FileCheck, Shield, CheckCircle2, Globe } from "lucide-react";

// ── Decorative graphics shown inside the dark left panel ─────────────────────

function DataSheetGraphic() {
  const rows = [
    { label: "Passport", fill: 0.9 },
    { label: "Visa Type", fill: 0.7 },
    { label: "Duration", fill: 0.55 },
    { label: "Status", fill: 0.8 },
    { label: "Documents", fill: 0.65 },
  ];
  return (
    <div
      className="w-full rounded-2xl p-5 space-y-3"
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="w-4 h-4 text-blue-300" />
        <span className="text-blue-200 text-xs uppercase tracking-wider">Application Overview</span>
      </div>

      {rows.map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="flex justify-between">
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>{r.label}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
              {Math.round(r.fill * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${r.fill * 100}%`,
                background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
              }}
            />
          </div>
        </div>
      ))}

      <div
        className="flex items-center gap-2 mt-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex -space-x-2">
          {["#60a5fa", "#a78bfa", "#34d399"].map((c, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: c,
                border: "2px solid rgba(13,27,62,0.8)",
                fontSize: "0.6rem",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>
          3 consultants reviewing
        </span>
      </div>
    </div>
  );
}

function ConsultancyGraphic() {
  const items = [
    { label: "Government License", value: "LIC-2024-****", ok: true },
    { label: "Clients Assisted", value: "1,240+", ok: true },
    { label: "Success Rate", value: "94.2%", ok: true },
    { label: "Active Cases", value: "38", ok: false },
  ];
  return (
    <div
      className="w-full rounded-2xl p-5 space-y-4"
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-green-300" />
        <span className="text-green-200 text-xs uppercase tracking-wider">Verified Consultancy</span>
      </div>

      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between py-2 px-3 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>{item.label}</span>
          <div className="flex items-center gap-2">
            <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 600 }}>{item.value}</span>
            <CheckCircle2
              className="w-3.5 h-3.5"
              style={{ color: item.ok ? "#34d399" : "#facc15" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dark left panel ───────────────────────────────────────────────────────────

function DarkPanel({ type }: { type: "aspirant" | "consultancy" }) {
  const features =
    type === "aspirant"
      ? ["Track your application in real time", "Connect with verified consultants"]
      : ["Government-verified onboarding", "Secure client management"];

  return (
    <div
      className="flex flex-col justify-between p-8 md:p-10 min-h-full"
      style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6b 60%, #1e4080 100%)" }}
    >
      {/* Wordmark — duplicated here to avoid circular dep with Wordmark.tsx */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div
          className="text-white tracking-wide"
          style={{ fontSize: "1.1rem", fontWeight: 700 }}
        >
          VisaGuide
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-10 space-y-6">
        <div>
          <h2
            className="text-white leading-tight mb-3 whitespace-pre-line"
            style={{ fontSize: "1.65rem", fontWeight: 700 }}
          >
            {type === "aspirant"
              ? "Your Visa Journey\nStarts Here"
              : "Join Our\nConsultancy Network"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.7 }}>
            {type === "aspirant"
              ? "Track applications, upload documents, and connect with verified consultants — all in one place."
              : "Manage client cases, verify credentials, and grow your consultancy with powerful tools."}
          </p>
        </div>

        {type === "aspirant" ? <DataSheetGraphic /> : <ConsultancyGraphic />}
      </div>

      <div className="space-y-2">
        {features.map((feat) => (
          <div key={feat} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.3)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            </div>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem" }}>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Split layout shell ────────────────────────────────────────────────────────

export default function SplitFormLayout({
  panelType,
  children,
}: {
  panelType: "aspirant" | "consultancy";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="md:w-2/5 lg:w-[42%] flex-shrink-0">
        <DarkPanel type={panelType} />
      </div>
      <div
        className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-16"
        style={{ background: "#ffffff" }}
      >
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
