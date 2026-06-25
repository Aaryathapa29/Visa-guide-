import { useState } from "react";
import { Bot, CalendarDays, FileSearch, MessageCircle, ChevronRight } from "lucide-react";
import { DARK, ACCENT } from "./ui/theme";
import type { BrowseView } from "./ui/theme";
import AspirantNavbar from "./aspirant/AspirantNavbar";
import StatsBar from "./aspirant/StatsBar";
import CountryBrowseGrid, { BrowseToggle } from "./aspirant/CountryBrowseGrid";
import ConsultancyBrowseGrid from "./aspirant/ConsultancyBrowseGrid";
import ConsultancyChatPanel from "./aspirant/ConsultancyChatPanel";
import ChatbotModal from "./aspirant/ChatbotModal";
import DocumentAnalysisCard from "./aspirant/DocumentAnalysisCard";
import BookingModal from "./aspirant/BookingModal";

type Modal = "chat" | "docanalysis" | "booking" | null;

export default function VisaAspirantHome() {
  const [modal, setModal] = useState<Modal>(null);
  const [browseView, setBrowseView] = useState<BrowseView>("countries");

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
    window.location.reload();
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <AspirantNavbar
        onOpenChat={() => setModal("chat")}
        onOpenDocAnalysis={() => setModal("docanalysis")}
        onOpenBooking={() => setModal("booking")}
        onLogout={handleLogout}
      />

      <main className="pt-16 max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Greeting */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-bold" style={{ color: DARK, fontSize: "1.4rem" }}>
              Welcome back, Aspirant
            </h1>
            <p className="text-sm mt-1" style={{ color: "#5a6e8a" }}>
              Explore visa destinations and connect with consultants.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModal("chat")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#eef2fb", color: DARK }}
              aria-label="Open Visa Guide Assistant chatbot"
            >
              <Bot className="w-4 h-4" />
              Ask AI Assistant
            </button>
            <button
              onClick={() => setModal("booking")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: DARK, color: "#fff" }}
              aria-label="Book a counselling session"
            >
              <CalendarDays className="w-4 h-4" />
              Book Session
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Browse section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-base" style={{ color: DARK }}>Explore</h2>
            <BrowseToggle view={browseView} onChange={setBrowseView} />
          </div>

          {browseView === "countries" ? (
            <CountryBrowseGrid view="countries" />
          ) : (
            <ConsultancyBrowseGrid />
          )}
        </div>

        {/* Chat with consultancies */}
        <div className="space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2" style={{ color: DARK }}>
            <MessageCircle className="w-5 h-5" style={{ color: ACCENT }} />
            Chat with Consultancies
          </h2>
          <ConsultancyChatPanel />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Analyse Cover Letter",
              sub: "Get AI feedback instantly",
              icon: <FileSearch className="w-5 h-5" />,
              onClick: () => setModal("docanalysis"),
            },
            {
              label: "Book Counselling",
              sub: "1-on-1 with a consultant",
              icon: <CalendarDays className="w-5 h-5" />,
              onClick: () => setModal("booking"),
            },
            {
              label: "Visa AI Assistant",
              sub: "Ask anything, anytime",
              icon: <Bot className="w-5 h-5" />,
              onClick: () => setModal("chat"),
            },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex items-center gap-3 rounded-2xl p-4 text-left transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: DARK, color: "#fff" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {a.icon}
              </div>
              <div>
                <div className="font-semibold text-sm">{a.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {a.sub}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
          ))}
        </div>
      </main>

      {/* Modals */}
      {modal === "chat" && <ChatbotModal onClose={() => setModal(null)} />}
      {modal === "docanalysis" && <DocumentAnalysisCard onClose={() => setModal(null)} />}
      {modal === "booking" && <BookingModal onClose={() => setModal(null)} />}

      {/* Floating consultancy chat FAB */}
      <button
        onClick={() => setModal(null)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-30"
        style={{ background: ACCENT }}
        aria-label="Chat with a consultancy"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
