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
  const [role, setRole] = useState<string | null>(localStorage.getItem("jwt_token") ? "unknown" : null);
  const adminRole = localStorage.getItem("admin_role") || "";

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
    <div className="min-h-screen flex flex-col">
      {/* ── Top navigation bar ── */}
      <nav
        className="bg-slate-950 px-4 py-2.5 flex items-center gap-1 overflow-x-auto flex-none border-b border-slate-800 sticky top-0 z-50"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2 mr-3 pr-3 border-r border-slate-800 flex-none">
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center shadow">
            <span className="text-sm">🚖</span>
          </div>
          <span className="text-white text-sm font-extrabold tracking-tight">Streetify</span>
          <span className="text-slate-400 text-xs font-mono font-medium bg-slate-800/80 px-1.5 py-0.5 rounded">v1.0</span>
        </div>

        {/* Screen buttons grouped by role */}
        {(["passenger", "driver", "admin", "support"] as const).map((group, gi) => {
          // Hide navigation groups that don't belong to the current user role
          if (role && role !== 'admin' && role !== group) return null;
          if (!role && group !== 'driver') return null; // Only show driver login when logged out (for MVP)

          const items = NAV.filter(n => n.group === group);
          // Show support tab to admin users, show passenger/driver groups based on role
          if (group === "support" && role !== "admin" && adminRole !== "SUPER_ADMIN") return null;
          return (
            <div key={group} className={`flex items-center gap-1 ${gi > 0 ? "border-l border-slate-800 pl-2 ml-1" : ""}`}>
              <span className="text-slate-600 text-xs font-mono mr-1 hidden sm:block">{GROUP_LABEL[group]}</span>
              {items.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setScreen(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-none
                    ${screen === key
                      ? "bg-blue-700 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          );
        })}

        {/* Right side items: Notification Center & Logout */}
        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />
          {role && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-white hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* ── Active screen ── */}
      <div className="flex-1">
        {screen === "login"   && <ScreenLogin />}
        {screen === "booking" && <ScreenBooking />}
        {screen === "driver"  && <ScreenDriver />}
        {screen === "payment" && <ScreenPayment />}
        {screen === "review"  && <ScreenReview />}
        {screen === "history" && <ScreenHistory />}
        {screen === "admin"   && <ScreenAdmin />}
        {screen === "support" && <ScreenSupport />}
        {screen === "profile" && <ScreenProfile />}
      </div>
    </div>
  );
}
