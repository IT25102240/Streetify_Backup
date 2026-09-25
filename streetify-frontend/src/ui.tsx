/**
 * Streetify shared UI primitives — Eco Drive Dark Theme v2.0
 * Pill · Card · Btn · Field · HR · WsLive · StatCard · Toast · PwStrength
 */
import React, { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ── Pill ── */
type PillColor = "green" | "red" | "orange" | "blue" | "slate" | "navy" | "yellow" | "gray" | "purple" | "eco";
const PILL_CLS: Record<PillColor, string> = {
  eco:    "pill-eco",
  green:  "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
  red:    "bg-red-900/40 text-red-400 border border-red-700/40",
  orange: "bg-orange-900/40 text-orange-400 border border-orange-700/40",
  blue:   "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  slate:  "bg-slate-800/60 text-slate-400 border border-slate-700/40",
  navy:   "bg-navy-dark/60 text-blue-300 border border-blue-900/40",
  yellow: "bg-amber-900/40 text-amber-400 border border-amber-700/40",
  gray:   "bg-slate-800/40 text-slate-400 border border-slate-700/30",
  purple: "bg-purple-900/40 text-purple-400 border border-purple-700/40",
};
export function Pill({ color = "slate", children }: { color?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${PILL_CLS[color as PillColor] ?? PILL_CLS.slate}`}>
      {children}
    </span>
  );
}

/* ── Card ── */
export function Card({
  children,
  className = "",
  hover = false,
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`eco-card ${hover ? "cursor-pointer hover:border-eco/40 hover:shadow-eco/10 hover:shadow-lg transition-all" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Btn ── */
export type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "eco";
type BtnSize = "xs" | "sm" | "md" | "lg" | "xl";

const BTN_V: Record<BtnVariant, string> = {
  eco:       "bg-gradient-to-r from-eco-dark to-eco text-white shadow-md shadow-eco/20 hover:shadow-eco/40 hover:from-eco hover:to-eco-glow",
  primary:   "bg-gradient-to-r from-navy to-navy-light text-white shadow-md shadow-navy/30 hover:shadow-navy-light/30",
  secondary: "bg-navy-dark/60 hover:bg-navy/60 text-slate-200 border border-navy-light/30 hover:border-eco/30 backdrop-blur-sm",
  ghost:     "bg-transparent hover:bg-navy/30 text-ash-light hover:text-white",
  danger:    "bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md shadow-red-700/30 hover:shadow-red-600/40",
  success:   "bg-gradient-to-r from-eco-dim to-eco text-white shadow-md shadow-eco-dim/30 hover:shadow-eco/40",
};
const BTN_S: Record<BtnSize, string> = {
  xs: "px-3 py-1 text-xs rounded-lg",
  sm: "px-4 py-1.5 text-sm rounded-xl",
  md: "px-5 py-2 text-sm rounded-xl",
  lg: "px-6 py-2.5 text-base rounded-xl",
  xl: "px-8 py-3 text-base rounded-2xl",
};

export function Btn({
  v = "primary",
  size = "md",
  full = false,
  loading = false,
  disabled = false,
  children,
  onClick,
  type = "button",
  className = "",
}: {
  v?: BtnVariant;
  size?: BtnSize;
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep disabled:opacity-40 disabled:pointer-events-none tracking-wide
        ${BTN_V[v as BtnVariant] ?? BTN_V.primary}
        ${BTN_S[size as BtnSize] ?? BTN_S.md}
        ${full ? "w-full" : ""}
        ${className}
      `}
    >
      {loading && <span className="spinner w-4 h-4 flex-none" />}
      {children}
    </button>
  );
}

/* ── Field ── */
type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  wrapClass?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, error, hint, wrapClass = "", className, ...props }: FieldProps) {
  return (
    <label className={`block ${wrapClass}`}>
      <span className="block text-sm font-semibold text-ash-light mb-1.5">{label}</span>
      <input
        {...props}
        className={`w-full px-4 py-2.5 eco-input text-sm placeholder-slate-500 transition-all
          ${error ? "border-red-500/60 focus:ring-red-500/30" : ""}
          ${className ?? ""}
        `}
      />
      {error && <p className="mt-1.5 text-xs text-red-400 font-semibold flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-ash-dark">{hint}</p>}
    </label>
  );
}

/* ── Textarea Field ── */
type TAreaProps = {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextareaField({ label, error, hint, className = "", ...props }: TAreaProps) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold text-ash-light mb-1.5">{label}</span>
      <textarea
        {...props}
        className={`w-full px-4 py-2.5 eco-input text-sm placeholder-slate-500 focus:outline-none focus:ring-2 resize-none transition-all
          ${error ? "border-red-500/60 focus:ring-red-500/30" : ""}
        `}
      />
      {error && <p className="mt-1.5 text-xs text-red-400 font-semibold">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-ash-dark">{hint}</p>}
    </label>
  );
}

/* ── HR ── */
export function HR({ label }: { label?: string }) {
  if (!label) return <hr className="border-navy-light/20 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-navy-light/20" />
      <span className="text-xs text-ash-dark font-semibold tracking-wider uppercase">{label}</span>
      <hr className="flex-1 border-navy-light/20" />
    </div>
  );
}

/* ── WsLive — WebSocket connection indicator ── */
export function WsLive({ label = "Live", connected = true }: { label?: string; connected?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${connected ? "text-eco-glow" : "text-ash-dark"}`}>
      <span className={`relative inline-flex w-2 h-2 rounded-full ${connected ? "bg-eco" : "bg-ash-dark"}`}>
        {connected && <span className="pulse-dot absolute inset-0 rounded-full bg-eco opacity-75" />}
      </span>
      {label}
    </span>
  );
}

/* ── StatCard ── */
export function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
  trend,
}: {
  icon?: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  trend?: string;
}) {
  return (
    <div className={`eco-card p-5 ${accent ? "border-eco/30 bg-eco-faint/40" : ""}`}>
      {icon && <p className="text-2xl mb-2">{icon}</p>}
      <p className={`text-2xl font-extrabold font-mono tracking-tight ${accent ? "text-eco-glow" : "text-white"}`}>{value}</p>
      <p className={`text-xs font-semibold mt-1 uppercase tracking-wider ${accent ? "text-eco/70" : "text-ash-dark"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1.5 ${accent ? "text-eco/50" : "text-ash-dark/70"}`}>{sub}</p>}
      {trend && <p className="text-xs mt-1.5 text-eco-glow font-bold">{trend}</p>}
    </div>
  );
}

