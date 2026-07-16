import { useState } from "react";
import { FileSearch, GraduationCap } from "lucide-react";
import ProfileDropdown from "../ui/ProfileDropdown";
import LogoutConfirmationModal from "../modals/LogoutConfirmationModal";

export default function AspirantNavbar({
  onOpenDocAnalysis,
  onOpenSettings,
  onLogout,
}: {
  onOpenDocAnalysis: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      onLogout();
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const userName = (() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return u.first_name || u.username || u.email || "";
    } catch (e) {
      return "";
    }
  })();

  return (
    <>
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
          <ProfileDropdown
            userName={userName}
            onSettingsClick={onOpenSettings}
            onLogoutClick={() => setShowLogoutModal(true)}
          />
        </div>
      </header>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        isLoading={logoutLoading}
      />
    </>
  );
}
