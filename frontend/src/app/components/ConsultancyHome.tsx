import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import API from "../../api";
import type { ConsultancyTab } from "./ui/theme";
import ConsultancyNavbar from "./consultancy/ConsultancyNavbar";
import OnboardingWizard from "./consultancy/OnboardingWizard";
import ConsultancyChatPanel from "./consultancy/ConsultancyChatPanel";
import AspirantQueueTable from "./consultancy/AspirantQueueTable";
import AccountSettings from "./pages/AccountSettings";
import ChatContainer from "./chat/ChatContainer";

interface CompletedSessionItem {
  id: number;
  aspirant_name: string;
  expert_name?: string;
  expert_specialization?: string;
  assigned_time?: string;
  appointment_time?: string;
  booking_time?: string;
  appointment_date?: string;
  booking_date?: string;
  status: string;
}

interface CompletedGroup {
  dateLabel: string;
  count: number;
  sessions: CompletedSessionItem[];
}

type Page = "dashboard" | "settings";

export default function ConsultancyHome() {
  const initialTab = (() => {
    if (typeof window === "undefined") return "bookings" as ConsultancyTab;

    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    if (requestedTab === "profile" || requestedTab === "bookings" || requestedTab === "chats") {
      return requestedTab as ConsultancyTab;
    }

    return "bookings" as ConsultancyTab;
  })();

  const [activeTab, setActiveTab] = useState<ConsultancyTab>(initialTab);
  const [page, setPage] = useState<Page>("dashboard");
  const [completedSessionGroups, setCompletedSessionGroups] = useState<CompletedGroup[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("authUser");
      const accessToken = localStorage.getItem("accessToken");
      if (raw && accessToken) {
        const user = JSON.parse(raw);
        if (user && user.role === "consultancy") {
          import("../../socketio-service").then(({ authenticateSocket }) => {
            authenticateSocket(user.id, "consultancy");
          }).catch(() => null);
        }
      }
    } catch (e) {
      // ignore
    }

    return () => {
      import("../../socketio-service").then(({ disconnectSocket }) => {
        disconnectSocket();
      }).catch(() => null);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return;
        const user = JSON.parse(raw);
        if (!user || user.role !== "consultancy") return;

        const response = await API.get("consultancy/sessions/");
        if (!mounted) return;

        const completed = Array.isArray(response.data?.completed) ? response.data.completed : [];
        const groups = completed.reduce<Record<string, CompletedGroup>>((accumulator, session) => {
          const dateKey = session.appointment_date || session.booking_date || "";
          const dateLabel = dateKey
            ? new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "Unknown";

          if (!accumulator[dateKey]) {
            accumulator[dateKey] = {
              dateLabel,
              count: 0,
              sessions: [],
            };
          }

          accumulator[dateKey].count += 1;
          accumulator[dateKey].sessions.push(session);
          return accumulator;
        }, {});

        setCompletedSessionGroups(Object.values(groups).sort((left, right) => {
          const leftTime = new Date(`${left.sessions[0]?.appointment_date || left.sessions[0]?.booking_date || "1970-01-01"}T12:00:00`).getTime();
          const rightTime = new Date(`${right.sessions[0]?.appointment_date || right.sessions[0]?.booking_date || "1970-01-01"}T12:00:00`).getTime();
          return rightTime - leftTime;
        }));
      } catch {
        if (mounted) {
          setCompletedSessionGroups([]);
        }
      }
    };

    loadSummary();
    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
    window.location.reload();
  }

  const userName = (() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return (
        u.display_name || u.first_name || u.username || u.email || ""
      ).toString().trim();
    } catch (e) {
      return "";
    }
  })();
  const consultancyName = (() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return u.office_name || u.username || u.email || "";
    } catch (e) {
      return "";
    }
  })();

  if (page === "settings") {
    return (
      <AccountSettings
        userRole="consultancy"
        userName={consultancyName || userName}
        onBack={() => setPage("dashboard")}
        onAccountDeleted={handleLogout}
      />
    );
  }

  return (
    <div className="aspirant-shell min-h-screen">
      <ConsultancyNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setPage("settings")}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-7xl px-6 pb-6 pt-2 md:px-12">
        {activeTab === "profile" && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(10,31,68,.25)]">
            <div className="mb-6">
              <h2 className="aspirant-serif text-2xl text-[#0a1f44]">Country Profiles</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add the countries you offer visa services for, then fill in the required documents and instructions for each.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <OnboardingWizard />
            </div>
          </section>
        )}

        {activeTab === "chats" && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(10,31,68,.25)]">
            <div className="mb-6">
              <h2 className="aspirant-serif text-2xl text-[#0a1f44]">Aspirant Chats</h2>
              <p className="mt-1 text-sm text-slate-600">
                Respond to messages from visa aspirants in a dedicated conversation workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <ChatContainer />
            </div>
          </section>
        )}

        {activeTab === "bookings" && (
          <div className="mt-2 flex min-h-screen bg-slate-50/50">
            <aside className="w-72 border-r border-slate-200 bg-slate-50/70 p-6">
              <h2 className="text-lg font-bold text-slate-900">Completed Sessions</h2>
              <p className="mt-1 text-sm text-slate-500">{completedSessionGroups.length} dates with completed counselling</p>

              <div className="mt-4 space-y-3">
                {completedSessionGroups.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    No completed sessions yet.
                  </div>
                ) : (
                  completedSessionGroups.map((group) => {
                    const isOpen = Boolean(expandedDates[group.dateLabel]);
                    return (
                      <div key={group.dateLabel} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDates((current) => ({
                              ...current,
                              [group.dateLabel]: !current[group.dateLabel],
                            }))
                          }
                          className="flex w-full items-center justify-between gap-3 p-3 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{group.dateLabel}</span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              {group.count}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-3">
                            <div className="space-y-2">
                              {group.sessions.map((session) => (
                                <div key={session.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                  <p className="text-sm font-semibold text-slate-900">{session.aspirant_name}</p>
                                  <div className="mt-1 text-xs text-slate-500">
                                    <div>Expert: {session.expert_name || "Unassigned"}</div>
                                    <div>Time: {session.assigned_time || session.appointment_time || session.booking_time || "—"}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <div className="flex-1 p-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <AspirantQueueTable />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
