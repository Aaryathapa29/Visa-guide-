import { useState } from "react";
import { CalendarDays, Clock, Check } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";

interface BookingRequest {
  id: string;
  aspirant: string;
  requestedDay: string;
  requestedTime: string;
  status: "pending" | "confirmed";
  assignedTime?: string;
}

const AVAILABLE_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

const INITIAL_BOOKINGS: BookingRequest[] = [
  { id: "b1", aspirant: "Amara Osei", requestedDay: "Mon 23 Jun", requestedTime: "10:00 AM", status: "pending" },
  { id: "b2", aspirant: "Ravi Shankar", requestedDay: "Wed 25 Jun", requestedTime: "02:00 PM", status: "pending" },
  { id: "b3", aspirant: "Leila Nasseri", requestedDay: "Thu 26 Jun", requestedTime: "11:00 AM", status: "confirmed", assignedTime: "11:00 AM" },
  { id: "b4", aspirant: "David Mensah", requestedDay: "Fri 27 Jun", requestedTime: "09:00 AM", status: "pending" },
];

export default function AspirantQueueTable() {
  const [bookings, setBookings] = useState<BookingRequest[]>(INITIAL_BOOKINGS);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [pickedTime, setPickedTime] = useState<string>("");

  function confirmBooking(id: string) {
    const time = pickedTime || (bookings.find((b) => b.id === id)?.requestedTime ?? "");
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "confirmed", assignedTime: time } : b))
    );
    setAssigningId(null);
    setPickedTime("");
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-sm" style={{ color: DARK }}>Pending Requests</h3>
          {pending.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "#fef3c7", color: "#d97706" }}
            >
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center py-10"
            style={{ background: "#fff", border: "1.5px dashed #dce6f5" }}
          >
            <CalendarDays className="w-8 h-8 mb-2" style={{ color: "#c7d8f0" }} />
            <p className="text-sm" style={{ color: "#5a6e8a" }}>No pending booking requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid #dce6f5" }}
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: DARK, color: "#fff" }}
                    >
                      {b.aspirant[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: DARK }}>
                        {b.aspirant}
                      </div>
                      <div
                        className="text-xs flex items-center gap-1.5 mt-0.5"
                        style={{ color: "#5a6e8a" }}
                      >
                        <Clock className="w-3 h-3" />
                        Requested: {b.requestedDay} at {b.requestedTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {assigningId !== b.id && (
                      <button
                        onClick={() => { setAssigningId(b.id); setPickedTime(b.requestedTime); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: DARK, color: "#fff" }}
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Assign Time
                      </button>
                    )}
                    <button
                      onClick={() => confirmBooking(b.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0" }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                  </div>
                </div>

                {/* Inline time picker */}
                {assigningId === b.id && (
                  <div className="px-5 pb-4 space-y-3" style={{ borderTop: "1px solid #f0f4f8" }}>
                    <p className="text-xs font-semibold pt-3" style={{ color: "#5a6e8a" }}>
                      Assign Appointment Time
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TIMES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setPickedTime(t)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            background: pickedTime === t ? ACCENT : "#f5f7fb",
                            color: pickedTime === t ? "#fff" : "#5a6e8a",
                            borderColor: pickedTime === t ? ACCENT : "#dce6f5",
                          }}
                          aria-pressed={pickedTime === t}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => confirmBooking(b.id)}
                        disabled={!pickedTime}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                        style={{ background: DARK, color: "#fff" }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirm at {pickedTime || "—"}
                      </button>
                      <button
                        onClick={() => setAssigningId(null)}
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
        )}
      </div>

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-4" style={{ color: DARK }}>Confirmed Sessions</h3>
          <div className="space-y-2">
            {confirmed.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: DARK }}>{b.aspirant}</span>
                  <span className="text-xs ml-2" style={{ color: "#5a6e8a" }}>
                    {b.requestedDay} · {b.assignedTime}
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
