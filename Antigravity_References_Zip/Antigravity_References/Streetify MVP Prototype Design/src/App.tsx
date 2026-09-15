/**
 * Streetify MVP — Application Shell
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

type Screen = "login" | "booking" | "driver" | "payment" | "review" | "admin" | "history";

const NAV: { key: Screen; label: string; icon: string; group: "passenger" | "driver" | "admin" }[] = [
  { key: "login",   label: "Driver Login",     icon: "🔐", group: "driver"     },
  { key: "booking", label: "Booking",          icon: "📍", group: "passenger"  },
  { key: "driver",  label: "Driver Dashboard", icon: "🚗", group: "driver"     },
  { key: "payment", label: "Payment",          icon: "💳", group: "passenger"  },
  { key: "review",  label: "Review",           icon: "⭐", group: "passenger"  },
  { key: "history", label: "Trip History",     icon: "📋", group: "passenger"  },
  { key: "admin",   label: "Admin Panel",      icon: "🛡️", group: "admin"     },
];

const GROUP_LABEL: Record<string, string> = {
  passenger: "Passenger",
  driver:    "Driver",
  admin:     "Admin",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<string | null>(localStorage.getItem("jwt_token") ? "unknown" : null);

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

    window.addEventListener("auth-success", handleAuthSuccess);
    window.addEventListener("auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth-success", handleAuthSuccess);
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
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
          <span className="text-slate-600 text-xs font-mono">MVP</span>
        </div>

        {/* Screen buttons grouped by role */}
        {(["passenger", "driver", "admin"] as const).map((group, gi) => {
          // Hide navigation groups that don't belong to the current user role
          if (role && role !== 'admin' && role !== group) return null;
          if (!role && group !== 'driver') return null; // Only show driver login when logged out (for MVP)

          const items = NAV.filter(n => n.group === group);
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

        {/* Logout Button */}
        {role && (
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-white hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>
        )}
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
      </div>
    </div>
  );
}
