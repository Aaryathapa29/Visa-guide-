import { useState } from "react";
import { Mail, Lock, Shield, HelpCircle, Building2, ArrowLeft } from "lucide-react";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import SubmitButton from "../ui/SubmitButton";
import API from "../../../api";

export default function ConsultancySignupForm({
  onBack,
  onSignIn,
  onVerificationPending,
}: {
  onBack: () => void;
  onSignIn: () => void;
  onVerificationPending: () => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form states
  const [orgType, setOrgType] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPassword, setOrgPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  
  // Status states
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (orgPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const usernameValue = orgEmail.split("@")[0] + "_agency";

      const response = await API.post("auth/register/", {
        username: usernameValue,
        email: orgEmail,
        password: orgPassword,
        role: "consultancy",
        organisation_type: orgType,       // Added to fix blank field error
        license_number: licenseNumber,   // Added to fix blank field error
      });

      if (response.status === 201) {
        setMessage("Consultancy submitted successfully! Waiting for admin verification.");
        setTimeout(() => onVerificationPending(), 2000);
      }
    } catch (err: any) {
      if (err.response?.data) {
        setError(Object.values(err.response.data).flat().join(" "));
      } else {
        setError("Server registration error.");
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
            background: "#ecfdf5",
            color: "#059669",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          <Building2 className="w-3 h-3" />
          CONSULTANCY
        </div>
        <h1 style={{ color: "#0d1b3e", fontSize: "1.65rem", fontWeight: 700, lineHeight: 1.2 }}>
          Consultancy Sign Up
        </h1>
        <p style={{ color: "#5a6e8a", fontSize: "0.875rem", marginTop: "0.4rem" }}>
          Register your organisation to manage client visa cases.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {message && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-xl">{message}</div>}
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>}

        <SelectField 
          id="orgType" 
          label="Organisation Type" 
          value={orgType}
          onChange={(e: any) => setOrgType(e.target.value)}
          required 
        />

        <InputField
          id="orgEmail"
          label="Official Email Address"
          type="email"
          placeholder="office@consultancy.com"
          icon={<Mail className="w-4 h-4" />}
          value={orgEmail}
          onChange={(e: any) => setOrgEmail(e.target.value)}
          required
        />

        <InputField
          id="orgPassword"
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Create a strong password"
          icon={<Lock className="w-4 h-4" />}
          value={orgPassword}
          onChange={(e: any) => setOrgPassword(e.target.value)}
          required
          trailingToggle={{ show: showPass, onToggle: () => setShowPass((v) => !v) }}
        />

        <InputField
          id="orgConfirmPassword"
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          icon={<Lock className="w-4 h-4" />}
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
          required
          trailingToggle={{ show: showConfirm, onToggle: () => setShowConfirm((v) => !v) }}
        />

        <InputField
          id="licenseNumber"
          label="Government License Number"
          placeholder="Enter license number for verification"
          icon={<Shield className="w-4 h-4" />}
          value={licenseNumber}
          onChange={(e: any) => setLicenseNumber(e.target.value)}
          required
          tooltip="Your government-issued consultancy license number is required for verification. This is reviewed by our compliance team within 24–48 hours."
        />

        <div
          className="flex items-start gap-2.5 rounded-xl p-3.5"
          style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#d97706" }} />
          <p style={{ color: "#92400e", fontSize: "0.75rem", lineHeight: 1.6 }}>
            Your license number will be verified with the relevant government authority before account
            activation.
          </p>
        </div>

        <div className="mt-2 space-y-3">
          <SubmitButton label={loading ? "Submitting..." : "Submit for Verification"} disabled={loading} />
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
        Already registered?{" "}
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