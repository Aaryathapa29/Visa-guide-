import { MapPin, Building2, Search, ChevronDown } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";
import type { BrowseView } from "../ui/theme";

export function BrowseToggle({
  view,
  onChange,
}: {
  view: BrowseView;
  onChange: (v: BrowseView) => void;
}) {
  const tabs = [
    { value: "countries" as const, label: "Browse by Countries", icon: <MapPin className="w-3.5 h-3.5" /> },
    { value: "consultancies" as const, label: "Browse by Consultancies", icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="inline-flex rounded-xl p-1 gap-1"
      style={{ background: "#eef2fb" }}
      role="tablist"
      aria-label="Browse view"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={view === tab.value}
          onClick={() => onChange(tab.value)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
          style={{
            background: view === tab.value ? DARK : "transparent",
            color: view === tab.value ? "#fff" : "#5a6e8a",
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function PlaceholderCard({ opacity }: { opacity: number }) {
  return (
    <div
      className="w-44 rounded-2xl p-4 space-y-3"
      style={{ background: "#f5f7fb", border: "1.5px dashed #dce6f5", opacity }}
    >
      <div className="w-8 h-8 rounded-lg" style={{ background: "#dce6f5" }} />
      <div className="space-y-1.5">
        <div className="h-2.5 rounded-full w-3/4" style={{ background: "#dce6f5" }} />
        <div className="h-2 rounded-full w-1/2" style={{ background: "#e8edf5" }} />
      </div>
      <div className="h-6 rounded-lg" style={{ background: "#e8edf5" }} />
    </div>
  );
}

function EmptyState({ view }: { view: BrowseView }) {
  const isConsultancies = view === "consultancies";
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "#eef2fb" }}
      >
        {isConsultancies ? (
          <Building2 className="w-9 h-9" style={{ color: ACCENT }} />
        ) : (
          <MapPin className="w-9 h-9" style={{ color: ACCENT }} />
        )}
      </div>

      <h3 className="font-bold mb-2" style={{ color: DARK, fontSize: "1.1rem" }}>
        {isConsultancies ? "No Consultancies Yet" : "Countries Coming Soon"}
      </h3>
      <p className="max-w-sm" style={{ color: "#5a6e8a", fontSize: "0.875rem", lineHeight: 1.7 }}>
        {isConsultancies
          ? "Content will appear once consultancies update their profiles."
          : "Visa destination guides will appear once consultancies add their country offerings."}
      </p>

      <div className="flex gap-3 mt-8 flex-wrap justify-center">
        {[1, 0.7, 0.4].map((opacity, i) => (
          <PlaceholderCard key={i} opacity={opacity} />
        ))}
      </div>

      <p
        className="mt-6 text-xs px-4 py-2 rounded-full"
        style={{ background: "#eef2fb", color: ACCENT }}
      >
        Check back soon — we&apos;re onboarding consultancies now.
      </p>
    </div>
  );
}

export default function CountryBrowseGrid({ view }: { view: BrowseView }) {
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: "#fff", border: "1.5px solid #dce6f5" }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#5a6e8a" }} />
        <input
          placeholder={view === "countries" ? "Search countries…" : "Search consultancies…"}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: DARK }}
          aria-label="Search"
        />
        <button
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "#eef2fb", color: "#5a6e8a" }}
        >
          Filters <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Content area */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #dce6f5" }}
      >
        <EmptyState view={view} />
      </div>
    </div>
  );
}
