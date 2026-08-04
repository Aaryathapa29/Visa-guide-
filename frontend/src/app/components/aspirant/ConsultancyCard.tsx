import { ArrowRight, Building2, Mail, MapPin } from "lucide-react";

interface ConsultancyCardProps {
  title: string;
  username: string;
  email: string;
  officeName: string | null;
  onClick: () => void;
}

export default function ConsultancyCard({ title, username, email, officeName, onClick }: ConsultancyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-[20px] border border-slate-200/80 bg-white text-left shadow-[0_10px_30px_-14px_rgba(10,31,68,0.2),0_2px_8px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-slate-300 hover:shadow-[0_18px_42px_-16px_rgba(10,31,68,0.28),0_10px_24px_-10px_rgba(15,23,42,0.12),0_2px_10px_rgba(15,23,42,0.08)]"
    >
      <div className="rounded-t-[20px] bg-gradient-to-r from-[#071735] via-[#0a1f44] to-[#163a6b] px-6 py-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="aspirant-serif text-2xl leading-tight">{title}</h3>
            <p className="mt-1 text-sm text-white/80">@{username}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0a2456] text-[#f97316] shadow-[0_8px_18px_-10px_rgba(2,6,23,0.35)]">
            <Building2 className="h-5 w-5" />
          </span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Consultancy profile</p>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p className="flex items-center gap-2 break-all">
            <Mail className="h-4 w-4 shrink-0 text-[#0a1f44]" />
            {email}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-[#0a1f44]" />
            {officeName || "Office details not provided"}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-4 text-[11px] font-bold uppercase tracking-widest text-[#0a1f44] transition-all group-hover:text-[#2563eb]">
          View profile <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </div>
    </button>
  );
}
