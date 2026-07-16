import { useEffect, useState } from "react";
import { Bell, Building2, CalendarDays, MessageCircle, GraduationCap, Hand } from "lucide-react";
import type { ConsultancyTab } from "../ui/theme";
import API from "../../../api";
import { offNewNotification, onNewNotification } from "../../../socketio-service";
import ProfileDropdown from "../ui/ProfileDropdown";
import LogoutConfirmationModal from "../modals/LogoutConfirmationModal";

const TABS: { value: ConsultancyTab; label: string }[] = [
  { value: "profile", label: "Country Profiles", icon: Building2 },
  { value: "bookings", label: "Bookings", icon: CalendarDays },
  { value: "chats", label: "Chats", icon: MessageCircle },
];

type Notification = { id: number; message: string; timestamp: string; is_read: boolean };

export default function ConsultancyNavbar({
  activeTab,
  onTabChange,
  onOpenSettings,
  onLogout,
}: {
  activeTab: ConsultancyTab;
  onTabChange: (t: ConsultancyTab) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const unread = notifications.filter((notification) => !notification.is_read).length;

  useEffect(() => {
    API.get("notifications/").then((response) => setNotifications(response.data.notifications || [])).catch(() => null);
    const handler = (notification: Notification) => setNotifications((items) => items.some((item) => item.id === notification.id) ? items : [{ ...notification, is_read: false }, ...items]);
    onNewNotification(handler);
    return () => offNewNotification(handler);
  }, []);

  async function toggleNotifications() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread) {
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      await API.post("notifications/").catch(() => null);
    }
  }

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      onLogout();
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const userName = localStorage.getItem("authUser")
    ? JSON.parse(localStorage.getItem("authUser") || "{}").email
    : "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1f44] text-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-4 px-5 md:px-10 lg:px-16">
          <a href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-sm bg-[#f97316]"><GraduationCap className="h-5 w-5" /></span><span className="aspirant-serif text-xl tracking-tight">Visa<span className="text-[#f97316]">Guide</span></span></a>

          <nav className="flex items-center gap-1" role="tablist" aria-label="Dashboard sections">
            {TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={activeTab === t.value}
                onClick={() => onTabChange(t.value)}
                className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${activeTab === t.value ? "bg-white/10 text-[#f97316]" : "text-white/75 hover:text-[#f97316]"}`}
              >
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </nav>

          <div className="relative flex items-center gap-1">
            <button onClick={toggleNotifications} className="relative grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/5 hover:text-[#f97316]" aria-label="Visit notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">{unread}</span>}
            </button>
            {open && <div className="absolute right-0 top-12 z-50 w-80 border border-slate-200 bg-white p-4 text-[#0a1f44] shadow-xl"><div className="mb-3 flex items-center justify-between"><div><p className="font-semibold">Visit notifications</p><p className="text-xs text-slate-500">Your consultancy profile visits</p></div><Bell className="h-5 w-5 text-[#f97316]" /></div><div className="max-h-80 space-y-2 overflow-y-auto">{notifications.length ? notifications.map((notification) => <div key={notification.id} className="flex gap-3 border border-slate-200 bg-slate-50 p-3"><Hand className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" /><div><p className="text-sm">{notification.message}</p><p className="mt-1 text-xs text-slate-500">{notification.timestamp}</p></div></div>) : <p className="py-8 text-center text-sm text-slate-500">No profile visits yet.</p>}</div></div>}
            <ProfileDropdown
              userName={userName}
              onSettingsClick={onOpenSettings}
              onLogoutClick={() => setShowLogoutModal(true)}
            />
          </div>
        </div>
      </header>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        isLoading={logoutLoading}
      />
    </>
  );
}
