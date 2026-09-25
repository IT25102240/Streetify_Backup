import { useState } from "react";

interface FooterProps {
  onNavigate?: (screen: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [showTour, setShowTour] = useState(false);
  const [showDataRetention, setShowDataRetention] = useState(false);
  const [showMobileApp, setShowMobileApp] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const TOUR_STEPS = [
    {
      title: "Passenger Ride Booking & Tracking",
      actor: "Passenger",
      icon: "📍",
      desc: "Interactive OpenStreetMap with Leaflet, GPS geolocation detection, fare estimates for Tuk, Car, Van, Bike, and real-time driver tracking with live cancellation reason prompts.",
    },
    {
      title: "Driver Dispatch & State Machine",
      actor: "Driver",
      icon: "🚗",
      desc: "Incoming trip acceptance via WebSocket, 4-stage state machine (En Route → Arrived → In Progress → Completed), 5-minute passenger no-show cancellation fee, and wallet earnings tracker.",
    },
    {
      title: "Dual Payment Gateway & 3D Secure",
      actor: "Passenger / Finance",
      icon: "💳",
      desc: "Supports PayHere Sri Lanka (Visa, MasterCard, Genie) and Stripe with realistic 3DS OTP authorization modal, instant receipt printing, and 15% platform commission deductions.",
    },
    {
      title: "Senior Driver Coordinator Queue",
      actor: "Senior Driver Coordinator",
      icon: "📋",
      desc: "Document review queue for driving licenses and vehicle revenue permits, approval/rejection decision engine, and driver cancellation rate monitor.",
    },
    {
      title: "Customer Support & Dispute Portal",
      actor: "Customer Support Officer",
      icon: "🎧",
      desc: "Formal ticket investigation with passenger/driver ride details, one-click resolution dispatch, and automated passenger wallet refund crediting directly in MSSQL.",
    },
    {
      title: "System Admin & Governance",
      actor: "System Administrator",
      icon: "🛡️",
      desc: "Role-based access control (RBAC), user suspension with temporal cooldowns, immutable audit trail, and live executive analytics dashboard with CSV report export.",
    },
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

  return (
    <>
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-12 pb-8 mt-auto font-sans relative z-30">
        {/* ── Top Grid: Project Info, Modules, Developers, Contact ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Column 1: Project Brand & System Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <span className="text-lg">🚖</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-lg font-extrabold tracking-tight">Streetify</span>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                      v1.0.4 PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Smart Urban Mobility Platform</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Full-stack urban transportation and dispatch ecosystem built with Spring Boot, Microsoft SQL Server, and
                React. Features real-time GPS telemetry, dual payment gateways, and role-based platform governance.
              </p>

              {/* Live Connectivity Badges */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>MSSQL Database: Connected (1433)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400 bg-blue-950/40 border border-blue-800/50 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>Backend REST & WS: Active (:8080)</span>
                </div>
              </div>
            </div>

            {/* Column 2: Lead Developers & Module Allocation */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>👥</span> Developers & Project Owners
              </h4>
              <p className="text-[11px] text-slate-400">SLIIT Software Engineering Capstone (2Y1S)</p>

              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-blue-400 font-bold">1.</span>
                  <div>
                    <span className="text-white font-semibold">Vidura Rammandalagedara</span>
                    <span className="block text-[10px] text-slate-400 font-mono">System Architecture & Super Admin</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <div>
                    <span className="text-white font-semibold">Lahiru Nayanamina</span>
                    <span className="block text-[10px] text-slate-400 font-mono">User Management & Security</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-amber-400 font-bold">3.</span>
                  <div>
                    <span className="text-white font-semibold">Chanuka Dharmakeerthi</span>
                    <span className="block text-[10px] text-slate-400 font-mono">Booking, Dispatch & Telemetry</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-purple-400 font-bold">4.</span>
                  <div>
                    <span className="text-white font-semibold">Tharindu Senaka</span>
                    <span className="block text-[10px] text-slate-400 font-mono">Driver Verification & Fleet</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-cyan-400 font-bold">5.</span>
                  <div>
                    <span className="text-white font-semibold">Daham Edirisinghe</span>
                    <span className="block text-[10px] text-slate-400 font-mono">Payment Gateway & Settlements</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-rose-400 font-bold">6.</span>
                  <div>
                    <span className="text-white font-semibold">Mithun Weerasingha</span>
                    <span className="block text-[10px] text-slate-400 font-mono">Review, Ratings & Feedback</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 3: Primary Actors & Portals */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Actor Portals & Modules
              </h4>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <button
                  onClick={() => handleQuickNav("booking")}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-slate-800 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span>📍</span> Passenger Booking
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-mono">→</span>
                </button>
                <button
                  onClick={() => handleQuickNav("driver")}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-slate-800 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span>🚗</span> Driver Dispatch Console
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-mono">→</span>
                </button>
                <button
                  onClick={() => handleQuickNav("admin")}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-slate-800 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span>📋</span> Driver Coordinator Queue
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-mono">→</span>
                </button>
                <button
                  onClick={() => handleQuickNav("admin")}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-slate-800 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span>🛡️</span> System Administrator
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-mono">→</span>
                </button>
                <button
                  onClick={() => handleQuickNav("payment")}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-slate-800 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span>💳</span> Finance & Commission
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-mono">→</span>
                </button>
                <button
                  onClick={() => handleQuickNav("support")}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 text-slate-300 hover:text-white border border-slate-800 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span>🎧</span> Customer Support Desk
                  </span>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-mono">→</span>
                </button>
              </div>
            </div>

            {/* Column 4: Institution, Contacts & Finished Product Specs */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🏛️</span> Institution & Contact
              </h4>
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span className="text-amber-400">🎓</span> SLIIT Malabe Campus
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Sri Lanka Institute of Information Technology, New Kandy Road, Malabe.
                </p>
                <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-blue-400">📞</span> 24/7 Hotline: <span className="font-mono text-white">011-200-0000</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-emerald-400">✉️</span> Email: <span className="font-mono text-white">contact@streetify.lk</span>
                  </div>
                </div>
              </div>

              {/* Dual Gateway Badges */}
              <div className="border border-slate-800/80 bg-slate-900/40 p-3 rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Payment Gateway Integration
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    🇱🇰 PayHere
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    💳 Stripe 3DS
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    👛 Wallet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════
            Bottom Bar — Exact Look & Feel from User's Uploaded Specification Image
           ══════════════════════════════════════════════════════════════════════════════ */}
        <div className="border-t border-slate-800/80 pt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left side: Security notice, Copyright, and gold links */}
            <div className="space-y-1.5 text-center md:text-left">
              <p className="text-xs text-slate-300 font-medium">
                Website protected by advanced security measures. Unauthorized use is prohibited.
              </p>
              <p className="text-xs text-slate-400">
                Copyright © 2026 SLIIT — All Rights Reserved
              </p>

              {/* Gold/amber interactive action links matching the image */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs">
                <button
                  onClick={() => {
                    setTourStep(0);
                    setShowTour(true);
                  }}
                  className="text-amber-500 hover:text-amber-400 hover:underline transition-colors font-medium text-left"
                >
                  Reset user tour on this page
                </button>
                <button
                  onClick={() => setShowDataRetention(true)}
                  className="text-amber-500 hover:text-amber-400 hover:underline transition-colors font-medium text-left"
                >
                  Data retention summary
                </button>
                <button
                  onClick={() => setShowMobileApp(true)}
                  className="text-amber-500 hover:text-amber-400 hover:underline transition-colors font-medium text-left"
                >
                  Get the mobile app
                </button>
              </div>
            </div>

            {/* Right side: Circular Social Icons (Facebook, Instagram, LinkedIn, YouTube) matching image */}
            <div className="flex items-center gap-3 flex-none">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[#1877F2] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-[#0077B5] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-[#FF0000] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modal 1: Interactive User Tour Walkthrough ── */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fade-in text-white">
            <button
              onClick={() => setShowTour(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {TOUR_STEPS[tourStep].icon}
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                  Step {tourStep + 1} of {TOUR_STEPS.length} — {TOUR_STEPS[tourStep].actor}
                </span>
                <h3 className="text-base font-bold text-white">{TOUR_STEPS[tourStep].title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-6">
              {TOUR_STEPS[tourStep].desc}
            </p>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setTourStep(idx)}
                  className={`h-1.5 rounded-full cursor-pointer transition-all ${
                    idx === tourStep ? "w-8 bg-blue-500" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                disabled={tourStep === 0}
                onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTour(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white"
                >
                  Close
                </button>
                {tourStep < TOUR_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTourStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1))}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                  >
                    Next Feature →
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTour(false)}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                  >
                    Finish Tour ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Data Retention Summary ── */}
      {showDataRetention && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
            <button
              onClick={() => setShowDataRetention(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔒</span>
              <h3 className="text-base font-bold text-white">Data Retention & Security Policy</h3>
            </div>
            <div className="text-xs text-slate-300 space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 leading-relaxed max-h-80 overflow-y-auto">
              <p>
                <strong>1. Cryptographic Protection:</strong> All passwords in Streetify are hashed using BCrypt strength 12
                with salt. Plaintext credentials are never persisted to MSSQL database.
              </p>
              <p>
                <strong>2. Realtime Telemetry:</strong> High-frequency GPS coordinates are held in transient memory and
                WebSocket buffers, retained for the active trip duration only, then discarded post-completion.
              </p>
              <p>
                <strong>3. Financial Ledger:</strong> Ride transaction receipts and 15% platform commissions are
                retained for a statutory 7-year audit duration under Sri Lankan financial regulations.
              </p>
              <p>
                <strong>4. Driver Document Storage:</strong> Verification documents uploaded in multipart format are
                stored under encrypted filesystem volumes and accessible strictly to authorized Senior Driver Coordinators.
              </p>
              <p>
                <strong>5. Audit Trail Immutability:</strong> The <code className="text-blue-400">audit_logs</code> table in
                MSSQL is append-only. No deletion or mutation of governance events is permitted by the application layer.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDataRetention(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Get the Mobile App ── */}
      {showMobileApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center text-white">
            <button
              onClick={() => setShowMobileApp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Get Streetify Mobile</h3>
            <p className="text-xs text-slate-400 mb-4">
              Download the native mobile client for Passengers and Drivers (Android APK & iOS TestFlight).
            </p>

            {/* Mock QR Code for quick demo scan */}
            <div className="bg-white p-4 rounded-xl w-36 h-36 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <div className="w-28 h-28 border-4 border-slate-900 flex flex-col items-center justify-center font-mono text-[9px] text-slate-900 p-1 text-center font-bold">
                <span>[QR CODE]</span>
                <span className="text-[7px] text-slate-600 mt-1">scan to download Streetify APK</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  alert("Streetify APK download simulator: latest release v1.0.4 downloaded.");
                  setShowMobileApp(false);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <span>⬇️</span> Download Android APK (Direct)
              </button>
              <button
                onClick={() => {
                  alert("iOS TestFlight invitation link sent to registered email.");
                  setShowMobileApp(false);
                }}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Join iOS TestFlight
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
