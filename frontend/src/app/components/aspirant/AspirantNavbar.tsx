import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FileSearch, GraduationCap } from "lucide-react";
import ProfileDropdown from "../ui/ProfileDropdown";
import LogoutConfirmationModal from "../modals/LogoutConfirmationModal";

export default function AspirantNavbar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();

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
      return (
        u.display_name ||
        u.full_name ||
        u.fullName ||
        u.first_name ||
        u.username ||
        u.email ||
        ""
      ).toString().trim();
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
          <NavLink to="/" end className={({ isActive }) => `rounded-sm px-3 py-2 font-medium transition-colors ${isActive ? "text-[#f97316]" : "text-white/75 hover:text-[#f97316]"}`}>
            Home
          </NavLink>
          <NavLink to="/chatbot" className={({ isActive }) => `rounded-sm px-3 py-2 font-medium transition-colors ${isActive ? "text-[#f97316]" : "text-white/75 hover:text-[#f97316]"}`}>
            Chatbot
          </NavLink>
          <NavLink to="/document-analyzer" className={({ isActive }) => `flex items-center gap-2 rounded-sm px-3 py-2 font-medium transition-colors ${isActive ? "text-[#f97316]" : "text-white/75 hover:text-[#f97316]"}`}>
            <FileSearch className="h-4 w-4" />Document Analyzer
          </NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <ProfileDropdown
            userName={userName}
            onSettingsClick={() => navigate("/settings")}
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
