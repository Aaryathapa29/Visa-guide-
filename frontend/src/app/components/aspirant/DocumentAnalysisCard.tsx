import { ArrowLeft } from "lucide-react";
import DocumentParser from "../Documentparser/DocumentParser";

export default function DocumentAnalysisCard({ onClose }: { onClose: () => void }) {
  return <main className="aspirant-shell min-h-[calc(100vh-4rem)]">
    <section className="aspirant-hero relative flex min-h-[42vh] items-end overflow-hidden border-b border-white/10 text-white"><div className="relative mx-auto w-full max-w-6xl px-6 py-12"><button onClick={onClose} className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/75 hover:text-[#f97316]"><ArrowLeft className="h-4 w-4" />Back to explore</button><p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#f97316]">AI Toolkit</p><h1 className="aspirant-serif mt-3 text-4xl leading-tight tracking-tight md:text-6xl">Document <span className="italic text-[#f97316]">Analyser.</span></h1><div className="mt-6 h-0.5 w-16 bg-[#f97316]" /></div></section>
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <DocumentParser onClose={onClose} />
    </div>
  </main>;
}
