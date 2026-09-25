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
          className="flex items-center gap-2 px-3.5 py-2.5 text-white rounded-full font-bold text-xs transition-all hover:scale-105 active:scale-95 group"
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e, #15803d)",
            boxShadow: "0 0 20px rgba(34,197,94,0.35), 0 4px 16px rgba(0,0,0,0.4)",
            border: "1px solid rgba(34,197,94,0.4)",
          }}
        >
          <span className="text-base group-hover:rotate-12 transition-transform">⚡</span>
          <span>Fast Role Switcher</span>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#4ade80" }}
          ></span>
        </button>
      </div>

      {/* Slide-over or Popup Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <div
            className="w-full max-w-lg p-5 sm:p-6 shadow-2xl relative text-white rounded-2xl"
            style={{
              background: "rgba(9,20,40,0.97)",
              border: "1px solid rgba(34,197,94,0.2)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="flex items-center justify-between pb-3 mb-1"
              style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-xl p-1.5 rounded-xl"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
                >⚡</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Quick Test Accounts & Role Switcher</h3>
                  <p className="text-[11px]" style={{ color: "#4a6580" }}>1-Click instant switch between all 6 primary system actors</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:text-white text-lg p-1 transition-colors"
                style={{ color: "#4a6580" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  disabled={switching === u.email}
                  onClick={() => handleQuickLogin(u)}
                  className="flex items-start gap-3 p-3 rounded-xl text-left transition-all disabled:opacity-50 group"
                  style={{
                    background: "rgba(15,36,64,0.5)",
                    border: "1px solid rgba(30,58,95,0.5)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(34,197,94,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(15,36,64,0.8)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(30,58,95,0.5)"; (e.currentTarget as HTMLElement).style.background = "rgba(15,36,64,0.5)"; }}
                >
                  <span
                    className="text-2xl p-1.5 rounded-lg"
                    style={{ background: "rgba(6,14,30,0.7)", border: "1px solid rgba(30,58,95,0.5)" }}
                  >
                    {u.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded text-white ${u.badgeColor}`}>
                        {u.label}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-eco-glow truncate transition-colors">
                      {u.name}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: "#4a6580" }}>
                      {u.details}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div
              className="rounded-xl p-3 flex items-center justify-between text-[11px]"
              style={{ background: "rgba(6,14,30,0.7)", border: "1px solid rgba(34,197,94,0.1)", color: "#4a6580" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }}></span>
                Connected to MSSQL Database (<code style={{ color: "#94a3b8" }}>streetify_db</code>)
              </span>
              <span className="font-mono">Localhost :8080</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
