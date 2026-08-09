import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Loader2, AlertCircle, Mail, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import ConsultancyCard from "./ConsultancyCard";


type Consultancy = {
  id: number;
  username: string;
  email: string;
  office_name: string | null;
  logo_url: string | null;
};

function cleanDisplayName(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) return "";

  const withoutSlug = raw.replace(/_agency$/i, "");
  const normalized = withoutSlug
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  if (!normalized) return "";

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSearchableText(consultancy: Consultancy) {
  const displayName = cleanDisplayName(consultancy.office_name || consultancy.username);
  return [displayName, cleanDisplayName(consultancy.username), consultancy.email, consultancy.office_name || ""]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function ConsultancyBrowseGrid() {
  const [consultancies, setConsultancies] = useState<Consultancy[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
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

        const detail =
          requestError?.response?.data?.detail ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load consultancies right now. Please try again.";

        setError(detail);
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
      const searchableText = getSearchableText(consultancy);
      return searchableText.includes(query);
    });
  }, [consultancies, search]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_12px_36px_-18px_rgba(10,31,68,0.16)]">
        <div className="bg-[#0a1f44] px-5 py-5 text-white">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">Search consultancies</h3>
        </div>
        <div className="space-y-4 bg-white p-5">
          <div className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 shadow-[0_8px_24px_-14px_rgba(10,31,68,.08)]">
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
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-20 text-center gap-4 shadow-[0_12px_36px_-18px_rgba(10,31,68,.22)]">
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
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-20 text-center gap-4 shadow-[0_12px_36px_-18px_rgba(10,31,68,.22)]">
                <AlertCircle className="h-10 w-10 text-red-600" />
                <h3 className="aspirant-serif text-2xl text-[#0a1f44]">
                  Could not load consultancies
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-slate-600">
                  {error}
                </p>
              </div>
            ) : filteredConsultancies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-20 text-center shadow-[0_12px_36px_-18px_rgba(10,31,68,.22)]">
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
                {filteredConsultancies.map((consultancy) => {
                  const displayName = cleanDisplayName(consultancy.office_name || consultancy.username);
                  const fallbackName = displayName || cleanDisplayName(consultancy.username) || "Consultancy";


                  return (
                    <ConsultancyCard
                      key={consultancy.id}
                      title={fallbackName}
                      username={consultancy.username}
                      email={consultancy.email}
                      officeName={consultancy.office_name}
                      logoUrl={consultancy.logo_url}
                      onClick={() => navigate(`/consultancies/${consultancy.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
