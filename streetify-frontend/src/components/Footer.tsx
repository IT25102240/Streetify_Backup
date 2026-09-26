/**
 * Streetify Footer — Eco Drive Dark Theme v2.0
 * Full project info, team, contacts, modals, social links
 */
import { useState } from "react";

interface FooterProps {
  onNavigate?: (screen: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [showTour,          setShowTour]          = useState(false);
  const [showDataRetention, setShowDataRetention] = useState(false);
  const [showMobileApp,     setShowMobileApp]     = useState(false);
  const [tourStep,          setTourStep]          = useState(0);

  const TOUR_STEPS = [
    {
      title: "Passenger Ride Booking & Tracking",
      actor: "Passenger",
      icon:  "📍",
      desc:  "Interactive OpenStreetMap with GPS geolocation detection, fare estimates for Tuk, Car, Van, Bike, and real-time driver tracking with live cancellation prompts.",
    },
    {
      title: "Driver Dispatch & State Machine",
      actor: "Driver",
      icon:  "🚗",
      desc:  "Incoming trip acceptance via WebSocket, 4-stage state machine (En Route → Arrived → In Progress → Completed), 5-minute no-show cancellation fee, and wallet earnings tracker.",
    },
    {
      title: "Dual Payment Gateway & 3D Secure",
      actor: "Passenger / Finance",
      icon:  "💳",
      desc:  "Supports PayHere Sri Lanka (Visa, MasterCard, Genie) and Stripe with realistic 3DS OTP authorization modal, instant receipt printing, and 15% platform commission deductions.",
    },
    {
      title: "Senior Driver Coordinator Queue",
      actor: "Driver Coordinator",
      icon:  "📋",
      desc:  "Document review queue for driving licenses and vehicle revenue permits, approval/rejection decision engine, and driver cancellation rate monitor.",
    },
    {
      title: "Customer Support & Dispute Portal",
      actor: "Customer Support Officer",
      icon:  "🎧",
      desc:  "Formal ticket investigation with passenger/driver ride details, one-click resolution dispatch, and automated passenger wallet refund crediting directly in MSSQL.",
    },
    {
      title: "System Admin & Governance",
      actor: "System Administrator",
      icon:  "🛡️",
      desc:  "Role-based access control (RBAC), user suspension with temporal cooldowns, immutable audit trail, and live analytics dashboard with CSV export.",
    },
  ];

  const TEAM = [
    { no: "01", name: "Vidura Rammandalagedara", role: "Core Architecture & RBAC Admin",       email: "vidura@streetify.lk",   color: "#22c55e",  badge: "SYSTEM ARCHITECTURE" },
    { no: "02", name: "Lahiru Nayanamina",        role: "Identity, JWT Auth & Data Privacy",    email: "lahiru@streetify.lk",   color: "#38bdf8",  badge: "IAM & SECURITY"      },
    { no: "03", name: "Chanuka Dharmakeerthi",    role: "WebSocket Telemetry & Live Dispatch",  email: "chanuka@streetify.lk",  color: "#f59e0b",  badge: "REAL-TIME DISPATCH"  },
    { no: "04", name: "Tharindu Senaka",          role: "Driver Onboarding & Fleet Operations", email: "tharindu@streetify.lk", color: "#a78bfa",  badge: "FLEET & VERIFICATION"},
    { no: "05", name: "Daham Edirisinghe",        role: "3DS Gateways & Wallet Ledger",         email: "daham@streetify.lk",    color: "#fb7185",  badge: "FINANCE & PAYMENTS"  },
    { no: "06", name: "Mithun Weerasingha",       role: "Customer Dispute & Ticket Resolution", email: "mithun@streetify.lk",  color: "#34d399",  badge: "SUPPORT & REVIEWS"   },
  ];

  const PORTALS = [
    { icon: "📍", label: "Passenger Booking",     screen: "booking", color: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.3)"  },
    { icon: "🚗", label: "Driver Dispatch",       screen: "driver",  color: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)" },
    { icon: "🛡️", label: "Admin Panel",           screen: "admin",   color: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.25)" },
    { icon: "🎧", label: "Support Desk",          screen: "support", color: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)" },
    { icon: "💳", label: "Finance & Payments",    screen: "payment", color: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
    { icon: "📋", label: "Trip History",          screen: "history", color: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)" },
    { icon: "🏢", label: "Branch Walk-in Desk",   screen: "kiosk",   color: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)"  },
  ];

  const handleQuickNav = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { screen } }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* ── Shared modal base ── */
  const modalOverlay = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      {children}
    </div>
  );

