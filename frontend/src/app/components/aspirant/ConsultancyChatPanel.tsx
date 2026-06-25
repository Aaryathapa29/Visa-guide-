import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";

interface Thread {
  id: number;
  name: string;
  country: string;
  avatar: string;
  unread: number;
}

type Msg = { from: "user" | "ai"; text: string };

const CONSULTANCIES: Thread[] = [
  { id: 1, name: "Global Visa Partners", country: "Canada, UK", avatar: "G", unread: 2 },
  { id: 2, name: "PathFinder Consulting", country: "Australia, NZ", avatar: "P", unread: 0 },
  { id: 3, name: "EuroPass Advisory", country: "Germany, France", avatar: "E", unread: 1 },
];

const SEED_MESSAGES: Record<number, Msg[]> = {
  1: [{ from: "ai", text: "Hello! How can we help with your Canada visa application?" }],
  2: [],
  3: [{ from: "ai", text: "Welcome to EuroPass Advisory. Ask us about Schengen visa requirements." }],
};

export default function ConsultancyChatPanel() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<number, Msg[]>>(SEED_MESSAGES);

  const active = CONSULTANCIES.find((c) => c.id === activeId);

  function send() {
    if (!activeId || !input.trim()) return;
    setChatMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), { from: "user", text: input.trim() }],
    }));
    setInput("");
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex"
      style={{ border: "1px solid #dce6f5", height: 380 }}
    >
      {/* Sidebar */}
      <div
        className="w-48 flex-shrink-0 flex flex-col"
        style={{ borderRight: "1px solid #dce6f5" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #dce6f5" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a6e8a" }}>
            Consultancies
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {CONSULTANCIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="w-full text-left flex items-center gap-2.5 px-4 py-3 transition-colors"
              style={{
                background: activeId === c.id ? "#eef2fb" : "transparent",
                borderLeft: activeId === c.id ? `3px solid ${ACCENT}` : "3px solid transparent",
              }}
              aria-label={`Chat with ${c.name}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: DARK, color: "#fff" }}
              >
                {c.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate" style={{ color: DARK }}>
                  {c.name}
                </div>
                {c.unread > 0 && (
                  <span
                    className="inline-block text-xs px-1.5 rounded-full mt-0.5"
                    style={{ background: ACCENT, color: "#fff", fontSize: "0.65rem" }}
                  >
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {active ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #dce6f5" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: DARK, color: "#fff" }}
            >
              {active.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{active.name}</div>
              <div className="text-xs" style={{ color: "#5a6e8a" }}>{active.country}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: "#f5f7fb" }}>
            {(chatMessages[active.id] ?? []).map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[75%] px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: msg.from === "user" ? DARK : "#fff",
                    color: msg.from === "user" ? "#fff" : DARK,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {(chatMessages[active.id] ?? []).length === 0 && (
              <p className="text-center text-xs mt-8" style={{ color: "#5a6e8a" }}>
                Start a conversation with {active.name}
              </p>
            )}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderTop: "1px solid #dce6f5", background: "#fff" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
              style={{ background: "#f5f7fb", border: "1px solid #dce6f5", color: DARK }}
              aria-label="Message input"
            />
            <button
              onClick={send}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: ACCENT }}
              aria-label="Send"
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "#f5f7fb" }}>
          <MessageCircle className="w-10 h-10" style={{ color: "#c7d8f0" }} />
          <p className="text-sm" style={{ color: "#5a6e8a" }}>Select a consultancy to chat</p>
        </div>
      )}
    </div>
  );
}
