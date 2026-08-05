import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock, UserRound } from "lucide-react";
import API from "../../../api";
import { ModalOverlay, ModalHeader } from "../ui/ModalOverlay";

interface ExpertOption {
  id: number | string;
  name: string;
  specialization: string;
}

const TIMES = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function parseTimeToDate(timeText: string, baseDate: Date) {
  const match = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "AM" && hours === 12) hours = 0;
  if (period === "PM" && hours !== 12) hours += 12;

  const value = new Date(baseDate);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

function isPastTimeSlot(timeText: string, selectedDateKey: string | null) {
  if (!selectedDateKey) return false;
  const todayKey = formatDateKey(new Date());
  if (selectedDateKey !== todayKey) return false;

  const candidate = parseTimeToDate(timeText, new Date());
  if (!candidate) return false;

  return candidate.getTime() < Date.now();
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

  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [experts, setExperts] = useState<ExpertOption[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [slotAvailability, setSlotAvailability] = useState<Array<{ time: string; is_booked: boolean }>>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(dateOptions[0]?.key ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(TIMES[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadExperts = async () => {
      if (!consultancyId) {
        if (mounted) {
          setExperts([]);
          setSelectedExpertId(null);
          setSlotAvailability([]);
          setExpertsLoading(false);
        }
        return;
      }

      setExpertsLoading(true);

      try {
        const response = await API.get("auth/experts/", {
          params: { consultancy_id: consultancyId },
        });
        const assignedExperts = Array.isArray(response.data) ? response.data : [];

        if (!mounted) return;
        setExperts(assignedExperts);
        setSelectedExpertId(assignedExperts[0]?.id ?? null);
      } catch {
        if (!mounted) return;
        setExperts([]);
        setSelectedExpertId(null);
      } finally {
        if (mounted) {
          setExpertsLoading(false);
        }
      }
    };

    loadExperts();
    return () => {
      mounted = false;
    };
  }, [consultancyId]);

  useEffect(() => {
    let mounted = true;

    const loadBookedSlots = async () => {
      if (!consultancyId || !selectedDay) {
        if (mounted) setSlotAvailability([]);
        return;
      }

      try {
        const response = await API.get(`consultancy/${consultancyId}/available-slots/`, {
          params: {
            date: selectedDay,
            expert_id: selectedExpertId ?? undefined,
          },
        });

        if (!mounted) return;
        setSlotAvailability(Array.isArray(response.data?.slots) ? response.data.slots : []);
      } catch {
        if (mounted) setSlotAvailability([]);
      }
    };

    loadBookedSlots();
    return () => {
      mounted = false;
    };
  }, [consultancyId, selectedDay, selectedExpertId]);

  const selectedExpert = experts.find((expert) => String(expert.id) === String(selectedExpertId));
  const bookedTimes = useMemo(() => {
    return slotAvailability.filter((slot) => slot.is_booked).map((slot) => slot.time);
  }, [slotAvailability]);
  const availableTimes = useMemo(() => {
    return (slotAvailability.length > 0 ? slotAvailability : TIMES.map((time) => ({ time, is_booked: false })))
      .filter((slot) => !isPastTimeSlot(slot.time, selectedDay))
      .map((slot) => slot.time);
  }, [selectedDay, slotAvailability]);

  async function confirm() {
    if (!selectedDay || !selectedTime) {
      setError("Please choose a date and time for the session.");
      return;
    }

    if (isPastTimeSlot(selectedTime, selectedDay) || bookedTimes.includes(selectedTime)) {
      setError("This time slot is no longer available. Please choose another slot.");
      return;
    }

    if (!consultancyId) {
      setError("Please choose a consultancy before booking this session.");
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
        expert_id: selectedExpertId ?? undefined,
        notes: `Requested appointment with ${consultancyName || "consultancy"}${selectedExpert ? ` for ${selectedExpert.name} (${selectedExpert.specialization})` : ""}.`,
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
        icon={<CalendarDays className="h-4 w-4 text-white" />}
        title="Book Counselling Session"
        subtitle={consultancyName ? `Schedule a 1-on-1 session with ${consultancyName}` : "Schedule a 1-on-1 session with a consultant"}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {confirmed ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Booking requested</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-600">
                Your session for <span className="font-semibold text-slate-900">{dateOptions.find((day) => day.key === selectedDay)?.label ?? selectedDay}</span> at <span className="font-semibold text-slate-900">{selectedTime}</span> has been submitted.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-[#0a1f44] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f97316]">Step 1</p>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Choose Expert</h3>

              {expertsLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading experts…</p>
              ) : experts.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {experts.map((expert) => (
                    <button
                      key={expert.id}
                      type="button"
                      onClick={() => setSelectedExpertId(String(expert.id))}
                      className={`rounded-2xl border p-4 text-left transition-all ${String(selectedExpertId) === String(expert.id) ? "border-[#f97316] bg-[#fff7ed] shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a1f44] shadow-sm">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{expert.name}</div>
                          <div className="text-xs text-slate-500">{expert.specialization}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No specified expert type available.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f97316]">Step 2</p>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Choose a date</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {dateOptions.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${selectedDay === day.key ? "border-[#0a1f44] bg-[#0a1f44] text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                    aria-pressed={selectedDay === day.key}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f97316]">Step 3</p>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Choose a time</h3>
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-2.5 py-1 font-semibold text-[#c2410c]">🟧 Selected</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">⚪ Available</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">🚫 Unavailable / Booked</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {availableTimes.map((time) => {
                  const isBooked = bookedTimes.includes(time);
                  const isDisabled = isBooked || isPastTimeSlot(time, selectedDay);

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => !isDisabled && setSelectedTime(time)}
                      disabled={isDisabled}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${selectedTime === time ? "border-[#f97316] bg-[#f97316] text-white" : isBooked ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700 opacity-70" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
                      aria-pressed={selectedTime === time}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {isBooked ? `${time} • Booked` : time}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f97316]">Booking summary</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Your session request</h3>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending review</span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Consultancy</span>
                  <span className="font-semibold text-slate-900">{consultancyName || "Selected consultancy"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Expert</span>
                  <span className="font-semibold text-slate-900">{selectedExpert?.name ? `${selectedExpert.name} - ${selectedExpert.specialization}` : "General counselling"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Date</span>
                  <span className="font-semibold text-slate-900">{dateOptions.find((day) => day.key === selectedDay)?.label ?? "Choose a day"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Time</span>
                  <span className="font-semibold text-slate-900">{selectedTime || "Choose a time"}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <button
              onClick={confirm}
              disabled={!selectedDay || !selectedTime || submitting || !consultancyId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a1f44] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Confirm Booking Request"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
