import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Globe2, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BrowseView } from "../ui/theme";
import API from "../../../api";
import LoadingState from "../ui/LoadingState";

type CountryProfile = { id: number; country: string; documents: string; instructions: string; consultancy_id: number; consultancy_name: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function BrowseToggle({ view, onChange }: { view: BrowseView; onChange: (view: BrowseView) => void }) {
  const tabs = [{ value: "consultancies" as const, label: "By Consultancy", icon: Building2 }, { value: "countries" as const, label: "By Country", icon: Globe2 }];
  return <div className="inline-flex gap-1 rounded-[16px] border border-slate-200 bg-white/90 p-1.5 shadow-[0_8px_24px_-14px_rgba(10,31,68,.16)]" role="tablist">
    {tabs.map((tab) => { const Icon = tab.icon; const active = view === tab.value; return <button key={tab.value} onClick={() => onChange(tab.value)} className={`inline-flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-bold uppercase tracking-[.14em] transition-all duration-200 sm:px-6 ${active ? "bg-[linear-gradient(135deg,#0a1f44_0%,#2563eb_100%)] text-white shadow-[0_8px_18px_-10px_rgba(10,31,68,0.35)]" : "text-slate-600 hover:bg-slate-50 hover:text-[#0a1f44]"}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}
  </div>;
}

export default function CountryBrowseGrid() {
  const [profiles, setProfiles] = useState<CountryProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("country-profiles/")
      .then((response) => setProfiles(Array.isArray(response.data) ? response.data : []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((profile) => {
      const countryName = (profile.country || "").toLowerCase();
      const consultancyName = (profile.consultancy_name || "").toLowerCase();
      return countryName.includes(query) || consultancyName.includes(query);
    });
  }, [profiles, search]);

  if (loading) return <LoadingState title="Loading countries" message="Fetching the latest country guidance from the dashboard." />;
  if (!profiles.length) return <div className="flex min-h-80 flex-col items-center justify-center border border-slate-200 bg-white px-6 text-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-[#f97316]"><MapPin className="h-8 w-8" /></span><h3 className="aspirant-serif mt-5 text-2xl text-[#0a1f44]">No countries currently available</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">Country guides will appear here when a consultancy adds its offered countries and visa information.</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border border-slate-200 bg-white px-5 py-4 shadow-[0_4px_20px_-8px_rgba(10,31,68,.12)]">
        <Search className="h-5 w-5 shrink-0 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search countries…"
          className="flex-1 bg-transparent text-sm text-[#0a1f44] outline-none"
          aria-label="Search countries"
        />
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center border border-slate-200 bg-white px-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-[#f97316]"><MapPin className="h-8 w-8" /></span>
          <h3 className="aspirant-serif mt-5 text-2xl text-[#0a1f44]">No matching countries</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">Try a different country name to narrow the list.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProfiles.map((profile) => {
        const countryRoute = `/consultancies/${profile.consultancy_id}/countries/${encodeURIComponent(slugify(profile.country))}`;

        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => {
              navigate(countryRoute);
            }}
            className="group rounded-[20px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 text-left shadow-[0_12px_32px_-18px_rgba(10,31,68,0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-slate-300 hover:shadow-[0_20px_42px_-18px_rgba(10,31,68,0.34)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef4ff] text-[#0a1f44] transition group-hover:bg-[#0a1f44] group-hover:text-white">
              <Globe2 className="h-6 w-6" />
            </span>
            <h3 className="aspirant-serif mt-5 text-2xl text-[#0a1f44]">{profile.country}</h3>
            <p className="mt-1 text-sm text-slate-600">Offered by {profile.consultancy_name}</p>
            <p className="mt-5 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-700">
              Open the full country guidance page for documents, instructions, and next steps.
            </p>
            <div className="mt-6 flex items-center justify-end text-[11px] font-bold uppercase tracking-[.16em] text-[#0a1f44] transition-all group-hover:text-[#2563eb]">
              Open guidance
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </button>
        );
      })}
        </div>
      )}
    </div>
  );
}