  const modalBox = "w-full max-w-lg rounded-2xl p-6 shadow-2xl relative text-white";
  const modalBoxStyle: React.CSSProperties = {
    background: "rgba(10,22,44,0.97)",
    border: "1px solid rgba(34,197,94,0.2)",
    backdropFilter: "blur(20px)",
  };

  return (
    <>
      <footer
        className="mt-auto pt-14 pb-8 relative"
        style={{
          background: "linear-gradient(to bottom, #060e1e, #030810)",
          borderTop: "1px solid rgba(34,197,94,0.1)",
        }}
      >
        {/* Top eco accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(34,197,94,0.4), transparent)" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Main 4-column grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* ── Column 1: Brand & System ── */}
            <div className="space-y-5">
              {/* Wordmark */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Streetify Logo"
                  className="w-10 h-10 rounded-2xl flex-none"
                  style={{ boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xl font-black tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                      Streetify
                    </span>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
                    >
                      v2.0
                    </span>
                  </div>
                  <p className="text-xs font-bold tracking-widest" style={{ color: "#22c55e", fontSize: "10px" }}>
                    ECO DRIVE PLATFORM
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                Sri Lanka's eco-conscious urban transportation platform. Full-stack powered by Spring Boot, Microsoft SQL Server, React & WebSocket real-time dispatch engine.
              </p>

              {/* Status badges */}
              <div className="space-y-2">
                <div
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}
                >
                  <span className="w-2 h-2 rounded-full bg-eco animate-pulse inline-block" style={{ background: "#22c55e" }} />
                  MSSQL Database · Port 1433
                </div>
                <div
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", color: "#7dd3fc" }}
                >
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#38bdf8" }} />
                  REST API & WebSocket · Port 8080
                </div>
              </div>

              {/* Payment badges */}
              <div className="flex flex-wrap gap-1.5">
                {["🇱🇰 PayHere", "💳 Stripe 3DS", "👛 Wallet"].map(g => (
                  <span
                    key={g}
                    className="text-xs font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: "rgba(30,58,95,0.6)", border: "1px solid rgba(30,58,95,0.8)", color: "#94a3b8" }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Column 2: Team ── */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
                <span>👥</span> Developers & Project Owners
              </h4>
              <p className="text-xs" style={{ color: "rgba(100,116,139,0.7)" }}>Software Engineering Capstone · Group 24</p>

              <ul className="space-y-1.5">
                {TEAM.map(m => (
                  <li
                    key={m.no}
                    className="flex items-center gap-2.5 p-2 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(15,36,64,0.4)", border: `1px solid rgba(30,58,95,0.5)` }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-none"
                      style={{ background: m.color + "20", color: m.color, border: `1px solid ${m.color}40` }}
                    >
                      {m.no}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                      <p className="text-[10px] truncate" style={{ color: "rgba(100,116,139,0.7)" }}>{m.role}</p>
                    </div>
                    <span
                      className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md flex-none"
                      style={{ background: m.color + "15", color: m.color, border: `1px solid ${m.color}30` }}
                    >
                      {m.badge}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Column 3: Portals ── */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
                <span>⚡</span> Actor Portals & Modules
              </h4>
              <div className="space-y-1.5">
                {PORTALS.map(p => (
                  <button
                    key={p.screen}
                    onClick={() => handleQuickNav(p.screen)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl transition-all text-xs hover:scale-[1.01]"
                    style={{
                      background: p.color,
                      border: `1px solid ${p.border}`,
                      color: "#cbd5e1",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span className="font-semibold">{p.label}</span>
                    </span>
                    <span style={{ color: p.border.replace("0.3", "0.8") }}>→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Column 4: Contact & Info ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#4ade80" }}>
                <span>📡</span> Contact & Project Info
              </h4>

              {/* Contact card */}
              <div
                className="p-4 rounded-2xl space-y-3"
                style={{ background: "rgba(15,36,64,0.4)", border: "1px solid rgba(34,197,94,0.12)" }}
              >
                <div>
                  <p className="text-xs font-bold text-white">Streetify — Web-Based Transportation System</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>SE Project · Group 24 · 2026</p>
                </div>
                <div className="space-y-2 text-xs" style={{ borderTop: "1px solid rgba(34,197,94,0.08)", paddingTop: "10px" }}>
                  <div className="flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <span style={{ color: "#4ade80" }}>📞</span>
                    <span>24/7 Hotline: </span>
                    <span className="font-mono text-white">+94 11 200 0000</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <span style={{ color: "#4ade80" }}>✉️</span>
                    <span className="font-mono text-white">contact@streetify.lk</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <span style={{ color: "#4ade80" }}>🌐</span>
                    <span className="font-mono text-white">www.streetify.lk</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <span style={{ color: "#4ade80" }}>📍</span>
                    <span>Colombo, Sri Lanka 🇱🇰</span>
                  </div>
                </div>
              </div>

              {/* Tech stack */}
              <div
                className="p-3 rounded-xl"
                style={{ background: "rgba(6,14,30,0.6)", border: "1px solid rgba(30,58,95,0.4)" }}
              >
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2" style={{ color: "#4a6580" }}>
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Spring Boot 3", "MSSQL", "React 18", "Tailwind", "WebSocket", "JWT RS256", "OpenStreetMap"].map(t => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(30,58,95,0.6)", color: "#64748b", border: "1px solid rgba(30,58,95,0.5)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Eco badge */}
              <div
                className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "rgba(5,46,22,0.4)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <span className="text-xl float-anim">🌿</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#4ade80" }}>Carbon Neutral Initiative</p>
                  <p className="text-[10px]" style={{ color: "#16a34a" }}>1 tree planted per 100 trips</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-5 pt-6"
            style={{ borderTop: "1px solid rgba(34,197,94,0.08)" }}
          >
            {/* Left: copyright + links */}
            <div className="text-center md:text-left space-y-2">
              <p className="text-xs" style={{ color: "#64748b" }}>
                Website protected by advanced security measures. Unauthorized use is prohibited.
              </p>
              <p className="text-xs" style={{ color: "#4a6580" }}>
                Copyright © 2026 Streetify — All Rights Reserved · Sri Lanka
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs">
                <button
                  onClick={() => { setTourStep(0); setShowTour(true); }}
                  className="transition-colors hover:underline font-medium"
                  style={{ color: "#22c55e" }}
                >
                  Platform Feature Tour
                </button>
                <button
                  onClick={() => setShowDataRetention(true)}
                  className="transition-colors hover:underline font-medium"
                  style={{ color: "#22c55e" }}
                >
                  Data Retention Policy
                </button>
                <button
                  onClick={() => setShowMobileApp(true)}
                  className="transition-colors hover:underline font-medium"
                  style={{ color: "#22c55e" }}
                >
                  Get Mobile App 📱
                </button>
              </div>
            </div>

            {/* Right: social icons */}
            <div className="flex items-center gap-2.5 flex-none">
              {[
                {
                  label: "Facebook",
                  bg: "#1877F2",
                  svg: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
                {
                  label: "Instagram",
                  bg: "linear-gradient(135deg, #f09433, #dc2743, #bc1888)",
                  svg: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  ),
                },
                {
                  label: "LinkedIn",
                  bg: "#0077B5",
                  svg: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  ),
                },
                {
                  label: "YouTube",
                  bg: "#FF0000",
                  svg: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95 hover:shadow-xl"
                  style={{ background: s.bg }}
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modal: Feature Tour ── */}
      {showTour && modalOverlay(
        <div className={modalBox} style={modalBoxStyle}>
          <button
            onClick={() => setShowTour(false)}
            className="absolute top-4 right-4 text-ash-dark hover:text-white text-xl transition-colors"
          >✕</button>

          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-3xl p-3 rounded-2xl"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              {TOUR_STEPS[tourStep].icon}
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: "#4ade80" }}>
                Step {tourStep + 1} of {TOUR_STEPS.length} — {TOUR_STEPS[tourStep].actor}
              </span>
              <h3 className="text-base font-bold text-white">{TOUR_STEPS[tourStep].title}</h3>
            </div>
          </div>

          <p
            className="text-xs leading-relaxed p-4 rounded-xl mb-5"
            style={{ background: "rgba(6,14,30,0.7)", border: "1px solid rgba(30,58,95,0.5)", color: "#94a3b8" }}
          >
            {TOUR_STEPS[tourStep].desc}
          </p>

          {/* Stepper dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setTourStep(idx)}
                className="h-1.5 rounded-full cursor-pointer transition-all"
                style={{
                  width: idx === tourStep ? "2rem" : "0.5rem",
                  background: idx === tourStep ? "#22c55e" : "rgba(30,58,95,0.7)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              disabled={tourStep === 0}
              onClick={() => setTourStep(p => Math.max(0, p - 1))}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
              style={{ background: "rgba(30,58,95,0.5)", color: "#94a3b8" }}
            >← Previous</button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTour(false)} className="px-3 py-1.5 text-xs text-ash-dark hover:text-white transition-colors">
                Close
              </button>
              {tourStep < TOUR_STEPS.length - 1 ? (
                <button
                  onClick={() => setTourStep(p => Math.min(TOUR_STEPS.length - 1, p + 1))}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
                >Next →</button>
              ) : (
                <button
                  onClick={() => setShowTour(false)}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
                >Finish ✓</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Data Retention ── */}
      {showDataRetention && modalOverlay(
        <div className={modalBox} style={modalBoxStyle}>
          <button onClick={() => setShowDataRetention(false)} className="absolute top-4 right-4 text-ash-dark hover:text-white text-xl">✕</button>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔒</span>
            <h3 className="text-base font-bold text-white">Data Retention & Security Policy</h3>
          </div>
          <div
            className="text-xs space-y-3 p-4 rounded-xl leading-relaxed max-h-80 overflow-y-auto thin-scroll"
            style={{ background: "rgba(6,14,30,0.7)", border: "1px solid rgba(30,58,95,0.5)", color: "#94a3b8" }}
          >
            <p><strong className="text-white">1. Cryptographic Protection:</strong> All passwords are hashed using BCrypt strength 12. Plaintext credentials are never persisted.</p>
            <p><strong className="text-white">2. Realtime Telemetry:</strong> GPS coordinates are held in transient memory for the active trip duration only, then discarded post-completion.</p>
            <p><strong className="text-white">3. Financial Ledger:</strong> Ride receipts and 15% commissions are retained for a 7-year statutory audit period under Sri Lankan financial law.</p>
            <p><strong className="text-white">4. Driver Documents:</strong> Verification documents are stored in encrypted filesystem volumes accessible only to Senior Driver Coordinators.</p>
            <p><strong className="text-white">5. Audit Trail Immutability:</strong> The <code className="text-eco-glow">audit_logs</code> table in MSSQL is append-only. No deletion of governance events is permitted.</p>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setShowDataRetention(false)}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
            >Understood & Close</button>
          </div>
        </div>
      )}

      {/* ── Modal: Mobile App ── */}
      {showMobileApp && modalOverlay(
        <div
          className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-center text-white"
          style={{ ...modalBoxStyle }}
        >
          <button onClick={() => setShowMobileApp(false)} className="absolute top-4 right-4 text-ash-dark hover:text-white text-xl">✕</button>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Get Streetify Mobile</h3>
          <p className="text-xs mb-5" style={{ color: "#64748b" }}>
            Download the native mobile client for Passengers and Drivers (Android APK & iOS TestFlight).
          </p>
          <div
            className="bg-white p-3 rounded-xl w-32 h-32 mx-auto mb-5 flex items-center justify-center shadow-xl"
          >
            <div className="w-full h-full border-4 border-gray-900 flex flex-col items-center justify-center font-mono text-[9px] text-gray-900 text-center font-bold">
              <span>[QR CODE]</span>
              <span className="text-[7px] text-gray-500 mt-1">streetify.lk/app</span>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { alert("Streetify APK v2.0 — download initiated."); setShowMobileApp(false); }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", boxShadow: "0 0 16px rgba(34,197,94,0.25)" }}
            >
              <span>⬇️</span> Download Android APK
            </button>
            <button
              onClick={() => { alert("iOS TestFlight invitation sent to registered email."); setShowMobileApp(false); }}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(15,36,64,0.6)", border: "1px solid rgba(30,58,95,0.5)", color: "#94a3b8" }}
            >
              Join iOS TestFlight
            </button>
          </div>
        </div>
      )}
    </>
  );
}
