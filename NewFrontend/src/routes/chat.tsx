import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Send, Sparkles, User, Loader2, Braces } from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "AI Visa Assistant & NLP Demo | VisaGuide" },
      { name: "description", content: "Chat with an AI advisor about student visas and see live NLP intent + entity extraction on your queries." },
    ],
  }),
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What documents do I need for a Canadian study permit?",
  "Compare F-1 vs Subclass 500 fees",
  "How long does a US student visa take?",
  "Post-study work rights in Australia?",
];

function ChatPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">AI + NLP</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-primary md:text-5xl">
          Chat, then peek under the hood.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Ask anything about USA, Canada or Australia student visas. Below the chat, drop any sentence into the NLP box
          to see intent, entities and keywords extracted in real time.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <ChatBox />
        <NlpPanel />
      </div>
    </div>
  );
}

function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm VisaGuide AI. I can help you understand student visas for the **USA, Canada and Australia**. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError(null);
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const assistantId = crypto.randomUUID();
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
        if (res.status === 402) throw new Error("AI credit exhausted. Add credits in Lovable Cloud to continue.");
        throw new Error("The assistant is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <header className="flex items-center gap-3 border-b border-border bg-primary px-5 py-4 text-primary-foreground">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-gold-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">VisaGuide AI</p>
          <p className="text-xs text-primary-foreground/70">Powered by Lovable AI · gemini-3-flash</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> online
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> thinking…
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="border-t border-border bg-secondary/40 px-5 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-5 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about visas, documents, fees…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </section>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={"flex gap-3 " + (isUser ? "flex-row-reverse" : "")}>
      <div
        className={
          "grid h-8 w-8 flex-shrink-0 place-items-center rounded-full " +
          (isUser ? "bg-secondary text-primary" : "bg-primary text-primary-foreground")
        }
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
          (isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground")
        }
      >
        <div className="whitespace-pre-wrap">{msg.content || "…"}</div>
      </div>
    </div>
  );
}

type NlpResult = {
  intent: string;
  sentiment: string;
  countries: string[];
  keywords: string[];
  entities: Array<{ text: string; type: string }>;
  summary: string;
};

function NlpPanel() {
  const [text, setText] = useState("I want to do my Masters in Canada, what IELTS score is needed?");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NlpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Analysis failed.");
      const data = (await res.json()) as NlpResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Braces className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-semibold text-primary">NLP analysis</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        A tiny NLP engine (structured LLM output) that pulls intent, entities and keywords from any student-visa query.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="mt-4 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
      />
      <button
        onClick={analyze}
        disabled={loading || text.trim().length < 3}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Analyzing…" : "Analyze text"}
      </button>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4 border-t border-border pt-4 text-sm">
          <Field label="Intent" value={result.intent} />
          <Field label="Sentiment" value={result.sentiment} />
          <ChipRow label="Countries" items={result.countries} />
          <ChipRow label="Keywords" items={result.keywords} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Entities</p>
            <ul className="mt-2 space-y-1">
              {result.entities.map((e, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5">
                  <span className="text-foreground">{e.text}</span>
                  <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    {e.type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
            <p className="mt-1 rounded-md bg-secondary p-3 italic text-foreground">{result.summary}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{value}</span>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-muted-foreground">(none)</span>}
        {items.map((it) => (
          <span key={it} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-primary">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}