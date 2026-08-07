import { useState, type MouseEvent } from "react";
import { Bot, CalendarDays, FileSearch, ArrowRight, ShieldCheck, CheckCircle2, ArrowUpRight, BookOpenText, Compass, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BrowseView } from "./ui/theme";
import CountryBrowseGrid, { BrowseToggle } from "./aspirant/CountryBrowseGrid";
import ConsultancyBrowseGrid from "./aspirant/ConsultancyBrowseGrid";
import BookingModal from "./aspirant/BookingModal";
import ChatContainer from "./chat/ChatContainer";
import FeatureTile from "./aspirant/FeatureTile";
type Modal = "booking" | null;

export default function VisaAspirantHome() {
  const [modal, setModal] = useState<Modal>(null);
  const [browseView, setBrowseView] = useState<BrowseView>("consultancies");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    setPointer({ x, y });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7fc_100%)]">
      <main className="aspirant-shell">
        <section className="aspirant-hero relative overflow-hidden border-b border-white/10 text-white">
          <div
            className="relative mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-20 md:px-12 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-24"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => setPointer({ x: 0, y: 0 })}
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-[#f97316]" />
                Premium visa guidance
              </div>
              <h1 className="aspirant-serif mt-6 text-4xl leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Study abroad with clarity, confidence, and calm.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Explore visa paths, follow clear next steps, and move from documents to decisions with more confidence.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/consultancies")}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0a1f44] shadow-[0_18px_45px_-18px_rgba(10,31,68,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f8fbff]"
                >
                  Explore consultancies
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate("/document-analyzer")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(10,31,68,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f97316]/50 hover:bg-white/15 hover:shadow-[0_20px_45px_-22px_rgba(249,115,22,0.45)]"
                >
                  Try AI review
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  { label: "Verified consultancies" },
                  { label: "AI document review" },
                  { label: "Guided next steps" },
                ].map((item) => (
                  <span key={item.label} className="feature-pill inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/80 backdrop-blur">
                    <CheckCircle2 className="h-4 w-4 text-[#f97316]" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:mx-0" style={{ transform: `translate3d(${pointer.x * 0.6}px, ${pointer.y * 0.5}px, 0)` }}>
              <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-[0_35px_80px_-34px_rgba(10,31,68,0.35)] backdrop-blur-sm">
                <div className="rounded-[24px] border border-white/20 bg-[linear-gradient(135deg,#0a1f44_0%,#163a6b_45%,#2563eb_100%)] p-7 text-white shadow-[0_22px_60px_-24px_rgba(10,31,68,0.55)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">Trusted guidance</p>
                      <h3 className="mt-3 text-2xl font-semibold leading-snug">Everything you need to prepare with confidence.</h3>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-200">Review documents, follow clear next steps, and move forward with a calmer plan for your visa journey.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Study Asia",
                        description: "Explore country guides, document requirements, and practical next moves in one place.",
                        icon: <BookOpenText className="h-4 w-4" />,
                      },
                      {
                        title: "Next step",
                        description: "Stay focused with clear actions, verified guidance, and simple progress at every stage.",
                        icon: <Compass className="h-4 w-4" />,
                      },
                    ].map((item) => (
                      <FeatureTile key={item.title} title={item.title} description={item.description} icon={item.icon} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="explore" className="mx-auto max-w-7xl scroll-mt-20 px-6 pb-16 md:px-12 lg:px-16">
          <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_24px_70px_-36px_rgba(10,31,68,0.24)]">
            <div className="bg-white px-8 py-8 text-slate-900">
              <div className="flex items-center justify-between gap-5">
                <h2 className="aspirant-serif text-3xl tracking-tight sm:text-4xl">Explore</h2>
                <BrowseToggle view={browseView} onChange={setBrowseView} />
              </div>
            </div>
            <div className="bg-white p-8 sm:p-10">
              {browseView === "countries" ? <CountryBrowseGrid /> : <ConsultancyBrowseGrid />}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(244,248,255,0.92)_100%)]">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 lg:px-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f97316]">AI toolkit</p>
            <h2 className="aspirant-serif mt-2 text-3xl text-[#0a1f44] sm:text-4xl">A calmer way to prepare every step.</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { label: "Document analyser", sub: "Review your cover letter and key documents before submission.", icon: <FileSearch className="h-6 w-6" />, onClick: () => navigate("/document-analyzer") },
                { label: "Visa AI assistant", sub: "Ask visa questions in plain language whenever you need an answer.", icon: <Bot className="h-6 w-6" />, onClick: () => navigate("/chatbot") },
                { label: "Book counselling", sub: "Arrange a focused session with a consultant when the time is right.", icon: <CalendarDays className="h-6 w-6" />, onClick: () => setModal("booking") },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="group rounded-[24px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 text-left shadow-[0_18px_45px_-24px_rgba(10,31,68,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(10,31,68,0.35)]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef4ff] text-[#0a1f44] transition-all duration-300 group-hover:bg-[#0a1f44] group-hover:text-white">
                    {action.icon}
                  </span>
                  <h3 className="aspirant-serif mt-5 text-xl text-[#0a1f44]">{action.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{action.sub}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.24em] text-[#0a1f44] transition-colors group-hover:text-[#2563eb]">
                    Open tool <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {modal === "booking" && <BookingModal onClose={() => setModal(null)} />}

      <button
        onClick={() => navigate("/chatbot")}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#0a1f44] text-white shadow-[0_20px_45px_-16px_rgba(10,31,68,0.45)] transition-all duration-300 hover:scale-105 hover:bg-[#163a6b] active:scale-95"
        aria-label="Open Visa Guide Assistant"
      >
        <Bot className="h-5 w-5" />
      </button>
    </div>
  );
}