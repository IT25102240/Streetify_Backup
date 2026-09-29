import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api/apiClient";

interface SystemStatusIndicatorProps {
  className?: string;
}

export default function SystemStatusIndicator({ className = "" }: SystemStatusIndicatorProps) {
  const [backendAlive, setBackendAlive] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/me`, { method: "OPTIONS" });
        if (isMounted) setBackendAlive(true);
      } catch (e) {
        if (isMounted) setBackendAlive(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`py-8 my-6 flex flex-col items-center justify-center gap-4 relative z-0 rounded-2xl ${className}`}
      style={{
        background: "#02050a",
        border: "1px solid rgba(34, 197, 94, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      <p className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
        System Status Monitor
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Frontend Badge */}
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-eco shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          <span className="text-sm font-black text-eco tracking-wide">
            FRONTEND LIVE
          </span>
        </div>

        {/* Backend Badge */}
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all"
          style={{
            background: backendAlive
              ? "rgba(34, 197, 94, 0.08)"
              : backendAlive === false
              ? "rgba(239, 68, 68, 0.08)"
              : "rgba(255, 255, 255, 0.02)",
            border: backendAlive
              ? "1px solid rgba(34, 197, 94, 0.25)"
              : backendAlive === false
              ? "1px solid rgba(239, 68, 68, 0.25)"
              : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shadow-lg ${
              backendAlive
                ? "animate-pulse bg-eco shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                : backendAlive === false
                ? "animate-pulse bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : "bg-slate-500"
            }`}
          />
          <span
            className={`text-sm font-black tracking-wide ${
              backendAlive
                ? "text-eco"
                : backendAlive === false
                ? "text-red-500"
                : "text-slate-400"
            }`}
          >
            {backendAlive
              ? "BACKEND LIVE"
              : backendAlive === false
              ? "BACKEND OFFLINE"
              : "PINGING BACKEND..."}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CompactStatusIndicator() {
  const [backendAlive, setBackendAlive] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/me`, { method: "OPTIONS" });
        if (isMounted) setBackendAlive(true);
      } catch (e) {
        if (isMounted) setBackendAlive(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-eco/10 border border-eco/30 text-[11px] font-bold text-eco font-mono">
        <span className="w-2 h-2 rounded-full animate-pulse bg-eco shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
        FRONTEND LIVE
      </div>
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono border ${
          backendAlive
            ? "bg-eco/10 border-eco/30 text-eco"
            : backendAlive === false
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            backendAlive
              ? "animate-pulse bg-eco shadow-[0_0_6px_rgba(34,197,94,0.8)]"
              : backendAlive === false
              ? "animate-pulse bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
              : "bg-slate-500"
          }`}
        />
        {backendAlive
          ? "BACKEND LIVE"
          : backendAlive === false
          ? "BACKEND OFFLINE"
          : "PINGING..."}
      </div>
    </div>
  );
}
