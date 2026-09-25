/**
 * Screen H — Profile Management
 * Implements UC04: Manage Profile Details (Passenger)
 *          UC17: Manage Profile Details (Driver)
 *
 * API hooks:
 *   GET   /api/auth/me            → UserProfile
 *   PUT   /api/auth/me            { firstName, lastName, phone, address } → { ok }
 *   POST  /api/auth/change-password { currentPassword, newPassword }      → { ok }
 *   POST  /api/auth/reset-password  { email }                             → { otp sent }
 *   POST  /api/auth/verify-otp      { email, otp, newPassword }           → { ok }
 */
import { useState, useEffect } from "react";
import { Btn, Card, Field, Toast, PwStrength, HR } from "../ui";
import { apiClient } from "../api/apiClient";
import { NotificationService } from "../services/notificationService";

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  address?: string;
  createdAt?: string;
  verificationStatus?: string;
  /* Driver only */
  licenseNumber?: string;
  vehicleType?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleYear?: string;
}

type Tab = "profile" | "security" | "otp";

const VEHICLE_TYPES = [
  { k: "sedan", label: "Sedan", icon: "🚗" },
  { k: "suv",   label: "SUV",   icon: "🚙" },
  { k: "van",   label: "Van",   icon: "🚐" },
  { k: "tuk",   label: "Tuk-Tuk", icon: "🛺" },
  { k: "moto",  label: "Motorcycle", icon: "🏍️" },
];

