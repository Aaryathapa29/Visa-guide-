import { useEffect, useState } from "react";
import { CalendarDays, Clock, Check } from "lucide-react";
import API from "../../../api";
import { ACCENT, DARK } from "../ui/theme";

interface BookingRequest {
  id: number;
  aspirant_id: number;
  aspirant_name: string;
  consultancy_id: number;
  appointment_date: string;
  appointment_time: string;
  booking_date?: string;
  booking_time?: string;
  assigned_time: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  notes?: string;
}

const AVAILABLE_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

function getNextDates() {
  const base = new Date();
  return Array.from({ length: 5 }, (_, index) => {
    const value = new Date(base);
    value.setDate(base.getDate() + index + 1);
    return {
      key: value.toISOString().slice(0, 10),
      label: value.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
  });
}

function formatDateLabel(dateValue: string) {
  if (!dateValue) return "—";
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AspirantQueueTable() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [pickedTime, setPickedTime] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [editingTime, setEditingTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("auth/bookings/");
      const raw = Array.isArray(response.data) ? response.data : [];
      const authUser = (() => {
        try {
          const stored = localStorage.getItem("authUser");
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      })();

      const filtered = raw.filter((booking: BookingRequest) => Number(booking.consultancy_id) === Number(authUser?.id));
      setBookings(filtered);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to load bookings right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await loadBookings();
    };

    run();
    return () => { mounted = false; };
  }, []);

  async function confirmBooking(id: number) {
    const chosenTime = pickedTime || (bookings.find((b) => b.id === id)?.appointment_time ?? "");
    if (!chosenTime) return;

    try {
      const response = await API.patch(`auth/bookings/${id}/`, {
        status: "confirmed",
        assigned_time: chosenTime,
      });

      const updated = response.data as BookingRequest;
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, ...updated, status: "confirmed" } : booking)));
      setAssigningId(null);
      setPickedTime("");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to confirm this booking.");
    }
  }

  async function handleSaveUpdate(id: number) {
    if (!editingDate || !editingTime) return;

    try {
      const response = await API.patch(`auth/bookings/${id}/update/`, {
        appointment_date: editingDate,
        appointment_time: editingTime,
        booking_date: editingDate,
        booking_time: editingTime,
        status: "confirmed",
      });

      const updated = response.data as BookingRequest;
      setBookings((prev) => prev.map((booking) => {
        if (booking.id !== id) return booking;

        return {
          ...booking,
          ...updated,
          booking_date: updated.booking_date ?? editingDate,
          booking_time: updated.booking_time ?? editingTime,
          status: "confirmed",
        };
      }));
      setEditingId(null);
      setEditingDate("");
      setEditingTime("");
      await loadBookings();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to update this booking.");
    }
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-slate-50 px-5 py-8 text-sm text-slate-600">Loading bookings…</div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-sm" style={{ color: DARK }}>Pending Requests</h3>
              {pending.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#d97706" }}>
                  {pending.length}
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="rounded-2xl flex flex-col items-center py-10" style={{ background: "#fff", border: "1.5px dashed #dce6f5" }}>
                <CalendarDays className="w-8 h-8 mb-2" style={{ color: "#c7d8f0" }} />
                <p className="text-sm" style={{ color: "#5a6e8a" }}>No pending booking requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((booking) => (
                  <div key={booking.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #dce6f5" }}>
                    <div className="flex items-center justify-between px-5 py-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: DARK, color: "#fff" }}>
                          {booking.aspirant_name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: DARK }}>{booking.aspirant_name}</div>
                          <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "#5a6e8a" }}>
                            <Clock className="w-3 h-3" />
                            Requested: {formatDateLabel(booking.appointment_date)} at {booking.appointment_time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {assigningId !== booking.id && (
                          <button
                            onClick={() => { setAssigningId(booking.id); setPickedTime(booking.appointment_time); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                            style={{ background: DARK, color: "#fff" }}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            Assign Time
                          </button>
                        )}
                        <button
                          onClick={() => confirmBooking(booking.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                          style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0" }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm
                        </button>
                      </div>
                    </div>

                    {assigningId === booking.id && (
                      <div className="px-5 pb-4 space-y-3" style={{ borderTop: "1px solid #f0f4f8" }}>
                        <p className="text-xs font-semibold pt-3" style={{ color: "#5a6e8a" }}>Assign Appointment Time</p>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_TIMES.map((time) => (
                            <button
                              key={time}
                              onClick={() => setPickedTime(time)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                              style={{
                                background: pickedTime === time ? ACCENT : "#f5f7fb",
                                color: pickedTime === time ? "#fff" : "#5a6e8a",
                                borderColor: pickedTime === time ? ACCENT : "#dce6f5",
                              }}
                              aria-pressed={pickedTime === time}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => confirmBooking(booking.id)}
                            disabled={!pickedTime}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                            style={{ background: DARK, color: "#fff" }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm at {pickedTime || "-"}
                          </button>
                          <button onClick={() => setAssigningId(null)} className="px-3 py-2 rounded-xl text-xs" style={{ color: "#5a6e8a" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {confirmed.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-4" style={{ color: DARK }}>Confirmed Sessions</h3>
              <div className="space-y-2">
                {confirmed.map((booking) => (
                  <div key={booking.id} className="rounded-xl px-4 py-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="flex items-center gap-4">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                      <div className="flex-1">
                        <span className="text-sm font-semibold" style={{ color: DARK }}>{booking.aspirant_name}</span>
                        <span className="text-xs ml-2" style={{ color: "#5a6e8a" }}>
                          {booking.booking_date ? formatDateLabel(booking.booking_date) : formatDateLabel(booking.appointment_date)} · {booking.booking_time || booking.appointment_time}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(booking.id);
                          setEditingDate(booking.appointment_date);
                          setEditingTime(booking.assigned_time || booking.appointment_time);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: "#fff", color: DARK, border: "1px solid #dce6f5" }}
                      >
                        Update Time/Date
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#dcfce7", color: "#15803d" }}>
                        Confirmed
                      </span>
                    </div>

                    {editingId === booking.id && (
                      <div className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-white p-3">
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: "#5a6e8a" }}>Update date</p>
                          <div className="flex flex-wrap gap-2">
                            {getNextDates().map((day) => (
                              <button
                                key={day.key}
                                onClick={() => setEditingDate(day.key)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                                style={{
                                  background: editingDate === day.key ? DARK : "#f5f7fb",
                                  color: editingDate === day.key ? "#fff" : "#5a6e8a",
                                  borderColor: editingDate === day.key ? DARK : "#dce6f5",
                                }}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: "#5a6e8a" }}>Update time</p>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TIMES.map((time) => (
                              <button
                                key={time}
                                onClick={() => setEditingTime(time)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                                style={{
                                  background: editingTime === time ? ACCENT : "#f5f7fb",
                                  color: editingTime === time ? "#fff" : "#5a6e8a",
                                  borderColor: editingTime === time ? ACCENT : "#dce6f5",
                                }}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleSaveUpdate(booking.id)}
                            disabled={!editingDate || !editingTime}
                            className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                            style={{ background: DARK, color: "#fff" }}
                          >
                            Save Update
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingDate("");
                              setEditingTime("");
                            }}
                            className="px-3 py-2 rounded-xl text-xs"
                            style={{ color: "#5a6e8a" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
