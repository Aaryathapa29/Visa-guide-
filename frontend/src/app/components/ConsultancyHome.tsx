import { useState, useEffect } from "react";
import type { ConsultancyTab } from "./ui/theme";
import ConsultancyNavbar from "./consultancy/ConsultancyNavbar";
import OnboardingWizard from "./consultancy/OnboardingWizard";
import ConsultancyChatPanel from "./consultancy/ConsultancyChatPanel";
import AspirantQueueTable from "./consultancy/AspirantQueueTable";

export default function ConsultancyHome() {
  const [activeTab, setActiveTab] = useState<ConsultancyTab>("profile");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (raw) {
        const user = JSON.parse(raw);
        if (user && user.role === "consultancy") {
          // lazy import to avoid loading socket client for non-consultancy pages
          import("../../socketio-service").then(({ authenticateSocket }) => {
            authenticateSocket(user.id, "consultancy");
          }).catch(() => null);
        }
      }
    } catch (e) {
      // ignore
    }

    return () => {
      import("../../socketio-service").then(({ disconnectSocket }) => {
        disconnectSocket();
      }).catch(() => null);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
    window.location.reload();
  }

  return (
    <div className="aspirant-shell min-h-screen">
      <ConsultancyNavbar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl px-6 py-12 md:px-12">
        {/* Greeting */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#f97316]">Consultancy portal</p><h1 className="aspirant-serif mt-2 text-4xl text-[#0a1f44]">
            Consultancy Dashboard</h1>
          <p className="mt-3 text-sm text-slate-600">
            Manage your country profiles, respond to aspirants, and handle bookings.
          </p>
        </div>

        {activeTab === "profile" && (
          <section className="mt-8 border border-slate-200 bg-white p-6 shadow-[0_4px_20px_-8px_rgba(10,31,68,.18)]"><h2 className="aspirant-serif text-2xl text-[#0a1f44]">Country Profiles</h2><p className="mt-1 text-sm text-slate-600">Add the countries you offer visa services for, then fill in the required documents and application instructions for each.</p><div className="mt-6">
            <OnboardingWizard />
          </div></section>
        )}

        {activeTab === "chats" && (
          <section className="mt-8 border border-slate-200 bg-white p-6 shadow-[0_4px_20px_-8px_rgba(10,31,68,.18)]"><h2 className="aspirant-serif text-2xl text-[#0a1f44]">Aspirant Chats</h2><p className="mt-1 text-sm text-slate-600">Respond to messages from visa aspirants who are interested in your services.</p><div className="mt-6">
            <ConsultancyChatPanel />
          </div></section>
        )}

        {activeTab === "bookings" && (
          <section className="mt-8 border border-slate-200 bg-white p-6 shadow-[0_4px_20px_-8px_rgba(10,31,68,.18)]"><h2 className="aspirant-serif text-2xl text-[#0a1f44]">Counselling Bookings</h2><p className="mt-1 text-sm text-slate-600">Review pending booking requests, assign appointment times, and confirm sessions.</p><div className="mt-6">
            <AspirantQueueTable />
          </div></section>
        )}
      </main>
    </div>
  );
}
