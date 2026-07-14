import { useEffect, useState } from "react";
import { Globe, Plus, X, ChevronDown, ChevronUp, Trash2, Check } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";
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
  expanded: boolean;
}

export default function OnboardingWizard() {
  const [profiles, setProfiles] = useState<CountryProfile[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    API.get("country-profiles/").then((response) => {
      const saved = Array.isArray(response.data) ? response.data : [];
      setProfiles(saved.map((profile: Omit<CountryProfile, "id" | "expanded"> & { id?: number }) => ({
        id: profile.country,
        country: profile.country,
        documents: profile.documents || "",
        instructions: profile.instructions || "",
        expanded: false,
      })));
    }).catch(() => null);
  }, []);

  const selected = profiles.map((p) => p.country);
  const filtered = COUNTRY_OPTIONS.filter(
    (c) => !selected.includes(c) && c.toLowerCase().includes(search.toLowerCase())
  );

  function addCountry(country: string) {
    setProfiles((prev) => [
      ...prev,
      { id: country, country, documents: "", instructions: "", expanded: true },
    ]);
    setShowDropdown(false);
    setSearch("");
  }

  function removeCountry(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  function updateField(id: string, field: "documents" | "instructions", value: string) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function toggleExpand(id: string) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, expanded: !p.expanded } : p)));
  }

  async function saveProfiles() {
    setSaving(true);
    setSaveMessage("");
    try {
      await API.put("country-profiles/", { profiles: profiles.map(({ country, documents, instructions }) => ({ country, documents, instructions })) });
      setSaveMessage("Country profiles saved.");
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.detail || "Unable to save country profiles.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Country selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold block" style={{ color: DARK }}>
          Countries Offered
        </label>

        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all"
            style={{
              background: "#fff",
              border: `1.5px solid ${showDropdown ? ACCENT : "#dce6f5"}`,
              color: DARK,
            }}
            aria-haspopup="listbox"
            aria-expanded={showDropdown}
          >
            <span style={{ color: selected.length ? DARK : "#9ca3af" }}>
              {selected.length
                ? `${selected.length} countr${selected.length === 1 ? "y" : "ies"} selected`
                : "Select countries you offer visa services for…"}
            </span>
            {showDropdown ? (
              <ChevronUp className="w-4 h-4" style={{ color: "#5a6e8a" }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: "#5a6e8a" }} />
            )}
          </button>

          {showDropdown && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl z-20 overflow-hidden"
              style={{ background: "#fff", border: "1.5px solid #dce6f5" }}
              role="listbox"
            >
              <div className="p-2" style={{ borderBottom: "1px solid #dce6f5" }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search countries…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "#f5f7fb", color: DARK }}
                  aria-label="Search countries"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "#5a6e8a" }}>
                    No countries found
                  </p>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c}
                      role="option"
                      aria-selected={false}
                      onClick={() => addCountry(c)}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
                      style={{ color: DARK }}
                    >
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#5a6e8a" }} />
                      {c}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#eef2fb", color: DARK }}
              >
                {c}
                <button
                  onClick={() => removeCountry(c)}
                  aria-label={`Remove ${c}`}
                  className="hover:opacity-60 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Per-country accordion forms */}
      {profiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: DARK }}>Country Details</h3>

          {profiles.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1.5px solid #dce6f5", background: "#fff" }}
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleExpand(p.id)}
                className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
                aria-expanded={p.expanded}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#eef2fb" }}
                  >
                    <Globe className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: DARK }}>{p.country}</span>
                  {(p.documents || p.instructions) && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#f0fdf4", color: "#059669" }}
                    >
                      Filled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCountry(p.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                    style={{ color: "#9ca3af" }}
                    aria-label={`Remove ${p.country}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {p.expanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: "#5a6e8a" }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: "#5a6e8a" }} />
                  )}
                </div>
              </button>

              {/* Accordion body — two-column text areas */}
              {p.expanded && (
                <div
                  className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4"
                  style={{ borderTop: "1px solid #dce6f5" }}
                >
                  <div className="space-y-2 pt-4">
                    <label
                      htmlFor={`docs-${p.id}`}
                      className="text-xs font-semibold uppercase tracking-wider block"
                      style={{ color: "#5a6e8a" }}
                    >
                      Documents Required
                    </label>
                    <textarea
                      id={`docs-${p.id}`}
                      value={p.documents}
                      onChange={(e) => updateField(p.id, "documents", e.target.value)}
                      placeholder={`List the documents required for a ${p.country} visa…\n• Valid passport\n• Bank statements\n• Employment letter`}
                      rows={6}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                      style={{ background: "#f5f7fb", border: "1.5px solid #dce6f5", color: DARK }}
                      onFocus={(e) => {
                        e.target.style.borderColor = ACCENT;
                        e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#dce6f5";
                        e.target.style.boxShadow = "none";
                      }}
                      aria-label={`Documents required for ${p.country}`}
                    />
                  </div>

                  <div className="space-y-2 pt-4">
                    <label
                      htmlFor={`instructions-${p.id}`}
                      className="text-xs font-semibold uppercase tracking-wider block"
                      style={{ color: "#5a6e8a" }}
                    >
                      Application Instructions
                    </label>
                    <textarea
                      id={`instructions-${p.id}`}
                      value={p.instructions}
                      onChange={(e) => updateField(p.id, "instructions", e.target.value)}
                      placeholder={`Step-by-step application guidance for ${p.country}…\n1. Complete the online form at…\n2. Book a biometrics appointment\n3. Submit documents at the visa centre`}
                      rows={6}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                      style={{ background: "#f5f7fb", border: "1.5px solid #dce6f5", color: DARK }}
                      onFocus={(e) => {
                        e.target.style.borderColor = ACCENT;
                        e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#dce6f5";
                        e.target.style.boxShadow = "none";
                      }}
                      aria-label={`Application instructions for ${p.country}`}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setShowDropdown(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "#eef2fb", color: DARK }}
        >
          <Plus className="w-4 h-4" />
          Add Another Country
        </button>

        {profiles.length > 0 && (
          <button
          onClick={saveProfiles}
          disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: DARK, color: "#fff" }}
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving…" : "Save Profiles"}
          </button>
        )}
      </div>

      {saveMessage && <p className="text-sm" style={{ color: saveMessage.includes("saved") ? "#059669" : "#dc2626" }}>{saveMessage}</p>}

      {/* Empty nudge */}
      {profiles.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#fff", border: "1.5px dashed #dce6f5" }}
        >
          <Globe className="w-10 h-10 mb-4" style={{ color: "#c7d8f0" }} />
          <p className="font-semibold text-sm" style={{ color: DARK }}>No countries added yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: "#5a6e8a" }}>
            Select the countries you offer visa services for to get started.
          </p>
          <button
            onClick={() => setShowDropdown(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: DARK, color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            Add First Country
          </button>
        </div>
      )}
    </div>
  );
}
