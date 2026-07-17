import axios from "axios";

// Chatbot now lives inside the Django backend under /api/chatbot (was a separate
// FastAPI service on :8001). Override with VITE_CHATBOT_URL if needed.
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || "http://localhost:8000/api/chatbot";

const ChatbotAPI = axios.create({
  baseURL: CHATBOT_URL,
});

export async function askChatbot(message: string) {
  try {
    const response = await ChatbotAPI.post("/chat", {
      message,
    });
    return response.data as { answer?: string; country?: string };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const messagePayload = error.response?.data ?? error.message;
      throw new Error(
        typeof messagePayload === "string"
          ? messagePayload
          : JSON.stringify(messagePayload)
      );
    }
    throw error;
  }
}

export default ChatbotAPI;
