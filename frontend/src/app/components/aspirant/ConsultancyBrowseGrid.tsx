import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Loader2, AlertCircle, ArrowRight, Mail, MapPin } from "lucide-react";
import API from "../../../api";

type Consultancy = {
  id: number;
  username: string;
  email: string;
  office_name: string | null;
};

export default function ConsultancyBrowseGrid() {
  const [consultancies, setConsultancies] = useState<Consultancy[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadConsultancies() {
      setLoading(true);
      setError("");

      try {
        const response = await API.get("consultancies/");
        if (!mounted) return;

        const items = Array.isArray(response.data) ? response.data : [];
        setConsultancies(items);
      } catch (requestError: any) {
        if (!mounted) return;
        setError(
          requestError?.response?.data?.detail ||
            "Unable to load consultancies right now. Please try again."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConsultancies();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredConsultancies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return consultancies;

    return consultancies.filter((consultancy) => {
      const officeName = consultancy.office_name || "";
      return (
        consultancy.username.toLowerCase().includes(query) ||
        consultancy.email.toLowerCase().includes(query) ||
        officeName.toLowerCase().includes(query)
      );
    });
  }, [consultancies, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border border-slate-200 bg-white px-5 py-4 shadow-[0_4px_20px_-8px_rgba(10,31,68,.12)]">
        <Search className="h-5 w-5 shrink-0 text-slate-500" />
        <input
          placeholder="Search consultancies…"
          className="flex-1 bg-transparent text-sm text-[#0a1f44] outline-none"
          aria-label="Search consultancies"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center border border-slate-200 bg-white px-6 py-20 text-center gap-4">
            <Loader2 className="h-9 w-9 animate-spin text-[#f97316]" />
            <div>
              <h3 className="aspirant-serif mb-2 text-2xl text-[#0a1f44]">
                Loading Consultancies
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Fetching the latest consultancy accounts from the server.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center border border-slate-200 bg-white px-6 py-20 text-center gap-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <h3 className="aspirant-serif text-2xl text-[#0a1f44]">
              Could not load consultancies
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-slate-600">
              {error}
            </p>
          </div>
        ) : filteredConsultancies.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-slate-200 bg-white px-6 py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Building2 className="h-9 w-9 text-[#f97316]" />
            </div>

            <h3 className="aspirant-serif mb-2 text-2xl text-[#0a1f44]">
              No Consultancies Found
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              {search
                ? "Try a different search term."
                : "Consultancies will appear here as soon as they register."}
            </p>

            {!search && (
              <p className="mt-6 border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                Consultancies are now loaded directly from the live account records.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredConsultancies.map((consultancy) => (
              <button
                key={consultancy.id}
                type="button"
                onClick={() => {
                  window.location.href = `/consultancies/${consultancy.id}`;
                }}
                className="group overflow-hidden border border-slate-200 bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#0a1f44] hover:shadow-[0_20px_50px_-20px_rgba(10,31,68,.35)]"
              >
                <div className="bg-gradient-to-br from-[#071735] to-[#17366a] p-6 text-white">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="aspirant-serif text-2xl leading-tight">{consultancy.office_name || consultancy.username}</h3><p className="mt-1 text-sm text-white/75">@{consultancy.username}</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#f97316]"><Building2 className="h-5 w-5" /></span></div>
                </div>
                <div className="p-6"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Consultancy profile</p><div className="mt-4 space-y-3 text-sm text-slate-600"><p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-[#0a1f44]" />{consultancy.email}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#0a1f44]" />{consultancy.office_name || "Office details not provided"}</p></div><div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-4 text-[11px] font-bold uppercase tracking-widest text-[#0a1f44] transition-all group-hover:text-[#f97316]">View profile <ArrowRight className="ml-1 h-4 w-4" /></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
