import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FileCheck,
  Globe,
  HelpCircle,
  Lock,
  Mail,
  Shield,
  User,
} from "lucide-react";

type Screen =
  | "selection"
  | "aspirant-signup"
  | "consultancy-signup"
  | "aspirant-signin"
  | "consultancy-signin";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
        <Globe className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.35em] text-white/70">Platform</div>
        <div className="text-[1.1rem] font-bold tracking-wide text-white">Visa Guide</div>
      </div>
    </div>
  );
}

function ProgressCard() {
  const rows = [
    { label: "Passport", fill: 0.9 },
    { label: "Visa Type", fill: 0.7 },
    { label: "Duration", fill: 0.55 },
    { label: "Status", fill: 0.8 },
    { label: "Documents", fill: 0.65 },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <FileCheck className="h-4 w-4 text-blue-300" />
        <span className="text-xs uppercase tracking-wider text-blue-200">Application Overview</span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex justify-between text-[0.72rem] text-white/60">
            <span>{row.label}</span>
            <span>{Math.round(row.fill * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${row.fill * 100}%`, background: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}
            />
          </div>
        </div>
      ))}
      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
        <div className="flex -space-x-2">
          {["#60a5fa", "#a78bfa", "#34d399"].map((color, index) => (
            <div
              key={color}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950/80 text-[0.6rem] font-bold text-white"
              style={{ background: color }}
            >
              {String.fromCharCode(65 + index)}
            </div>
          ))}
        </div>
        <span className="text-[0.7rem] text-white/50">3 consultants reviewing</span>
      </div>
    </div>
  );
}

function ConsultancyCard() {
  const items = [
    { label: "Government License", value: "LIC-2024-****", ok: true },
    { label: "Clients Assisted", value: "1,240+", ok: true },
    { label: "Success Rate", value: "94.2%", ok: true },
    { label: "Active Cases", value: "38", ok: false },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-4 w-4 text-green-300" />
        <span className="text-xs uppercase tracking-wider text-green-200">Verified Consultancy</span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/6 px-3 py-2">
          <span className="text-[0.75rem] text-white/60">{item.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[0.75rem] font-semibold text-white">{item.value}</span>
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: item.ok ? "#34d399" : "#facc15" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SidePanel({ type }: { type: "aspirant" | "consultancy" }) {
  return (
    <div
      className="flex h-full flex-col justify-between p-8 md:p-10"
      style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6b 60%, #1e4080 100%)" }}
    >
      <BrandMark />

      <div className="flex flex-1 flex-col justify-center space-y-6 py-10">
        <div>
          <h2 className="mb-3 whitespace-pre-line text-[1.65rem] font-bold leading-tight text-white">
            {type === "aspirant" ? "Your Visa Journey\nStarts Here" : "Join Our\nConsultancy Network"}
          </h2>
          <p className="text-sm leading-7 text-white/60">
            {type === "aspirant"
              ? "Track applications, upload documents, and connect with verified consultants in one place."
              : "Manage client cases, verify credentials, and grow your consultancy with secure tools."}
          </p>
        </div>

        {type === "aspirant" ? <ProgressCard /> : <ConsultancyCard />}
      </div>

      <div className="space-y-2">
        {(type === "aspirant"
          ? ["Track your application in real time", "Connect with verified consultants"]
          : ["Government-verified onboarding", "Secure client management"]
        ).map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-400/30">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            </div>
            <span className="text-[0.78rem] text-white/65">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldShell({
  id,
  label,
  icon,
  required,
  type = "text",
  placeholder,
  tooltip,
  trailingAction,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  required?: boolean;
  type?: string;
  placeholder: string;
  tooltip?: string;
  trailingAction?: { active: boolean; onClick: () => void };
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[0.82rem] font-semibold text-slate-800">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
        {tooltip ? (
          <div className="group relative">
            <HelpCircle className="h-3.5 w-3.5 cursor-help text-slate-500" aria-label={tooltip} />
            <div className="absolute -top-1 left-5 z-10 hidden w-52 rounded-lg bg-slate-950 p-2.5 text-xs leading-5 text-white/85 shadow-lg group-hover:block">
              {tooltip}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200"
        style={{
          background: focused ? "#eef4ff" : "#f5f7fb",
          border: `1.5px solid ${focused ? "#2563eb" : "#dce6f5"}`,
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
        }}
      >
        <span style={{ color: focused ? "#2563eb" : "#5a6e8a" }}>{icon}</span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
          style={{ color: "#0d1b3e", fontSize: "0.9rem" }}
        />
        {trailingAction ? (
          <button
            type="button"
            onClick={trailingAction.onClick}
            className="flex-shrink-0 text-slate-500 transition-colors"
            aria-label={trailingAction.active ? "Hide password" : "Show password"}
          >
            {trailingAction.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SelectShell({ id, label, required }: { id: string; label: string; required?: boolean }) {
  const [focused, setFocused] = useState(false);

  const orgTypes = [
    "Immigration Law Firm",
    "Visa Consultancy Agency",
    "HR / Relocation Services",
    "Travel & Tourism Agency",
    "Educational Institution",
    "Corporate HR Department",
    "Other",
  ];

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[0.82rem] font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200"
        style={{
          background: focused ? "#eef4ff" : "#f5f7fb",
          border: `1.5px solid ${focused ? "#2563eb" : "#dce6f5"}`,
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
        }}
      >
        <Building2 className="h-4 w-4 flex-shrink-0" style={{ color: focused ? "#2563eb" : "#5a6e8a" }} />
        <select
          id={id}
          name={id}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          defaultValue=""
          className="w-full bg-transparent outline-none appearance-none cursor-pointer"
          style={{ color: "#0d1b3e", fontSize: "0.9rem" }}
        >
          <option value="" disabled>
            Select organisation type
          </option>
          {orgTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PrimaryButton({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="submit"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      style={{
        background: hovered ? "linear-gradient(135deg, #1a3a6b 0%, #1e4080 100%)" : "linear-gradient(135deg, #0d1b3e 0%, #1a3a6b 100%)",
        color: "#fff",
        boxShadow: hovered ? "0 8px 24px rgba(13,27,62,0.35)" : "0 4px 14px rgba(13,27,62,0.25)",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <span className="text-[0.95rem] font-semibold">{children}</span>
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

function SplitLayout({ children, panelType }: { children: ReactNode; panelType: "aspirant" | "consultancy" }) {
  return (
    <div className="min-h-screen w-full flex-col md:flex md:flex-row">
      <div className="flex-shrink-0 md:w-2/5 lg:w-[42%]">
        <SidePanel type={panelType} />
      </div>
      <div className="flex flex-1 items-center justify-center bg-white p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function RoleSelection({
  onChoose,
  onSignIn,
}: {
  onChoose: (next: "aspirant-signup" | "consultancy-signup") => void;
  onSignIn: (next: "aspirant-signin" | "consultancy-signin") => void;
}) {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6"
      style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6b 55%, #1e4080 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { size: 600, x: -200, y: -200, opacity: 0.05 },
          { size: 400, x: "60%", y: "50%", opacity: 0.04 },
        ].map((circle, index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              width: circle.size,
              height: circle.size,
              left: circle.x,
              top: circle.y,
              background: "radial-gradient(circle, rgba(255,255,255,1), transparent)",
              opacity: circle.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/12">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-[2.2rem] font-extrabold tracking-[-0.01em] text-white">VisaGuide</h1>
            <p className="mt-2 text-[0.9rem] text-white/55">Choose your role to get started.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              key: "aspirant" as const,
              title: "I am a Visa Aspirant",
              icon: <User className="h-7 w-7" />,
              accent: "#60a5fa",
              bg: "rgba(96,165,250,0.1)",
              border: "rgba(96,165,250,0.3)",
              signup: "aspirant-signup" as const,
              signin: "aspirant-signin" as const,
            },
            {
              key: "consultancy" as const,
              title: "I am a Consultancy",
              icon: <Building2 className="h-7 w-7" />,
              accent: "#34d399",
              bg: "rgba(52,211,153,0.1)",
              border: "rgba(52,211,153,0.3)",
              signup: "consultancy-signup" as const,
              signin: "consultancy-signin" as const,
            },
          ].map((card) => (
            <SelectionCard
              key={card.key}
              title={card.title}
              icon={card.icon}
              accent={card.accent}
              bg={card.bg}
              border={card.border}
              onCreate={() => onChoose(card.signup)}
              onSignIn={() => onSignIn(card.signin)}
            />
          ))}
        </div>

        <p className="text-[0.72rem] text-white/35">
          By continuing, you agree to our <a href="#" className="underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Terms of Service</a> and <a href="#" className="underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function SelectionCard({
  icon,
  title,
  accent,
  bg,
  border,
  onCreate,
  onSignIn,
}: {
  icon: ReactNode;
  title: string;
  accent: string;
  bg: string;
  border: string;
  onCreate: () => void;
  onSignIn: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200"
      style={{
        background: hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
        border: `1.5px solid ${hovered ? border : "rgba(255,255,255,0.12)"}`,
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.25)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: bg, color: accent }}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-[0.95rem] font-bold text-white">{title}</div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[0.82rem] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-blue-900"
          style={{ background: accent, color: "#0d1b3e" }}
        >
          Create account <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 py-2.5 text-[0.82rem] font-semibold text-white/80 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-blue-900"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function AspirantSignUp({ onBack, onSignIn }: { onBack: () => void; onSignIn: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    window.alert("Aspirant account created! (demo)");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-blue-600">
          <User className="h-3 w-3" />
          Visa Aspirant
        </div>
        <h1 className="text-[1.65rem] font-bold leading-tight text-slate-950">Aspirant Sign Up</h1>
        <p className="mt-1.5 text-[0.875rem] text-slate-500">Create your account to start your visa journey.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <FieldShell id="fullName" label="Full Name" placeholder="Enter your full name" icon={<User className="h-4 w-4" />} required />
        <FieldShell id="email" label="Email Address" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} required />
        <FieldShell id="password" label="Password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" icon={<Lock className="h-4 w-4" />} required trailingAction={{ active: showPassword, onClick: () => setShowPassword((value) => !value) }} />
        <FieldShell id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} placeholder="Repeat your password" icon={<Lock className="h-4 w-4" />} required trailingAction={{ active: showConfirmPassword, onClick: () => setShowConfirmPassword((value) => !value) }} />

        <div className="mt-2 space-y-3">
          <PrimaryButton>Create Aspirant Account</PrimaryButton>
          <div className="text-center">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[0.8rem] text-slate-500 hover:underline focus-visible:outline-none">
              <ArrowLeft className="h-3 w-3" />
              Back to Selection
            </button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-[0.78rem] text-slate-500">
        Already have an account?{" "}
        <button type="button" onClick={onSignIn} className="font-semibold text-blue-600 hover:underline focus-visible:outline-none">
          Sign in
        </button>
      </p>
    </div>
  );
}

function ConsultancySignUp({ onBack, onSignIn }: { onBack: () => void; onSignIn: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    window.alert("Consultancy account submitted for verification! (demo)");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-emerald-600">
          <Building2 className="h-3 w-3" />
          Consultancy
        </div>
        <h1 className="text-[1.65rem] font-bold leading-tight text-slate-950">Consultancy Sign Up</h1>
        <p className="mt-1.5 text-[0.875rem] text-slate-500">Register your organisation to manage client visa cases.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <SelectShell id="orgType" label="Organisation Type" required />
        <FieldShell id="orgEmail" label="Official Email Address" type="email" placeholder="office@consultancy.com" icon={<Mail className="h-4 w-4" />} required />
        <FieldShell id="orgPassword" label="Password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" icon={<Lock className="h-4 w-4" />} required trailingAction={{ active: showPassword, onClick: () => setShowPassword((value) => !value) }} />
        <FieldShell
          id="licenseNumber"
          label="Government License Number"
          placeholder="Enter license number for verification"
          icon={<Shield className="h-4 w-4" />}
          required
          tooltip="Your government-issued consultancy license number is required for verification. This is reviewed by our compliance team within 24-48 hours."
        />

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-[0.75rem] leading-6 text-amber-900">
            Your license number will be verified with the relevant government authority before account activation.
          </p>
        </div>

        <div className="mt-2 space-y-3">
          <PrimaryButton>Submit for Verification</PrimaryButton>
          <div className="text-center">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[0.8rem] text-slate-500 hover:underline focus-visible:outline-none">
              <ArrowLeft className="h-3 w-3" />
              Back to Selection
            </button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-[0.78rem] text-slate-500">
        Already registered?{" "}
        <button type="button" onClick={onSignIn} className="font-semibold text-blue-600 hover:underline focus-visible:outline-none">
          Sign in
        </button>
      </p>
    </div>
  );
}

function AspirantSignIn({ onBack, onSignUp }: { onBack: () => void; onSignUp: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    window.alert("Signed in as Aspirant! (demo)");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-blue-600">
          <User className="h-3 w-3" />
          Visa Aspirant
        </div>
        <h1 className="text-[1.65rem] font-bold leading-tight text-slate-950">Welcome Back</h1>
        <p className="mt-1.5 text-[0.875rem] text-slate-500">Sign in to continue your visa journey.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <FieldShell id="signin-email" label="Email Address" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} required />
        <FieldShell id="signin-password" label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" icon={<Lock className="h-4 w-4" />} required trailingAction={{ active: showPassword, onClick: () => setShowPassword((value) => !value) }} />

        <div className="flex justify-end">
          <a href="#" className="text-[0.78rem] font-medium text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        <div className="mt-1 space-y-3">
          <PrimaryButton>Sign In</PrimaryButton>
          <div className="text-center">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[0.8rem] text-slate-500 hover:underline focus-visible:outline-none">
              <ArrowLeft className="h-3 w-3" />
              Back to Selection
            </button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-[0.78rem] text-slate-500">
        Don't have an account?{" "}
        <button type="button" onClick={onSignUp} className="font-semibold text-blue-600 hover:underline focus-visible:outline-none">
          Sign up
        </button>
      </p>
    </div>
  );
}

function ConsultancySignIn({ onBack, onSignUp }: { onBack: () => void; onSignUp: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    window.alert("Signed in as Consultancy! (demo)");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-emerald-600">
          <Building2 className="h-3 w-3" />
          Consultancy
        </div>
        <h1 className="text-[1.65rem] font-bold leading-tight text-slate-950">Welcome Back</h1>
        <p className="mt-1.5 text-[0.875rem] text-slate-500">Sign in to your consultancy dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <FieldShell id="consultancy-signin-email" label="Official Email Address" type="email" placeholder="office@consultancy.com" icon={<Mail className="h-4 w-4" />} required />
        <FieldShell id="consultancy-signin-password" label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" icon={<Lock className="h-4 w-4" />} required trailingAction={{ active: showPassword, onClick: () => setShowPassword((value) => !value) }} />

        <div className="flex justify-end">
          <a href="#" className="text-[0.78rem] font-medium text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <p className="text-[0.75rem] leading-6 text-emerald-950">
            Consultancy access is restricted to government-verified organisations only.
          </p>
        </div>

        <div className="mt-1 space-y-3">
          <PrimaryButton>Sign In</PrimaryButton>
          <div className="text-center">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[0.8rem] text-slate-500 hover:underline focus-visible:outline-none">
              <ArrowLeft className="h-3 w-3" />
              Back to Selection
            </button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-[0.78rem] text-slate-500">
        Not yet registered?{" "}
        <button type="button" onClick={onSignUp} className="font-semibold text-blue-600 hover:underline focus-visible:outline-none">
          Apply now
        </button>
      </p>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("selection");

  return (
    <div className="size-full">
      {screen === "selection" ? (
        <RoleSelection onChoose={(next) => setScreen(next)} onSignIn={(next) => setScreen(next)} />
      ) : null}

      {screen === "aspirant-signup" ? (
        <SplitLayout panelType="aspirant">
          <AspirantSignUp onBack={() => setScreen("selection")} onSignIn={() => setScreen("aspirant-signin")} />
        </SplitLayout>
      ) : null}

      {screen === "consultancy-signup" ? (
        <SplitLayout panelType="consultancy">
          <ConsultancySignUp onBack={() => setScreen("selection")} onSignIn={() => setScreen("consultancy-signin")} />
        </SplitLayout>
      ) : null}

      {screen === "aspirant-signin" ? (
        <SplitLayout panelType="aspirant">
          <AspirantSignIn onBack={() => setScreen("selection")} onSignUp={() => setScreen("aspirant-signup")} />
        </SplitLayout>
      ) : null}

      {screen === "consultancy-signin" ? (
        <SplitLayout panelType="consultancy">
          <ConsultancySignIn onBack={() => setScreen("selection")} onSignUp={() => setScreen("consultancy-signup")} />
        </SplitLayout>
      ) : null}
    </div>
  );
}