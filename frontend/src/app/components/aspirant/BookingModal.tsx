import { useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { ModalOverlay, ModalHeader } from "../ui/ModalOverlay";
import { ACCENT, DARK } from "../ui/theme";

const TIMES = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];
const DAYS = ["Mon 23", "Tue 24", "Wed 25", "Thu 26", "Fri 27"];

export default function BookingModal({ onClose }: { onClose: () => void }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function confirm() {
    if (selectedDay && selectedTime) setConfirmed(true);
  }

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader
        icon={<CalendarDays className="w-4 h-4 text-white" />}
        title="Book Counselling Session"
        subtitle="Schedule a 1-on-1 session with a consultant"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ background: "#f5f7fb" }}>
        {confirmed ? (
          /* Confirmation state */
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#f0fdf4" }}
            >
              <CalendarDays className="w-8 h-8" style={{ color: "#22c55e" }} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: DARK }}>Booking Requested!</h3>
            <p className="text-sm max-w-xs" style={{ color: "#5a6e8a" }}>
              Your session for <strong>{selectedDay}</strong> at{" "}
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
            {/* Day picker */}
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: DARK }}>Select a Day</h4>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150"
                    style={{
                      background: selectedDay === d ? DARK : "#fff",
                      color: selectedDay === d ? "#fff" : "#5a6e8a",
                      borderColor: selectedDay === d ? DARK : "#dce6f5",
                    }}
                    aria-pressed={selectedDay === d}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time picker */}
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: DARK }}>Select a Time</h4>
              <div className="flex gap-2 flex-wrap">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all duration-150"
                    style={{
                      background: selectedTime === t ? ACCENT : "#fff",
                      color: selectedTime === t ? "#fff" : "#5a6e8a",
                      borderColor: selectedTime === t ? ACCENT : "#dce6f5",
                    }}
                    aria-pressed={selectedTime === t}
                  >
                    <Clock className="w-3 h-3" />
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Session details */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#fff", border: "1px solid #dce6f5" }}
            >
              <h4 className="font-semibold text-sm mb-2" style={{ color: DARK }}>Session details</h4>
              <p className="text-sm" style={{ color: "#5a6e8a" }}>
                Duration: 45 minutes &middot; Video call &middot; English
              </p>
            </div>

            <button
              onClick={confirm}
              disabled={!selectedDay || !selectedTime}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
              style={{ background: DARK, color: "#fff" }}
            >
              Confirm Booking Request
            </button>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}
