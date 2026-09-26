/**
 * Screen A — Driver Onboarding & Login (Eco Drive Dark Theme v2.0)
 *
 * API hooks:
 *   POST /api/auth/login              { email, password }    → { jwt, ... }
 *   POST /api/auth/register/driver    { ...fields }          → { driverId, pending: true }
 *   POST /api/auth/register/passenger { ...fields }          → { accessToken, ... }
 *   POST /api/docs/upload             FormData               → { docId, status: "pending" }
 */
import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { Btn, Card, Field, HR, PwStrength, Pill } from "../ui";
import { apiClient } from "../api/apiClient";

interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
  verificationStatus: string;
  message: string;
  adminRole?: string;
  vehicleInfo?: string;
}

type Tab  = "login" | "register-driver" | "register-passenger";
type Step = 1 | 2 | 3;

interface DocState {
  file: string;
  progress: number;
  done: boolean;
  error?: string;
}

const VEHICLE_TYPES = [
  { k:"sedan",  label:"Sedan",      icon:"🚗" },
  { k:"suv",    label:"SUV",        icon:"🚙" },
  { k:"van",    label:"Van",        icon:"🚐" },
  { k:"tuk",    label:"Tuk-Tuk",   icon:"🛺" },
  { k:"moto",   label:"Motorcycle", icon:"🏍️" },
];

function simulateUpload(
  file: File,
  onProgress: (p: number) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  if (file.size > 10 * 1024 * 1024) { onError("File exceeds 10 MB limit"); return; }
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 20 + 6;
    if (p >= 100) {
      clearInterval(iv);
      onProgress(100);
      setTimeout(onDone, 250);
    } else {
      onProgress(Math.min(p, 98));
    }
  }, 160);
}

const DOC_KEYS   = ["license", "reg", "insurance"] as const;
type  DocKey     = typeof DOC_KEYS[number];
const DOC_LABEL: Record<DocKey, { title: string; hint: string; icon: string }> = {
  license:   { title:"Driver's Licence",       hint:"Front page clearly visible",     icon:"🪪" },
  reg:       { title:"Vehicle Registration",   hint:"Current registration document",  icon:"📄" },
  insurance: { title:"Insurance Certificate",  hint:"Must be valid and not expired",  icon:"🛡️" },
};

/* ── Hero Feature Cards ── */
const FEATURES = [
  { icon: "📍", title: "Smart Booking",    desc: "GPS-powered live trip booking with real-time driver tracking" },
  { icon: "🌿", title: "Eco Drive",        desc: "Carbon-conscious routing to reduce your environmental impact" },
  { icon: "💳", title: "Secure Payments",  desc: "PayHere & Stripe with 3D-Secure for safe transactions" },
  { icon: "🛡️", title: "Verified Drivers", desc: "All drivers are background checked and document verified" },
];

