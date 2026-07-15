import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, Braces, Send, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "../ui/theme";

const SUGGESTIONS = [
  "What documents do I need for a Canadian study permit?",
  "Compare F-1 vs Subclass 500 fees",
  "How long does a US student visa take?",
];

export default function ChatbotModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "ai", text: "Hi! I'm VisaGuide AI. I can help you understand student visas for the USA, Canada and Australia. What would you like to know?" }]);
  const [analysisText, setAnalysisText] = useState("I want to do my Masters in Canada, what IELTS score is needed?");
  const [analysed, setAnalysed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  function send(text = input) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { from: "user", text: trimmed }, { from: "ai", text: "Thanks for your question! This feature will connect to our AI engine. For now, please consult a registered consultancy." }]);
    setInput("");
  }

  return <main className="aspirant-shell min-h-[calc(100vh-4rem)]">
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <button onClick={onClose} className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0a1f44] hover:text-[#f97316]"><ArrowLeft className="h-4 w-4" />Back to explore</button>
      <header className="mb-10 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#f97316]">AI + NLP</p><h1 className="aspirant-serif mt-2 text-4xl tracking-tight text-[#0a1f44] md:text-5xl">Chat, then peek under the hood.</h1><p className="mt-3 text-slate-600">Ask anything about USA, Canada or Australia student visas. Analyse a question to see its intent, entities and keywords.</p></header>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-8px_rgba(10,31,68,.18)]">
          <header className="flex items-center gap-3 bg-[#0a1f44] px-5 py-4 text-white"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f97316]"><Bot className="h-5 w-5" /></span><div><p className="font-semibold">VisaGuide AI</p><p className="text-xs text-white/70">Your student-visa guide</p></div><span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs"><span className="h-1.5 w-1.5 rounded-full bg-green-400" />online</span></header>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">{messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.from === "user" ? "flex-row-reverse" : ""}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${message.from === "user" ? "bg-slate-100 text-[#0a1f44]" : "bg-[#0a1f44] text-white"}`}>{message.from === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</span><p className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${message.from === "user" ? "rounded-tr-sm bg-[#0a1f44] text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}>{message.text}</p></div>)}</div>
          {messages.length === 1 && <div className="border-t border-slate-200 bg-slate-50 px-5 py-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Try asking</p><div className="flex flex-wrap gap-2">{SUGGESTIONS.map((item) => <button key={item} onClick={() => send(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-[#0a1f44] hover:bg-[#0a1f44] hover:text-white">{item}</button>)}</div></div>}
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-200 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about visas, documents, fees…" className="flex-1 rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0a1f44]" /><button className="inline-flex items-center gap-1.5 rounded-md bg-[#0a1f44] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={!input.trim()}><Send className="h-4 w-4" />Send</button></form>
        </section>
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_-8px_rgba(10,31,68,.18)]"><div className="flex items-center gap-2"><Braces className="h-5 w-5 text-[#f97316]" /><h2 className="text-lg font-semibold text-[#0a1f44]">NLP analysis</h2></div><p className="mt-1 text-sm text-slate-600">Extract the intent, entities and keywords from a student-visa query.</p><textarea value={analysisText} onChange={(event) => setAnalysisText(event.target.value)} rows={3} className="mt-4 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-[#0a1f44]" /><button onClick={() => setAnalysed(true)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white"><Sparkles className="h-4 w-4" />Analyse text</button>{analysed && <div className="mt-5 space-y-4 border-t border-slate-200 pt-4 text-sm"><Result label="Intent" value="visa requirements" /><Result label="Sentiment" value="neutral" /><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Countries</p><span className="mt-2 inline-block rounded-full border border-slate-200 px-2.5 py-1 text-xs text-[#0a1f44]">Canada</span></div><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Keywords</p><p className="mt-1 rounded-md bg-slate-100 p-3 text-slate-700">Masters, Canada, IELTS score</p></div></div>}</section>
      </div>
    </div>
  </main>;
}

function Result({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span><span className="rounded-full bg-[#0a1f44] px-3 py-1 text-xs font-semibold text-white">{value}</span></div>; }
