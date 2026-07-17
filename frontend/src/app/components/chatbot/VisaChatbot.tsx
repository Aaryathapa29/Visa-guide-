import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import MessageBubble from "./components/MessageBubble";
import TypingIndicator from "./components/TypingIndicator";
import UploadPanel from "./components/UploadPanel";
import { sendMessage } from "./utils/api";
import { uid, titleFromText, flagFor } from "./utils/format";
import { loadConversations, saveConversations, newConversation } from "./utils/storage";
import { exportMarkdown, exportJSON, copyMarkdown } from "./utils/export";
import type { Conversation, Message } from "./types";
import "./chatbot.css";

const QUICK = [
  { c: "Canada",    q: "How much money do I need to show for a Canada study permit?" },
  { c: "Australia", q: "What is the Genuine Student requirement for Australia?" },
  { c: "USA",       q: "What documents do I need for a USA F-1 visa interview?" },
  { c: "Canada",    q: "How many hours can I work off campus while studying in Canada?" },
  { c: "Australia", q: "How much are the Subclass 500 fees and financial requirements?" },
  { c: "USA",       q: "Explain OPT and STEM OPT work rules for F-1 students." },
];

export default function VisaChatbot({ onClose }: { onClose: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 820);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef   = useRef<HTMLTextAreaElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  // Always-fresh reference to conversations so handleSend can read the latest
  // turns (for memory) without re-creating the callback on every message.
  const convosRef = useRef<Conversation[]>([]);

  useEffect(() => {
    const list = loadConversations();
    if (list.length) {
      setConversations(list);
      setActiveId(list[0].id);
    } else {
      const c = newConversation();
      setConversations([c]);
      setActiveId(c.id);
    }
  }, []);

  useEffect(() => {
    convosRef.current = conversations;
    if (conversations.length) saveConversations(conversations);
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages = active?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  useEffect(() => {
    if (!showExport) return;
    const onDoc = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showExport]);

  const handleNew = useCallback(() => {
    const empty = conversations.find((c) => c.messages.length === 0);
    if (empty) { setActiveId(empty.id); }
    else {
      const c = newConversation();
      setConversations((prev) => [c, ...prev]);
      setActiveId(c.id);
    }
    if (window.innerWidth <= 820) setSidebarOpen(false);
    setInput("");
    textRef.current?.focus();
  }, [conversations]);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    if (window.innerWidth <= 820) setSidebarOpen(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        if (next.length) setActiveId(next[0].id);
        else { const c = newConversation(); setActiveId(c.id); return [c]; }
      }
      if (next.length === 0) { const c = newConversation(); setActiveId(c.id); return [c]; }
      return next;
    });
  }, [activeId]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || !activeId) return;

    // Snapshot the prior turns (before this message) to send as memory context.
    const current = convosRef.current.find((c) => c.id === activeId);
    const priorTurns = (current?.messages ?? [])
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    const userMsg: Message = { id: uid(), role: "user", text: trimmed, ts: Date.now() };
    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        title: isFirst ? titleFromText(trimmed) : c.title,
        messages: [...c.messages, userMsg],
        updatedAt: Date.now(),
      };
    }));
    setInput("");
    setLoading(true);
    if (textRef.current) textRef.current.style.height = "auto";

    try {
      const res = await sendMessage(trimmed, activeId, priorTurns);
      const botMsg: Message = {
        id: uid(), role: "bot", text: res.answer,
        country: res.country ?? undefined, sources: res.sources, ts: Date.now(),
      };
      setConversations((prev) => prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, botMsg], updatedAt: Date.now() } : c));
    } catch (e: unknown) {
      const botMsg: Message = {
        id: uid(), role: "bot",
        text: `⚠️ ${e instanceof Error ? e.message : "Could not reach the server. Is the backend running?"}`,
        ts: Date.now(),
      };
      setConversations((prev) => prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, botMsg], updatedAt: Date.now() } : c));
    }

    setLoading(false);
    textRef.current?.focus();
  }, [loading, activeId]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };
  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const canExport = messages.length > 0;
  const doExport = async (kind: "md" | "json" | "copy") => {
    if (!active) return;
    if (kind === "md")   exportMarkdown(active);
    if (kind === "json") exportJSON(active);
    if (kind === "copy") await copyMarkdown(active);
    setShowExport(false);
  };

  return (
    <div className="vg-chat">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="vgc-main">
        <div className="topbar">
          <button className="iconbtn" onClick={onClose} title="Back to app">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <button
            className="iconbtn hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            title="Toggle history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>

          <div>
            <div className="topbar__title">{active?.title ?? "Visa Guide"}</div>
            <div className="topbar__meta">Answers cite the visa documents they came from</div>
          </div>

          <div className="topbar__spacer" />

          <div className="chips">
            {["🇺🇸 USA", "🇦🇺 Australia", "🇨🇦 Canada"].map((c) => (
              <span className="chip" key={c}>{c}</span>
            ))}
          </div>

          <div className="menu-wrap" ref={exportRef}>
            <button
              className="topbar__btn"
              disabled={!canExport}
              onClick={() => setShowExport((s) => !s)}
              title="Export this chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              <span>Export</span>
            </button>
            {showExport && (
              <div className="menu">
                <button className="menu__item" onClick={() => doExport("md")}>
                  📝 Download Markdown <span className="k">.md</span>
                </button>
                <button className="menu__item" onClick={() => doExport("json")}>
                  🗂️ Download JSON <span className="k">.json</span>
                </button>
                <div className="menu__sep" />
                <button className="menu__item" onClick={() => doExport("copy")}>
                  📋 Copy transcript
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="scroll">
          <div className="thread">
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome__badge">🛂</div>
                <h1>Your student visa assistant</h1>
                <p>
                  Ask anything about student visas for the <strong>USA</strong>, <strong>Australia</strong>,
                  and <strong>Canada</strong>. Answers are drawn from up-to-date visa documents and
                  every fact is cited so you can check the source.
                </p>
                <div className="suggest">
                  {QUICK.map((item) => (
                    <button key={item.q} className="suggest__card" onClick={() => handleSend(item.q)}>
                      <span className="suggest__flag">{flagFor(item.c)}</span>
                      {item.q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} msg={m} />)
            )}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="composer">
          <div className="composer__inner">
            <div className="inputbar">
              <textarea
                ref={textRef} rows={1} value={input}
                onChange={autoResize} onKeyDown={handleKey} disabled={loading}
                placeholder="Ask about student visas for USA, Australia, or Canada…"
              />
              <button
                className={`circlebtn ${showUpload ? "circlebtn--active" : ""}`}
                onClick={() => setShowUpload((p) => !p)} title="Add a document"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              </button>
              <button
                className="circlebtn circlebtn--send"
                onClick={() => handleSend(input)} disabled={loading || !input.trim()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
            <p className="composer__hint">
              Visa Guide gives general information, not legal advice. Always verify on official
              government websites, as rules change.
            </p>
          </div>
        </div>
      </div>

      {showUpload && <UploadPanel onClose={() => setShowUpload(false)} />}
    </div>
  );
}
