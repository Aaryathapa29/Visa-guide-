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
    <div className="flex h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-slate-50/80">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`w-full border-l-4 px-4 py-3 text-left transition-colors ${activeRoomId === room.id ? "bg-orange-50" : "bg-transparent hover:bg-white"}`}
              style={{ borderLeftColor: activeRoomId === room.id ? ACCENT : "transparent" }}
            >
              <div className="text-sm font-semibold text-slate-900">
                {room.opponent_display_name || room.consultancy_name}
              </div>
              <div className="mt-1 text-xs text-slate-500">Room #{room.id}</div>
            </button>
          ))}
        </div>
      </div>

      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-bold text-white">
              {(activeRoom.opponent_display_name || activeRoom.consultancy_name || "C").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {activeRoom.opponent_display_name || activeRoom.consultancy_name}
              </div>
              <div className={`text-xs ${isConnected ? "text-green-600" : "text-slate-500"}`}>
                {isConnected ? "Connected" : "Connecting…"}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2.5 text-sm shadow-sm ${message.sender_id === currentUserId ? "bg-[#0a1f44] text-white" : "bg-white text-slate-900"}`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message…"
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white transition-opacity hover:opacity-80"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50">
          <MessageCircle className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Select a conversation to begin.</p>
        </div>
      )}
    </div>
  );
}
