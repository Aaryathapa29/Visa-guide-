import axios from "axios";

const CHATBOT_URL = "http://localhost:8001";

const ChatbotAPI = axios.create({
  baseURL: CHATBOT_URL,
});

export async function askChatbot(message: string) {
  try {
    const response = await ChatbotAPI.post("/chat", {
      message: message,
      // If the endpoint expects a different key, swap this to:
      // user_message: message
      // text: message
    });
    return response.data;
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
