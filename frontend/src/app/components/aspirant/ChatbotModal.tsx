import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { ModalOverlay, ModalHeader } from "../ui/ModalOverlay";
import { ACCENT, DARK } from "../ui/theme";
import type { ChatMessage } from "../ui/theme";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    from: "ai",
    text: "Hi! I'm your Visa Guide Assistant. Ask me anything about visa types, requirements, or application processes.",
  },
];

export default function ChatbotModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  function send() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((m) => [
      ...m,
      { from: "user", text: trimmed },
      {
        from: "ai",
        text: "Thanks for your question! This feature will connect to our AI engine. For now, please consult a registered consultancy.",
      },
    ]);
    setInput("");
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        icon={<Bot className="w-4 h-4 text-white" />}
        title="Visa Guide Assistant"
        subtitle="AI-powered visa guidance"
        onClose={onClose}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: "#f5f7fb" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
              style={{
                background: msg.from === "user" ? DARK : "#fff",
                color: msg.from === "user" ? "#fff" : DARK,
                borderBottomRightRadius: msg.from === "user" ? 4 : undefined,
                borderBottomLeftRadius: msg.from === "ai" ? 4 : undefined,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: "#fff", borderTop: "1px solid #dce6f5" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about visa requirements…"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: "#f5f7fb", border: "1.5px solid #dce6f5", color: DARK }}
          aria-label="Chat message input"
        />
        <button
          onClick={send}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: ACCENT }}
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </ModalOverlay>
  );
}
