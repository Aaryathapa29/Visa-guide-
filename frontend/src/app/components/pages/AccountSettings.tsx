import { useState } from "react";
import { ArrowLeft, Lock, User, Building2, Trash2 } from "lucide-react";
import InputField from "../ui/InputField";
import API from "../../../api";

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
  const [formState, setFormState] = useState({
    name: userName || "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAspirant = userRole === "aspirant";
  const nameLabel = isAspirant ? "Full Name" : "Consultancy Name";
  const nameIcon = isAspirant ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />;

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (formState.password && formState.password !== formState.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (formState.name) payload.name = formState.name;
      if (formState.password) payload.password = formState.password;

      await API.patch("auth/update-profile/", payload);
      setMessage("Profile updated successfully!");
      setFormState(prev => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to update profile.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await API.delete("auth/delete-account/");
      setMessage("Account deleted successfully.");
      setTimeout(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authRole");
        localStorage.removeItem("authUser");
        if (onAccountDeleted) onAccountDeleted();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to delete account.";
      setError(errorMsg);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <main className="aspirant-shell min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0a1f44] transition-colors hover:text-[#f97316]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-[#0a1f44]">Account Settings</h1>
          <p className="mt-2 text-slate-600">
            Manage your {isAspirant ? "profile" : "consultancy"} information and account security.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-5 rounded-lg bg-white p-6 shadow-sm">
          {message && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              ✓ {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              ✕ {error}
            </div>
          )}

          <InputField
            id="name"
            label={nameLabel}
            placeholder={isAspirant ? "Enter your full name" : "Enter consultancy name"}
            icon={nameIcon}
            value={formState.name}
            onChange={(e) =>
              setFormState(prev => ({ ...prev, name: e.target.value }))
            }
          />

          <div className="border-t border-slate-200 pt-5">
            <p className="mb-4 text-sm font-semibold text-[#0a1f44]">Change Password</p>

            <InputField
              id="password"
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password (leave blank to keep current)"
              icon={<Lock className="w-4 h-4" />}
              value={formState.password}
              onChange={(e) =>
                setFormState(prev => ({ ...prev, password: e.target.value }))
              }
              trailingToggle={{
                show: showPassword,
                onToggle: () => setShowPassword(!showPassword),
              }}
            />

            <InputField
              id="confirmPassword"
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              icon={<Lock className="w-4 h-4" />}
              value={formState.confirmPassword}
              onChange={(e) =>
                setFormState(prev => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              trailingToggle={{
                show: showConfirm,
                onToggle: () => setShowConfirm(!showConfirm),
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#0a1f44] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#071735] disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Delete Account Section */}
        <div className="mt-8 space-y-4 rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Delete Account</h3>
              <p className="mt-1 text-sm text-red-700">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
            </div>

            <div className="px-6 py-4">
              <p className="text-slate-700">
                Are you absolutely sure? This will permanently delete your account and all associated data. This action cannot be reversed.
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0a1f44] transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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
