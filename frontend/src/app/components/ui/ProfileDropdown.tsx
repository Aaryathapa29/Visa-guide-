import { useRef, useEffect, useState } from "react";
import { Settings, LogOut, Building2 } from "lucide-react";

interface ProfileDropdownProps {
  userName?: string;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
}

export default function ProfileDropdown({
  userName,
  onSettingsClick,
  onLogoutClick,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSettingsClick = () => {
    setIsOpen(false);
    onSettingsClick();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogoutClick();
  };

  const resolvedName = userName || (() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "";
      const u = JSON.parse(raw);

      return (
        u.fullName ||
        u.full_name ||
        u.displayName ||
        u.display_name ||
        u.first_name ||
        u.office_name ||
        u.username ||
        u.email ||
        ""
      ).toString().trim();
    } catch {
      return "";
    }
  })();

  const resolvedLogoUrl = (() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return (u.logo_url || "").toString().trim();
    } catch {
      return "";
    }
  })();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f97316] hover:bg-white/15 hover:text-[#f97316]"
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        {resolvedLogoUrl ? (
          <img
            src={resolvedLogoUrl}
            alt={resolvedName || "Profile avatar"}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <Building2 className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-52 rounded-[16px] border border-slate-200/80 bg-white p-1 shadow-[0_18px_42px_-20px_rgba(10,31,68,0.35)]">
          {resolvedName && (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-600">Signed in as</p>
              <p className="truncate text-sm font-semibold text-[#0a1f44]">{resolvedName}</p>
            </div>
          )}

          <button
            onClick={handleSettingsClick}
            className="flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </button>

          <button
            onClick={handleLogoutClick}
            className="mt-1 flex w-full items-center gap-3 rounded-[12px] border-t border-slate-100 px-4 py-3 text-sm text-red-600 transition-all duration-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
