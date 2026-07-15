import { useEffect, useState } from "react";
import { Hand, Loader2, Bell } from "lucide-react";
import API from "../../../api";
import { DARK } from "../ui/theme";
// Fixed relative path import target
import { onNewNotification, offNewNotification } from "../../../socketio-service";

type VisitNotification = {
  id: number;
  visitor_name: string;
  message: string;
  timestamp: string;
};

export default function ConsultancyVisitNotificationsFeed() {
  const [notifications, setNotifications] = useState<VisitNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      setError("");

      try {
        const response = await API.get("notifications/");
        if (!mounted) return;
        setNotifications(Array.isArray(response.data.notifications) ? response.data.notifications : []);
      } catch (requestError: any) {
        if (mounted) {
          setError(requestError?.response?.data?.detail || "Unable to load visit notifications.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // initial database load
    loadNotifications();

    // subscribe to real-time socket events cleanly
    const handler = (notification: any) => {
      setNotifications((prev) => {
        // Guard checking for duplicate keys
        if (prev.some((item) => item.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    };
    onNewNotification(handler);

    return () => {
      mounted = false;
      offNewNotification(handler);
    };
  }, []);

  return (
    <section className="rounded-2xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #dce6f5" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold" style={{ color: DARK, fontSize: "1rem" }}>Visit Alerts</h2>
          <p className="text-xs mt-0.5" style={{ color: "#5a6e8a" }}>Unread consultancy visit notifications</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eef2fb", color: "#2563eb" }}>
          <Bell className="w-4 h-4" />
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#2563eb" }} />
          <p className="text-sm mt-2" style={{ color: "#5a6e8a" }}>Loading unread alerts…</p>
        </div>
      ) : error ? (
        <p className="text-sm rounded-xl p-4" style={{ background: "#fef2f2", color: "#b91c1c" }}>{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm rounded-xl p-4" style={{ background: "#f8fafc", color: "#5a6e8a" }}>
          No unread visit notifications yet.
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "#fafdff", border: "1px solid #dce6f5" }}>
              <Hand className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2563eb" }} />
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: DARK }}>
                  {notification.message}
                </p>
                <p className="text-xs mt-1" style={{ color: "#5a6e8a" }}>
                  {notification.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}