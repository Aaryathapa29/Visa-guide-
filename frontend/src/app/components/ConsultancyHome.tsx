import { useState } from "react";
import { Globe, CalendarDays, MessageCircle, Users } from "lucide-react";
import { ACCENT, DARK } from "./ui/theme";
import type { ConsultancyTab } from "./ui/theme";
import ConsultancyNavbar from "./consultancy/ConsultancyNavbar";
import OnboardingWizard from "./consultancy/OnboardingWizard";
import ConsultancyChatPanel from "./consultancy/ConsultancyChatPanel";
import AspirantQueueTable from "./consultancy/AspirantQueueTable";

const STATS = [
  { label: "Countries Offered", value: "0", icon: <Globe className="w-4 h-4" />, highlight: false },
  { label: "Pending Bookings", value: "3", icon: <CalendarDays className="w-4 h-4" />, highlight: true },
  { label: "Active Chats", value: "2", icon: <MessageCircle className="w-4 h-4" />, highlight: false },
  { label: "Aspirants Served", value: "124", icon: <Users className="w-4 h-4" />, highlight: false },
];

function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STATS.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: s.highlight ? "#fffbeb" : "#fff",
            border: `1px solid ${s.highlight ? "#fde68a" : "#dce6f5"}`,
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: s.highlight ? "#fef3c7" : "#eef2fb",
              color: s.highlight ? "#d97706" : ACCENT,
            }}
          >
            {s.icon}
          </div>
          <div>
            <div className="font-bold" style={{ color: DARK, fontSize: "1.2rem" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "#5a6e8a" }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionWrapper({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: "#fff", border: "1px solid #dce6f5" }}
    >
      <div>
        <h2 className="font-bold" style={{ color: DARK, fontSize: "1rem" }}>{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: "#5a6e8a" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function ConsultancyHome() {
  const [activeTab, setActiveTab] = useState<ConsultancyTab>("profile");

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
    window.location.reload();
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <ConsultancyNavbar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <main className="pt-16 max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="font-bold" style={{ color: DARK, fontSize: "1.4rem" }}>
            Consultancy Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5a6e8a" }}>
            Manage your country profiles, respond to aspirants, and handle bookings.
          </p>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Tab panels */}
        {activeTab === "profile" && (
          <SectionWrapper
            title="Country Profiles"
            subtitle="Add the countries you offer visa services for, then fill in the required documents and application instructions for each."
          >
            <OnboardingWizard />
          </SectionWrapper>
        )}

        {activeTab === "chats" && (
          <SectionWrapper
            title="Aspirant Chats"
            subtitle="Respond to messages from visa aspirants who are interested in your services."
          >
            <ConsultancyChatPanel />
          </SectionWrapper>
        )}

        {activeTab === "bookings" && (
          <SectionWrapper
            title="Counselling Bookings"
            subtitle="Review pending booking requests, assign appointment times, and confirm sessions."
          >
            <AspirantQueueTable />
          </SectionWrapper>
        )}
      </main>
    </div>
  );
}
