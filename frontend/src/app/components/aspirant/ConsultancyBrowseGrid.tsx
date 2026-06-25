import { Building2, Search, ChevronDown } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";

// Standalone consultancy browse grid — shown when the browse toggle is on "consultancies".
// Currently renders the empty state matching the MVP spec.

export default function ConsultancyBrowseGrid() {
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: "#fff", border: "1.5px solid #dce6f5" }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#5a6e8a" }} />
        <input
          placeholder="Search consultancies…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: DARK }}
          aria-label="Search consultancies"
        />
        <button
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "#eef2fb", color: "#5a6e8a" }}
        >
          Filters <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #dce6f5" }}
      >
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "#eef2fb" }}
          >
            <Building2 className="w-9 h-9" style={{ color: ACCENT }} />
          </div>

          <h3 className="font-bold mb-2" style={{ color: DARK, fontSize: "1.1rem" }}>
            No Consultancies Yet
          </h3>
          <p className="max-w-sm" style={{ color: "#5a6e8a", fontSize: "0.875rem", lineHeight: 1.7 }}>
            Content will appear once consultancies update their profiles.
          </p>

          <div className="flex gap-3 mt-8 flex-wrap justify-center">
            {[1, 0.7, 0.4].map((opacity, i) => (
              <div
                key={i}
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
            ))}
          </div>

          <p
            className="mt-6 text-xs px-4 py-2 rounded-full"
            style={{ background: "#eef2fb", color: ACCENT }}
          >
            Check back soon — we&apos;re onboarding consultancies now.
          </p>
        </div>
      </div>
    </div>
  );
}
