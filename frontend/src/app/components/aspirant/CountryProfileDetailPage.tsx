import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Globe2, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";

type CountryProfile = {
  id: number;
  country: string;
  documents: string;
  instructions: string;
  consultancy_id: number;
  consultancy_name: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CountryProfileDetailPage({ consultancyId, countrySlug }: { consultancyId: number; countrySlug: string }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await API.get("country-profiles/");
        if (!mounted) return;

        const items = Array.isArray(response.data) ? response.data : [];
        const matched = items.find((item: CountryProfile) => {
          if (Number(item.consultancy_id) !== Number(consultancyId)) return false;
          return slugify(item.country) === slugify(countrySlug);
        });

        setProfile(matched ?? null);
      } catch {
        if (mounted) setError("Unable to load this country profile right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [consultancyId, countrySlug]);

  const sections = useMemo(() => {
    if (!profile) return [] as Array<{ title: string; body: string }>;
    return [
      { title: "Documents Required", body: profile.documents || "No documents required were provided." },
      { title: "Application Instructions", body: profile.instructions || "No application instructions were provided." },
    ];
  }, [profile]);

  return (
    <div className="min-h-screen" style={{ background: "#f3f7fb" }}>
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0a1f44] transition hover:border-[#f97316] hover:text-[#f97316]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#f97316]">Country details</p>
            <p className="text-sm font-semibold text-[#0a1f44]">Visa Guide</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)]">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#f97316]" />
            <h1 className="mt-4 font-serif text-2xl font-medium text-slate-900">Loading country guidance</h1>
            <p className="mt-2 text-sm text-slate-600">Fetching the latest documents and instructions for this profile.</p>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)]">
            <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
            <h1 className="mt-4 text-2xl font-semibold text-[#0a1f44]">Could not load this page</h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>
        ) : !profile ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)]">
            <Globe2 className="mx-auto h-10 w-10 text-[#f97316]" />
            <h1 className="mt-4 text-2xl font-semibold text-[#0a1f44]">No matching country profile found</h1>
            <p className="mt-2 text-sm text-slate-600">This consultancy has not published guidance for this country yet.</p>
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)]">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a1f44] px-6 py-6 md:px-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-slate-300">Visa guidance</p>
                  <h1 className="mt-1 text-3xl font-semibold text-white">{profile.country}</h1>
                  <p className="mt-2 text-sm text-slate-300">Offered by {profile.consultancy_name}</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f97316] text-white">
                  <Globe2 className="h-6 w-6" />
                </div>
              </div>

            </section>

            <section className="mt-6 flex flex-col gap-6">
              {sections.map((section) => (
                <article key={section.title} className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)]">
                  <h2 className="text-xl font-semibold text-[#0a1f44]">{section.title}</h2>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{section.body}</p>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
