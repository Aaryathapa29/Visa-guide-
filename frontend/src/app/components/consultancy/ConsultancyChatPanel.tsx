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
    <div
      className="rounded-2xl overflow-hidden flex"
      style={{ border: "1px solid #dce6f5", height: 500 }}
    >
      {/* Sidebar */}
      <div
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ borderRight: "1px solid #dce6f5", background: "#fff" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #dce6f5" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a6e8a" }}>
            Aspirant Messages
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => markRead(t.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors"
              style={{
                background: activeId === t.id ? "#eef2fb" : "transparent",
                borderLeft: activeId === t.id ? `3px solid ${ACCENT}` : "3px solid transparent",
              }}
              aria-label={`Open chat with ${t.aspirant}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: DARK, color: "#fff" }}
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
                  className="text-xs px-1.5 rounded-full font-semibold flex-shrink-0"
                  style={{ background: ACCENT, color: "#fff", fontSize: "0.65rem" }}
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
            style={{ borderBottom: "1px solid #dce6f5", background: "#fff" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: DARK, color: "#fff" }}
            >
              {active.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{active.aspirant}</div>
              <div className="text-xs" style={{ color: "#22c55e" }}>● Online</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#f5f7fb" }}>
            {active.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "consultancy" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[70%] px-3 py-2.5 rounded-2xl text-sm"
                  style={{
                    background: msg.from === "consultancy" ? DARK : "#fff",
                    color: msg.from === "consultancy" ? "#fff" : DARK,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    borderBottomRightRadius: msg.from === "consultancy" ? 4 : undefined,
                    borderBottomLeftRadius: msg.from === "aspirant" ? 4 : undefined,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: "1px solid #dce6f5", background: "#fff" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Reply to ${active.aspirant}…`}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "#f5f7fb", border: "1.5px solid #dce6f5", color: DARK }}
              aria-label="Reply input"
            />
            <button
              onClick={send}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ background: ACCENT }}
              aria-label="Send reply"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "#f5f7fb" }}>
          <MessageCircle className="w-10 h-10" style={{ color: "#c7d8f0" }} />
          <p className="text-sm" style={{ color: "#5a6e8a" }}>Select a conversation to respond</p>
        </div>
      )}
    </div>
  );
}
