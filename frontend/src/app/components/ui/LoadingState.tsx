type LoadingStateProps = {
  title?: string;
  message?: string;
  className?: string;
};

export default function LoadingState({
  title = "Loading",
  message = "Please wait while we fetch the latest information.",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_10px_40px_-18px_rgba(10,31,68,.24)] ${className}`.trim()}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-r-transparent border-t-transparent" />
      </div>

      <h3 className="font-serif text-2xl font-medium text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-sans text-slate-500">{message}</p>
    </div>
  );
}
