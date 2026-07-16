import axios from "axios";
import type { ChatApiResponse, UploadApiResponse } from "../types";

// Same convention as the existing chatbot API (api/chatbot.ts).
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || "http://localhost:8001";

const ChatbotAPI = axios.create({ baseURL: CHATBOT_URL });

function toError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data ?? error.message;
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail?: unknown }).detail
        : payload;
    return new Error(
      typeof detail === "string" ? detail : JSON.stringify(detail ?? "Server error"),
    );
  }
  return error instanceof Error ? error : new Error("Request failed");
}

export interface HistoryTurn { role: string; text: string }

export async function sendMessage(
  message: string,
  sessionId?: string,
  history?: HistoryTurn[],
): Promise<ChatApiResponse> {
  try {
    const { data } = await ChatbotAPI.post("/chat", { message, session_id: sessionId, history });
    return {
      answer: data.answer ?? "",
      country: data.country ?? null,
      // Backend may or may not return sources yet — degrade gracefully.
      sources: Array.isArray(data.sources) ? data.sources : [],
    };
  } catch (error) {
    throw toError(error);
  }
}

export async function uploadDoc(file: File, country: string): Promise<UploadApiResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("country", country);
  try {
    const { data } = await ChatbotAPI.post("/upload", form);
    return data as UploadApiResponse;
  } catch (error) {
    throw toError(error);
  }
}

export default ChatbotAPI;
