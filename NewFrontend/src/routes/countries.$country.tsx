import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileText, Clock, Wallet, Languages, Briefcase, ArrowRight } from "lucide-react";
import { getCountry, type CountryVisaInfo } from "@/lib/visa-data";

export const Route = createFileRoute("/countries/$country")({
  loader: ({ params }) => {
    const c = getCountry(params.country);
    if (!c) throw notFound();
    return { country: c };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.country.name} Student Visa Guide | VisaGuide` },
          {
            name: "description",
            content: `${loaderData.country.visaType} — documents, fees, processing time and post-study work rights for ${loaderData.country.name}.`,
          },
        ]
      : [],
  }),
  component: CountryDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold text-primary">Country not found</h1>
      <Link to="/countries" className="mt-4 inline-block text-gold underline">Back to countries</Link>
    </div>
  ),
});

function CountryDetail() {
  const data = Route.useLoaderData() as { country: CountryVisaInfo };
  const c = data.country;

  return (
    <div>
      <section
        className="border-b border-white/10 text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Link to="/countries" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> All countries
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-6xl">{c.flag}</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{c.name}</h1>
              <p className="mt-2 max-w-xl text-primary-foreground/80">{c.tagline}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-gold">Visa type</p>
              <p className="mt-1 text-lg font-semibold">{c.visaType}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <Stat icon={Clock} label="Processing time" value={c.processingTime} />
          <Stat icon={Wallet} label="Visa fee" value={c.visaFee} />
          <Stat icon={Wallet} label="Proof of funds" value={c.proofOfFunds} />
          <Stat icon={Languages} label="English requirement" value={c.englishTest} />
          <Stat icon={Briefcase} label="Work rights" value={c.workRights} />
          <Stat icon={Briefcase} label="Post-study work" value={c.postStudyWork} />
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-primary">
              <FileText className="h-5 w-5 text-gold" /> Documents you'll need
            </h2>
            <ul className="mt-4 space-y-2">
              {c.documents.map((d) => (
                <li key={d} className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">Application steps</h2>
            <ol className="mt-4 space-y-4">
              {c.steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-md border border-border bg-card p-4">
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-primary">{s.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-secondary/50 p-8">
          <h3 className="text-lg font-semibold text-primary">Why students choose {c.name}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {c.highlights.map((h) => (
              <div key={h} className="rounded-md bg-card p-4 text-sm text-foreground shadow-[var(--shadow-card)]">
                {h}
              </div>
            ))}
          </div>
          <Link
            to="/chat"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-navy-deep"
          >
            Ask our AI about {c.name} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}