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

import { tabStorage } from "./utils/storage";

type Screen = "login" | "booking" | "driver" | "payment" | "review" | "admin" | "history" | "support" | "profile" | "kiosk";

const NAV: { key: Screen; label: string; icon: string; group: "passenger" | "driver" | "admin" | "support" }[] = [
  { key: "booking", label: "Home",              icon: "🏠", group: "passenger" },
  { key: "payment", label: "Payment",           icon: "💳", group: "passenger" },
  { key: "review",  label: "Rate Trip",         icon: "⭐", group: "passenger" },
  { key: "history", label: "Trip History",      icon: "📋", group: "passenger" },
  { key: "profile", label: "My Profile",        icon: "👤", group: "passenger" },
  { key: "driver",  label: "Driver Dashboard",  icon: "🚗", group: "driver"    },
  { key: "admin",   label: "Admin Panel",       icon: "🛡️", group: "admin"    },
  { key: "kiosk",   label: "Branch Desk",       icon: "🏢", group: "admin"    },
];

const GROUP_LABEL: Record<string, string> = {
  passenger: "Passenger",
  driver:    "Driver",
  admin:     "Admin",
  support:   "Support",
};

export default function App() {
  const getInitialScreen = (): Screen => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlScreen = params.get("screen") as Screen | null;
      if (urlScreen) return urlScreen;
      const urlRole = params.get("role")?.toLowerCase();
      if (urlRole === "driver") return "driver";
      if (urlRole === "admin") return "admin";
      if (urlRole === "passenger") return "booking";

      const token = tabStorage.getItem("jwt_token");
      if (token) {
        const storedRole = tabStorage.getItem("user_role")?.toLowerCase();
        if (storedRole === "driver") return "driver";
        if (storedRole === "admin") return "admin";
        return "booking";
      }
    } catch {}
    return "login";
  };

  const [screen, setScreenState] = useState<Screen>(getInitialScreen);
  const [history, setHistory] = useState<Screen[]>([]);

  const setScreen = (newScreen: Screen) => {
    setScreenState((prev) => {
      if (prev !== newScreen) {
        setHistory((h) => [...h, prev]);
      }
      return newScreen;
    });
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) {
        const fallbackScreen: Screen = role === "driver" ? "driver" : "booking";
        setScreenState(fallbackScreen);
        return [];
      }
      const newHistory = [...prevHistory];
      const previousScreen = newHistory.pop()!;
      setScreenState(previousScreen);
      return newHistory;
    });
  };

  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const homeTarget: Screen = role === "driver" ? "driver" : "booking";
    setScreen(homeTarget);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [role, setRole] = useState<string | null>(
    tabStorage.getItem("jwt_token")
      ? (tabStorage.getItem("user_role")?.toLowerCase() || "passenger")
      : null
  );
  const [adminRole, setAdminRole] = useState(tabStorage.getItem("admin_role") || "");
  const [userName, setUserName]   = useState(tabStorage.getItem("user_name")  || "");
  const [isVivaMode, setIsVivaMode] = useState(false);

  // Initialize from URL query parameters (for direct 2-tab Viva links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get("role")?.toLowerCase();
    const urlScreen = params.get("screen") as Screen | null;
    const viva = params.get("viva") === "1" || params.get("viva") === "true";

    if (viva) setIsVivaMode(true);

    if (urlRole) {
      const isDriver = urlRole === "driver";
      const isAdmin = urlRole === "admin";
      const defaultEmail = isDriver ? "driver1@streetify.com" : isAdmin ? "admin@streetify.com" : "passenger1@streetify.com";
      const defaultName = isDriver ? "Kamal Perera" : isAdmin ? "System Admin" : "Lahiru Peris";
      const defaultVehicle = isDriver ? "WP CAB-1234 · Toyota Prius" : "";
      const defaultAdmin = isAdmin ? "SUPER_ADMIN" : "";

      tabStorage.setTabOnly("user_role", urlRole.toUpperCase());
      tabStorage.setTabOnly("user_name", defaultName);
      tabStorage.setTabOnly("user_email", defaultEmail);
      if (defaultVehicle) tabStorage.setTabOnly("vehicle_info", defaultVehicle);
      if (defaultAdmin) tabStorage.setTabOnly("admin_role", defaultAdmin);

      setRole(urlRole);
      setUserName(defaultName);
      setAdminRole(defaultAdmin);

      if (urlScreen) {
        setScreenState(urlScreen);
      } else {
        setScreenState(isDriver ? "driver" : isAdmin ? "admin" : "booking");
      }

      // Automatically obtain real JWT token from seeded credentials if backend is running
      fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: defaultEmail, password: "1111" }),
      })
      .then(res => res.ok ? res.json() : null)
      .then(auth => {
        if (auth?.accessToken) {
          tabStorage.setTabOnly("jwt_token", auth.accessToken);
        } else {
          tabStorage.setTabOnly("jwt_token", `mock-jwt-${urlRole}`);
        }
      })
      .catch(() => {
        tabStorage.setTabOnly("jwt_token", `mock-jwt-${urlRole}`);
      });
    }
  }, []);

  useEffect(() => {
    const handleAuthSuccess = (e: any) => {
      const userRole = e.detail?.role?.toLowerCase() || "passenger";
      const newAdminRole = e.detail?.adminRole || tabStorage.getItem("admin_role") || "";
      const newUserName = tabStorage.getItem("user_name") || "";
      setRole(userRole);
      setUserName(newUserName);
      setAdminRole(newAdminRole);
      setHistory([]);
      setScreen(userRole === "driver" ? "driver" : userRole === "admin" ? "admin" : "booking");
    };
    const handleAuthExpired = () => { 
      setRole(null); 
      setScreen("login"); 
    };
    const handleNavigate = (e: any) => {
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
    tabStorage.clearAuth();
    setRole(null);
    setUserName("");
    setAdminRole("");
    setHistory([]);
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
        {/* ── Back Navigation Button ── */}
        {screen !== "login" && (history.length > 0 || (screen !== "booking" && screen !== (role === "driver" ? "driver" : "booking"))) && (
          <button
            type="button"
            id="nav-back-button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-xl bg-slate-800/90 hover:bg-eco/20 text-slate-300 hover:text-eco transition-all border border-slate-700 hover:border-eco/50 text-xs font-bold shadow-sm flex-none group cursor-pointer"
            title="Go Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>Back</span>
          </button>
        )}

        {/* ── Wordmark / Brand Logo (Clicks to Home) ── */}
        <div
          id="nav-logo-home"
          onClick={handleGoHome}
          className="flex items-center gap-2.5 mr-4 pr-4 flex-none cursor-pointer group select-none transition-transform hover:opacity-95"
          style={{ borderRight: "1px solid rgba(34,197,94,0.12)" }}
          title="Return to Streetify Home"
        >
          <img
            src="/logo.png"
            alt="Streetify Logo"
            className="w-8 h-8 rounded-xl flex-none group-hover:scale-105 group-hover:rotate-[-3deg] transition-all"
            style={{ boxShadow: "0 0 16px rgba(34,197,94,0.35)" }}
          />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-white text-sm font-black tracking-tight group-hover:text-eco transition-colors"
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
          if (!role) return null; // Hide all navigation when logged out
          if (role !== "admin" && role !== group) return null;
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

          {isVivaMode && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              2-Tab Viva Sync
            </span>
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
        {screen === "login"   && <ScreenLogin key="login" />}
        {screen === "booking" && <ScreenBooking key={`booking-${userName}`} />}
        {screen === "driver"  && <ScreenDriver key={`driver-${userName}`} />}
        {screen === "payment" && <ScreenPayment key={`payment-${userName}`} />}
        {screen === "review"  && <ScreenReview key={`review-${userName}`} />}
        {screen === "history" && <ScreenHistory key={`history-${userName}`} />}
        {screen === "admin"   && <ScreenAdmin key={`admin-${adminRole}-${userName}`} />}
        {screen === "kiosk"   && <ScreenBranchKiosk key={`kiosk-${adminRole}-${userName}`} />}
        {screen === "support" && <ScreenSupport key={`support-${userName}`} />}
        {screen === "profile" && <ScreenProfile key={`profile-${userName}`} />}
      </main>

      {/* ── Footer ── */}
      <Footer onNavigate={(s: any) => setScreen(s)} />

      {/* ── Fast Role Switcher ── */}
      <DemoSwitcher />
    </div>
  );
}
