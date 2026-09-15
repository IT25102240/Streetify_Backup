/**
 * Streetify shared UI primitives
 * Pill · Card · Btn · Field · HR · WsLive · StatCard · Toast · PwStrength
 */
import React, { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ── Pill ── */
type PillColor = "green" | "red" | "orange" | "blue" | "slate" | "navy" | "yellow" | "gray" | "purple";
const PILL_CLS: Record<PillColor, string> = {
  green:  "bg-emerald-100 text-emerald-700",
  red:    "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
  blue:   "bg-blue-100 text-blue-700",
  slate:  "bg-slate-100 text-slate-600",
  navy:   "bg-blue-900 text-blue-100",
  yellow: "bg-amber-100 text-amber-700",
  gray:   "bg-slate-200 text-slate-500",
  purple: "bg-purple-100 text-purple-700",
};
export function Pill({ color = "slate", children }: { color?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${PILL_CLS[color as PillColor] ?? PILL_CLS.slate}`}>
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
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${hover ? "cursor-pointer hover:shadow-md hover:border-slate-300 transition-all" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Btn ── */
export type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type BtnSize = "xs" | "sm" | "md" | "lg" | "xl";

const BTN_V: Record<BtnVariant, string> = {
  primary:   "bg-blue-700 hover:bg-blue-800 text-white shadow-sm",
  secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300",
  ghost:     "bg-transparent hover:bg-slate-100 text-slate-600",
  danger:    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  success:   "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
};
const BTN_S: Record<BtnSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-lg",
  sm: "px-3.5 py-1.5 text-sm rounded-xl",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-base rounded-xl",
  xl: "px-6 py-3 text-base rounded-xl",
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
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none
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
      <span className="block text-sm font-bold text-slate-700 mb-1.5">{label}</span>
      <input
        {...props}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-shadow
          ${error ? "border-red-400 focus:ring-red-300" : "border-slate-300 focus:ring-blue-500"}
          ${className ?? ""}
        `}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
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
      <span className="block text-sm font-bold text-slate-700 mb-1.5">{label}</span>
      <textarea
        {...props}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none transition-shadow
          ${error ? "border-red-400 focus:ring-red-300" : "border-slate-300 focus:ring-blue-500"}
        `}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}

/* ── HR ── */
export function HR({ label }: { label?: string }) {
  if (!label) return <hr className="border-slate-200 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-slate-200" />
      <span className="text-xs text-slate-400 font-semibold">{label}</span>
      <hr className="flex-1 border-slate-200" />
    </div>
  );
}

/* ── WsLive — WebSocket connection indicator ── */
export function WsLive({ label = "Live", connected = true }: { label?: string; connected?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${connected ? "text-emerald-600" : "text-slate-400"}`}>
      <span className={`relative inline-flex w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`}>
        {connected && <span className="pulse-dot absolute inset-0 rounded-full bg-emerald-500 opacity-75" />}
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
    <Card className={`p-4 ${accent ? "bg-blue-700 border-blue-600" : ""}`}>
      {icon && <p className="text-2xl mb-2">{icon}</p>}
      <p className={`text-2xl font-extrabold font-mono ${accent ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-xs font-semibold mt-0.5 ${accent ? "text-blue-200" : "text-slate-500"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-blue-300" : "text-slate-400"}`}>{sub}</p>}
    </Card>
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
  const bg = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-blue-700" }[type];
  const icon = { success: "✅", error: "❌", info: "ℹ️" }[type];
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] ${bg} text-white px-5 py-4 rounded-2xl shadow-2xl max-w-sm toast-enter flex items-start gap-3`}
    >
      <span className="text-xl flex-none mt-0.5">{icon}</span>
      <div>
        <p className="font-extrabold text-sm leading-snug">{message}</p>
        {sub && <p className="text-xs opacity-80 mt-1 font-mono">{sub}</p>}
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
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500", "bg-emerald-600"];
  return { score: s, label: labels[s] ?? labels[4], color: colors[s] ?? colors[4] };
}

export function PwStrength({ password }: { password: string }) {
  const { score, label, color } = scorePassword(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all ${i <= score ? color : "bg-slate-200"}`} />
        ))}
      </div>
      {label && <p className={`text-xs font-semibold mt-1 ${score <= 2 ? "text-red-500" : score === 3 ? "text-yellow-600" : "text-emerald-600"}`}>{label}</p>}
    </div>
  );
}
