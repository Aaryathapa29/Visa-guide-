import { useEffect, useState } from "react";
import type { Screen } from "./components/ui/theme";
import RoleSelection from "./components/auth/RoleSelection";
import AspirantSignupForm from "./components/auth/AspirantSignupForm";
import ConsultancySignupForm from "./components/auth/ConsultancySignupForm";
import LoginPanel from "./components/auth/LoginPanel";
import SplitFormLayout from "./components/auth/SplitFormLayout";
import VisaAspirantHome from "./components/VisaAspirantHome";
import ConsultancyHome from "./components/ConsultancyHome";

export default function App() {
  const [screen, setScreen] = useState<Screen>("selection");

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    const savedRole = localStorage.getItem("authRole");

    if (savedToken && savedRole === "student") {
      setScreen("aspirant-home");
    }

    if (savedToken && savedRole === "consultancy") {
      setScreen("consultancy-home");
    }
  }, []);

  if (screen === "aspirant-home") {
    return <VisaAspirantHome />;
  }

  if (screen === "consultancy-home") {
    return <ConsultancyHome />;
  }

  if (screen === "consultancy-pending") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6b 55%, #1e4080 100%)" }}
      >
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl space-y-4">
          <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#2563eb" }}>
            Verification required
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#0d1b3e" }}>
            Consultancy registration submitted
          </h1>
          <p className="text-sm leading-6" style={{ color: "#5a6e8a" }}>
            Your account is waiting for manual review by the admin. You will only be able to sign in after the consultancy is verified.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setScreen("consultancy-signin")}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#0d1b3e" }}
            >
              Go to sign in
            </button>
            <button
              type="button"
              onClick={() => setScreen("selection")}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ background: "#eef4ff", color: "#2563eb" }}
            >
              Back to start
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full">
      {screen === "selection" && (
        <RoleSelection
          onSelect={(type) => setScreen(type)}
          onSignIn={(type) => setScreen(type)}
        />
      )}

      {screen === "aspirant" && (
        <SplitFormLayout panelType="aspirant">
          <AspirantSignupForm
            onBack={() => setScreen("selection")}
            onSignIn={() => setScreen("aspirant-signin")}
          />
        </SplitFormLayout>
      )}

      {screen === "consultancy" && (
        <SplitFormLayout panelType="consultancy">
          <ConsultancySignupForm
            onBack={() => setScreen("selection")}
            onSignIn={() => setScreen("consultancy-signin")}
            onVerificationPending={() => setScreen("consultancy-pending")}
          />
        </SplitFormLayout>
      )}

      {screen === "aspirant-signin" && (
        <SplitFormLayout panelType="aspirant">
          <LoginPanel
            role="aspirant"
            onBack={() => setScreen("selection")}
            onSignUp={() => setScreen("aspirant")}
            onLoginSuccess={() => {
              localStorage.setItem("authRole", "student");
              setScreen("aspirant-home");
            }}
          />
        </SplitFormLayout>
      )}

      {screen === "consultancy-signin" && (
        <SplitFormLayout panelType="consultancy">
          <LoginPanel
            role="consultancy"
            onBack={() => setScreen("selection")}
            onSignUp={() => setScreen("consultancy")}
            onLoginSuccess={() => {
              localStorage.setItem("authRole", "consultancy");
              setScreen("consultancy-home");
            }}
          />
        </SplitFormLayout>
      )}
    </div>
  );
}