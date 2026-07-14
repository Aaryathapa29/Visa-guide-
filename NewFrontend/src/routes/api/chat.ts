import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are VisaGuide AI, a knowledgeable, friendly student-visa advisor.
You specialise ONLY in study visas for the United States (F-1), Canada (Study Permit) and Australia (Subclass 500).
Give concise, structured answers. Use short paragraphs and bullet points.
When asked about requirements mention: documents needed, financial proof, English test (IELTS/TOEFL/PTE), processing time and approximate visa fee.
If the user asks about a country outside USA / Canada / Australia, politely say VisaGuide currently focuses on those three destinations.
Never invent legal advice — remind users to verify with the official embassy website.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: Array<{ role: string; content: string }> };
        const messages = body.messages ?? [];

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
        });

        return result.toTextStreamResponse();
      },
    },
  },
});