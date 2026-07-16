import { useState } from "react";
import { Bot, CalendarDays, FileSearch, MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import type { BrowseView } from "./ui/theme";
import AspirantNavbar from "./aspirant/AspirantNavbar";
import CountryBrowseGrid, { BrowseToggle } from "./aspirant/CountryBrowseGrid";
import ConsultancyBrowseGrid from "./aspirant/ConsultancyBrowseGrid";
import VisaChatbot from "./chatbot/VisaChatbot";
import BookingModal from "./aspirant/BookingModal";
import DocumentAnalysisCard from "./aspirant/DocumentAnalysisCard";
import AccountSettings from "./pages/AccountSettings";

type Modal = "booking" | null;
type Page = "home" | "chat" | "document" | "settings";

export default function VisaAspirantHome() {
  const [modal, setModal] = useState<Modal>(null);
  const [browseView, setBrowseView] = useState<BrowseView>("consultancies");
  const [page, setPage] = useState<Page>("home");

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
    window.location.reload();
  }

  const userName = localStorage.getItem("authUser")
    ? JSON.parse(localStorage.getItem("authUser") || "{}").email
    : "";

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <AspirantNavbar
        onOpenDocAnalysis={() => setPage("document")}
        onOpenSettings={() => setPage("settings")}
        onLogout={handleLogout}
      />

      {page === "chat" && <VisaChatbot onClose={() => setPage("home")} />}
      {page === "document" && <DocumentAnalysisCard onClose={() => setPage("home")} />}
      {page === "settings" && (
        <AccountSettings
          userRole="aspirant"
          userName={userName}
          onBack={() => setPage("home")}
          onAccountDeleted={handleLogout}
        />
      )}

      {page === "home" && <>

      <main className="aspirant-shell">
        <section className="aspirant-hero relative flex min-h-[53vh] items-center overflow-hidden border-b border-white/10 text-white">
          <div className="relative mx-auto w-full max-w-7xl px-6 py-20 md:px-12 lg:px-16">
            <div className="h-0.5 w-16 bg-[#f97316]" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[.25em] text-[#f97316]">Your global future starts here</p>
            <h1 className="aspirant-serif mt-3 max-w-5xl text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">Only Trusted Consultancies,<br className="hidden sm:block" /> All In One Place</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">Explore visa destinations with confidence, connect with verified consultancies, and make your journey to the skies easier.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#explore" className="inline-flex items-center gap-2 bg-[#f97316] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90">Start exploring <ArrowRight className="h-4 w-4" /></a>
              <button onClick={() => setPage("chat")} className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-[#f97316] hover:text-[#f97316]"><Sparkles className="h-4 w-4" />Ask the AI advisor</button>
            </div>
          </div>
        </section>

        <section id="explore" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16 md:px-12 lg:px-16">
          <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#f97316]">Discover</p>
          <div className="flex flex-wrap items-end justify-between gap-5"><div><h2 className="aspirant-serif mt-2 text-4xl tracking-tight text-[#0a1f44] md:text-5xl">Explore</h2><div className="mt-3 h-0.5 w-16 bg-[#f97316]" /></div><BrowseToggle view={browseView} onChange={setBrowseView} /></div>
          <div className="mt-8">{browseView === "countries" ? <CountryBrowseGrid /> : <ConsultancyBrowseGrid />}</div>
        </section>

        <section className="border-y border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-6 py-14 md:px-12 lg:px-16"><p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#f97316]">AI Toolkit</p><h2 className="aspirant-serif mt-2 text-3xl text-[#0a1f44]">Make every step clearer.</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{[
          { label: "Document Analyser", sub: "Review your cover letter before submission.", icon: <FileSearch className="h-6 w-6" />, onClick: () => setPage("document") },
          { label: "Visa AI Assistant", sub: "Ask visa questions anytime, in plain language.", icon: <Bot className="h-6 w-6" />, onClick: () => setPage("chat") },
          { label: "Book Counselling", sub: "Request a focused session with a consultant.", icon: <CalendarDays className="h-6 w-6" />, onClick: () => setModal("booking") },
        ].map((action) => <button key={action.label} onClick={action.onClick} className="aspirant-card group p-6 text-left transition-all hover:-translate-y-1"><span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-[#0a1f44] transition-colors group-hover:bg-[#f97316] group-hover:text-white">{action.icon}</span><h3 className="aspirant-serif mt-5 text-xl text-[#0a1f44]">{action.label}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{action.sub}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#0a1f44] group-hover:text-[#f97316]">Open tool <ArrowRight className="h-4 w-4" /></span></button>)}</div></div></section>
      </main>

      {modal === "booking" && <BookingModal onClose={() => setModal(null)} />}

      {/* Floating consultancy chat FAB */}
      <button onClick={() => setPage("chat")} className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#f97316] text-white shadow-lg transition-all hover:scale-105 active:scale-95" aria-label="Open Visa Guide Assistant">
        <Sparkles className="h-5 w-5" />
      </button>
      </>}
    </div>
  );
}