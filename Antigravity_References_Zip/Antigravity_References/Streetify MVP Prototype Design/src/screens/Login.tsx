/**
 * Screen A — Driver Onboarding & Login
 *
 * API hooks:
 *   POST /api/auth/login        { email, password }    → { jwt, refreshToken, expiresIn }
 *   POST /api/auth/register     { ...fields }          → { driverId, pending: true }
 *   POST /api/docs/upload       FormData               → { docId, status: "pending" }
 *   GET  /api/drivers/:id/status                       → { approved, pending, rejectedDocs }
 *
 * JWT: RS256 · 15-min access token · refresh via POST /api/auth/refresh
 */
import { useState, useRef, DragEvent, ChangeEvent } from "react";
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

export default function ScreenLogin() {
  const [tab, setTab]           = useState<Tab>("login");
  const [step, setStep]         = useState<Step>(1);
  const [jwtBanner, setJwt]     = useState(true);

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
      if (response.fullName) {
        localStorage.setItem("user_name", response.fullName);
      }
      if (response.vehicleInfo) {
        localStorage.setItem("vehicle_info", response.vehicleInfo);
      }
      // Dispatch event to app to navigate to the correct dashboard
      window.dispatchEvent(new CustomEvent("auth-success", { detail: { role: response.role } }));
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4">

      {/* JWT session-expired banner */}
      {jwtBanner && (
        <div
          className="w-full max-w-md mb-5 bg-orange-50 border border-orange-300 rounded-2xl px-5 py-3.5 flex items-start gap-3 shadow-sm"
          style={{ animation: "slide-in .4s cubic-bezier(.22,1,.36,1) both" }}
        >
          <span className="text-orange-500 text-xl flex-none mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-extrabold text-orange-700 text-sm">Session Expired</p>
            <p className="text-xs text-orange-600 mt-0.5 font-mono leading-relaxed">
              Your RS256 JWT token has expired. Please sign in again to continue.
              Access tokens expire after 15 minutes for security.
            </p>
          </div>
          <button
            onClick={() => setJwt(false)}
            className="text-orange-400 hover:text-orange-600 transition-colors flex-none text-xl leading-none ml-1"
          >
            &times;
          </button>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl shadow-lg mb-3">
            <span className="text-2xl">🚖</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Streetify</h1>
          <p className="text-sm text-slate-500 mt-1">User Portal</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-1 mb-5 shadow-sm">
          {(["login", "register-passenger", "register-driver"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setStep(1); setS1Err(""); setS2Err(""); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all
                ${tab === t ? "bg-blue-700 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "login" ? "🔐 Sign In" : t === "register-passenger" ? "🧍 Passenger" : "🚗 Driver"}
            </button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {tab === "login" && (
          <Card className="p-6 space-y-4">
            <Field
              label="Email Address"
              type="email"
              placeholder="driver@example.com"
              value={loginEmail}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPw}
                  onChange={e => setLPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-16 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 hover:text-slate-600 tracking-wider transition-colors"
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {loginErr && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2.5 items-start"
                   style={{ animation: "slide-up .3s cubic-bezier(.22,1,.36,1) both" }}>
                <span className="text-red-500 flex-none mt-0.5">⚠</span>
                <p className="text-sm text-red-700 font-semibold leading-snug">{loginErr}</p>
              </div>
            )}

            <Btn v="primary" size="lg" full onClick={handleLogin} loading={loginLoading}>
              Sign In to User Portal
            </Btn>

            <div className="flex items-center justify-between text-xs pb-4">
              <button className="text-slate-400 hover:text-blue-600 hover:underline transition-colors">Forgot password?</button>
              <button className="text-slate-400 hover:text-blue-600 hover:underline transition-colors">Resend activation email</button>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-mono pt-1 leading-relaxed border-t border-slate-100 mt-4">
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
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all
                      ${step === n ? "bg-blue-700 text-white shadow-md shadow-blue-700/30" : step > n ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                      {step > n ? "✓" : n}
                    </div>
                    <span className={`text-xs font-semibold hidden sm:block ${step === n ? "text-slate-800" : "text-slate-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${step > n ? "bg-emerald-400" : "bg-slate-200"}`} />
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
                  <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{s1Err}</p>
                )}
                <Btn v="primary" size="lg" full onClick={() => { if (validateStep1()) setStep(2); }}>
                  Continue to Vehicle Details →
                </Btn>
              </Card>
            )}

            {/* Step 2 — Vehicle & security */}
            {step === 2 && (
              <Card className="p-6 space-y-4" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Vehicle Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {VEHICLE_TYPES.map(vt => (
                      <button key={vt.k} onClick={() => setVehicle(vt.k)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border-2 transition-all text-center flex flex-col items-center gap-1
                          ${vehicle === vt.k
                            ? "border-blue-700 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
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
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Create Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{s2Err}</p>
                )}

                <div className="flex gap-3">
                  <Btn v="ghost" size="lg" onClick={() => setStep(1)}>← Back</Btn>
                  <Btn v="primary" size="lg" full onClick={() => { if (validateStep2()) setStep(3); }}>
                    Continue to Documents →
                  </Btn>
                </div>
              </Card>
            )}

            {/* Step 3 — Document upload */}
            {step === 3 && (
              <Card className="p-6 space-y-5" style={{ animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both" }}>
                <div>
                  <p className="font-extrabold text-slate-900">Upload Required Documents</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
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
                        <p className="text-sm font-bold text-slate-700">{meta.title}</p>
                        <p className="text-xs text-slate-400 ml-auto">{meta.hint}</p>
                      </div>

                      {!doc ? (
                        <div
                          onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={e => onDrop(key, e)}
                          onClick={() => fileRefs[key].current?.click()}
                          className={`border-2 border-dashed rounded-xl py-5 px-4 text-center cursor-pointer transition-all
                            ${over ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}`}
                        >
                          <p className="text-2xl mb-1">{over ? "📂" : "📎"}</p>
                          <p className="text-sm font-semibold text-slate-600">
                            {over ? "Release to upload" : "Drag & drop or click to browse"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">PDF · JPEG · PNG · max 10 MB</p>
                          <input
                            ref={fileRefs[key]}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => onFileInput(key, e)}
                          />
                        </div>
                      ) : doc.error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                          <span className="text-red-500 text-lg">⚠</span>
                          <p className="text-sm text-red-700 font-semibold flex-1">{doc.error}</p>
                          <button
                            onClick={() => setDocs(d => ({ ...d, [key]: null }))}
                            className="text-xs text-red-500 hover:underline font-bold"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">{doc.done ? "✅" : "⏳"}</span>
                            <p className="text-sm font-semibold text-slate-700 truncate flex-1 min-w-0" title={doc.file}>
                              {doc.file}
                            </p>
                            {doc.done
                              ? <Pill color="green">Uploaded</Pill>
                              : <span className="text-xs font-mono text-blue-600 font-bold">{Math.round(doc.progress)}%</span>
                            }
                            {doc.done && (
                              <button
                                onClick={() => setDocs(d => ({ ...d, [key]: null }))}
                                className="text-slate-400 hover:text-red-500 text-sm leading-none transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {!doc.done && (
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${doc.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Upload progress summary */}
                <div className="flex gap-1">
                  {DOC_KEYS.map(k => (
                    <div key={k} className={`flex-1 h-1 rounded-full ${docs[k]?.done ? "bg-emerald-500" : docs[k] && !docs[k]!.error ? "bg-blue-300" : "bg-slate-200"}`} />
                  ))}
                </div>

                {allDocsUploaded && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                    <span className="text-emerald-500 text-xl">✅</span>
                    <div>
                      <p className="text-sm font-extrabold text-emerald-700">All documents uploaded successfully!</p>
                      <p className="text-xs text-emerald-600 mt-0.5 font-mono">POST /api/docs/upload · Verification in 1–2 business days</p>
                    </div>
                  </div>
                )}

                {submitted && (
                  <div
                    className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center"
                    style={{ animation: "pop-in .4s cubic-bezier(.22,1,.36,1) both" }}
                  >
                    <p className="font-extrabold text-blue-800">Application Submitted!</p>
                    <p className="text-xs text-blue-600 mt-1 font-mono">POST /api/auth/register → driverId pending verification</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Btn v="ghost" size="lg" onClick={() => setStep(2)}>← Back</Btn>
                  <Btn
                    v="primary" size="lg" full
                    disabled={!allDocsUploaded || anyUploading || submitted}
                    loading={anyUploading}
                    onClick={async () => {
                      setSubmitted(true);
                      try {
                        // Register Driver Step 1 (Info)
                        await apiClient('/auth/register/driver', {
                          method: 'POST',
                          body: JSON.stringify({
                            firstName,
                            lastName,
                            email,
                            password: pw,
                            phone,
                            nic: nic,
                            vehicleType: vehicle,
                            numberPlate: plate,
                            yearOfManufacture: parseInt(year)
                          })
                        });
                        // Documents upload simulation (Backend will have POST /api/driver/upload-documents)
                      } catch (e: any) {
                        alert("Registration failed: " + e.message);
                        setSubmitted(false);
                      }
                    }}
                  >
                    {submitted ? "✓ Application Submitted" : allDocsUploaded ? "Submit Application →" : `Upload ${DOC_KEYS.filter(k => !docs[k]?.done).length} more document(s)`}
                  </Btn>
                </div>

                <p className="text-center text-[11px] text-slate-400 leading-relaxed">
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
               <label className="block text-sm font-bold text-slate-700 mb-1.5">Create Password</label>
               <input
                 type="password"
                 placeholder="Minimum 8 characters"
                 value={pw}
                 onChange={e => setPw(e.target.value)}
                 className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
               <PwStrength password={pw} />
             </div>
             {s1Err && (
               <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{s1Err}</p>
             )}
             <Btn
               v="primary" size="lg" full
               loading={loginLoading}
               onClick={async () => {
                 if (!validatePassenger()) {
                    return;
                 }
                 setLLoad(true);
                 try {
                   const response = await apiClient<AuthResponseDTO>('/auth/register/passenger', {
                     method: 'POST',
                     body: JSON.stringify({
                       firstName,
                       lastName,
                       email,
                       password: pw,
                       phone
                     })
                   });
                   // Automatically log them in after registration by saving the token
                   localStorage.setItem("jwt_token", response.accessToken);
                   if (response.fullName) {
                     localStorage.setItem("user_name", response.fullName);
                   }
                   if (response.vehicleInfo) {
                     localStorage.setItem("vehicle_info", response.vehicleInfo);
                   }
                   window.dispatchEvent(new CustomEvent("auth-success", { detail: { role: response.role } }));
                 } catch (e: any) {
                   setS1Err(e.message || "Failed to register.");
                 } finally {
                   setLLoad(false);
                 }
               }}
             >
               Create Passenger Account
             </Btn>
           </Card>
        )}
      </div>
    </div>
  );
}
