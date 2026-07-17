interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LogoutConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: LogoutConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#0a1f44]">
            Confirm Logout
          </h2>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-slate-700">
            Are you sure you want to logout? You'll need to sign in again to access your account.
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0a1f44] transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-md bg-[#0a1f44] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#071735] disabled:opacity-50"
          >
            {isLoading ? "Logging out..." : "Yes, Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
