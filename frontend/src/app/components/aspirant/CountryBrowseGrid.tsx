import { useEffect, useState } from "react";
import { Building2, Globe2, Loader2, MapPin } from "lucide-react";
import type { BrowseView } from "../ui/theme";
import API from "../../../api";

type CountryProfile = { id: number; country: string; documents: string; instructions: string; consultancy_name: string };

export function BrowseToggle({ view, onChange }: { view: BrowseView; onChange: (view: BrowseView) => void }) {
  const tabs = [{ value: "consultancies" as const, label: "By Consultancy", icon: Building2 }, { value: "countries" as const, label: "By Country", icon: Globe2 }];
  return <div className="inline-flex gap-1 border border-slate-200 bg-white p-1.5 shadow-[0_4px_20px_-8px_rgba(10,31,68,.12)]" role="tablist">
    {tabs.map((tab) => { const Icon = tab.icon; const active = view === tab.value; return <button key={tab.value} onClick={() => onChange(tab.value)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-[.14em] transition-colors sm:px-6 ${active ? "bg-[#0a1f44] text-white" : "text-slate-600 hover:text-[#0a1f44]"}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}
  </div>;
}

export default function CountryBrowseGrid() {
  const [profiles, setProfiles] = useState<CountryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { API.get("country-profiles/").then((response) => setProfiles(Array.isArray(response.data) ? response.data : [])).catch(() => setProfiles([])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex min-h-72 items-center justify-center border border-slate-200 bg-white"><Loader2 className="h-8 w-8 animate-spin text-[#f97316]" /></div>;
  if (!profiles.length) return <div className="flex min-h-80 flex-col items-center justify-center border border-slate-200 bg-white px-6 text-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-[#f97316]"><MapPin className="h-8 w-8" /></span><h3 className="aspirant-serif mt-5 text-2xl text-[#0a1f44]">No countries currently available</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">Country guides will appear here when a consultancy adds its offered countries and visa information.</p></div>;
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{profiles.map((profile) => <article key={profile.id} className="border border-slate-200 bg-white p-6"><span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-[#f97316]"><Globe2 className="h-6 w-6" /></span><h3 className="aspirant-serif mt-5 text-2xl text-[#0a1f44]">{profile.country}</h3><p className="mt-1 text-sm text-slate-600">Offered by {profile.consultancy_name}</p>{profile.documents && <p className="mt-5 whitespace-pre-line border-t border-slate-200 pt-4 text-sm text-slate-700"><strong className="text-[#0a1f44]">Documents</strong><br />{profile.documents}</p>}{profile.instructions && <p className="mt-4 whitespace-pre-line text-sm text-slate-700"><strong className="text-[#0a1f44]">Instructions</strong><br />{profile.instructions}</p>}</article>)}</div>;
}
