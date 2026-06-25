import { useState } from "react";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import InputField from "../ui/InputField";
import SubmitButton from "../ui/SubmitButton";
import API from "../../../api"; // Make sure your api.ts exists in src/

export default function AspirantSignupForm({
  onBack,
  onSignIn,
}: {
  onBack: () => void;
  onSignIn: () => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form input states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Status states
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Using email string as username for Django authentication
      const usernameValue = email.split("@")[0] + Math.floor(Math.random() * 1000);

      const response = await API.post("auth/register/", {
        username: usernameValue,
        email: email,
        password: password,
        role: "student",
      });

      if (response.status === 201) {
        setMessage("Aspirant account created successfully! Redirecting...");
        setTimeout(() => onSignIn(), 2000); // Send to sign in page automatically after 2 seconds
      }
    } catch (err: any) {
      if (err.response?.data) {
        setError(Object.values(err.response.data).flat().join(" "));
      } else {
        setError("Unable to connect to the registration server.");
      }
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
          <User className="w-3 h-3" />
          VISA ASPIRANT
        </div>
        <h1 style={{ color: "#0d1b3e", fontSize: "1.65rem", fontWeight: 700, lineHeight: 1.2 }}>
          Aspirant Sign Up
        </h1>
        <p style={{ color: "#5a6e8a", fontSize: "0.875rem", marginTop: "0.4rem" }}>
          Create your account to start your visa journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {/* Success and Error Banners */}
        {message && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-xl">{message}</div>}
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>}

        <InputField
          id="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          icon={<User className="w-4 h-4" />}
          value={fullName}
          onChange={(e: any) => setFullName(e.target.value)}
          required
        />
        <InputField
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          required
        />
        <InputField
          id="password"
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Create a strong password"
          icon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          required
          trailingToggle={{ show: showPass, onToggle: () => setShowPass((v) => !v) }}
        />
        <InputField
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          icon={<Lock className="w-4 h-4" />}
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
          required
          trailingToggle={{ show: showConfirm, onToggle: () => setShowConfirm((v) => !v) }}
        />

        <div className="mt-2 space-y-3">
          <SubmitButton label={loading ? "Registering..." : "Create Aspirant Account"} disabled={loading} />
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 transition-colors hover:underline focus-visible:outline-none"
              style={{ color: "#5a6e8a", fontSize: "0.8rem" }}
              aria-label="Back to user selection"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Selection
            </button>
          </div>
        </div>
      </form>

      <p className="text-center mt-6" style={{ color: "#5a6e8a", fontSize: "0.78rem" }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="font-semibold hover:underline focus-visible:outline-none"
          style={{ color: "#2563eb" }}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}