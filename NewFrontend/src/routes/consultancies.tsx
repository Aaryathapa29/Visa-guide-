import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Star, ArrowRight, Globe2 } from "lucide-react";

export const Route = createFileRoute("/consultancies")({
  component: ConsultanciesPage,
  head: () => ({
    meta: [
      { title: "Partner Consultancies | VisaGuide" },
      { name: "description", content: "Meet the two partner consultancies helping students file for USA, Canada and Australia study visas." },
    ],
  }),
});

const consultancies = [
  {
    name: "Northstar Global Education",
    tagline: "Ivy League specialists since 2011.",
    countries: ["USA", "Canada"],
    rating: 4.8,
    reviews: 312,
    address: "3rd Floor, Horizon Tower, MG Road, Bengaluru",
    phone: "+91 80 4123 5678",
    email: "hello@northstar-edu.mock",
    services: [
      "Free profile evaluation",
      "SOP & LOR drafting",
      "F-1 visa mock interview",
      "Scholarship shortlisting",
    ],
    tint: "from-primary/90 to-primary",
  },
  {
    name: "Southern Cross Consultants",
    tagline: "Australia & Canada specialists with 12+ years of practice.",
    countries: ["Australia", "Canada"],
    rating: 4.7,
    reviews: 208,
    address: "204, Marine Chambers, Nariman Point, Mumbai",
    phone: "+91 22 6198 4400",
    email: "care@southerncross.mock",
    services: [
      "GTE statement coaching",
      "PGWP & PR roadmap",
      "CoE & OSHC arrangement",
      "Post-arrival settlement",
    ],
    tint: "from-navy-deep to-primary",
  },
];

function ConsultanciesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">Trusted partners</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-primary md:text-5xl">
          Two consultancies. One goal — your acceptance letter.
        </h1>
        <p className="mt-3 text-muted-foreground">
          These are demonstration profiles for our academic project. Both illustrate the kind of end-to-end support a
          student typically receives when engaging a visa consultancy.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {consultancies.map((c) => (
          <article
            key={c.name}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
          >
            <div className={`bg-gradient-to-br ${c.tint} p-6 text-primary-foreground`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{c.name}</h2>
                  <p className="mt-1 text-sm text-primary-foreground/80">{c.tagline}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground">
                  <Star className="h-3 w-3 fill-current" /> {c.rating}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.countries.map((cn) => (
                  <span key={cn} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs">
                    <Globe2 className="h-3 w-3" /> {cn}
                  </span>
                ))}
                <span className="text-xs text-primary-foreground/70">· {c.reviews} student reviews</span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold text-primary">Services</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {c.services.map((s) => (
                  <li key={s} className="rounded-md bg-secondary px-3 py-2 text-foreground">{s}</li>
                ))}
              </ul>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> {c.address}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {c.phone}</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {c.email}</p>
              </div>

              <Link
                to="/chat"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-gold"
              >
                Ask AI about this consultancy <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-10 rounded-xl border border-dashed border-border bg-secondary/60 p-4 text-center text-xs text-muted-foreground">
        Mock data for a college project. Contact details are illustrative and non-functional.
      </p>
    </div>
  );
}