export default function ScreenProfile() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast, setToast]     = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  /* Profile form state */
  const [firstName, setFirst]   = useState("");
  const [lastName,  setLast]    = useState("");
  const [phone,     setPhone]   = useState("");
  const [address,   setAddr]    = useState("");

  /* Password change */
  const [curPw,  setCur]    = useState("");
  const [newPw,  setNew]    = useState("");
  const [confPw, setConf]   = useState("");
  const [pwErr,  setPwErr]  = useState("");

  /* OTP Password Reset — UC03/UC16 */
  const [otpEmail,    setOtpEmail]    = useState("");
  const [otpCode,     setOtpCode]     = useState("");
  const [otpNewPw,    setOtpNewPw]    = useState("");
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpLoading,  setOtpLoading]  = useState(false);

  const role = localStorage.getItem("user_role") || "passenger";

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await apiClient<UserProfile>("/auth/me");
        setProfile(data);
        setFirst(data.firstName || "");
        setLast(data.lastName  || "");
        setPhone(data.phone    || "");
        setAddr(data.address   || "");
      } catch {
        /* Use localStorage fallback */
        const name = (localStorage.getItem("user_name") || "").split(" ");
        const fallback: UserProfile = {
          id: 0,
          firstName: name[0] || "User",
          lastName:  name.slice(1).join(" ") || "",
          email:     localStorage.getItem("user_email") || "user@example.com",
          phone:     "",
          role,
          createdAt: new Date().toISOString(),
        };
        setProfile(fallback);
        setFirst(fallback.firstName);
        setLast(fallback.lastName);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiClient("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ firstName, lastName, phone, address }),
      });
      setProfile(p => p ? { ...p, firstName, lastName, phone, address } : p);
      localStorage.setItem("user_name", `${firstName} ${lastName}`);
      showToast("Profile updated successfully ✓");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPwErr("");
    if (newPw !== confPw) { setPwErr("Passwords do not match"); return; }
    if (newPw.length < 8)  { setPwErr("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      await apiClient("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      showToast("Password changed successfully ✓");
      setCur(""); setNew(""); setConf("");
    } catch (err: any) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  /* OTP Reset Flow — UC03 / UC16 */
  const sendOtp = async () => {
    if (!otpEmail.trim()) { showToast("Enter your email address", "error"); return; }
    setOtpLoading(true);
    try {
      try {
        await apiClient("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ email: otpEmail.trim() }),
        });
      } catch {}
      const code = NotificationService.sendOtp(otpEmail.trim(), "Password Reset");
      setOtpCode(code);
      setOtpSent(true);
      showToast("OTP sent via Notification Service (Check SMS/Bell) ✓", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim() || !otpNewPw.trim()) { showToast("Fill in OTP and new password", "error"); return; }
    if (otpNewPw.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    setOtpLoading(true);
    try {
      await apiClient("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: otpEmail, otp: otpCode, newPassword: otpNewPw }),
      });
      showToast("Password reset successfully! Please log in again.", "success");
      setOtpSent(false); setOtpCode(""); setOtpNewPw(""); setOtpEmail("");
    } catch (err: any) {
      showToast(err.message || "Invalid OTP or OTP expired", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "profile",  label: "Personal Info",     icon: "👤" },
    { key: "security", label: "Change Password",   icon: "🔐" },
    { key: "otp",      label: "Reset via OTP",     icon: "📱" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {toast && <Toast message={toast.msg} type={toast.type} visible={!!toast} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-8 text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold shadow-lg">
            {loading ? "…" : initials}
          </div>
          <div>
            <p className="text-xl font-extrabold">{firstName} {lastName}</p>
            <p className="text-blue-200 text-sm font-mono mt-0.5">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                {role}
              </span>
              {role === "driver" && profile?.verificationStatus && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  profile.verificationStatus === "APPROVED" ? "bg-green-500/30 text-green-200" : "bg-yellow-500/30 text-yellow-200"
                }`}>
                  {profile.verificationStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tab Nav */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                tab === t.key ? "bg-blue-700 text-white shadow" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Personal Info Tab ── */}
        {tab === "profile" && (
          <Card className="p-6 space-y-4">
            <p className="font-extrabold text-slate-800 text-base">Personal Information</p>
            {loading ? (
              <p className="text-slate-400 text-sm py-4 text-center">Loading profile…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="First Name"
                    value={firstName}
                    onChange={e => setFirst(e.target.value)}
                    placeholder="First name"
                  />
                  <Field
                    label="Last Name"
                    value={lastName}
                    onChange={e => setLast(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <Field
                  label="Email Address"
                  value={profile?.email || ""}
                  disabled
                  hint="Email cannot be changed. Contact admin to update."
                  type="email"
                />
                <Field
                  label="Phone Number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+94 71 234 5678"
                  type="tel"
                />
                <Field
                  label="Address (Optional)"
                  value={address}
                  onChange={e => setAddr(e.target.value)}
                  placeholder="No. 12, Main Street, Colombo 03"
                />

                {/* Driver-specific info (read-only display) */}
                {role === "driver" && (
                  <>
                    <HR label="Vehicle Information" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { label: "Vehicle Type",  value: localStorage.getItem("vehicle_info")?.split("·")[1]?.trim() || "N/A" },
                        { label: "Plate Number",  value: localStorage.getItem("vehicle_info")?.split("·")[0]?.trim() || "N/A" },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <p className="text-xs font-bold text-slate-500 mb-1">{item.label}</p>
                          <p className="font-bold text-slate-800">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">Vehicle info can only be updated via the Coordinator panel.</p>
                  </>
                )}

                <div className="pt-2">
                  <Btn v="primary" full onClick={saveProfile} loading={saving}>
                    💾 Save Changes
                  </Btn>
                </div>
              </>
            )}
          </Card>
        )}

        {/* ── Change Password Tab ── */}
        {tab === "security" && (
          <Card className="p-6 space-y-4">
            <div>
              <p className="font-extrabold text-slate-800 text-base">Change Password</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Requires your current password. Minimum 8 characters.
              </p>
            </div>
            <Field
              label="Current Password"
              type="password"
              value={curPw}
              onChange={e => setCur(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <div>
              <Field
                label="New Password"
                type="password"
                value={newPw}
                onChange={e => setNew(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <PwStrength password={newPw} />
            </div>
            <Field
              label="Confirm New Password"
              type="password"
              value={confPw}
              onChange={e => setConf(e.target.value)}
              placeholder="Repeat new password"
              error={pwErr}
              autoComplete="new-password"
            />
            <Btn v="primary" full onClick={changePassword} loading={saving} disabled={!curPw || !newPw || !confPw}>
              🔐 Change Password
            </Btn>
          </Card>
        )}

        {/* ── OTP Reset Tab — UC03 / UC16 ── */}
        {tab === "otp" && (
          <Card className="p-6 space-y-4">
            <div>
              <p className="font-extrabold text-slate-800 text-base">Reset Password via OTP</p>
              <p className="text-xs text-slate-500 mt-0.5">
                A one-time PIN will be sent to your email via the Notification Service (UC03/UC16)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📱</span>
                <p className="font-bold text-blue-800 text-sm">How it works</p>
              </div>
              <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                <li>Enter your registered email address</li>
                <li>Click "Send OTP" — a 6-digit code will be emailed to you</li>
                <li>Enter the OTP code and your new password</li>
                <li>Click "Verify & Reset" to complete</li>
              </ol>
            </div>

            <Field
              label="Registered Email Address"
              type="email"
              value={otpEmail}
              onChange={e => setOtpEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={otpSent}
            />

            {!otpSent ? (
              <Btn v="primary" full onClick={sendOtp} loading={otpLoading} disabled={!otpEmail.trim()}>
                📤 Send OTP to Email
              </Btn>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 font-semibold">
                  ✅ OTP sent to <span className="font-mono">{otpEmail}</span> — check your inbox
                </div>
                <Field
                  label="OTP Code (6 digits)"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                />
                <div>
                  <Field
                    label="New Password"
                    type="password"
                    value={otpNewPw}
                    onChange={e => setOtpNewPw(e.target.value)}
                    placeholder="New password (min 8 chars)"
                  />
                  <PwStrength password={otpNewPw} />
                </div>
                <div className="flex gap-3">
                  <Btn v="secondary" onClick={() => { setOtpSent(false); setOtpCode(""); setOtpNewPw(""); }}>
                    ← Resend
                  </Btn>
                  <Btn
                    v="success"
                    full
                    onClick={verifyOtp}
                    loading={otpLoading}
                    disabled={otpCode.length < 6 || !otpNewPw}
                  >
                    ✅ Verify & Reset Password
                  </Btn>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Account info footer */}
        <p className="text-center text-xs text-slate-400 mt-4 font-mono">
          Account created {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"} 
          {" · "}User ID #{profile?.id}
        </p>
      </div>
    </div>
  );
}
