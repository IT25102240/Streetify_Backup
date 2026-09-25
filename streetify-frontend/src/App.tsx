/**
 * Streetify v2.0 — Eco Drive Application Shell
 * Dark Navy / Eco-Green / Glassmorphism Design System
 */
import { useState, useEffect } from "react";

import ScreenLogin       from "./screens/Login";
import ScreenBooking     from "./screens/Booking";
import ScreenDriver      from "./screens/Driver";
import ScreenPayment     from "./screens/Payment";
import ScreenReview      from "./screens/Review";
import ScreenAdmin       from "./screens/Admin";
import ScreenHistory     from "./screens/History";
import ScreenSupport     from "./screens/Support";
import ScreenProfile     from "./screens/Profile";
import ScreenBranchKiosk from "./screens/BranchKiosk";
import NotificationCenter from "./components/NotificationCenter";
import Footer            from "./components/Footer";
import DemoSwitcher      from "./components/DemoSwitcher";

type Screen = "login" | "booking" | "driver" | "payment" | "review" | "admin" | "history" | "support" | "profile" | "kiosk";

const NAV: { key: Screen; label: string; icon: string; group: "passenger" | "driver" | "admin" | "support" }[] = [
  { key: "login",   label: "Sign In",           icon: "🔐", group: "driver"    },
  { key: "booking", label: "Book Ride",         icon: "📍", group: "passenger" },
  { key: "payment", label: "Payment",           icon: "💳", group: "passenger" },
  { key: "review",  label: "Rate Trip",         icon: "⭐", group: "passenger" },
  { key: "history", label: "Trip History",      icon: "📋", group: "passenger" },
  { key: "profile", label: "My Profile",        icon: "👤", group: "passenger" },
  { key: "driver",  label: "Driver Dashboard",  icon: "🚗", group: "driver"    },
  { key: "admin",   label: "Admin Panel",       icon: "🛡️", group: "admin"    },
  { key: "kiosk",   label: "Branch Desk",       icon: "🏢", group: "admin"    },
  { key: "support", label: "Support Portal",    icon: "🎧", group: "support"   },
];

