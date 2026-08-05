import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock, Plus, Trash2, X } from "lucide-react";
import API from "../../../api";

interface BookingRequest {
  id: number;
  aspirant_id: number;
  aspirant_name: string;
  consultancy_id: number;
  expert_id?: number | string | null;
  expert_name?: string;
  expert_specialization?: string;
  appointment_date: string;
  appointment_time: string;
  booking_date?: string;
  booking_time?: string;
  assigned_time: string;
  session_datetime?: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  notes?: string;
}

interface Expert {
  id: number | string;
  name: string;
  specialization: string;
}

interface PendingRequest {
  id: number;
  aspirantName: string;
  expertId: string;
  date: string;
  time: string;
  status: "pending";
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

function formatTimeLabel(timeValue: string) {
  return timeValue || "—";
}

export default function AspirantQueueTable() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [confirmedSessions, setConfirmedSessions] = useState<PendingRequest[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState<string>("all");
  const [isAddExpertOpen, setIsAddExpertOpen] = useState(false);
  const [newExpertName, setNewExpertName] = useState("");
  const [newExpertRole, setNewExpertRole] = useState("");
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [pickedTime, setPickedTime] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [editingTime, setEditingTime] = useState<string>("");
  const [editingSlots, setEditingSlots] = useState<Array<{ time: string; is_booked: boolean }>>([]);
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

      const now = Date.now();

      const mappedPending = filtered
        .filter((booking: BookingRequest) => booking.status === "pending")
        .map((booking: BookingRequest) => ({
          id: booking.id,
          aspirantName: booking.aspirant_name,
          expertId: booking.expert_id ? String(booking.expert_id) : "",
          date: booking.appointment_date || booking.booking_date || "",
          time: booking.assigned_time || booking.appointment_time || "",
          status: "pending" as const,
        }));

      const mappedConfirmed = filtered
        .filter((booking: BookingRequest) => booking.status === "confirmed")
        .filter((booking: BookingRequest) => {
          const sessionDate = booking.session_datetime ? new Date(booking.session_datetime).getTime() : null;
          return sessionDate ? sessionDate > now : true;
        })
        .map((booking: BookingRequest) => ({
          id: booking.id,
          aspirantName: booking.aspirant_name,
          expertId: booking.expert_id ? String(booking.expert_id) : "",
          date: booking.booking_date || booking.appointment_date || "",
          time: booking.assigned_time || booking.booking_time || booking.appointment_time || "",
          status: "pending" as const,
        }));

      setPendingRequests(mappedPending);
      setConfirmedSessions(mappedConfirmed);
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
      const authUser = (() => {
        try {
          const stored = localStorage.getItem("authUser");
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      })();

      if (authUser?.id && authUser?.role === "consultancy") {
        try {
          const expertsResponse = await API.get("auth/experts/", {
            params: { consultancy_id: authUser.id },
          });
          if (!mounted) return;
          const responseExperts = Array.isArray(expertsResponse.data) ? expertsResponse.data : [];
          setExperts(responseExperts.map((expert: any) => ({
            id: expert.id,
            name: expert.name,
            specialization: expert.specialization || "General Counsellor",
          })));
        } catch {
          if (!mounted) return;
          setExperts([]);
        }
      }

      await loadBookings();
    };

    run();
    return () => { mounted = false; };
  }, []);

  async function confirmBooking(id: number) {
    const chosenTime = pickedTime || (bookings.find((b) => b.id === id)?.appointment_time ?? "");
    if (!chosenTime) return;

    try {
      await API.patch(`auth/bookings/${id}/`, {
        status: "confirmed",
        assigned_time: chosenTime,
      });

      const booking = bookings.find((item) => item.id === id);
      if (booking) {
        setPendingRequests((current) => current.filter((request) => request.id !== id));
        setConfirmedSessions((current) => [
          {
            id: booking.id,
            aspirantName: booking.aspirant_name,
            expertId: booking.expert_id ? String(booking.expert_id) : "",
            date: booking.booking_date || booking.appointment_date || "",
            time: chosenTime,
            status: "pending",
          },
          ...current,
        ]);
      }

      setAssigningId(null);
      setPickedTime("");
      await loadBookings();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to confirm this booking.");
    }
  }

  async function loadAvailabilityForDate(consultancyId: number, date: string, expertId?: string | number | null) {
    if (!consultancyId || !date) {
      setEditingSlots([]);
      return;
    }

    try {
      const response = await API.get(`consultancy/${consultancyId}/available-slots/`, {
        params: {
          date,
          expert_id: expertId || undefined,
        },
      });
      const slots = Array.isArray(response.data?.slots) ? response.data.slots : [];
      setEditingSlots(slots);
    } catch {
      setEditingSlots([]);
    }
  }

  async function handleSaveUpdate(id: number) {
    if (!editingDate || !editingTime) return;

    const activeBooking = bookings.find((item) => item.id === id);
    const currentConsultancyId = Number(activeBooking?.consultancy_id ?? 0);
    const currentExpertId = activeBooking?.expert_id ?? undefined;
    const isSlotBooked = editingSlots.some((slot) => slot.time === editingTime && slot.is_booked);

    if (isSlotBooked && currentExpertId !== undefined) {
      setError("This time slot is already booked for the selected date and expert.");
      return;
    }

    try {
      await API.patch(`auth/bookings/${id}/update/`, {
        appointment_date: editingDate,
        appointment_time: editingTime,
        booking_date: editingDate,
        booking_time: editingTime,
        assigned_time: editingTime,
        status: "confirmed",
      });

      if (activeBooking) {
        setConfirmedSessions((current) =>
          current.map((session) =>
            session.id === id
              ? {
                  ...session,
                  date: editingDate,
                  time: editingTime,
                }
              : session,
          ),
        );
      }

      setEditingId(null);
      setEditingDate("");
      setEditingTime("");
      setEditingSlots([]);
      await loadBookings();
      if (currentConsultancyId) {
        await loadAvailabilityForDate(currentConsultancyId, editingDate, currentExpertId);
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to update this booking.");
    }
  }

  async function cancelBooking(id: number) {
    try {
      await API.patch(`sessions/${id}/cancel/`, {});
      setPendingRequests((current) => current.filter((request) => request.id !== id));
      setConfirmedSessions((current) => current.filter((session) => session.id !== id));
      await loadBookings();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to cancel this booking.");
    }
  }

  const filteredPendingRequests = useMemo(() => {
    if (selectedExpertId === "all") return pendingRequests;
    return pendingRequests.filter((request) => request.expertId === selectedExpertId);
  }, [pendingRequests, selectedExpertId]);

  const handleAddExpert = async () => {
    if (!newExpertName.trim() || !newExpertRole.trim()) return;

    try {
      const response = await API.post("auth/experts/", {
        name: newExpertName.trim(),
        specialization: newExpertRole.trim(),
      });
      const createdExpert = response.data as Expert;
      setExperts((current) => [...current, {
        id: createdExpert.id,
        name: createdExpert.name,
        specialization: createdExpert.specialization,
      }]);
      setSelectedExpertId(String(createdExpert.id));
      setNewExpertName("");
      setNewExpertRole("");
      setIsAddExpertOpen(false);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "Unable to save this expert right now.");
    }
  };

  async function deleteExpert(expertId: number | string, expertName: string) {
    const confirmed = window.confirm(`Are you sure you want to delete ${expertName}?`);
    if (!confirmed) return;

    const deletedId = String(expertId);

    try {
      await API.delete(`auth/experts/${expertId}/`);
    } catch {
      setError("Unable to delete this expert right now.");
      return;
    }

    setExperts((current) => current.filter((expert) => String(expert.id) !== deletedId));
    setBookings((current) => current.map((booking) => (
      String(booking.expert_id) === deletedId
        ? { ...booking, expert_id: null, expert_name: booking.aspirant_name, expert_specialization: "" }
        : booking
    )));
    setPendingRequests((current) => current.map((request) => (
      request.expertId === deletedId
        ? { ...request, expertId: "" }
        : request
    )));
    setConfirmedSessions((current) => current.map((session) => (
      session.expertId === deletedId
        ? { ...session, expertId: "" }
        : session
    )));

    if (selectedExpertId === deletedId) {
      setSelectedExpertId("all");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Counselling Bookings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review pending requests, assign appointment times, and confirm sessions.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedExpertId}
            onChange={(event) => setSelectedExpertId(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Experts</option>
            {experts.map((expert) => (
              <option key={String(expert.id)} value={String(expert.id)}>
                {expert.name} - {expert.specialization}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsAddExpertOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Expert
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Expert Directory</h3>
            <p className="text-sm text-slate-500">Select an expert or delete one directly from the list.</p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {experts.map((expert) => {
            const expertId = String(expert.id);
            const isActive = selectedExpertId === expertId;

            return (
              <div
                key={expertId}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-all ${isActive ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedExpertId(expertId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a1f44] text-xs font-bold text-white">
                    {expert.name?.charAt(0)?.toUpperCase() || "E"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{expert.name}</div>
                    <div className="truncate text-xs text-slate-500">{expert.specialization || "General Counsellor"}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => deleteExpert(expert.id, expert.name)}
                  className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100"
                  title={`Delete ${expert.name}`}
                  aria-label={`Delete ${expert.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {experts.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm text-slate-500">
            No experts available. Add one to begin assigning sessions.
          </div>
        )}
      </div>

      {isAddExpertOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Expert</h3>
              <p className="text-sm text-slate-500">Create a new counsellor profile for assignment filtering.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddExpertOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={newExpertName}
              onChange={(event) => setNewExpertName(event.target.value)}
              placeholder="Expert name"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              value={newExpertRole}
              onChange={(event) => setNewExpertRole(event.target.value)}
              placeholder="Specialization"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddExpertOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddExpert}
              className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Save Expert
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">
          Loading bookings…
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pending Requests</h3>
                <p className="text-sm text-slate-500">Review incoming requests and assign appointment times.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {filteredPendingRequests.length}
              </span>
            </div>

            {filteredPendingRequests.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10">
                <CalendarDays className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No pending booking requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPendingRequests.map((request) => {
                  const expert = experts.find((item) => String(item.id) === String(request.expertId));
                  return (
                    <div key={request.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0a1f44] text-sm font-bold text-white">
                            {request.aspirantName?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{request.aspirantName}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>Expert: {expert?.name || "Unassigned"}</span>
                              <span>•</span>
                              <span>Requested: {formatDateLabel(request.date)} at {formatTimeLabel(request.time)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningId(request.id);
                              setPickedTime(request.time || "09:00 AM");
                            }}
                            className="rounded-xl bg-[#0a1f44] px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                          >
                            Assign / Confirm
                          </button>
                        </div>
                      </div>

                      {assigningId === request.id && (
                        <div className="space-y-3 border-t border-slate-100 px-5 pb-4">
                          <p className="pt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Assign appointment time
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TIMES.map((time) => (
                              <button
                                key={time}
                                onClick={() => setPickedTime(time)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${pickedTime === time ? "border-[#f97316] bg-[#f97316] text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                                aria-pressed={pickedTime === time}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => confirmBooking(request.id)}
                              disabled={!pickedTime}
                              className="rounded-xl bg-[#0a1f44] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                            >
                              Confirm at {pickedTime || "-"}
                            </button>
                            <button type="button" onClick={() => setAssigningId(null)} className="rounded-xl px-3 py-2 text-xs text-slate-500">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Confirmed Sessions</h3>
            <div className="space-y-3">
              {confirmedSessions.map((session) => {
                const expert = experts.find((item) => String(item.id) === String(session.expertId));
                return (
                  <div key={session.id} className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        <div>
                          <p className="font-bold text-slate-900">{session.aspirantName}</p>
                          <p className="text-xs text-slate-600">
                            Expert: <span className="font-semibold text-slate-800">{expert?.name || "Unassigned"}</span> | {formatDateLabel(session.date)} - {formatTimeLabel(session.time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(session.id);
                            setEditingDate(session.date);
                            setEditingTime(session.time);
                            const consultancyId = Number(session.id ? bookings.find((item) => item.id === session.id)?.consultancy_id : 0);
                            const expertId = session.expertId || undefined;
                            if (consultancyId && session.date) {
                              void loadAvailabilityForDate(consultancyId, session.date, expertId);
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs"
                        >
                          Update Time/Date
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelBooking(session.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs"
                        >
                          Cancel Booking
                        </button>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Confirmed
                        </span>
                      </div>
                    </div>

                    {editingId === session.id && (
                      <div className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-white p-3">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Update date</p>
                          <div className="flex flex-wrap gap-2">
                            {getNextDates().map((day) => (
                              <button
                                key={day.key}
                                onClick={() => {
                                  setEditingDate(day.key);
                                  const consultancyId = Number(bookings.find((item) => item.id === session.id)?.consultancy_id ?? 0);
                                  if (consultancyId) {
                                    void loadAvailabilityForDate(consultancyId, day.key, session.expertId);
                                  }
                                }}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${editingDate === day.key ? "border-[#0a1f44] bg-[#0a1f44] text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Update time</p>
                          <div className="flex flex-wrap gap-2">
                            {editingSlots.length > 0 ? editingSlots.map((slot) => {
                              const isDisabled = slot.is_booked && slot.time !== editingTime;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  onClick={() => !isDisabled && setEditingTime(slot.time)}
                                  disabled={isDisabled}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${editingTime === slot.time ? "border-[#f97316] bg-[#f97316] text-white" : isDisabled ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700 opacity-70" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                                >
                                  {slot.time}{slot.is_booked ? " • Booked" : ""}
                                </button>
                              );
                            }) : AVAILABLE_TIMES.map((time) => (
                              <button
                                key={time}
                                onClick={() => setEditingTime(time)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${editingTime === time ? "border-[#f97316] bg-[#f97316] text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveUpdate(session.id)}
                            disabled={!editingDate || !editingTime}
                            className="rounded-xl bg-[#0a1f44] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            Save Update
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingDate("");
                              setEditingTime("");
                            }}
                            className="rounded-xl px-3 py-2 text-xs text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
