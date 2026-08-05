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
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex h-[calc(100vh-120px)] flex-col min-h-[520px]">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consultancy chat</p>
            {active ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {active.avatar}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{active.name}</div>
                  <div className="text-sm text-slate-500">{active.country}</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Active now
                </span>
              </div>
            ) : (
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Select a consultancy to start chatting</h2>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-slate-50">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consultancies</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {CONSULTANCIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-100"
                    style={{
                      background: activeId === c.id ? "#eef2fb" : "transparent",
                      borderLeft: activeId === c.id ? `3px solid ${ACCENT}` : "3px solid transparent",
                    }}
                    aria-label={`Chat with ${c.name}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {c.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">{c.name}</div>
                      <div className="truncate text-xs text-slate-500">{c.country}</div>
                    </div>
                    {c.unread > 0 && (
                      <span className="inline-flex h-6 items-center rounded-full bg-amber-100 px-2 text-[11px] font-semibold text-amber-700">
                        {c.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-50">
              {active ? (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="mx-auto w-full max-w-lg space-y-4">
                      {(chatMessages[active.id] ?? []).map((msg, index) => (
                        <div key={index} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.from === "user" ? "bg-slate-900 text-white rounded-br-none" : "bg-white text-slate-900 rounded-bl-none"}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {(chatMessages[active.id] ?? []).length === 0 && (
                        <div className="mt-10 rounded-3xl bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
                          Start a conversation with {active.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder="Type a message…"
                        className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#0a1f44] focus:ring-2 focus:ring-[#0a1f44]/10"
                        aria-label="Message input"
                      />
                      <button
                        onClick={send}
                        className="inline-flex h-11 min-w-[3rem] items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white"
                        aria-label="Send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-10 text-center text-slate-500">
                  <MessageCircle className="h-12 w-12 text-slate-300" />
                  <p className="text-base font-semibold">Select a consultancy to chat</p>
                  <p className="max-w-md text-sm text-slate-500">Choose a consultancy from the list on the left to start your visa conversation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
