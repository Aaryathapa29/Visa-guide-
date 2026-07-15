// ── Split layout shell ────────────────────────────────────────────────────────

export default function SplitFormLayout({
  panelType,
  children,
}: {
  panelType: "aspirant" | "consultancy";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div
        className="flex items-center justify-center p-8 md:p-12 lg:p-16 w-full"
        style={{ background: "#ffffff" }}
      >
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
