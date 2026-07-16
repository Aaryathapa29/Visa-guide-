import { useRef, useEffect, useState } from "react";
import { Settings, LogOut, User } from "lucide-react";

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/90 transition-colors hover:border-[#f97316] hover:text-[#f97316]"
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <User className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
          {userName && (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-600">Signed in as</p>
              <p className="truncate text-sm font-semibold text-[#0a1f44]">{userName}</p>
            </div>
          )}

          <button
            onClick={handleSettingsClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </button>

          <button
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
