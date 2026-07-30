import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Globe2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import LoadingState from "../ui/LoadingState";

type Consultancy = {
  id: number;
  username: string;
  email: string;
  office_name: string | null;
};

type CountryProfile = {
  id: number;
  country: string;
  documents: string;
  instructions: string;
  consultancy_id: number;
  consultancy_name: string;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ConsultancyProfilePage({ consultancyId }: { consultancyId: number }) {
  const navigate = useNavigate();
  const [consultancy, setConsultancy] = useState<Consultancy | null>(null);
  const [countryProfiles, setCountryProfiles] = useState<CountryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const [consultanciesResponse, profilesResponse] = await Promise.all([
          API.get("consultancies/"),
          API.get("country-profiles/"),
          API.post("log-visit/", { consultancy_id: consultancyId }).catch(() => null),
        ]);

        if (!mounted) return;

        const consultancies = Array.isArray(consultanciesResponse.data) ? consultanciesResponse.data : [];
        const selected = consultancies.find((item: Consultancy) => Number(item.id) === Number(consultancyId));
        const profiles = Array.isArray(profilesResponse.data)
          ? profilesResponse.data.filter((profile: CountryProfile) => Number(profile.consultancy_id) === Number(consultancyId))
          : [];

        if (!selected) {
          setError("Consultancy profile not found.");
          setConsultancy(null);
          setCountryProfiles([]);
        } else {
          setConsultancy(selected);
          setCountryProfiles(profiles);
        }
      } catch {
        if (mounted) {
          setError("Unable to load this consultancy profile right now.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [consultancyId]);

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ background: "rgba(240,244,248,0.92)", borderColor: "#dce6f5" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: "#eef2fb", color: "#0d1b3e" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider" style={{ color: "#2563eb" }}>Consultancy Profile</div>
            <div className="font-bold" style={{ color: "#0d1b3e" }}>Visa Guide</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
        {loading ? (
          <LoadingState
            title="Loading consultancy profile"
            message="Fetching profile details and logging the visit."
          />
        ) : error ? (
          <div className="rounded-3xl border bg-white p-10 text-center" style={{ borderColor: "#dce6f5" }}>
            <AlertCircle className="mx-auto h-10 w-10" style={{ color: "#dc2626" }} />
            <h1 className="mt-4 font-bold" style={{ color: "#0d1b3e", fontSize: "1.2rem" }}>{error}</h1>
            <p className="mt-2 text-sm" style={{ color: "#5a6e8a" }}>Please go back and try another consultancy.</p>
          </div>
        ) : (
          <>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)] md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#f97316]">Country guidance</p>
                  <h2 className="mt-2 text-2xl font-medium text-slate-900 sm:text-3xl">
                    {consultancy?.office_name || consultancy?.username || "Consultancy"}
                  </h2>
                </div>
                <div className="rounded-full bg-[#f8fbff] px-3 py-1 text-sm font-semibold text-[#0a1f44]">
                  {countryProfiles.length} published
                </div>
              </div>

              {countryProfiles.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-700">
                  This consultancy has not published any country profiles yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {countryProfiles.map((profile) => {
                    const countryRoute = `/consultancies/${consultancyId}/countries/${encodeURIComponent(slugify(profile.country))}`;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          navigate(countryRoute);
                        }}
                        className="group rounded-[1.5rem] border border-slate-200 bg-[#f8fbff] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#f97316] hover:bg-[#fff8f1] hover:shadow-[0_20px_45px_-20px_rgba(10,31,68,.35)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#f97316] shadow-sm transition group-hover:scale-105">
                            <Globe2 className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-[#0a1f44]">{profile.country}</h3>
                            <p className="text-sm text-slate-600">View visa details and instructions</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end text-[11px] font-bold uppercase tracking-[.16em] text-[#0a1f44] transition-all group-hover:text-[#f97316]">
                          Open details
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}