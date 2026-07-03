import { useState } from "react";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import InputField from "../ui/InputField";
import SubmitButton from "../ui/SubmitButton";
import API from "../../../api";

export default function PasswordResetRequestForm({
  role,
  onBack,
  onRequested,
}: {
  role: "aspirant" | "consultancy";
  onBack: () => void;
  onRequested?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await API.post("auth/password-reset/", { email });
      setMessage(response.data?.message ?? "Check your email for the reset link.");

      if (onRequested) {
        onRequested();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Unable to start password reset right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
          style={{
            background: role === "aspirant" ? "#eef4ff" : "#ecfdf5",
            color: role === "aspirant" ? "#2563eb" : "#059669",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          <Shield className="w-3 h-3" />
          {role === "aspirant" ? "VISA ASPIRANT" : "CONSULTANCY"}
        </div>
        <h1 style={{ color: "#0d1b3e", fontSize: "1.65rem", fontWeight: 700, lineHeight: 1.2 }}>
          Reset Password
        </h1>
        <p style={{ color: "#5a6e8a", fontSize: "0.875rem", marginTop: "0.4rem" }}>
          Enter the email address for your account and we will send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {message && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-xl">{message}</div>}
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>}

        <InputField
          id="reset-email"
          label={role === "aspirant" ? "Email Address" : "Official Email Address"}
          type="email"
          placeholder={role === "aspirant" ? "you@example.com" : "office@consultancy.com"}
          icon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          required
        />

        <div className="mt-2 space-y-3">
          <SubmitButton label={loading ? "Sending..." : "Send reset link"} disabled={loading} />
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 transition-colors hover:underline focus-visible:outline-none"
              style={{ color: "#5a6e8a", fontSize: "0.8rem" }}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Sign In
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}