import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Globe2, Mail, MapPin, Phone, Star } from "lucide-react";
import { COUNTRIES } from "@/lib/visa-data";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "VisaGuide — Only Trusted Consultancies, All In One Place" },
      {
        name: "description",
        content:
          "Explore student-visa options for USA, Canada and Australia through trusted consultancies — all in one place.",
      },
    ],
  }),
});

type ExploreMode = "consultancy" | "country";
const MODES: Array<{ value: ExploreMode; label: string; icon: typeof Globe2 }> = [
  { value: "consultancy", label: "By Consultancy", icon: Building2 },
  { value: "country", label: "By Country", icon: Globe2 },
];

const CONSULTANCIES = [
  {
    name: "Northstar Global Education",
    tagline: "Ivy League specialists since 2011.",
    countries: ["USA", "Canada"],
    rating: 4.8,
    reviews: 312,
    city: "Bengaluru",
    phone: "+91 80 4123 5678",
    email: "hello@northstar-edu.mock",
  },
  {
    name: "Southern Cross Consultants",
    tagline: "Australia & Canada specialists with 12+ years of practice.",
    countries: ["Australia", "Canada"],
    rating: 4.7,
    reviews: 208,
    city: "Mumbai",
    phone: "+91 22 6198 4400",
    email: "care@southerncross.mock",
  },
];

function Index() {
  const [mode, setMode] = useState<ExploreMode>("country");

  // Smooth scroll to #explore when landing with hash
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#explore") {
      const el = document.getElementById("explore");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div>
      {/* Hero */}
      <section
        className="relative flex min-h-[60vh] items-center overflow-hidden border-b border-white/10 bg-primary text-primary-foreground"
        aria-label="Hero"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gold opacity-[0.10] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-white opacity-[0.04] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.19_0.08_265/0.6),transparent)]" />
        </div>
        <div className="relative w-full px-6 py-20 md:px-12 lg:px-16">
          <div className="h-0.5 w-16 bg-gold" />
          <h1 className="mt-6 max-w-5xl font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Only Trusted Consultancies,<br className="hidden sm:block" /> All In One Place
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">
            Make your journey to the skies easier with VisaGuide. Explore your visa options with confidence and ease.
          </p>
          <div className="mt-10">
            <a
              href="#explore"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", "#explore");
              }}
              className="group relative inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-gold"
            >
              Start exploring <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-100 bg-gold transition-transform duration-300 group-hover:scale-x-0" />
            </a>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section id="explore" className="w-full scroll-mt-20 px-6 py-16 md:px-12 lg:px-16">
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Discover</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight text-primary md:text-5xl">Explore</h2>
          <div className="mt-3 h-0.5 w-16 bg-gold" />

          <div
            role="tablist"
            aria-label="Explore mode"
            className="mt-8 inline-flex flex-wrap gap-2 border border-border bg-card p-1.5 shadow-[var(--shadow-card)]"
          >
            {MODES.map((opt) => {
              const active = opt.value === mode;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(opt.value)}
                  className={
                    "inline-flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors sm:px-5 " +
                    (active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary")
                  }
                >
                  <Icon className="h-4 w-4" /> {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {mode === "country" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COUNTRIES.map((c) => (
              <Link
                key={c.code}
                to="/countries/$country"
                params={{ country: c.code }}
                className="group relative overflow-hidden border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-[var(--shadow-elegant)]"
              >
                <div
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100"
                  aria-hidden
                />
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-border bg-secondary text-3xl transition-colors group-hover:border-gold">
                    {c.flag}
                  </span>
                  <span className="rounded-sm bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    {c.visaType.split(" ")[0]}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-2xl text-primary">{c.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.tagline}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <Row label="Visa" value={c.visaType} />
                  <Row label="Processing" value={c.processingTime.split("(")[0].trim()} />
                  <Row label="Post-study" value={c.postStudyWork} />
                </dl>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex gap-1">
                    {c.levels.map((l) => (
                      <span key={l} className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {l}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary transition-all group-hover:gap-2 group-hover:text-gold">
                    View guide <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {mode === "consultancy" && (
          <div className="grid gap-6 sm:grid-cols-2">
            {CONSULTANCIES.map((c) => (
              <Link
                key={c.name}
                to="/consultancies"
                className="group relative overflow-hidden border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-[var(--shadow-elegant)]"
              >
                <div
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100"
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-secondary text-primary transition-colors group-hover:border-gold">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-foreground">
                    <Star className="h-3 w-3 fill-current" /> {c.rating}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-2xl text-primary">{c.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.tagline}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.countries.map((cn) => (
                    <span key={cn} className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                      <Globe2 className="h-3 w-3" /> {cn}
                    </span>
                  ))}
                </div>
                <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> {c.city}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {c.phone}</p>
                  <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-primary" /> {c.email}</p>
                </dl>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.reviews} reviews</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary transition-all group-hover:gap-2 group-hover:text-gold">
                    View profile <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-primary">{value}</dd>
    </div>
  );
}
