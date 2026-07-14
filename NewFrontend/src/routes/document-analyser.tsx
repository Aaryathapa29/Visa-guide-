import { createFileRoute } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";

export const Route = createFileRoute("/document-analyser")({
  component: DocumentAnalyserPage,
  head: () => ({
    meta: [
      { title: "Document Analyser | VisaGuide" },
      {
        name: "description",
        content: "Upload your visa documents and get instant AI-powered checks for completeness and clarity.",
      },
    ],
  }),
});

function DocumentAnalyserPage() {
  return (
    <div>
      <section className="relative flex min-h-[50vh] items-end overflow-hidden border-b border-white/10 bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gold opacity-[0.08] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.19_0.08_265/0.6),transparent)]" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">AI Toolkit</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight md:text-6xl">
            Document <span className="italic text-gold">Analyser.</span>
          </h1>
          <div className="mt-6 h-0.5 w-16 bg-gold" />
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="border border-dashed border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary">
            <FileText className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-serif text-2xl text-primary">Upload a document to analyse</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Drop a PDF or image of your SOP, LOR, bank statement or I-20 and we'll flag missing fields, tone
            and required signatures.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold-foreground shadow-[var(--shadow-elegant)] transition-transform hover:-translate-y-0.5"
          >
            <Upload className="h-4 w-4" /> Choose file
          </button>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            Coming soon · academic project preview
          </p>
        </div>
      </div>
    </div>
  );
}