const GROUP_LABEL: Record<string, string> = {
  passenger: "Passenger",
  driver:    "Driver",
  admin:     "Admin",
  support:   "Support",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<string | null>(
    localStorage.getItem("jwt_token")
      ? (localStorage.getItem("user_role")?.toLowerCase() || "passenger")
      : null
  );
  const adminRole = localStorage.getItem("admin_role") || "";
  const userName  = localStorage.getItem("user_name")  || "";

  useEffect(() => {
    const handleAuthSuccess = (e: any) => {
      const userRole = e.detail?.role?.toLowerCase() || "passenger";
      setRole(userRole);
      setScreen(userRole === "driver" ? "driver" : userRole === "admin" ? "admin" : "booking");
    };
    const handleAuthExpired = () => { setRole(null); setScreen("login"); };
    const handleNavigate    = (e: any) => {
      const dest = e.detail?.screen as Screen;
      if (dest) setScreen(dest);
    };
    window.addEventListener("auth-success",  handleAuthSuccess);
    window.addEventListener("auth-expired",  handleAuthExpired);
    window.addEventListener("navigate",      handleNavigate);
    return () => {
      window.removeEventListener("auth-success",  handleAuthSuccess);
      window.removeEventListener("auth-expired",  handleAuthExpired);
      window.removeEventListener("navigate",      handleNavigate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("vehicle_info");
    localStorage.removeItem("admin_role");
    setRole(null);
    setScreen("login");
  };

  const roleColor: Record<string, string> = {
    passenger: "bg-eco-faint text-eco-glow border-eco/30",
    driver:    "bg-blue-950 text-blue-300 border-blue-700/30",
    admin:     "bg-purple-950 text-purple-300 border-purple-700/30",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060e1e" }}>

      {/* ── Top Navigation Bar ── */}
      <nav
        className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto flex-none sticky top-0 z-50"
        style={{
          background: "rgba(6,14,30,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(34,197,94,0.12)",
          boxShadow: "0 1px 20px rgba(0,0,0,0.4), 0 0 40px rgba(34,197,94,0.03)",
          scrollbarWidth: "none",
        }}
      >
        {/* ── Wordmark ── */}
        <div
          onClick={() => setScreen(role === "driver" ? "driver" : role === "admin" ? "admin" : "booking")}
          className="flex items-center gap-2.5 mr-4 pr-4 flex-none cursor-pointer group"
          style={{ borderRight: "1px solid rgba(34,197,94,0.12)" }}
        >
          {/* Logo mark */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-none group-hover:scale-105 transition-transform"
            style={{
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              boxShadow: "0 0 16px rgba(34,197,94,0.35)",
            }}
          >
            <span className="text-sm font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>S</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-white text-sm font-black tracking-tight"
                style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}
              >
                Streetify
              </span>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                v2.0
              </span>
            </div>
            <div className="text-[10px] font-semibold" style={{ color: "#22c55e", letterSpacing: "0.06em" }}>
              ECO DRIVE
            </div>
          </div>
        </div>

        {/* ── Screen buttons grouped by role ── */}
        {(["passenger", "driver", "admin", "support"] as const).map((group, gi) => {
          if (role && role !== "admin" && role !== group) return null;
          if (!role && group !== "driver") return null;
          if (group === "support" && role !== "admin" && adminRole !== "SUPER_ADMIN") return null;

          const items = NAV.filter(n => n.group === group);
          return (
            <div
              key={group}
              className={`flex items-center gap-0.5 ${gi > 0 ? "pl-2 ml-1" : ""}`}
              style={gi > 0 ? { borderLeft: "1px solid rgba(34,197,94,0.1)" } : {}}
            >
              <span
                className="text-[9px] font-mono mr-1 hidden lg:block uppercase tracking-widest"
                style={{ color: "rgba(100,116,139,0.6)" }}
              >
                {GROUP_LABEL[group]}
              </span>
              {items.map(({ key, label, icon }) => {
                const isActive = screen === key;
                return (
                  <button
                    key={key}
                    onClick={() => setScreen(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-none ${
                      isActive
                        ? "nav-active"
                        : "text-slate-400 hover:text-white hover:bg-navy/50"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* ── Right: User chip + Notifications + Logout ── */}
        <div className="ml-auto flex items-center gap-2">
          {role && (
            <div
              onClick={() => setScreen("profile")}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all hover:border-eco/30"
              style={{
                background: "rgba(15,36,64,0.6)",
                border: "1px solid rgba(30,58,95,0.6)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                {userName || "Active User"}
              </span>
              <span
                className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border ${roleColor[role] ?? roleColor.passenger}`}
              >
                {role}
              </span>
            </div>
          )}

          <NotificationCenter />

          {role && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.25)",
                background: "transparent",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = "rgba(239,68,68,0.15)";
                (e.target as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = "transparent";
                (e.target as HTMLElement).style.color = "#f87171";
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* ── Active Screen ── */}
      <main className="flex-1">
        {screen === "login"   && <ScreenLogin />}
        {screen === "booking" && <ScreenBooking />}
        {screen === "driver"  && <ScreenDriver />}
        {screen === "payment" && <ScreenPayment />}
        {screen === "review"  && <ScreenReview />}
        {screen === "history" && <ScreenHistory />}
        {screen === "admin"   && <ScreenAdmin />}
        {screen === "kiosk"   && <ScreenBranchKiosk />}
        {screen === "support" && <ScreenSupport />}
        {screen === "profile" && <ScreenProfile />}
      </main>

      {/* ── Footer ── */}
      <Footer onNavigate={(s: any) => setScreen(s)} />

      {/* ── Fast Role Switcher ── */}
      <DemoSwitcher />
    </div>
  );
}