/* ── Toast ── */
export function Toast({
  message,
  sub,
  type = "success",
  visible,
}: {
  message: string;
  sub?: string;
  type?: "success" | "error" | "info";
  visible: boolean;
}) {
  if (!visible) return null;
  const styles = {
    success: "bg-gradient-to-r from-eco-dim to-eco-dark border-eco/40",
    error:   "bg-gradient-to-r from-red-800 to-red-700 border-red-600/40",
    info:    "bg-gradient-to-r from-navy-dark to-navy border-navy-light/40",
  }[type];
  const icon = { success: "✅", error: "❌", info: "ℹ️" }[type];
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] ${styles} text-white px-5 py-4 rounded-2xl shadow-2xl max-w-sm toast-enter flex items-start gap-3 border backdrop-blur-md`}
    >
      <span className="text-xl flex-none mt-0.5">{icon}</span>
      <div>
        <p className="font-extrabold text-sm leading-snug">{message}</p>
        {sub && <p className="text-xs opacity-75 mt-1 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

/* ── PwStrength — live password strength meter ── */
function scorePassword(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["", "Too weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-eco", "bg-eco-glow"];
  return { score: s, label: labels[s] ?? labels[4], color: colors[s] ?? colors[4] };
}

export function PwStrength({ password }: { password: string }) {
  const { score, label, color } = scorePassword(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all ${i <= score ? color : "bg-navy-light/30"}`} />
        ))}
      </div>
      {label && <p className={`text-xs font-semibold mt-1.5 ${score <= 2 ? "text-red-400" : score === 3 ? "text-yellow-400" : "text-eco-glow"}`}>{label}</p>}
    </div>
  );
}
