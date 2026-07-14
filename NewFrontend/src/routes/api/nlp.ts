import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const schema = z.object({
  intent: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  countries: z.array(z.string()),
  keywords: z.array(z.string()),
  entities: z.array(z.object({ text: z.string(), type: z.string() })),
  summary: z.string(),
});

export const Route = createFileRoute("/api/nlp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text } = (await request.json()) as { text?: string };
        if (!text || text.trim().length < 3) {
          return new Response(JSON.stringify({ error: "Text too short" }), { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const { output } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          system:
            "You are an NLP engine for a student-visa website. Extract structured info from the query. Intent examples: 'requirements_query', 'cost_query', 'timeline_query', 'comparison', 'greeting', 'other'. Countries must be canonical: USA, Canada, Australia.",
          prompt: text,
          output: Output.object({ schema }),
        });

        return Response.json(output);
      },
    },
  },
});