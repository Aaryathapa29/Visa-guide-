export const DARK = "#0d1b3e";
export const MID = "#1a3a6b";
export const ACCENT = "#2563eb";

export type Screen =
  | "selection"
  | "aspirant"
  | "consultancy"
  | "aspirant-signin"
  | "consultancy-signin"
  | "password-reset-request"
  | "password-reset-confirm"
  | "aspirant-home"
  | "consultancy-home"
  | "consultancy-pending";

export type ConsultancyTab = "profile" | "chats" | "bookings";
export type BrowseView = "countries" | "consultancies";
export type ChatMessage = { from: "user" | "ai"; text: string };
