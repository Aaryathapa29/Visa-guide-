import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";

interface ChatThread {
  id: number;
  aspirant: string;
  avatar: string;
  unread: number;
  messages: { from: "aspirant" | "consultancy"; text: string }[];
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 1,
    aspirant: "Amara Osei",
    avatar: "A",
    unread: 3,
    messages: [
      { from: "aspirant", text: "Hello! I am interested in applying for a Canada study permit." },
      { from: "consultancy", text: "Hi Amara! We would be happy to help. Could you let us know your current status?" },
      { from: "aspirant", text: "I am currently on a tourist visa that expires in March." },
    ],
  },
  {
    id: 2,
    aspirant: "Ravi Shankar",
    avatar: "R",
    unread: 1,
    messages: [{ from: "aspirant", text: "Do you handle UK Skilled Worker visas?" }],
  },
  {
    id: 3,
    aspirant: "Leila Nasseri",
    avatar: "L",
    unread: 0,
    messages: [
      { from: "aspirant", text: "Thank you for the document checklist!" },
      { from: "consultancy", text: "You're welcome, Leila. Let us know if you have more questions." },
    ],
  },
];

export default function ConsultancyChatPanel() {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [activeId, setActiveId] = useState<number | null>(1);
  const [input, setInput] = useState("");

  const active = threads.find((t) => t.id === activeId);

  function markRead(id: number) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
    setActiveId(id);
  }

  function send() {
    if (!activeId || !input.trim()) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, messages: [...t.messages, { from: "consultancy" as const, text: input.trim() }] }
          : t
      )
    );
    setInput("");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div
        className="flex min-h-[520px] overflow-hidden rounded-[24px] border border-slate-200/80 shadow-[0_18px_56px_-24px_rgba(10,31,68,0.28)]"
        style={{ border: "1px solid #dce6f5" }}
      >
      {/* Sidebar */}
      <div
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ borderRight: "1px solid #e5ebf4", background: "#fcfdff" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #e5ebf4", background: "#f8fbff" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a6e8a" }}>
            Aspirant Messages
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => markRead(t.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 transition-all duration-200"
              style={{
                background: activeId === t.id ? "#eef4ff" : "transparent",
                borderLeft: activeId === t.id ? `3px solid ${ACCENT}` : "3px solid transparent",
                boxShadow: activeId === t.id ? "inset 0 1px 0 rgba(255,255,255,0.45)" : "none",
              }}
              aria-label={`Open chat with ${t.aspirant}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #1a3a6b 100%)", color: "#fff" }}
              >
                {t.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate" style={{ color: DARK }}>
                  {t.aspirant}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: "#5a6e8a" }}>
                  {t.messages[t.messages.length - 1]?.text ?? "No messages"}
                </div>
              </div>
              {t.unread > 0 && (
                <span
                  className="flex-shrink-0 rounded-full px-1.5 text-xs font-semibold"
                  style={{ background: ACCENT, color: "#fff", fontSize: "0.65rem", boxShadow: "0 6px 16px -10px rgba(37, 99, 235, 0.6)" }}
                >
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat pane */}
      {active ? (
        <div className="flex-1 flex flex-col">
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid #e5ebf4", background: "#fcfdff" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #1a3a6b 100%)", color: "#fff" }}
            >
              {active.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{active.aspirant}</div>
              <div className="text-xs" style={{ color: "#22c55e" }}>● Online</div>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)" }}
          >
            <div className="mx-auto w-full max-w-lg space-y-3">
              {active.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "consultancy" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[70%] rounded-[16px] px-3 py-2.5 text-sm"
                    style={{
                      background: msg.from === "consultancy" ? "linear-gradient(135deg, #0d1b3e 0%, #1a3a6b 100%)" : "#fff",
                      color: msg.from === "consultancy" ? "#fff" : DARK,
                      boxShadow: "0 8px 24px -14px rgba(10,31,68,0.24)",
                      borderBottomRightRadius: msg.from === "consultancy" ? 4 : undefined,
                      borderBottomLeftRadius: msg.from === "aspirant" ? 4 : undefined,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: "1px solid #e5ebf4", background: "#fcfdff" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Reply to ${active.aspirant}…`}
              className="flex-1 rounded-[14px] px-4 py-2.5 text-sm outline-none transition-all duration-200"
              style={{ background: "#f8fbff", border: "1.5px solid #dce6f5", color: DARK, boxShadow: "inset 0 1px 2px rgba(10,31,68,0.04)" }}
              aria-label="Reply input"
            />
            <button
              onClick={send}
              className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-10px_rgba(37,99,235,0.6)]"
              style={{ background: ACCENT }}
              aria-label="Send reply"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)" }}>
          <MessageCircle className="w-10 h-10" style={{ color: "#c7d8f0" }} />
          <p className="text-sm" style={{ color: "#5a6e8a" }}>Select a conversation to respond</p>
        </div>
      )}
    </div>
  );
}
