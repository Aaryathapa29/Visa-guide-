// ── Split layout shell ────────────────────────────────────────────────────────

export default function SplitFormLayout({
  panelType,
  children,
}: {
  panelType: "aspirant" | "consultancy";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(10,31,68,0.1),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#f3f7fc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center rounded-[30px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_24px_80px_-28px_rgba(10,31,68,0.35)] backdrop-blur-xl sm:p-6 lg:p-8">
        <div className="w-full max-w-md rounded-[24px] border border-slate-200/70 bg-white/80 p-5 shadow-[0_10px_30px_-16px_rgba(10,31,68,0.18)] sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
