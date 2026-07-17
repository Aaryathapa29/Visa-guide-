import { useEffect, useState } from "react";
import { Bell, Building2, CalendarDays, MessageCircle, GraduationCap, Hand } from "lucide-react";
import type { ConsultancyTab } from "../ui/theme";
import API from "../../../api";
import { offNewNotification, onNewNotification, onNotificationsSnapshot, offNotificationsSnapshot } from "../../../socketio-service";
import ProfileDropdown from "../ui/ProfileDropdown";
import LogoutConfirmationModal from "../modals/LogoutConfirmationModal";

const TABS: { value: ConsultancyTab; label: string }[] = [
  { value: "profile", label: "Country Profiles", icon: Building2 },
  { value: "bookings", label: "Bookings", icon: CalendarDays },
  { value: "chats", label: "Chats", icon: MessageCircle },
];

type Notification = { id: number; message: string; timestamp: string; is_read: boolean };
type NotificationEvent = { id: number; count: number; timestamp: string; label: string };

function readStoredHistory() {
  if (typeof window === "undefined") return [] as NotificationEvent[];

  try {
    const raw = window.localStorage.getItem("consultancyNotificationHistory");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NotificationEvent[];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeStoredHistory(history: NotificationEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("consultancyNotificationHistory", JSON.stringify(history.slice(0, 6)));
}

function readPendingCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem("consultancyNotificationPendingCount");
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

function writePendingCount(count: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("consultancyNotificationPendingCount", String(count));
}

function formatRelativeTime(timestamp: string) {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return "just now";

  const diffMs = Date.now() - parsed;
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

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
  const [history, setHistory] = useState<NotificationEvent[]>(() => readStoredHistory());
  const [pendingCount, setPendingCount] = useState(() => readPendingCount());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const unread = pendingCount;

  useEffect(() => {
    API.get("notifications/")
      .then((response) => {
        const serverNotifications = response.data.notifications || [];

        // Prefer explicit unread_count returned by the backend (stable source of truth).
        // Fallback to counting unread items in the payload if unread_count isn't provided.
        const rawUnread = response.data.unread_count;
        const unreadFromServer = typeof rawUnread !== "undefined" ? Number(rawUnread) : serverNotifications.filter((notification: Notification) => !notification.is_read).length;

        setNotifications(serverNotifications);

        // Compute how many are new since last seen.
        const lastSeenRaw = typeof window !== "undefined" ? window.localStorage.getItem("consultancyNotificationLastSeenAt") : null;
        const lastSeenAt = lastSeenRaw ? Date.parse(lastSeenRaw) : null;

        const initialCount = Number(unreadFromServer || 0);

        const safeInitial = Number.isFinite(initialCount) ? initialCount : 0;

        if (safeInitial > 0) {
          const latestTimestamp = serverNotifications.find((n: Notification) => !n.is_read)?.timestamp || new Date().toISOString();
          const newEvent: NotificationEvent = {
            id: Date.now(),
            count: safeInitial,
            timestamp: latestTimestamp,
            label: `${safeInitial} anonymous profile visits made`,
          };
          setHistory((previous) => {
            const next = [newEvent, ...previous.filter((entry) => entry.id !== newEvent.id)].slice(0, 6);
            writeStoredHistory(next);
            return next;
          });
          setPendingCount(safeInitial);
          writePendingCount(safeInitial);
        } else {
          setPendingCount(0);
          writePendingCount(0);
        }
      })
      .catch(() => null);

    const handler = (notification: Notification) => {
      setNotifications((items) => (items.some((item) => item.id === notification.id) ? items : [{ ...notification, is_read: false }, ...items]));
      setPendingCount((current) => {
        const next = current + 1;
        const event: NotificationEvent = {
          id: Date.now(),
          count: next,
          timestamp: notification.timestamp || new Date().toISOString(),
          label: `${next} anonymous profile visits made`,
        };
        setHistory((previous) => {
          const nextHistory = [event, ...previous].slice(0, 6);
          writeStoredHistory(nextHistory);
          return nextHistory;
        });
        writePendingCount(next);
        return next;
      });
    };

    onNewNotification(handler);

    const snapshotHandler = (data: any) => {
      const serverNotifications = data?.notifications || [];
      const rawUnread = data?.unread_count;
      const unreadFromServer = typeof rawUnread !== "undefined" ? Number(rawUnread) : serverNotifications.filter((notification: Notification) => !notification.is_read).length;

      setNotifications(serverNotifications);

      const lastSeenRaw = typeof window !== "undefined" ? window.localStorage.getItem("consultancyNotificationLastSeenAt") : null;
      const lastSeenAt = lastSeenRaw ? Date.parse(lastSeenRaw) : null;

      const initialCount = lastSeenAt
        ? serverNotifications.filter((n: Notification) => {
            const t = Date.parse(n.timestamp);
            return !Number.isNaN(t) && t > lastSeenAt && !n.is_read;
          }).length
        : Number(unreadFromServer || 0);

      const safeInitial = Number.isFinite(initialCount) ? initialCount : 0;

      if (safeInitial > 0) {
        const latestTimestamp = serverNotifications.find((n: Notification) => !n.is_read)?.timestamp || new Date().toISOString();
        const newEvent: NotificationEvent = {
          id: Date.now(),
          count: safeInitial,
          timestamp: latestTimestamp,
          label: `${safeInitial} anonymous profile visits made`,
        };
        setHistory((previous) => {
          const next = [newEvent, ...previous.filter((entry) => entry.id !== newEvent.id)].slice(0, 6);
          writeStoredHistory(next);
          return next;
        });
        setPendingCount(safeInitial);
        writePendingCount(safeInitial);
      } else {
        setPendingCount(0);
        writePendingCount(0);
      }
    };

    onNotificationsSnapshot(snapshotHandler);

    return () => {
      offNewNotification(handler);
      offNotificationsSnapshot(snapshotHandler);
    };
  }, []);

  async function toggleNotifications() {
    const willOpen = !open;
    setOpen(willOpen);

    if (willOpen) {
      // mark local items as read immediately for optimistic UI
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      setPendingCount(0);
      writePendingCount(0);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("consultancyNotificationLastSeenAt", new Date().toISOString());
      }

      // send mark-as-read request and update local state from server response when available
      try {
        const resp = await API.post("notifications/");
        const serverNotifications = resp?.data?.notifications || [];
        const serverUnread = typeof resp?.data?.unread_count !== "undefined" ? Number(resp.data.unread_count) : serverNotifications.filter((n: Notification) => !n.is_read).length;
        setNotifications(serverNotifications);
        setPendingCount(Number.isFinite(serverUnread) ? serverUnread : 0);
        writePendingCount(Number.isFinite(serverUnread) ? serverUnread : 0);
      } catch (e) {
        // swallow network errors but keep optimistic UI
      }
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
    ? (() => {
        try {
          const raw = localStorage.getItem("authUser");
          if (!raw) return "";
          const u = JSON.parse(raw);
          return (
            u.display_name ||
            u.full_name ||
            u.fullName ||
            u.office_name ||
            u.first_name ||
            u.username ||
            u.email ||
            ""
          ).toString().trim();
        } catch (e) {
          return "";
        }
      })()
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
            {open && (
              <div className="absolute right-0 top-12 z-50 w-80 border border-slate-200 bg-white p-4 text-[#0a1f44] shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Visit notifications</p>
                    <p className="text-xs text-slate-500">Your consultancy profile visits</p>
                  </div>
                  <Bell className="h-5 w-5 text-[#f97316]" />
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className={`flex gap-3 border ${notification.is_read ? "border-slate-200 bg-slate-50" : "border-slate-300 bg-white"} p-3`}>
                        <Hand className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" />
                        <div>
                          <p className="text-sm">{notification.message}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  ) : history.length ? (
                    history.map((entry, index) => (
                      <div key={entry.id} className="flex gap-3 border border-slate-200 bg-slate-50 p-3">
                        <Hand className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" />
                        <div>
                          <p className="text-sm">{index === 0 ? `${entry.count} new anonymous profile visits made` : `${entry.count} anonymous profile visits made`}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-500">No profile visits yet.</p>
                  )}
                </div>
              </div>
            )}
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
