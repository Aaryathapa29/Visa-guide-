import API from "../api";

export interface ChatRoomSummary {
  id: number;
  aspirant: number;
  consultancy: number;
  created_at: string;
  opponent_display_name: string;
  aspirant_name: string;
  consultancy_name: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  text: string;
  timestamp: string;
  is_read: boolean;
}

export async function fetchChatRooms() {
  const response = await API.get<ChatRoomSummary[]>("chat/rooms/mine/");
  return response.data;
}

export async function ensureChatRoom(aspirantId: number, consultancyId: number) {
  // Prefer access token from localStorage/sessionStorage
  // New endpoint accepts only consultancyId and uses the authenticated user as aspirant.
  try {
    const response = await API.post<ChatRoomSummary>("chat/rooms/ensure-current/", { consultancy_id: consultancyId });
    return response.data;
  } catch (err: any) {
    // If unauthorized, provide a clearer error so UI can prompt re-login
    if (err?.response?.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    // Fallback to the older ensure endpoint for backward compatibility
    const response = await API.post<ChatRoomSummary>("chat/rooms/ensure/", { aspirant_id: aspirantId, consultancy_id: consultancyId });
    return response.data;
  }
}

export async function fetchRoomMessages(roomId: number) {
  try {
    const response = await API.get<ChatMessage[]>(`chat/rooms/${roomId}/messages/`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('[chatApi] 401 Unauthorized while fetching messages. Token expired or invalid.');
    } else {
      console.error('[chatApi] Error fetching messages:', error);
    }
    return [];
  }
}

export async function postRoomMessage(roomId: number, message: string) {
  const response = await API.post<ChatMessage>(`chat/rooms/${roomId}/messages/`, { message });
  return response.data;
}
