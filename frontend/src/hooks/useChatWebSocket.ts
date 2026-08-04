import { useChatSocket } from "./useChatSocket";

export const useChatWebSocket = (roomId: number | string | null, currentUserId?: number | null) => {
  return useChatSocket(roomId, currentUserId);
};