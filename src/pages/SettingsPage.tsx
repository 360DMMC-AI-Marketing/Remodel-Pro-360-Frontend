import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Bell, UserX, Shield, Mail, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { toast } from "sonner";
import { useAuth } from "@/stores/useAuth";
import { authService } from "@/api/auth";
import api from "@/api/interceptor";

interface NotificationPrefs {
  emailNewBid: boolean;
  emailBidAccepted: boolean;
  emailMessages: boolean;
  emailProjectUpdates: boolean;
  emailMilestoneUpdates: boolean;
}

const PREF_LABELS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "emailNewBid", label: "New Bids", description: "When a contractor submits a bid on your project" },
  { key: "emailBidAccepted", label: "Bid Accepted", description: "When your bid is accepted by a homeowner" },
  { key: "emailMessages", label: "Messages", description: "When you receive a new message" },
  { key: "emailProjectUpdates", label: "Project Updates", description: "Status changes on your projects" },
  { key: "emailMilestoneUpdates", label: "Milestone Updates", description: "Milestone submissions, approvals, and payments" },
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? "bg-primary-600" : "bg-neutral-300"
    }`}
  >
    <span
      className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification prefs
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailNewBid: true,
    emailBidAccepted: true,
    emailMessages: true,
    emailProjectUpdates: true,
    emailMilestoneUpdates: true,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      const np = res.data?.user?.notificationPreferences;
      if (np) setPrefs(np);
    }).catch(() => {}).finally(() => setLoadingPrefs(false));
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      setChangingPassword(true);
      await api.post("/auth/change-password", { currentPassword, newPassword, confirmPassword });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePrefs = async () => {
    try {
      setSavingPrefs(true);
      const res = await api.patch("/auth/notification-preferences", prefs);
      setPrefs(res.data.notificationPreferences);
      toast.success("Notification preferences saved.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      setDeleting(true);
      await api.delete("/auth/account");
      toast.success("Account deleted.");
      logout();
      navigate("/");
    } catch {
      toast.error("Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const isOAuth = user?.authProvider === "google" || user?.authProvider === "apple";

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your account security, notifications, and preferences.</p>
      </div>

      {/* ── Account Security ── */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
          <div className="rounded-lg bg-primary-50 p-2">
            <Shield size={18} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Account Security</h2>
            <p className="text-xs text-neutral-400">Password and authentication</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Auth Provider */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-700">Sign-in method</p>
                <p className="text-xs text-neutral-400">
                  {isOAuth ? `Signed in with ${user?.authProvider === "google" ? "Google" : "Apple"}` : "Email & Password"}
                </p>
              </div>
            </div>
            {isOAuth && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                {user?.authProvider === "google" ? "Google" : "Apple"}
              </span>
            )}
          </div>

          {/* Email Verification (local auth only) */}
          {!isOAuth && (
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-700">Email verification</p>
                  <p className="text-xs text-neutral-400">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!user?.isVerified && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await authService.resendVerification();
                        toast.success("Verification email sent! Check your inbox.");
                      } catch {
                        toast.error("Failed to send verification email.");
                      }
                    }}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    Resend email
                  </button>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  user?.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {user?.isVerified ? "Verified" : "Not verified"}
                </span>
              </div>
            </div>
          )}

          {/* Change Password (only for local auth) */}
          {!isOAuth && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-neutral-700">Change Password</p>
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={changingPassword || !currentPassword || !newPassword}
                onClick={handleChangePassword}
              >
                {changingPassword ? "Saving..." : "Update Password"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
          <div className="rounded-lg bg-amber-50 p-2">
            <Bell size={18} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Email Notifications</h2>
            <p className="text-xs text-neutral-400">Choose which emails you receive</p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {PREF_LABELS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-neutral-700">{label}</p>
                <p className="text-xs text-neutral-400">{description}</p>
              </div>
              {loadingPrefs ? (
                <div className="h-6 w-11 rounded-full bg-neutral-200 animate-pulse" />
              ) : (
                <Toggle checked={prefs[key]} onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-neutral-100">
          <Button variant="primary" size="sm" disabled={savingPrefs} onClick={handleSavePrefs}>
            {savingPrefs ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* ── Account Management ── */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
          <div className="rounded-lg bg-red-50 p-2">
            <UserX size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Account</h2>
            <p className="text-xs text-neutral-400">Account information and deletion</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-neutral-400" />
              <span className="text-sm text-neutral-700">{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-neutral-400" />
              <span className="text-sm text-neutral-700">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}</span>
            </div>
          </div>

          {/* Delete Account */}
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-between rounded-lg border border-red-200 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span>Delete my account</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-medium text-red-800">This action is permanent and cannot be undone.</p>
              <p className="text-xs text-red-600">All your projects, bids, contracts, and data will be permanently deleted.</p>
              <div>
                <label className="text-xs text-red-700 font-medium mb-1 block">Type DELETE to confirm</label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="border-red-300"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
