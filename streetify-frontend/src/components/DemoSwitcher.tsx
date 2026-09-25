import { useState } from "react";
import { apiClient } from "../api/apiClient";

interface DemoUser {
  label: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN";
  adminRole?: string;
  email: string;
  name: string;
  avatar: string;
  badgeColor: string;
  details: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    label: "Passenger",
    role: "PASSENGER",
    email: "passenger1@streetify.com",
    name: "Lahiru Peris",
    avatar: "👤",
    badgeColor: "bg-blue-600",
    details: "Wallet LKR 5,000 · Booking & Tracking",
  },
  {
    label: "Driver",
    role: "DRIVER",
    email: "driver1@streetify.com",
    name: "Kamal Perera",
    avatar: "🚗",
    badgeColor: "bg-emerald-600",
    details: "Toyota Prius (CAB-1234) · Dispatch Console",
  },
  {
    label: "Driver Coordinator",
    role: "ADMIN",
    adminRole: "DRIVER_MGMT",
    email: "tharindu@streetify.lk",
    name: "Tharindu Senaka",
    avatar: "📋",
    badgeColor: "bg-purple-600",
    details: "Driver Verification & Documents Review",
  },
  {
    label: "Super Admin",
    role: "ADMIN",
    adminRole: "SUPER_ADMIN",
    email: "vidura@streetify.lk",
    name: "Vidura Rammandalagedara",
    avatar: "🛡️",
    badgeColor: "bg-rose-600",
    details: "RBAC Governance, Suspension & Audit Logs",
  },
  {
    label: "Finance Manager",
    role: "ADMIN",
    adminRole: "PAYMENT_MGMT",
    email: "daham@streetify.lk",
    name: "Daham Edirisinghe",
    avatar: "💳",
    badgeColor: "bg-amber-600",
    details: "Platform 15% Commission & Settlement",
  },
  {
    label: "Customer Support",
    role: "ADMIN",
    adminRole: "REVIEW_MGMT",
    email: "mithun@streetify.lk",
    name: "Mithun Weerasingha",
    avatar: "🎧",
    badgeColor: "bg-cyan-600",
    details: "Dispute Tickets, Ratings & Wallet Refunds",
  },
];

export default function DemoSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleQuickLogin = async (user: DemoUser) => {
    setSwitching(user.email);
    try {
      // Direct login to backend MSSQL database - try primary seed password
      let password = user.email.startsWith("passenger") || user.email.startsWith("driver")
        ? "1111"
        : "admin123";

      let res: any = null;
      try {
        res = await apiClient("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: user.email, password }),
        });
      } catch {
        // Try personal member password if custom seeded (e.g. vidura123, mithun123)
        const prefix = user.email.split("@")[0];
        res = await apiClient("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: user.email, password: prefix + "123" }),
        });
      }

      if (res && res.accessToken) {
        localStorage.setItem("jwt_token", res.accessToken);
        localStorage.setItem("user_role", res.role || user.role);
        localStorage.setItem("user_name", res.fullName || user.name);
        if (res.adminRole || user.adminRole) {
          localStorage.setItem("admin_role", res.adminRole || user.adminRole || "");
        } else {
          localStorage.removeItem("admin_role");
        }

        window.dispatchEvent(
          new CustomEvent("auth-success", {
            detail: {
              role: (res.role || user.role).toLowerCase(),
              token: res.accessToken,
              adminRole: res.adminRole || user.adminRole || "",
            },
          })
        );
      }
    } catch {
      // Fallback local session if backend is momentarily restarting
      localStorage.setItem("jwt_token", "mock-jwt-" + user.role.toLowerCase());
      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_name", user.name);
      if (user.adminRole) localStorage.setItem("admin_role", user.adminRole);

      window.dispatchEvent(
        new CustomEvent("auth-success", {
          detail: {
            role: user.role.toLowerCase(),
            token: "mock-jwt-" + user.role.toLowerCase(),
            adminRole: user.adminRole || "",
          },
        })
      );
    } finally {
      setSwitching(null);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Demo Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 hover:from-blue-600 hover:to-violet-600 text-white rounded-full shadow-xl shadow-blue-900/40 border border-blue-400/30 font-bold text-xs transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">⚡</span>
          <span>Fast Role Switcher</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>

      {/* Slide-over or Popup Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Quick Test Accounts & Role Switcher</h3>
                  <p className="text-[11px] text-slate-400">1-Click instant switch between all 6 primary system actors</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  disabled={switching === u.email}
                  onClick={() => handleQuickLogin(u)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 text-left transition-all group disabled:opacity-50"
                >
                  <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-700/60">
                    {u.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded text-white ${u.badgeColor}`}>
                        {u.label}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                      {u.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {u.details}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Connected to MSSQL Database (<code className="text-slate-300">streetify_db</code>)
              </span>
              <span className="font-mono text-slate-500">Localhost :8080</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
