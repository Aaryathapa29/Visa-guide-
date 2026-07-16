import { useState } from "react";
import { Mail, Lock, User, Building2, ArrowLeft, ChevronRight, Shield } from "lucide-react";
import InputField from "../ui/InputField";
import API from "../../../api"; // Make sure your api.ts exists in src/

interface LoginPanelProps {
  role: "aspirant" | "consultancy";
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onLoginSuccess?: (role: string) => void;
}

export default function LoginPanel({ role, onBack, onSignUp, onForgotPassword, onLoginSuccess }: LoginPanelProps) {
  const [showPass, setShowPass] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isAspirant = role === "aspirant";

  // Form input and loading states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("auth/login/", {
        email: email,
        password: password,
        role: role === "aspirant" ? "student" : "consultancy",
      });

      if (response.status === 200) {
        const { access, refresh, user } = response.data;

        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
        localStorage.setItem("authRole", user.role);
        localStorage.setItem("authUser", JSON.stringify(user));

        if (onLoginSuccess) {
          onLoginSuccess(user.role);
        } else {
          alert(`Successfully authenticated as ${user.role}!`);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      
      // Provide specific error messages based on status
      if (status === 401) {
        // Unauthorized - could be wrong email or password
        if (detail?.toLowerCase().includes("email")) {
          setError("Email address not found. Please check and try again, or sign up for a new account.");
        } else if (detail?.toLowerCase().includes("password")) {
          setError("Incorrect password. Please try again.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else if (detail) {
        setError(detail);
      } else {
        setError("Connection failed. Check if the Django backend server is awake.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header badge */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
          style={{
            background: isAspirant ? "#eef4ff" : "#ecfdf5",
            color: isAspirant ? "#2563eb" : "#059669",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          {isAspirant ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
          {isAspirant ? "VISA ASPIRANT" : "CONSULTANCY"}
        </div>
        <h1 style={{ color: "#0d1b3e", fontSize: "1.65rem", fontWeight: 700, lineHeight: 1.2 }}>
          Welcome Back
        </h1>
        <p style={{ color: "#5a6e8a", fontSize: "0.875rem", marginTop: "0.4rem" }}>
          {isAspirant
            ? "Sign in to continue your visa journey."
            : "Sign in to your consultancy dashboard."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {/* Error notification banner */}
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>}

        <InputField
          id={isAspirant ? "signin-email" : "cons-signin-email"}
          label={isAspirant ? "Email Address" : "Official Email Address"}
          type="email"
          placeholder={isAspirant ? "you@example.com" : "office@consultancy.com"}
          icon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          required
        />
        <InputField
          id={isAspirant ? "signin-password" : "cons-signin-password"}
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Enter your password"
          icon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          required
          trailingToggle={{ show: showPass, onToggle: () => setShowPass((v) => !v) }}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="hover:underline"
            style={{ color: "#2563eb", fontSize: "0.78rem", fontWeight: 500 }}
          >
            Forgot password?
          </button>
        </div>

        {/* Consultancy-only verification notice */}
        {!isAspirant && (
          <div
            className="flex items-start gap-2.5 rounded-xl p-3.5"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#059669" }} />
            <p style={{ color: "#14532d", fontSize: "0.75rem", lineHeight: 1.6 }}>
              Consultancy access is restricted to government-verified organisations only.
            </p>
          </div>
        )}

        <div className="mt-1 space-y-3">
          <button
            type="submit"
            disabled={loading}
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
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              {loading ? "Signing In..." : "Sign In"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 transition-colors hover:underline focus-visible:outline-none"
              style={{ color: "#5a6e8a", fontSize: "0.8rem" }}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Selection
            </button>
          </div>
        </div>
      </form>

      <p className="text-center mt-6" style={{ color: "#5a6e8a", fontSize: "0.78rem" }}>
        {isAspirant ? "Don't have an account? " : "Not yet registered? "}
        <button
          type="button"
          onClick={onSignUp}
          className="font-semibold hover:underline focus-visible:outline-none"
          style={{ color: "#2563eb" }}
        >
          {isAspirant ? "Sign up" : "Apply now"}
        </button>
      </p>
    </div>
  );
}