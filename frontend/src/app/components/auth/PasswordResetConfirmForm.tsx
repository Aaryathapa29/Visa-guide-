import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Shield } from "lucide-react";
import InputField from "../ui/InputField";
import SubmitButton from "../ui/SubmitButton";
import API from "../../../api";

export default function PasswordResetConfirmForm({
  initialUidb64,
  initialToken,
  onBack,
  onSuccess,
}: {
  initialUidb64?: string;
  initialToken?: string;
  onBack: () => void;
  onSuccess?: () => void;
}) {
  const [uidb64, setUidb64] = useState(initialUidb64 ?? "");
  const [token, setToken] = useState(initialToken ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getErrorMessage(err: any) {
    const data = err?.response?.data;

    if (!data) {
      return "Unable to update password.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }

    const firstFieldError = Object.values(data).find((value) => {
      return Array.isArray(value) && value.length > 0;
    }) as string[] | undefined;

    if (firstFieldError?.length) {
      return firstFieldError[0];
    }

    return "Unable to update password.";
  }

  useEffect(() => {
    if (initialUidb64) {
      setUidb64(initialUidb64);
    }
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken, initialUidb64]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("auth/password-reset/confirm/", {
        uidb64,
        token,
        new_password: newPassword,
      });

      setMessage(response.data?.message ?? "Password updated successfully.");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
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
            background: "#eef4ff",
            color: "#2563eb",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          <Shield className="w-3 h-3" />
          PASSWORD RESET
        </div>
        <h1 style={{ color: "#0d1b3e", fontSize: "1.65rem", fontWeight: 700, lineHeight: 1.2 }}>
          Create a New Password
        </h1>
        <p style={{ color: "#5a6e8a", fontSize: "0.875rem", marginTop: "0.4rem" }}>
          Paste the reset token from your email, then set a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {message && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-xl">{message}</div>}
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>}

        <InputField
          id="uidb64"
          label="UID"
          placeholder="Paste uidb64 from the reset link"
          icon={<Shield className="w-4 h-4" />}
          value={uidb64}
          onChange={(e: any) => setUidb64(e.target.value)}
          required
        />
        <InputField
          id="token"
          label="Token"
          placeholder="Paste token from the reset link"
          icon={<Shield className="w-4 h-4" />}
          value={token}
          onChange={(e: any) => setToken(e.target.value)}
          required
        />
        <InputField
          id="newPassword"
          label="New Password"
          type={showNewPassword ? "text" : "password"}
          placeholder="Enter a new password"
          icon={<Lock className="w-4 h-4" />}
          value={newPassword}
          onChange={(e: any) => setNewPassword(e.target.value)}
          trailingToggle={{
            show: showNewPassword,
            onToggle: () => setShowNewPassword((current) => !current),
          }}
          required
        />
        <InputField
          id="confirmPassword"
          label="Confirm New Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Repeat the new password"
          icon={<Lock className="w-4 h-4" />}
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
          trailingToggle={{
            show: showConfirmPassword,
            onToggle: () => setShowConfirmPassword((current) => !current),
          }}
          required
        />

        <div className="mt-2 space-y-3">
          <SubmitButton label={loading ? "Updating..." : "Update Password"} disabled={loading} />
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