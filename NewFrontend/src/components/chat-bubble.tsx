import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export function ChatBubble() {
  return (
    <Link
      to="/chat"
      aria-label="Open AI chatbot"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 ring-1 ring-accent/40 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-accent/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-accent/40" />
    </Link>
  );
}