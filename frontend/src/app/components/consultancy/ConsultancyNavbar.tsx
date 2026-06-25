import { Bell, LogOut } from "lucide-react";
import Wordmark from "../ui/Wordmark";
import { DARK } from "../ui/theme";
import type { ConsultancyTab } from "../ui/theme";

const TABS: { value: ConsultancyTab; label: string }[] = [
  { value: "profile", label: "Country Profiles" },
  { value: "chats", label: "Aspirant Chats" },
  { value: "bookings", label: "Counselling Bookings" },
];

export default function ConsultancyNavbar({
  activeTab,
  onTabChange,
  onLogout,
}: {
  activeTab: ConsultancyTab;
  onTabChange: (t: ConsultancyTab) => void;
  onLogout: () => void;
}) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40"
      style={{ background: DARK, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <Wordmark />

        <nav className="flex items-center gap-1" role="tablist" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={activeTab === t.value}
              onClick={() => onTabChange(t.value)}
              className="px-4 py-2 rounded-lg text-sm transition-all duration-150"
              style={{
                background: activeTab === t.value ? "rgba(255,255,255,0.12)" : "transparent",
                color: activeTab === t.value ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: activeTab === t.value ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.6)" }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ background: "#059669", color: "#fff" }}
            aria-label="Account"
          >
            C
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
      </div>
    </header>
  );
}
