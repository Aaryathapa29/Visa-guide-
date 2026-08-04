import type { ReactNode } from "react";

interface FeatureTileProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function FeatureTile({ title, description, icon }: FeatureTileProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_-14px_rgba(10,31,68,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(10,31,68,0.2)]">
      <div className="rounded-t-[24px] bg-gradient-to-r from-[#071735] via-[#0a1f44] to-[#163a6b] px-5 py-5 text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[18px] bg-[#0a2456] text-white shadow-sm">
            {icon}
          </span>
          <h4 className="text-sm font-semibold leading-tight">{title}</h4>
        </div>
      </div>
      <div className="flex-1 px-5 py-6 text-sm leading-6 text-slate-700">{description}</div>
    </div>
  );
}
