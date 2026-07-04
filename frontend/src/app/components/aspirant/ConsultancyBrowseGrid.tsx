import { useEffect, useMemo, useState } from "react";
import { Building2, Search, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";
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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
            <Loader2 className="w-9 h-9 animate-spin" style={{ color: ACCENT }} />
            <div>
              <h3 className="font-bold mb-2" style={{ color: DARK, fontSize: "1.1rem" }}>
                Loading Consultancies
              </h3>
              <p style={{ color: "#5a6e8a", fontSize: "0.875rem", lineHeight: 1.7 }}>
                Fetching the latest consultancy accounts from the server.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
            <AlertCircle className="w-10 h-10" style={{ color: "#dc2626" }} />
            <h3 className="font-bold" style={{ color: DARK, fontSize: "1.1rem" }}>
              Could not load consultancies
            </h3>
            <p className="max-w-md" style={{ color: "#5a6e8a", fontSize: "0.875rem", lineHeight: 1.7 }}>
              {error}
            </p>
          </div>
        ) : filteredConsultancies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "#eef2fb" }}
            >
              <Building2 className="w-9 h-9" style={{ color: ACCENT }} />
            </div>

            <h3 className="font-bold mb-2" style={{ color: DARK, fontSize: "1.1rem" }}>
              No Consultancies Found
            </h3>
            <p className="max-w-sm" style={{ color: "#5a6e8a", fontSize: "0.875rem", lineHeight: 1.7 }}>
              {search
                ? "Try a different search term."
                : "Consultancies will appear here as soon as they register."}
            </p>

            {!search && (
              <p
                className="mt-6 text-xs px-4 py-2 rounded-full"
                style={{ background: "#eef2fb", color: ACCENT }}
              >
                Consultancies are now loaded directly from the live account records.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 md:p-6">
            {filteredConsultancies.map((consultancy) => (
              <button
                key={consultancy.id}
                type="button"
                onClick={() => {
                  window.location.href = `/consultancies/${consultancy.id}`;
                }}
                className="rounded-2xl p-4 md:p-5 border transition-all hover:shadow-sm text-left"
                style={{ background: "#fafdff", borderColor: "#dce6f5", cursor: "pointer" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#eef2fb" }}
                  >
                    <Building2 className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate" style={{ color: DARK, fontSize: "1rem" }}>
                      {consultancy.office_name || consultancy.username}
                    </h3>
                    <p className="text-sm truncate" style={{ color: "#5a6e8a" }}>
                      @{consultancy.username}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-sm" style={{ color: "#334155" }}>
                    <span className="font-semibold">Email:</span> {consultancy.email}
                  </div>
                  <div className="text-sm" style={{ color: "#334155" }}>
                    <span className="font-semibold">Office:</span> {consultancy.office_name || "Not provided"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