function SystemStatusIndicator() {
  const [backendAlive, setBackendAlive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await fetch('http://localhost:8080/api/auth/me', { method: 'OPTIONS' });
        setBackendAlive(true);
      } catch (e) {
        setBackendAlive(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-8 flex flex-col items-center justify-center gap-4 relative z-0" style={{ background: "#02050a", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
      <p className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">System Status Monitor</p>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Frontend Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-eco shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          <span className="text-sm font-black text-eco tracking-wide">FRONTEND LIVE</span>
        </div>
        
        {/* Backend Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all" style={{ 
          background: backendAlive ? "rgba(34,197,94,0.08)" : backendAlive === false ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
          border: backendAlive ? "1px solid rgba(34,197,94,0.25)" : backendAlive === false ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.1)"
        }}>
          <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${backendAlive ? "animate-pulse bg-eco shadow-[0_0_8px_rgba(34,197,94,0.8)]" : backendAlive === false ? "animate-pulse bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-slate-500"}`}></span>
          <span className={`text-sm font-black tracking-wide ${backendAlive ? "text-eco" : backendAlive === false ? "text-red-500" : "text-slate-400"}`}>
            {backendAlive ? "BACKEND LIVE" : backendAlive === false ? "BACKEND OFFLINE" : "PINGING BACKEND..."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScreenLogin() {
  const [tab, setTab]           = useState<Tab>("login");
  const [step, setStep]         = useState<Step>(1);

  /* Login state */
  const [loginEmail, setEmail]  = useState("");
  const [loginPw, setLPw]       = useState("");
  const [loginErr, setLErr]     = useState("");
  const [loginLoading, setLLoad]= useState(false);
  const [showPw, setShowPw]     = useState(false);

  /* Step 1 */
  const [firstName, setFirst]   = useState("");
  const [lastName,  setLast]    = useState("");
  const [phone,     setPhone]   = useState("");
  const [email,     setRegEmail]= useState("");
  const [nic,       setNic]     = useState("");
  const [s1Err,     setS1Err]   = useState("");

  /* Step 2 */
  const [vehicle,   setVehicle] = useState("");
  const [plate,     setPlate]   = useState("");
  const [year,      setYear]    = useState("");
  const [pw,        setPw]      = useState("");
  const [pwConfirm, setPwConf]  = useState("");
  const [s2Err,     setS2Err]   = useState("");

  /* Step 3 — docs */
  const [docs, setDocs] = useState<Record<DocKey, DocState | null>>({
    license: null, reg: null, insurance: null,
  });
  const [dragOver, setDragOver] = useState<DocKey | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileRefs = {
    license:   useRef<HTMLInputElement>(null),
    reg:       useRef<HTMLInputElement>(null),
    insurance: useRef<HTMLInputElement>(null),
  };

  function handleFile(key: DocKey, file: File) {
    setDocs(d => ({ ...d, [key]: { file: file.name, progress: 0, done: false } }));
    simulateUpload(
      file,
      p  => setDocs(d => ({ ...d, [key]: { ...d[key]!, progress: p } })),
      () => setDocs(d => ({ ...d, [key]: { ...d[key]!, done: true, progress: 100 } })),
      e  => setDocs(d => ({ ...d, [key]: { ...d[key]!, error: e } })),
    );
  }

  function onDrop(key: DocKey, e: DragEvent) {
    e.preventDefault();
    setDragOver(null);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(key, f);
  }

  function onFileInput(key: DocKey, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(key, f);
    e.target.value = "";
  }

  async function handleLogin() {
    setLErr("");
    if (!loginEmail || !loginPw) { setLErr("Enter your email and password to continue."); return; }
    setLLoad(true);
    try {
      const response = await apiClient<AuthResponseDTO>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPw })
      });
      localStorage.setItem("jwt_token", response.accessToken);
      if (response.fullName)    localStorage.setItem("user_name",    response.fullName);
      if (response.vehicleInfo) localStorage.setItem("vehicle_info", response.vehicleInfo);
      if (response.role)        localStorage.setItem("user_role",    response.role.toLowerCase());
      if (response.adminRole)   localStorage.setItem("admin_role",   response.adminRole);
      window.dispatchEvent(new CustomEvent("auth-success", { detail: { role: response.role, adminRole: response.adminRole } }));
      setLLoad(false);
    } catch (e: any) {
      setLLoad(false);
      setLErr(e.message || "Invalid credentials — check your email and password.");
    }
  }

  function validateStep1() {
    if (!firstName.trim()) { setS1Err("First name is required."); return false; }
    if (!lastName.trim())  { setS1Err("Last name is required."); return false; }
    if (phone.replace(/\D/,"").length < 9) { setS1Err("Enter a valid mobile number."); return false; }
    if (!email.includes("@")) { setS1Err("Enter a valid email address."); return false; }
    if (nic.replace(/\D/,"").length < 9)  { setS1Err("Enter a valid NIC number."); return false; }
    setS1Err(""); return true;
  }

  function validatePassenger() {
    if (!firstName.trim()) { setS1Err("First name is required."); return false; }
    if (!lastName.trim())  { setS1Err("Last name is required."); return false; }
    if (phone.replace(/\D/,"").length < 9) { setS1Err("Enter a valid mobile number."); return false; }
    if (!email.includes("@")) { setS1Err("Enter a valid email address."); return false; }
    if (pw.length < 8) { setS1Err("Password must be at least 8 characters."); return false; }
    setS1Err(""); return true;
  }

  function validateStep2() {
    if (!vehicle)          { setS2Err("Select a vehicle type."); return false; }
    if (!plate.trim())     { setS2Err("Enter the vehicle number plate."); return false; }
    if (!year.trim())      { setS2Err("Enter the year of manufacture."); return false; }
    if (pw.length < 8)     { setS2Err("Password must be at least 8 characters."); return false; }
    if (pw !== pwConfirm)  { setS2Err("Passwords do not match."); return false; }
    setS2Err(""); return true;
  }

  const allDocsUploaded = DOC_KEYS.every(k => docs[k]?.done);
  const anyUploading    = DOC_KEYS.some(k => docs[k] && !docs[k]!.done && !docs[k]!.error);

  const STEPS = [
    { n: 1 as Step, label:"Personal Info"       },
    { n: 2 as Step, label:"Vehicle & Security"  },
    { n: 3 as Step, label:"Documents"           },
  ];

  const tabStyles = (t: Tab) =>
    tab === t
      ? "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-gradient-to-r from-eco-dark to-eco text-white shadow-md shadow-eco/25"
      : "flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-ash hover:text-white hover:bg-navy/40";

  return (
    <div className="flex flex-col">
      <div
        className="min-h-screen flex"
        style={{
          background: "linear-gradient(135deg, #060e1e 0%, #0f2440 50%, #060e1e 100%)",
        }}
      >
      {/* ── Left: Hero Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-10 relative overflow-hidden hero-section"
        style={{ maxWidth: "50vw" }}
      >
        <div className="hero-content">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <img
              src="/logo.png"
              alt="Streetify Logo"
              className="w-10 h-10 rounded-2xl"
              style={{ boxShadow: "0 0 24px rgba(34,197,94,0.4)" }}
            />
            <div>
              <p className="text-2xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.03em" }}>
                Streetify
              </p>
              <p className="text-xs font-bold tracking-widest" style={{ color: "#22c55e" }}>ECO DRIVE PLATFORM</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.03em" }}>
              Smarter rides.<br />
              <span className="gradient-text-eco">Greener cities.</span>
            </h1>
            <p className="text-ash-light text-lg leading-relaxed max-w-sm">
              Sri Lanka's first eco-conscious transportation platform. Book rides, earn green points, and reduce your carbon footprint.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(15,36,64,0.5)",
                  border: "1px solid rgba(34,197,94,0.15)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <p className="text-xl mb-2">{f.icon}</p>
                <p className="text-white font-bold text-sm mb-1">{f.title}</p>
                <p className="text-ash-dark text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust badges */}
        <div className="hero-content flex items-center gap-4 mt-8">
          <div className="flex items-center gap-1.5 text-xs text-ash-dark">
            <span>🔒</span> RS256 JWT Auth
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ash-dark">
            <span>🌿</span> Carbon Neutral
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ash-dark">
            <span>🇱🇰</span> Made in Sri Lanka
          </div>
        </div>
      </div>

      {/* ── Right: Auth Panel ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center py-10 px-5 min-h-screen"
        style={{
          background: "rgba(6,14,30,0.85)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(34,197,94,0.08)",
        }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img
            src="/logo.png"
            alt="Streetify Logo"
            className="w-9 h-9 rounded-xl"
            style={{ boxShadow: "0 0 20px rgba(34,197,94,0.35)" }}
          />
          <div>
            <p className="text-xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Streetify</p>
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#22c55e" }}>ECO DRIVE</p>
          </div>
        </div>

        <div className="w-full" style={{ maxWidth: "420px" }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white mb-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
              {tab === "login" ? "Welcome back" : tab === "register-passenger" ? "Join as Passenger" : "Drive with Us"}
            </h2>
            <p className="text-sm text-ash-dark">
              {tab === "login" ? "Sign in to your Streetify account" : tab === "register-passenger" ? "Create your free passenger account" : "Register as a verified Streetify driver"}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex p-1 gap-1 mb-5 rounded-2xl"
            style={{ background: "rgba(15,36,64,0.6)", border: "1px solid rgba(34,197,94,0.1)" }}
          >
            {(["login", "register-passenger", "register-driver"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setStep(1); setS1Err(""); setS2Err(""); setLErr(""); }}
                className={tabStyles(t)}
              >
                {t === "login" ? "🔐 Sign In" : t === "register-passenger" ? "🧍 Passenger" : "🚗 Driver"}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <Card className="p-6 space-y-4" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
              <Field
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
              />

              <div>
                <label className="block text-sm font-semibold text-ash-light mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPw}
                    onChange={e => setLPw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-16 eco-input text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-ash-dark hover:text-white tracking-wider transition-colors"
                  >
                    {showPw ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {loginErr && (
                <div
                  className="rounded-xl px-4 py-3 flex gap-2.5 items-start"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    animation: "slide-up .3s cubic-bezier(.22,1,.36,1) both",
                  }}
                >
                  <span className="text-red-400 flex-none mt-0.5">⚠</span>
                  <p className="text-sm text-red-300 font-semibold leading-snug">{loginErr}</p>
                </div>
              )}

              <Btn v="eco" size="lg" full onClick={handleLogin} loading={loginLoading}>
                Sign In to Streetify
              </Btn>

              <div className="flex items-center justify-between text-xs pb-2">
                <button className="text-ash-dark hover:text-eco-glow transition-colors">Forgot password?</button>
                <button className="text-ash-dark hover:text-eco-glow transition-colors">Resend activation email</button>
              </div>

              <p
                className="text-center text-[10px] font-mono pt-3 leading-relaxed"
                style={{ color: "rgba(100,116,139,0.6)", borderTop: "1px solid rgba(34,197,94,0.08)" }}
              >
                Protected by RS256 JWT · 15-min access tokens · TLS 1.3
              </p>
            </Card>
          )}

          {/* ── REGISTER DRIVER ── */}
          {tab === "register-driver" && (
            <>
              {/* Step progress */}
              <div className="flex items-center mb-5">
                {STEPS.map(({ n, label }, i) => (
                  <div key={n} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                    <div className="flex items-center gap-2 flex-none">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all"
                        style={{
                          background: step === n
                            ? "linear-gradient(135deg, #16a34a, #22c55e)"
                            : step > n
                              ? "rgba(34,197,94,0.3)"
                              : "rgba(30,58,95,0.6)",
                          color: step === n ? "#fff" : step > n ? "#4ade80" : "#4a6580",
                          boxShadow: step === n ? "0 0 12px rgba(34,197,94,0.4)" : "none",
                        }}
                      >
                        {step > n ? "✓" : n}
                      </div>
                      <span
                        className="text-xs font-semibold hidden sm:block"
                        style={{ color: step === n ? "#e2e8f0" : "#4a6580" }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 h-px mx-2 rounded-full transition-all"
                        style={{ background: step > n ? "rgba(34,197,94,0.4)" : "rgba(30,58,95,0.4)" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1 — Personal info */}
              {step === 1 && (
                <Card className="p-6 space-y-4" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" placeholder="Kasun"  value={firstName} onChange={e => setFirst(e.target.value)} />
                    <Field label="Last Name"  placeholder="Perera" value={lastName}  onChange={e => setLast(e.target.value)} />
                  </div>
                  <Field
                    label="Mobile Number" type="tel"
                    placeholder="+94 77 123 4567"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    hint="Used for trip notifications and OTP"
                  />
                  <Field
                    label="Email Address" type="email"
                    placeholder="driver@example.com"
                    value={email} onChange={e => setRegEmail(e.target.value)}
                  />
                  <Field
                    label="National ID / NIC"
                    placeholder="199012345678"
                    value={nic} onChange={e => setNic(e.target.value)}
                    hint="12-digit NIC · used for identity verification"
                  />
                  {s1Err && (
                    <div
                      className="rounded-xl px-4 py-3 text-sm font-semibold"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                    >
                      ⚠ {s1Err}
                    </div>
                  )}
                  <Btn v="eco" size="lg" full onClick={() => { if (validateStep1()) setStep(2); }}>
                    Continue to Vehicle Details →
                  </Btn>
                </Card>
              )}

              {/* Step 2 — Vehicle & security */}
              {step === 2 && (
                <Card className="p-6 space-y-4" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
                  <div>
                    <label className="block text-sm font-semibold text-ash-light mb-2">Vehicle Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {VEHICLE_TYPES.map(vt => (
                        <button
                          key={vt.k}
                          onClick={() => setVehicle(vt.k)}
                          className="py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
                          style={{
                            background: vehicle === vt.k ? "rgba(34,197,94,0.15)" : "rgba(15,36,64,0.5)",
                            border: vehicle === vt.k ? "2px solid rgba(34,197,94,0.5)" : "1px solid rgba(30,58,95,0.5)",
                            color: vehicle === vt.k ? "#4ade80" : "#64748b",
                            boxShadow: vehicle === vt.k ? "0 0 12px rgba(34,197,94,0.15)" : "none",
                          }}
                        >
                          <span className="text-xl">{vt.icon}</span>
                          {vt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Number Plate"
                      placeholder="CAB-4821"
                      value={plate}
                      onChange={e => setPlate(e.target.value.toUpperCase())}
                      className="font-mono tracking-widest"
                    />
                    <Field
                      label="Year of Manufacture"
                      type="number" placeholder="2019"
                      value={year}
                      onChange={e => setYear(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ash-light mb-1.5">Create Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={pw}
                      onChange={e => setPw(e.target.value)}
                      className="w-full px-4 py-2.5 eco-input text-sm"
                    />
                    <PwStrength password={pw} />
                  </div>

                  <Field
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat your password"
                    value={pwConfirm}
                    onChange={e => setPwConf(e.target.value)}
                    error={pwConfirm && pw !== pwConfirm ? "Passwords do not match" : undefined}
                  />

                  {s2Err && (
                    <div
                      className="rounded-xl px-4 py-3 text-sm font-semibold"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                    >
                      ⚠ {s2Err}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Btn v="ghost" size="lg" onClick={() => setStep(1)}>← Back</Btn>
                    <Btn v="eco" size="lg" full onClick={() => { if (validateStep2()) setStep(3); }}>
                      Continue to Documents →
                    </Btn>
                  </div>
                </Card>
              )}

              {/* Step 3 — Document upload */}
              {step === 3 && (
                <Card className="p-6 space-y-5" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
                  <div>
                    <p className="font-extrabold text-white text-base">Upload Required Documents</p>
                    <p className="text-xs text-ash-dark mt-1 leading-relaxed">
                      PDF or JPEG · max 10 MB each · encrypted at rest · reviewed within 1–2 business days
                    </p>
                  </div>

                  {DOC_KEYS.map(key => {
                    const doc  = docs[key];
                    const meta = DOC_LABEL[key];
                    const over = dragOver === key;
                    return (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{meta.icon}</span>
                          <p className="text-sm font-bold text-ash-light">{meta.title}</p>
                          <p className="text-xs text-ash-dark ml-auto">{meta.hint}</p>
                        </div>

                        {!doc ? (
                          <div
                            onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={e => onDrop(key, e)}
                            onClick={() => fileRefs[key].current?.click()}
                            className="rounded-xl py-5 px-4 text-center cursor-pointer transition-all"
                            style={{
                              border: over ? "2px solid rgba(34,197,94,0.6)" : "2px dashed rgba(30,58,95,0.6)",
                              background: over ? "rgba(34,197,94,0.08)" : "rgba(6,14,30,0.4)",
                            }}
                          >
                            <p className="text-2xl mb-1">{over ? "📂" : "📎"}</p>
                            <p className="text-sm font-semibold text-ash">
                              {over ? "Release to upload" : "Drag & drop or click to browse"}
                            </p>
                            <p className="text-xs text-ash-dark mt-0.5">PDF · JPEG · PNG · max 10 MB</p>
                            <input
                              ref={fileRefs[key]}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={e => onFileInput(key, e)}
                            />
                          </div>
                        ) : doc.error ? (
                          <div
                            className="rounded-xl px-4 py-3 flex items-center gap-3"
                            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
                          >
                            <span className="text-red-400 text-lg">⚠</span>
                            <p className="text-sm text-red-300 font-semibold flex-1">{doc.error}</p>
                            <button
                              onClick={() => setDocs(d => ({ ...d, [key]: null }))}
                              className="text-xs text-red-400 hover:text-red-300 font-bold"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div
                            className="rounded-xl px-4 py-3"
                            style={{ background: "rgba(15,36,64,0.5)", border: "1px solid rgba(34,197,94,0.15)" }}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-base">{doc.done ? "✅" : "⏳"}</span>
                              <p className="text-sm font-semibold text-ash-light truncate flex-1 min-w-0" title={doc.file}>
                                {doc.file}
                              </p>
                              {doc.done
                                ? <Pill color="eco">Uploaded</Pill>
                                : <span className="text-xs font-mono text-eco font-bold">{Math.round(doc.progress)}%</span>
                              }
                              {doc.done && (
                                <button
                                  onClick={() => setDocs(d => ({ ...d, [key]: null }))}
                                  className="text-ash-dark hover:text-red-400 text-sm leading-none transition-colors"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            {!doc.done && (
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,58,95,0.5)" }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${doc.progress}%`,
                                    background: "linear-gradient(to right, #16a34a, #22c55e)",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Progress bar summary */}
                  <div className="flex gap-1">
                    {DOC_KEYS.map(k => (
                      <div
                        key={k}
                        className="flex-1 h-1 rounded-full transition-all"
                        style={{
                          background: docs[k]?.done
                            ? "#22c55e"
                            : docs[k] && !docs[k]!.error
                              ? "rgba(34,197,94,0.3)"
                              : "rgba(30,58,95,0.5)",
                        }}
                      />
                    ))}
                  </div>

                  {allDocsUploaded && (
                    <div
                      className="rounded-xl px-4 py-3 flex items-center gap-2.5"
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
                    >
                      <span className="text-eco-glow text-xl">✅</span>
                      <div>
                        <p className="text-sm font-extrabold text-eco-glow">All documents uploaded!</p>
                        <p className="text-xs text-eco/60 mt-0.5 font-mono">Verification in 1–2 business days</p>
                      </div>
                    </div>
                  )}

                  {submitted && (
                    <div
                      className="rounded-xl px-4 py-3 text-center"
                      style={{
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        animation: "pop-in .4s cubic-bezier(.22,1,.36,1) both",
                      }}
                    >
                      <p className="font-extrabold text-eco-glow">Application Submitted! 🎉</p>
                      <p className="text-xs text-eco/60 mt-1 font-mono">Driver ID created · pending verification</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Btn v="ghost" size="lg" onClick={() => setStep(2)}>← Back</Btn>
                    <Btn
                      v="eco" size="lg" full
                      disabled={!allDocsUploaded || anyUploading || submitted}
                      loading={anyUploading}
                      onClick={async () => {
                        setSubmitted(true);
                        try {
                          await apiClient('/auth/register/driver', {
                            method: 'POST',
                            body: JSON.stringify({
                              firstName,
                              lastName,
                              email,
                              password: pw,
                              phone,
                              nic,
                              vehicleType: vehicle,
                              numberPlate: plate,
                              yearOfManufacture: parseInt(year)
                            })
                          });
                        } catch (e: any) {
                          alert("Registration failed: " + e.message);
                          setSubmitted(false);
                        }
                      }}
                    >
                      {submitted ? "✓ Application Submitted" : allDocsUploaded ? "Submit Application →" : `Upload ${DOC_KEYS.filter(k => !docs[k]?.done).length} more document(s)`}
                    </Btn>
                  </div>

                  <p className="text-center text-[11px] text-ash-dark leading-relaxed">
                    By submitting you agree to the Streetify Driver Terms of Service and Privacy Policy.
                    Your data is encrypted in transit and at rest.
                  </p>
                </Card>
              )}
            </>
          )}

          {/* ── REGISTER PASSENGER ── */}
          {tab === "register-passenger" && (
            <Card className="p-6 space-y-4" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" placeholder="Kasun"  value={firstName} onChange={e => setFirst(e.target.value)} />
                <Field label="Last Name"  placeholder="Perera" value={lastName}  onChange={e => setLast(e.target.value)} />
              </div>
              <Field
                label="Mobile Number" type="tel"
                placeholder="+94 77 123 4567"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
              <Field
                label="Email Address" type="email"
                placeholder="passenger@example.com"
                value={email} onChange={e => setRegEmail(e.target.value)}
              />
              <div>
                <label className="block text-sm font-semibold text-ash-light mb-1.5">Create Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  className="w-full px-4 py-2.5 eco-input text-sm"
                />
                <PwStrength password={pw} />
              </div>
              {s1Err && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                >
                  ⚠ {s1Err}
                </div>
              )}
              <Btn
                v="eco" size="lg" full
                loading={loginLoading}
                onClick={async () => {
                  if (!validatePassenger()) return;
                  setLLoad(true);
                  try {
                    const response = await apiClient<AuthResponseDTO>('/auth/register/passenger', {
                      method: 'POST',
                      body: JSON.stringify({ firstName, lastName, email, password: pw, phone })
                    });
                    localStorage.setItem("jwt_token", response.accessToken);
                    if (response.fullName)    localStorage.setItem("user_name",    response.fullName);
                    if (response.vehicleInfo) localStorage.setItem("vehicle_info", response.vehicleInfo);
                    window.dispatchEvent(new CustomEvent("auth-success", { detail: { role: response.role } }));
                  } catch (e: any) {
                    setS1Err(e.message || "Failed to register.");
                  } finally {
                    setLLoad(false);
                  }
                }}
              >
                Create Passenger Account 🌿
              </Btn>

              <p className="text-center text-[10px] text-ash-dark font-mono leading-relaxed">
                Free account · No hidden fees · Book rides instantly after sign-up
              </p>
            </Card>
          )}

          {/* Bottom eco tagline */}
          <p className="text-center text-xs text-ash-dark mt-6">
            🌿 Every ride counts — Streetify plants 1 tree per 100 trips completed
          </p>
        </div>
      </div>
    </div>

    {/* ── Below Login: Project Vision & Mission ── */}
      <div className="py-20 px-8 relative z-0" style={{ background: "#030810", borderTop: "1px solid rgba(34,197,94,0.15)" }}>
        <div className="absolute inset-0 -z-10 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 -z-10 bg-[#030810]/80 backdrop-blur-3xl" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.03em" }}>
              The future of mobility.<br />
              <span className="text-eco">Driven by nature.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Streetify is not just another ride-hailing app. <strong>The driver comes to you, and you will arrive at the destination you always want to go.</strong> It is a comprehensive ecosystem designed for the modern era, balancing operational excellence with environmental responsibility.
            </p>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="p-6 rounded-2xl transition-transform hover:-translate-y-1" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderLeft: "4px solid #22c55e" }}>
              <h3 className="text-sm font-black text-eco mb-2 uppercase tracking-widest font-mono flex items-center gap-2">
                <span>🌱</span> Our Vision
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                To revolutionize Sri Lanka's transportation ecosystem by bridging advanced technology with environmental sustainability. <strong>The driver comes to you, taking you to the destination you always want to go</strong>, as we aim to create a unified platform that makes every journey a step towards a greener, smarter nation.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl transition-transform hover:-translate-y-1" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)", borderLeft: "4px solid #38bdf8" }}>
              <h3 className="text-sm font-black text-sky-400 mb-2 uppercase tracking-widest font-mono flex items-center gap-2">
                <span>⚡</span> Our Mission
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                To deliver a seamless, highly secure, and real-time ride-hailing experience connecting passengers, drivers, and administrators. Because <strong>the driver comes to you, ensuring you reach the destination you always want to go</strong>. We implement robust RBAC governance, 3DS payments, and WebSocket telemetry to empower driver livelihoods while actively reducing carbon footprints.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <SystemStatusIndicator />
    </div>
  );
}
