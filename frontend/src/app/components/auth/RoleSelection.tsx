import { useState } from "react";
import { Globe, User, Building2, ChevronRight } from "lucide-react";
import type { Screen } from "../ui/theme";

interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  accent: string;
  bg: string;
  border: string;
  onSelect: () => void;
  onSignIn: () => void;
}

function SelectionCard({
  icon,
  title,
  accent,
  bg,
  border,
  onSelect,
  onSignIn,
}: SelectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
        border: `1.5px solid ${hovered ? border : "rgba(255,255,255,0.12)"}`,
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.25)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: bg, color: accent }}
      >
        {icon}
      </div>

      <div className="flex-1">
        <div className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
          {title}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-blue-900"
          style={{ background: accent, color: "#0d1b3e", fontSize: "0.82rem", fontWeight: 700 }}
          aria-label={`Sign up as ${title}`}
        >
          Create account <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-blue-900"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
            fontSize: "0.82rem",
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          aria-label={`Sign in as ${title}`}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

const CARDS = [
  {
    type: "aspirant" as const,
    signinType: "aspirant-signin" as const,
    icon: <User className="w-7 h-7" />,
    title: "I am a Visa Aspirant",
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.3)",
  },
  {
    type: "consultancy" as const,
    signinType: "consultancy-signin" as const,
    icon: <Building2 className="w-7 h-7" />,
    title: "I am a Consultancy",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.3)",
  },
] as const;

export default function RoleSelection({
  onSelect,
  onSignIn,
}: {
  onSelect: (t: "aspirant" | "consultancy") => void;
  onSignIn: (t: Extract<Screen, "aspirant-signin" | "consultancy-signin">) => void;
}) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative"
      style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6b 55%, #1e4080 100%)" }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[
          { size: 600, x: -200, y: -200, opacity: 0.05 },
          { size: 400, x: "60%", y: "50%", opacity: 0.04 },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: c.size,
              height: c.size,
              left: c.x,
              top: c.y,
              background: "radial-gradient(circle, rgba(255,255,255,1), transparent)",
              opacity: c.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-10 text-center">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1
              className="text-white"
              style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.1 }}
            >
              VisaGuide
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Choose your role to get started.
            </p>
          </div>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <SelectionCard
              key={card.type}
              {...card}
              onSelect={() => onSelect(card.type)}
              onSignIn={() => onSignIn(card.signinType)}
            />
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
