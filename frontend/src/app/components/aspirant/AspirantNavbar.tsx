import { Bell, LogOut, FileSearch, GraduationCap } from "lucide-react";

export default function AspirantNavbar({
  onOpenDocAnalysis,
  onLogout,
}: {
  onOpenDocAnalysis: () => void;
  onLogout: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#0a1f44] px-5 text-white shadow-sm md:px-10 lg:px-16"
    >
      <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="VisaGuide home">
        <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#f97316] text-white"><GraduationCap className="h-5 w-5" /></span>
        <span className="aspirant-serif text-xl tracking-tight">Visa<span className="text-[#f97316]">Guide</span></span>
      </a>

      <nav className="hidden items-center gap-1 text-sm md:flex">
        <a href="/" className="rounded-sm px-3 py-2 font-medium text-white/75 transition-colors hover:text-[#f97316]">Home</a>
        <a href="#explore" className="rounded-sm px-3 py-2 font-medium text-white/75 transition-colors hover:text-[#f97316]">Explore</a>
        <button onClick={onOpenDocAnalysis} className="flex items-center gap-2 rounded-sm px-3 py-2 font-medium text-white/75 transition-colors hover:text-[#f97316]"><FileSearch className="h-4 w-4" />Document Parser</button>
      </nav>

      <div className="flex items-center gap-1">
        <button className="relative grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/5 hover:text-[#f97316]" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f97316]" /></button>
        <button onClick={onLogout} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/90 transition-colors hover:border-[#f97316] hover:text-[#f97316]" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
      </div>
    </header>
  );
}
