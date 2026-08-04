import { useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import API from "../../../api";
import { ModalOverlay, ModalHeader } from "../ui/ModalOverlay";
import { ACCENT, DARK } from "../ui/theme";

const TIMES = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function BookingModal({
  consultancyId,
  consultancyName,
  onClose,
  onBooked,
}: {
  consultancyId?: number;
  consultancyName?: string;
  onClose: () => void;
  onBooked?: () => void;
}) {
  const dateOptions = useMemo(() => {
    const dates: { key: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 5; i += 1) {
      const value = new Date(today);
      value.setDate(today.getDate() + i + 1);
      dates.push({ key: formatDateKey(value), label: formatDayLabel(value) });
    }
    return dates;
  }, []);

  const [selectedDay, setSelectedDay] = useState<string | null>(dateOptions[0]?.key ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(TIMES[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!selectedDay || !selectedTime || !consultancyId) {
      setError("Please choose a date and time for the session.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const currentUser = (() => {
        try {
          const raw = localStorage.getItem("authUser");
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      if (!currentUser?.id) {
        setError("Please sign in before booking a counselling session.");
        return;
      }

      await API.post("auth/bookings/", {
        consultancy_id: consultancyId,
        appointment_date: selectedDay,
        appointment_time: selectedTime,
        notes: `Requested appointment with ${consultancyName || "consultancy"}.`,
      });

      setConfirmed(true);
      onBooked?.();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to submit the booking request right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader
        icon={<CalendarDays className="w-4 h-4 text-white" />}
        title="Book Counselling Session"
        subtitle={consultancyName ? `Schedule a 1-on-1 session with ${consultancyName}` : "Schedule a 1-on-1 session with a consultant"}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ background: "#f5f7fb" }}>
        {confirmed ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#f0fdf4" }}
            >
              <CalendarDays className="w-8 h-8" style={{ color: "#22c55e" }} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: DARK }}>Booking Requested!</h3>
            <p className="text-sm max-w-xs" style={{ color: "#5a6e8a" }}>
              Your session for <strong>{dateOptions.find((d) => d.key === selectedDay)?.label ?? selectedDay}</strong> at{" "}
              <strong>{selectedTime}</strong> has been submitted. A consultant will confirm shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: DARK, color: "#fff" }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: DARK }}>Select a Day</h4>
              <div className="flex gap-2 flex-wrap">
                {dateOptions.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150"
                    style={{
                      background: selectedDay === day.key ? DARK : "#fff",
                      color: selectedDay === day.key ? "#fff" : "#5a6e8a",
                      borderColor: selectedDay === day.key ? DARK : "#dce6f5",
                    }}
                    aria-pressed={selectedDay === day.key}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: DARK }}>Select a Time</h4>
              <div className="flex gap-2 flex-wrap">
                {TIMES.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all duration-150"
                    style={{
                      background: selectedTime === time ? ACCENT : "#fff",
                      color: selectedTime === time ? "#fff" : "#5a6e8a",
                      borderColor: selectedTime === time ? ACCENT : "#dce6f5",
                    }}
                    aria-pressed={selectedTime === time}
                  >
                    <Clock className="w-3 h-3" />
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={confirm}
              disabled={!selectedDay || !selectedTime || submitting || !consultancyId}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
              style={{ background: DARK, color: "#fff" }}
            >
              {submitting ? "Submitting…" : "Confirm Booking Request"}
            </button>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}
