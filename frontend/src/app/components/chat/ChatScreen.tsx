import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Paperclip, Send, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchChatRooms, fetchRoomMessages, type ChatRoomSummary } from "../../../api/chatApi";
import { useChatSocket } from "../../../hooks/useChatSocket";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ChatScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ChatRoomSummary>({
    id: 0,
    aspirant: 0,
    consultancy: 0,
    created_at: new Date().toISOString(),
    opponent_display_name: "Consultant",
    aspirant_name: "Aspirant",
    consultancy_name: "Consultancy",
    consultancy_logo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id ?? null;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const roomIdNum = roomId ? Number(roomId) : 0;
  const { messages, isConnected, isConnecting, sendMessage } = useChatSocket(roomIdNum > 0 ? roomIdNum : null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomIdNum) return;

    async function loadRoomDetails() {
      try {
        await fetchRoomMessages(roomIdNum);
        const rooms = await fetchChatRooms();
        const selectedRoom = rooms.find((item) => item.id === roomIdNum);

        if (selectedRoom) {
          setRoom(selectedRoom);
        }
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    }

    loadRoomDetails();
  }, [roomIdNum, navigate]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      const sent = await sendMessage(trimmed);
      if (sent) setInput("");
    } catch (err) {
      console.error('[ChatScreen] sendMessage error:', err);
      // keep input so user can retry
    }
  };

  const opponentName = room.opponent_display_name || "Consultant";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f3f3ee]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4" />
          <p className="text-sm text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f3f3ee]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-slate-100 rounded-lg transition" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <div className="font-semibold text-slate-900">{opponentName}</div>
          <div className="text-xs text-slate-500">
            {isConnected ? "Connected" : isConnecting ? "Connecting…" : "Offline"}
          </div>
        </div>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-center text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.sender_id === currentUserId;
            return isMe ? (
              // User Message (Right, Blue)
              <div key={message.id} className="flex items-end justify-end gap-2">
                <span className="bg-[#2563eb] text-white text-[10px] font-bold px-2 py-1 rounded-md h-fit">You</span>
                <div className="bg-[#2563eb] text-white px-5 py-3 rounded-3xl max-w-sm text-sm shadow-sm">
                  {message.text}
                </div>
              </div>
            ) : (
              // Opponent Message (Left, White with initials)
              <div key={message.id} className="flex items-end gap-3">
                <div className="bg-[#111827] text-white font-bold text-xs w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden flex-col">
                  {room.consultancy_logo_url ? (
                    <img src={room.consultancy_logo_url} alt={opponentName} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <div className="bg-white text-slate-800 px-6 py-4 rounded-3xl max-w-lg text-sm shadow-sm border border-slate-100 leading-relaxed">
                  {message.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Pill */}
      <div className="px-6 py-6 bg-[#f3f3ee]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center bg-white rounded-full px-6 py-3 shadow-md border border-slate-200 gap-3 max-w-2xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message…"
            className="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-400"
          />
          <button type="button" className="text-slate-400 hover:text-slate-600 p-1 transition" aria-label="Attach file">
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="bg-[#2563eb] hover:bg-[#1e40af] text-white p-2.5 rounded-full transition flex items-center justify-center disabled:opacity-50"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
