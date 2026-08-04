import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ensureChatRoom, fetchChatRooms, type ChatRoomSummary } from "../../../api/chatApi";
import { useChatSocket } from "../../../hooks/useChatSocket";

const ACCENT = "#f97316";
const DARK = "#0a1f44";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ChatContainer() {
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id ?? null;

  const { messages, isConnected, sendMessage } = useChatSocket(activeRoomId);

  const activeRoom = useMemo(() => rooms.find((room) => room.id === activeRoomId) ?? null, [rooms, activeRoomId]);

  useEffect(() => {
    async function loadRooms() {
      const data = await fetchChatRooms();
      setRooms(data);
      if (data[0]) setActiveRoomId(data[0].id);
    }

    loadRooms();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const pendingConsultancyId = window.localStorage.getItem("pendingChatConsultancyId");
    if (!pendingConsultancyId) return;

    const consultancyId = Number(pendingConsultancyId);
    if (!Number.isFinite(consultancyId)) return;

    window.localStorage.removeItem("pendingChatConsultancyId");

    ensureChatRoom(currentUserId, consultancyId)
      .then((room) => {
        setRooms((prev) => {
          const next = prev.filter((item) => item.id !== room.id);
          return [room, ...next];
        });
        setActiveRoomId(room.id);
      })
      .catch(() => null);
  }, [currentUserId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const sent = await sendMessage(trimmed);
    if (sent) setInput("");
  };

  const startOrSelectRoom = async (consultancyId: number) => {
    if (!currentUserId) return;
    const room = await ensureChatRoom(currentUserId, consultancyId);
    setRooms((prev) => {
      const next = prev.filter((item) => item.id !== room.id);
      return [room, ...next];
    });
    setActiveRoomId(room.id);
  };

  return (
    <div className="rounded-2xl overflow-hidden flex" style={{ border: "1px solid #dce6f5", height: 520 }}>
      <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: "1px solid #dce6f5", background: "#fff" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #dce6f5" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a6e8a" }}>Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <button key={room.id} onClick={() => setActiveRoomId(room.id)} className="w-full text-left px-4 py-3 transition-colors" style={{ background: activeRoomId === room.id ? "#eef2fb" : "transparent", borderLeft: activeRoomId === room.id ? `3px solid ${ACCENT}` : "3px solid transparent" }}>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{room.opponent_display_name || room.consultancy_name}</div>
              <div className="text-xs mt-1" style={{ color: "#5a6e8a" }}>Room #{room.id}</div>
            </button>
          ))}
        </div>
      </div>

      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #dce6f5", background: "#fff" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: DARK, color: "#fff" }}>{(activeRoom.opponent_display_name || activeRoom.consultancy_name || "C").slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{activeRoom.opponent_display_name || activeRoom.consultancy_name}</div>
              <div className="text-xs" style={{ color: isConnected ? "#22c55e" : "#5a6e8a" }}>{isConnected ? "Connected" : "Connecting…"}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#f5f7fb" }}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%] rounded-2xl px-3 py-2.5 text-sm" style={{ background: message.sender_id === currentUserId ? DARK : "#fff", color: message.sender_id === currentUserId ? "#fff" : DARK, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {message.text}
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>}
          </div>

          <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid #dce6f5", background: "#fff" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Type a message…" className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: "#f5f7fb", border: "1.5px solid #dce6f5", color: DARK }} />
            <button onClick={handleSend} className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80" style={{ background: ACCENT }} aria-label="Send message">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "#f5f7fb" }}>
          <MessageCircle className="w-10 h-10" style={{ color: "#c7d8f0" }} />
          <p className="text-sm" style={{ color: "#5a6e8a" }}>Select a conversation to begin.</p>
        </div>
      )}
    </div>
  );
}
