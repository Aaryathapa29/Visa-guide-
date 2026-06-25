import { useState } from "react";
import { Bot, CalendarDays, Bell, LogOut, FileSearch } from "lucide-react";
import Wordmark from "../ui/Wordmark";
import { ACCENT, DARK } from "../ui/theme";

function NavBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150"
      style={{
        color: hovered ? "#fff" : "rgba(255,255,255,0.65)",
        background: hovered ? "rgba(255,255,255,0.1)" : "transparent",
      }}
      aria-label={label}
    >
      {icon}
      {label}
    </button>
  );
}

export default function AspirantNavbar({
  onOpenChat,
  onOpenDocAnalysis,
  onOpenBooking,
  onLogout,
}: {
  onOpenChat: () => void;
  onOpenDocAnalysis: () => void;
  onOpenBooking: () => void;
  onLogout: () => void;
}) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
      style={{ background: DARK, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <Wordmark />

      <nav className="flex items-center gap-1">
        <NavBtn icon={<Bot className="w-4 h-4" />} label="Visa Guide Assistant" onClick={onOpenChat} />
        <NavBtn
          icon={<FileSearch className="w-4 h-4" />}
          label="Document Analysis"
          onClick={onOpenDocAnalysis}
        />
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenBooking}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{ background: ACCENT, color: "#fff" }}
          aria-label="Book counselling session"
        >
          <CalendarDays className="w-4 h-4" />
          Book Counselling
        </button>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.6)" }}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
          style={{ background: ACCENT, color: "#fff" }}
          aria-label="Account"
        >
          A
        </div>

        <button
          onClick={onLogout}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.5)" }}
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
