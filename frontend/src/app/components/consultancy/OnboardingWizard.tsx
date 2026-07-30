import { useEffect, useState } from "react";
import { ArrowRight, Globe2, Loader2, Plus, Trash2 } from "lucide-react";
import { ACCENT } from "../ui/theme";
import API from "../../../api";

const COUNTRY_OPTIONS = [
  "Canada", "United Kingdom", "Germany", "Australia", "France",
  "Netherlands", "Sweden", "Japan", "United States", "New Zealand",
  "Portugal", "Ireland", "Singapore", "UAE",
];

interface CountryProfile {
  id: string;
  country: string;
  documents: string;
  instructions: string;
}

type ViewMode = "grid" | "edit";

export default function OnboardingWizard() {
  const [profiles, setProfiles] = useState<CountryProfile[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [draft, setDraft] = useState<CountryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    void loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      // When in the consultancy dashboard, request owner-only profiles to avoid returning global list
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("authUser") : null;
      let ownerOnlyParam = "";
      if (raw) {
        try {
          const u = JSON.parse(raw);
          if (u && u.role === "consultancy") ownerOnlyParam = "?owner_only=true";
        } catch {}
      }
      const response = await API.get(`country-profiles/${ownerOnlyParam}`);
      const saved = Array.isArray(response.data) ? response.data : [];
      setProfiles(saved.map((profile: { id: number | string; country: string; documents?: string; instructions?: string }) => ({
        id: String(profile.id),
        country: profile.country,
        documents: profile.documents || "",
        instructions: profile.instructions || "",
      })));
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  function startAddCountry() {
    setDraft({ id: `new-${Date.now()}`, country: "", documents: "", instructions: "" });
    setSaveMessage("");
    setView("edit");
  }

  function startEditCountry(profile: CountryProfile) {
    setDraft({ ...profile });
    setSaveMessage("");
    setView("edit");
  }

  function updateDraft(field: "country" | "documents" | "instructions", value: string) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function saveProfiles() {
    if (!draft) return;

    const trimmedCountry = draft.country.trim();
    if (!trimmedCountry) {
      setSaveMessage("Please select a country before saving.");
      return;
    }

    const nextProfile: CountryProfile = {
      id: draft.id || trimmedCountry.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      country: trimmedCountry,
      documents: draft.documents,
      instructions: draft.instructions,
    };

    const nextProfiles = [
      ...profiles.filter((profile) => profile.id !== draft.id),
      nextProfile,
    ].sort((a, b) => a.country.localeCompare(b.country));

    setSaving(true);
    setSaveMessage("");

    try {
      await API.put("country-profiles/", {
        profiles: nextProfiles.map(({ country, documents, instructions }) => ({ country, documents, instructions })),
      });
      setProfiles(nextProfiles);
      setSaveMessage("Country profiles saved.");
      setView("grid");
      setDraft(null);
      await loadProfiles();
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.detail || "Unable to save country profiles.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile(profileId: string) {
    const confirmed = window.confirm("Delete this country guidance? This cannot be undone.");
    if (!confirmed) return;

    try {
      await API.delete(`country-profiles/${profileId}/`);
      setProfiles((current) => current.filter((profile) => profile.id !== profileId));
      setSaveMessage("Country profile deleted.");
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.detail || "Unable to delete country profile.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  if (view === "edit" && draft) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(10,31,68,.2)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#f97316]">Country profile editor</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#0a1f44]">
              {draft.country || "New country profile"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setView("grid");
              setDraft(null);
              setSaveMessage("");
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#f97316] hover:text-[#f97316]"
          >
            Back to countries
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <label className="block text-sm font-semibold text-slate-700">
            Country
            <select
              value={draft.country}
              onChange={(event) => updateDraft("country", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#f97316]"
            >
              <option value="">Select a country</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-[#0a1f44]">Profile status</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.documents.trim() || draft.instructions.trim() ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {draft.documents.trim() || draft.instructions.trim() ? "Filled" : "Incomplete"}
              </span>
              <span className="text-sm text-slate-600">This profile will be saved to the consultancy dashboard.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="block text-sm font-semibold text-slate-700">
            Documents Required
            <textarea
              value={draft.documents}
              onChange={(event) => updateDraft("documents", event.target.value)}
              rows={5}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-[#f97316]"
              placeholder="List the documents required for this country"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Application Instructions
            <textarea
              value={draft.instructions}
              onChange={(event) => updateDraft("instructions", event.target.value)}
              rows={5}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-[#f97316]"
              placeholder="Write clear application instructions"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{saveMessage}</p>
          <button
            type="button"
            onClick={() => {
              void saveProfiles();
            }}
            disabled={saving || !draft.country.trim()}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
            style={{ background: saving ? "#cbd5e1" : ACCENT }}
          >
            {saving ? "Saving..." : "Save Profiles"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0a1f44]">Your offered countries</p>
          <p className="text-sm text-slate-600">Click any card to edit the documents and guidance for that country.</p>
        </div>
        <p className="text-sm text-slate-500">{profiles.length} profile{profiles.length === 1 ? "" : "s"} available</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => {
          const isFilled = Boolean(profile.documents.trim() || profile.instructions.trim());
          return (
            <div
              key={profile.id}
              className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_8px_30px_-12px_rgba(10,31,68,.2)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_35px_-10px_rgba(10,31,68,.25)]"
            >
              <button
                type="button"
                onClick={() => startEditCountry(profile)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between bg-[#0a1f44] px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-slate-300">Country profile</p>
                    <h3 className="mt-1 truncate text-xl font-medium text-white">{profile.country}</h3>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f97316] text-white">
                    <Globe2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-5">
                  <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isFilled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {isFilled ? "Filled" : "Incomplete"}
                  </span>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {profile.documents.trim() || profile.instructions.trim()
                      ? "Update the documents and guidance for this country."
                      : "Add the required documents and instructions for this country."}
                  </p>
                  <div className="mt-5 flex items-center justify-end">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#f97316]">
                      View/Edit Profile
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={() => void deleteProfile(profile.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={startAddCountry}
          className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[#f97316]/50 bg-[#fff7ed] p-6 text-center shadow-[0_8px_30px_-12px_rgba(10,31,68,.2)] transition-all hover:-translate-y-1 hover:border-[#f97316]"
        >
          <div className="w-full">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f97316] text-white">
              <Plus className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-[#0a1f44]">Add Country</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Create a new country profile and fill in the visa guidance for your consultancy.</p>
          </div>
        </button>
      </div>

      {saveMessage && <p className="text-sm text-slate-600">{saveMessage}</p>}
    </div>
  );
}