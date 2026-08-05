import { useEffect, useRef, useState, useCallback } from "react";
import { type Socket } from "socket.io-client";
import apiClient from "../api/apiClient";
import { getGlobalSocket } from "../socketio-service";

export interface ChatMessageShape {
  id: number;
  sender_id: number;
  text: string;
  timestamp: string;
  is_read: boolean;
}

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("access_token") ||
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("token") ||
    window.sessionStorage.getItem("access_token") ||
    window.sessionStorage.getItem("accessToken") ||
    window.sessionStorage.getItem("token") ||
    ""
  );
}

function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("authUser") || window.sessionStorage.getItem("authUser");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === "number" ? parsed.id : null;
  } catch {
    return null;
  }
}

export const useChatSocket = (roomId: string | number | null, explicitUserId?: number | null) => {
  const [messages, setMessages] = useState<ChatMessageShape[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const userId = explicitUserId ?? getStoredUserId();

  // Load REST history safely
  const loadMessages = useCallback(async () => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    try {
      const response = await apiClient.get<ChatMessageShape[]>(`chat/rooms/${roomId}/messages/`);
      setMessages(response.data);
    } catch (error) {
      console.error("[Socket] Failed to fetch message history:", error);
      setMessages([]);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setIsConnected(false);
      return;
    }

    const token = getStoredToken();
    const userId = explicitUserId ?? getStoredUserId();
    if (!token) return;

    setIsConnecting(true);
    const socket = getGlobalSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log("[Socket.IO] Connected/Reconnected! ID:", socket.id);
      setIsConnected(true);
      setIsConnecting(false);

      if (userId) {
        socket.emit("join_user_channel", { user_id: userId });
      }

      console.log("[Socket.IO] Emitting join_room for room_id:", roomId);
      socket.emit("join_room", { room_id: String(roomId) });
      loadMessages();
    };

    const appendIncomingMessage = (data: any) => {
      const receiveTs = new Date().toISOString();
      console.log("[Socket.IO CLIENT] receive_message event payload received:", data, "receive_ts:", receiveTs);
      if (!data) return;

      if (roomId && data.room_id != null && String(data.room_id) !== String(roomId)) {
        return;
      }

      const id = data.message_id ?? data.id ?? Date.now();
      const incomingText = data.message ?? data.content ?? data.text ?? "";

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === id || (msg.id < 0 && msg.text === incomingText))) {
          return prev.map((msg) =>
            msg.id < 0 && msg.text === incomingText ? { ...msg, id } : msg
          );
        }

        return [
          ...prev,
          {
            id,
            sender_id: data.sender_id ?? 0,
            text: incomingText,
            timestamp: data.timestamp ?? new Date().toISOString(),
            is_read: false,
          },
        ];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("receive_message", appendIncomingMessage);
    socket.on("join_room_success", (data: any) => {
      console.log("[Socket.IO] join_room_success", data);
    });
    socket.on("join_room_error", (data: any) => {
      console.warn("[Socket.IO] join_room_error", data);
    });

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive_message", appendIncomingMessage);
      if (roomId) {
        socket.emit("leave_room", { room_id: String(roomId) });
      }
    };
  }, [roomId, loadMessages]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || !roomId) {
        return false;
      }

      const text = messageText.trim();
      const optimisticMsg: ChatMessageShape = {
        id: -Date.now(),
        sender_id: Number(userId ?? 0),
        text,
        timestamp: new Date().toISOString(),
        is_read: false,
      };

      // 1. Optimistic local UI update
      setMessages((prev) => [...prev, optimisticMsg]);

      const payload = {
        room_id: Number(roomId),
        message: text,
        content: text,
      };

      // 2. Broadcast via Socket.IO
      if (socketRef.current && socketRef.current.connected) {
        const emitTs = new Date().toISOString();
        console.log("[Socket.IO CLIENT] emitting send_message", { payload, emit_ts: emitTs });
        socketRef.current.emit("send_message", payload);
      } else {
        console.warn("[Socket.IO] Cannot emit, socket is not connected");
      }

      // 3. Persist via REST API (Safely handles 405/Network errors)
      try {
        const res = await apiClient.post<ChatMessageShape>(`chat/rooms/${roomId}/messages/`, {
          message: text,
          content: text,
        });

        if (res?.data) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === optimisticMsg.id ? res.data : msg))
          );
        }
      } catch (err) {
        console.warn("[REST Persistence] Failed to save message via API (Socket active):", err);
      }

      return true;
    },
    [roomId, userId]
  );

  return { messages, sendMessage, isConnected, isConnecting, connected: isConnected };
};