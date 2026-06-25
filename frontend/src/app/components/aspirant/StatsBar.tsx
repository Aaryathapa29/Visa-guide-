import { FileText, Users, CalendarDays, FileSearch } from "lucide-react";
import { ACCENT, DARK } from "../ui/theme";

const STATS = [
  { label: "Applications", value: "3", icon: <FileText className="w-4 h-4" /> },
  { label: "Consultants Chatted", value: "2", icon: <Users className="w-4 h-4" /> },
  { label: "Sessions Booked", value: "1", icon: <CalendarDays className="w-4 h-4" /> },
  { label: "Documents Analysed", value: "4", icon: <FileSearch className="w-4 h-4" /> },
];

export default function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STATS.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fff", border: "1px solid #dce6f5" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#eef2fb", color: ACCENT }}
          >
            {s.icon}
          </div>
          <div>
            <div className="font-bold" style={{ color: DARK, fontSize: "1.2rem" }}>
              {s.value}
            </div>
            <div className="text-xs" style={{ color: "#5a6e8a" }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
