/**
 * Streetify v1.0 — Application Shell
 *
 * Navigation bar wires all 7 screens. In production, replace this with
 * React Router (react-router-dom) and protect routes with a JWT guard:
 *
 *   <Route path="/login" element={<Login/>} />
 *   <Route element={<RequireAuth/>}>
 *     <Route path="/book"    element={<Booking/>} />
 *     <Route path="/driver"  element={<Driver/>}  />
 *     <Route path="/history" element={<History/>} />
 *   </Route>
 */
import { useState, useEffect } from "react";

import ScreenLogin   from "./screens/Login";
import ScreenBooking from "./screens/Booking";
import ScreenDriver  from "./screens/Driver";
import ScreenPayment from "./screens/Payment";
import ScreenReview  from "./screens/Review";
import ScreenAdmin   from "./screens/Admin";
import ScreenHistory from "./screens/History";
import ScreenSupport from "./screens/Support";
import ScreenProfile from "./screens/Profile";
import NotificationCenter from "./components/NotificationCenter";
import Footer from "./components/Footer";
import DemoSwitcher from "./components/DemoSwitcher";

type Screen = "login" | "booking" | "driver" | "payment" | "review" | "admin" | "history" | "support" | "profile";

const NAV: { key: Screen; label: string; icon: string; group: "passenger" | "driver" | "admin" | "support" }[] = [
  { key: "login",   label: "Login / Register",  icon: "🔐", group: "driver"     },
  { key: "booking", label: "Book Ride",         icon: "📍", group: "passenger"  },
  { key: "payment", label: "Payment",           icon: "💳", group: "passenger"  },
  { key: "review",  label: "Rate Trip",         icon: "⭐", group: "passenger"  },
  { key: "history", label: "Trip History",      icon: "📋", group: "passenger"  },
  { key: "profile", label: "My Profile",        icon: "👤", group: "passenger"  },
  { key: "driver",  label: "Driver Dashboard",  icon: "🚗", group: "driver"     },
  { key: "admin",   label: "Admin Panel",       icon: "🛡️", group: "admin"     },
  { key: "support", label: "Support Portal",    icon: "🎧", group: "support"    },
];

const GROUP_LABEL: Record<string, string> = {
  passenger: "Passenger",
  driver:    "Driver",
  admin:     "Admin",
  support:   "Support",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<string | null>(localStorage.getItem("jwt_token") ? (localStorage.getItem("user_role")?.toLowerCase() || "passenger") : null);
  const adminRole = localStorage.getItem("admin_role") || "";
  const userName = localStorage.getItem("user_name") || "";

  useEffect(() => {
    const handleAuthSuccess = (e: any) => {
      const userRole = e.detail?.role?.toLowerCase() || 'passenger';
      setRole(userRole);
      setScreen(userRole === 'driver' ? 'driver' : userRole === 'admin' ? 'admin' : 'booking');
    };

    const handleAuthExpired = () => {
      setRole(null);
      setScreen("login");
    };

    const handleNavigate = (e: any) => {
      const dest = e.detail?.screen as Screen;
      if (dest) setScreen(dest);
    };

    window.addEventListener("auth-success", handleAuthSuccess);
    window.addEventListener("auth-expired", handleAuthExpired);
    window.addEventListener("navigate", handleNavigate);

    return () => {
      window.removeEventListener("auth-success", handleAuthSuccess);
      window.removeEventListener("auth-expired", handleAuthExpired);
      window.removeEventListener("navigate", handleNavigate);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* ── Top navigation bar ── */}
      <nav
        className="bg-slate-950/95 backdrop-blur-md px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto flex-none border-b border-slate-800 sticky top-0 z-50 shadow-md"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Wordmark */}
        <div 
          onClick={() => setScreen(role === 'driver' ? 'driver' : role === 'admin' ? 'admin' : 'booking')}
          className="flex items-center gap-2 mr-3 pr-3 border-r border-slate-800 flex-none cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-700/30 group-hover:scale-105 transition-transform">
            <span className="text-base">🚖</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-extrabold tracking-tight">Streetify</span>
              <span className="text-slate-400 text-[10px] font-mono font-bold bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.2 rounded">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Screen buttons grouped by role */}
        {(["passenger", "driver", "admin", "support"] as const).map((group, gi) => {
          if (role && role !== 'admin' && role !== group) return null;
          if (!role && group !== 'driver') return null;

          const items = NAV.filter(n => n.group === group);
          if (group === "support" && role !== "admin" && adminRole !== "SUPER_ADMIN") return null;
          return (
            <div key={group} className={`flex items-center gap-1 ${gi > 0 ? "border-l border-slate-800 pl-2 ml-1" : ""}`}>
              <span className="text-slate-500 text-[11px] font-mono mr-1 hidden lg:block uppercase tracking-wider">{GROUP_LABEL[group]}</span>
              {items.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setScreen(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-none
                    ${screen === key
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          );
        })}

        {/* Right side items: User Chip, Notification Center & Logout */}
        <div className="ml-auto flex items-center gap-2.5">
          {role && (
            <div 
              onClick={() => setScreen("profile")}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px]">
                {userName || "Active User"}
              </span>
              <span className="text-[9px] font-mono font-bold bg-blue-950 text-blue-400 px-1.5 py-0.2 rounded border border-blue-800/50 uppercase">
                {role}
              </span>
            </div>
          )}

          <NotificationCenter />

          {role && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-600/80 border border-red-500/30 transition-all shadow-sm"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* ── Active screen ── */}
      <main className="flex-1">
        {screen === "login"   && <ScreenLogin />}
        {screen === "booking" && <ScreenBooking />}
        {screen === "driver"  && <ScreenDriver />}
        {screen === "payment" && <ScreenPayment />}
        {screen === "review"  && <ScreenReview />}
        {screen === "history" && <ScreenHistory />}
        {screen === "admin"   && <ScreenAdmin />}
        {screen === "support" && <ScreenSupport />}
        {screen === "profile" && <ScreenProfile />}
      </main>

      {/* ── Modern Finished Product Footer ── */}
      <Footer onNavigate={(s: any) => setScreen(s)} />

      {/* ── Fast Role Switcher for 1-Click Multi-Actor Testing ── */}
      <DemoSwitcher />
    </div>
  );
}

