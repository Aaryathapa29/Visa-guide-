import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Lock, User, Building2, Trash2, ShieldCheck } from "lucide-react";
import InputField from "../ui/InputField";
import api from "../../../api";

interface AccountSettingsProps {
  userRole: "aspirant" | "consultancy";
  userName?: string;
  onBack: () => void;
  onAccountDeleted?: () => void;
}

export default function AccountSettings({
  userRole,
  userName,
  onBack,
  onAccountDeleted,
}: AccountSettingsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [nameSuccessMessage, setNameSuccessMessage] = useState("");
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAspirant = userRole === "aspirant";
  const nameLabel = isAspirant ? "Display Name" : "Consultancy Name";
  const nameIcon = isAspirant ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;

  const getInitialName = () => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return userName || "";
      const stored = JSON.parse(raw);
      return (
        stored.display_name ||
        stored.full_name ||
        stored.fullName ||
        stored.first_name ||
        stored.office_name ||
        stored.username ||
        stored.email ||
        userName ||
        ""
      );
    } catch {
      return userName || "";
    }
  };

  useEffect(() => {
    setFormState((prev) => ({ ...prev, name: getInitialName() }));
  }, [userName]);

  const heroTitle = useMemo(() => (isAspirant ? "Aspirant account" : "Consultancy account"), [isAspirant]);
  const heroHeading = useMemo(() => (isAspirant ? "Manage your Aspirant account" : "Manage your Consultancy account"), [isAspirant]);

  function getAuthHeaders() {
    if (typeof window === "undefined") {
      return { "Content-Type": "application/json" };
    }

    const token = window.localStorage.getItem("accessToken")
      || window.localStorage.getItem("access_token")
      || window.sessionStorage.getItem("accessToken")
      || window.sessionStorage.getItem("access_token")
      || "";

    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    };
  }

  async function handleSaveName() {
    setError("");
    setNameSuccessMessage("");

    if (!formState.name.trim()) {
      setError("Please provide a valid name.");
      setNameSuccessMessage("");
      return;
    }

    setSavingName(true);
    try {
      const resp = await api.patch("auth/update-profile/", { name: formState.name.trim() }, {
        headers: getAuthHeaders(),
      });
      const updatedUser = resp.data?.user;
      if (updatedUser) {
        const raw = localStorage.getItem("authUser");
        const current = raw ? JSON.parse(raw) : {};
        const merged = { ...current, ...updatedUser };
        localStorage.setItem("authUser", JSON.stringify(merged));
      }

      setNameSuccessMessage("✓ Name changed successfully.");
      setIsEditingName(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to update name.";
      setError(errorMsg);
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword() {
    setError("");
    setPasswordSuccessMessage("");

    if (!formState.currentPassword) {
      setError("Please enter your current password.");
      setPasswordSuccessMessage("");
      return;
    }

    if (!formState.password) {
      setError("Please enter your new password.");
      setPasswordSuccessMessage("");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError("New passwords do not match.");
      setPasswordSuccessMessage("");
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch("auth/update-profile/", {
        current_password: formState.currentPassword,
        password: formState.password,
        new_password: formState.password,
      }, {
        headers: getAuthHeaders(),
      });
      setPasswordSuccessMessage("✓ Password updated successfully.");
      setFormState((prev) => ({ ...prev, currentPassword: "", password: "", confirmPassword: "" }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to update password.";
      setError(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await api.delete("auth/delete-account/", {
        headers: getAuthHeaders(),
      });
      setTimeout(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authRole");
        localStorage.removeItem("authUser");
        if (onAccountDeleted) onAccountDeleted();
      }, 750);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to delete account.";
      setError(errorMsg);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fbff] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_8px_32px_-18px_rgba(10,31,68,.2)] sm:p-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0a1f44] transition-colors hover:text-[#f97316]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-orange-500">ACCOUNT SETTINGS</p>
              <h1 className="mt-2 font-serif text-3xl font-light text-slate-900 sm:text-4xl">{heroHeading}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Keep your profile details current, protect your password, and manage your account from one secure place.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-2 text-sm font-semibold text-[#0a1f44]">
              <ShieldCheck className="h-4 w-4" />
              Secure session
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ✕ {error}
            </div>
          )}

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_8px_32px_-18px_rgba(10,31,68,.18)] sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-semibold text-[#0a1f44]">Profile details</p>
              <p className="mt-1 text-sm text-slate-500">
                Update the public name shown across your Visa Guide account.
              </p>
            </div>

            <InputField
              id="name"
              label={nameLabel}
              placeholder={isAspirant ? "Enter your display name" : "Enter consultancy name"}
              icon={nameIcon}
              value={formState.name}
              disabled={!isEditingName}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, name: event.target.value }));
                setNameSuccessMessage("");
              }}
              trailingAction={{
                label: isEditingName ? "Save" : "Edit",
                onClick: isEditingName ? handleSaveName : () => setIsEditingName(true),
                disabled: savingName,
              }}
            />

            {nameSuccessMessage && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {nameSuccessMessage}
              </div>
            )}

            {isEditingName && (
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setFormState((prev) => ({ ...prev, name: getInitialName() }));
                  }}
                  className="text-slate-600 underline hover:text-slate-800"
                >
                  Cancel
                </button>
                <span className="text-xs">Edit mode is enabled for this field</span>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_8px_32px_-18px_rgba(10,31,68,.18)] sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-semibold text-[#0a1f44]">Security</p>
              <p className="mt-1 text-sm text-slate-500">
                Update your current password securely and keep the new password confirmed before saving.
              </p>
            </div>

            <div className="space-y-4">
              <InputField
                id="currentPassword"
                label="Current Password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                icon={<Lock className="h-4 w-4" />}
                value={formState.currentPassword}
                onChange={(event) => setFormState((prev) => ({ ...prev, currentPassword: event.target.value }))}
                trailingToggle={{
                  show: showCurrentPassword,
                  onToggle: () => setShowCurrentPassword((value) => !value),
                }}
              />

              <InputField
                id="password"
                label="New Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                icon={<Lock className="h-4 w-4" />}
                value={formState.password}
                onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                trailingToggle={{
                  show: showPassword,
                  onToggle: () => setShowPassword((value) => !value),
                }}
              />

              <InputField
                id="confirmPassword"
                label="Confirm New Password"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                icon={<Lock className="h-4 w-4" />}
                value={formState.confirmPassword}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }));
                  setPasswordSuccessMessage("");
                }}
                trailingToggle={{
                  show: showConfirm,
                  onToggle: () => setShowConfirm((value) => !value),
                }}
              />
            </div>

            {passwordSuccessMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {passwordSuccessMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={savingPassword}
                className="rounded-full bg-[#0a1f44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#071735] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPassword ? "Saving..." : "Save Password"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-red-200 bg-red-50/30 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Delete account</h3>
                  <p className="mt-1 text-sm leading-6 text-red-700">
                    This action disables your account immediately and removes your profile from active use. It cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_20px_60px_-28px_rgba(10,31,68,.45)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-red-600">Delete account</h2>
            </div>
            <div className="px-6 py-5 text-sm leading-6 text-slate-700">
              Are you sure you want to deactivate this account? Your profile will no longer be active, and you will need to sign up again to use Visa Guide in the future.
            </div>
            <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0a1f44] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
