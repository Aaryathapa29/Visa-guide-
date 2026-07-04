import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Mail, Info, Loader2, AlertCircle } from "lucide-react";
import API from "../../../api";

type Consultancy = {
  id: number;
  username: string;
  email: string;
  office_name: string | null;
};

export default function ConsultancyProfilePage({ consultancyId }: { consultancyId: number }) {
  const [consultancy, setConsultancy] = useState<Consultancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const [consultanciesResponse] = await Promise.all([
          API.get("consultancies/"),
          API.post("log-visit/", { consultancy_id: consultancyId }).catch(() => null),
        ]);

        if (!mounted) return;

        const consultancies = Array.isArray(consultanciesResponse.data) ? consultanciesResponse.data : [];
        const selected = consultancies.find((item: Consultancy) => Number(item.id) === Number(consultancyId));

        if (!selected) {
          setError("Consultancy profile not found.");
          setConsultancy(null);
        } else {
          setConsultancy(selected);
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

  const hasEmptyProfile = useMemo(() => {
    if (!consultancy) return true;
    return !consultancy.office_name?.trim();
  }, [consultancy]);

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <header className="sticky top-0 z-20 backdrop-blur border-b" style={{ background: "rgba(240,244,248,0.92)", borderColor: "#dce6f5" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: "#eef2fb", color: "#0d1b3e" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider" style={{ color: "#2563eb" }}>Consultancy Profile</div>
            <div className="font-bold" style={{ color: "#0d1b3e" }}>Visa Guide</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {loading ? (
          <div className="rounded-3xl bg-white border p-10 text-center" style={{ borderColor: "#dce6f5" }}>
            <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: "#2563eb" }} />
            <h1 className="font-bold mt-4" style={{ color: "#0d1b3e", fontSize: "1.2rem" }}>Loading consultancy profile</h1>
            <p className="mt-2 text-sm" style={{ color: "#5a6e8a" }}>Fetching profile details and logging the visit.</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white border p-10 text-center" style={{ borderColor: "#dce6f5" }}>
            <AlertCircle className="w-10 h-10 mx-auto" style={{ color: "#dc2626" }} />
            <h1 className="font-bold mt-4" style={{ color: "#0d1b3e", fontSize: "1.2rem" }}>{error}</h1>
            <p className="mt-2 text-sm" style={{ color: "#5a6e8a" }}>Please go back and try another consultancy.</p>
          </div>
        ) : (
          <>
            <section className="rounded-3xl bg-white border p-6 md:p-8 space-y-6" style={{ borderColor: "#dce6f5" }}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#eef2fb" }}>
                  <Building2 className="w-7 h-7" style={{ color: "#2563eb" }} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold truncate" style={{ color: "#0d1b3e", fontSize: "1.5rem" }}>
                    {consultancy?.office_name || consultancy?.username || "Consultancy Profile"}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "#5a6e8a" }}>
                    Public consultancy profile details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-4" style={{ background: "#fafdff", border: "1px solid #dce6f5" }}>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#2563eb" }}>Office Name</div>
                  <div className="font-semibold" style={{ color: "#0d1b3e" }}>
                    {consultancy?.office_name || "Not provided yet"}
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "#fafdff", border: "1px solid #dce6f5" }}>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#2563eb" }}>Username</div>
                  <div className="font-semibold" style={{ color: "#0d1b3e" }}>{consultancy?.username}</div>
                </div>
                <div className="rounded-2xl p-4 md:col-span-2" style={{ background: "#fafdff", border: "1px solid #dce6f5" }}>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#2563eb" }}>Email</div>
                  <div className="inline-flex items-center gap-2 font-semibold" style={{ color: "#0d1b3e" }}>
                    <Mail className="w-4 h-4" style={{ color: "#5a6e8a" }} />
                    {consultancy?.email}
                  </div>
                </div>
              </div>

              {hasEmptyProfile && (
                <div className="rounded-2xl p-5" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#1d4ed8" }}>
                    <Info className="w-4 h-4" />
                    Profile information is currently empty
                  </div>
                  <p style={{ color: "#1e3a8a", fontSize: "0.95rem", lineHeight: 1.7 }}>
                    Profile information is currently empty. This consultancy has not provided further information yet.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}