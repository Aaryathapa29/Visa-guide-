import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Building2, FileSearch, GraduationCap } from "lucide-react";
import API from "../../../api";
import { offNewNotification, onNewNotification } from "../../../socketio-service";
import ProfileDropdown from "../ui/ProfileDropdown";
import LogoutConfirmationModal from "../modals/LogoutConfirmationModal";

type NotificationItem = {
  id: number;
  title?: string;
  message: string;
  created_at?: string;
  timestamp?: string;
  is_read: boolean;
};

const formatTime = (value?: string) => {
  if (!value) return "just now";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "just now";

  const diffMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

export default function AspirantNavbar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const response = await API.get("notifications/");
        if (!mounted) return;

        const nextNotifications = Array.isArray(response.data?.notifications)
          ? response.data.notifications
          : [];

        setNotifications(nextNotifications);
        setUnreadCount(nextNotifications.filter((item: NotificationItem) => !item.is_read).length);
      } catch (error) {
        console.debug("[AspirantNavbar] failed to load notifications", error);
      }
    };

    fetchNotifications();

    const liveNotificationHandler = (notification: NotificationItem) => {
      const nextItem = {
        id: notification.id,
        title: notification.title || "Booking update",
        message: notification.message || "You have a new update.",
        created_at: notification.created_at || notification.timestamp || new Date().toISOString(),
        is_read: Boolean(notification.is_read),
      };

      setNotifications((current) => [nextItem, ...current.filter((item) => item.id !== nextItem.id)]);
      setUnreadCount((current) => (nextItem.is_read ? current : current + 1));
    };

    onNewNotification(liveNotificationHandler);

    return () => {
      mounted = false;
      offNewNotification(liveNotificationHandler);
    };
  }, []);

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      onLogout();
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleBellClick = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (!nextState) return;

    try {
      const response = await API.post("notifications/mark-read/");
      const nextNotifications = Array.isArray(response.data?.notifications) ? response.data.notifications : notifications;
      setNotifications(nextNotifications);
      setUnreadCount(nextNotifications.filter((item: NotificationItem) => !item.is_read).length);
    } catch (error) {
      console.debug("[AspirantNavbar] failed to mark notifications as read", error);
    }
  };

  const userName = (() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return (
        u.display_name ||
        u.full_name ||
        u.fullName ||
        u.first_name ||
        u.username ||
        u.email ||
        ""
      ).toString().trim();
    } catch (e) {
      return "";
    }
  })();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#071735] px-5 text-white shadow-[0_10px_30px_-18px_rgba(2,6,23,0.35)] backdrop-blur md:px-10 lg:px-16">
        <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="VisaGuide home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f97316] text-white shadow-[0_8px_20px_-12px_rgba(249,115,22,0.65)]"><GraduationCap className="h-5 w-5" /></span>
          <span className="aspirant-serif text-xl tracking-tight">Visa<span className="text-[#f97316]">Guide</span></span>
        </a>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/10 p-1 text-sm md:flex">
          <NavLink to="/" end className={({ isActive }) => `rounded-full px-3 py-2 font-medium transition-all duration-200 ${isActive ? "bg-white text-[#0a1f44] shadow-[0_8px_18px_-10px_rgba(10,31,68,0.35)]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
            Home
          </NavLink>
          <NavLink to="/consultancies" className={({ isActive }) => `flex items-center gap-2 rounded-full px-3 py-2 font-medium transition-all duration-200 ${isActive ? "bg-white text-[#0a1f44] shadow-[0_8px_18px_-10px_rgba(10,31,68,0.35)]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
            <Building2 className="h-4 w-4" />Consultancies
          </NavLink>
          <NavLink to="/chatbot" className={({ isActive }) => `rounded-full px-3 py-2 font-medium transition-all duration-200 ${isActive ? "bg-white text-[#0a1f44] shadow-[0_8px_18px_-10px_rgba(10,31,68,0.35)]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
            Chatbot
          </NavLink>
          <NavLink to="/document-analyzer" className={({ isActive }) => `flex items-center gap-2 rounded-full px-3 py-2 font-medium transition-all duration-200 ${isActive ? "bg-white text-[#0a1f44] shadow-[0_8px_18px_-10px_rgba(10,31,68,0.35)]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
            <FileSearch className="h-4 w-4" />Document Analyzer
          </NavLink>
        </nav>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={handleBellClick}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/90 transition-colors hover:border-[#f97316] hover:text-[#f97316]"
            aria-label="Notification center"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-[#0a1f44] shadow-xl">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="font-semibold">Notifications</p>
                <p className="text-xs text-slate-500">Booking status and visa updates</p>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto p-3">
                {notifications.length > 0 ? notifications.map((notification) => (
                  <div key={notification.id} className={`rounded-lg border p-3 ${notification.is_read ? "border-slate-200 bg-slate-50" : "border-[#f97316]/20 bg-[#fff7ed]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[#0a1f44]">{notification.title || "Booking update"}</p>
                      {!notification.is_read && <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#f97316]" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{formatTime(notification.created_at || notification.timestamp)}</p>
                  </div>
                )) : (
                  <p className="py-8 text-center text-sm text-slate-500">No alerts yet.</p>
                )}
              </div>
            </div>
          )}

          <ProfileDropdown
            userName={userName}
            onSettingsClick={() => navigate("/settings")}
            onLogoutClick={() => setShowLogoutModal(true)}
          />
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
