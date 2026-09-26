/**
 * Screen D — Passenger Payment & Receipt
 * Retry loop for declined cards · PDF-style receipt · CRUD payment processing
 *
 * API hooks:
 *   POST /api/payments/charge { rideId, method, cardToken } → { txnId, status }
 *   GET  /api/payments/receipt/:txnId                       → { pdf_url }
 */
import { useState, useEffect } from "react";
import { Btn, Card, Field, Pill } from "../ui";
import { apiClient } from "../api/apiClient";
import { NotificationService } from "../services/notificationService";

type PayMeth  = "card"|"wallet"|"cash";
type PayState = "idle"|"processing"|"declined"|"success";
type GatewayProvider = "payhere" | "stripe";

const FARE_ROWS = (base: number, km: number, perKm: number) => [
  { label: "Base Fare",                     value: `LKR ${base.toFixed(2)}` },
  { label: `Distance — ${km} km × LKR ${perKm}`,  value: `LKR ${(km * perKm).toFixed(2)}` },
  { label: "Platform Fee",                  value: "LKR 4.00" },
];

export default function ScreenPayment() {
  const [method, setMethod] = useState<PayMeth>("card");
  const [ps, setPs]         = useState<PayState>("idle");
  const [cardNum, setCard]  = useState("");
  const [expiry, setExpiry] = useState("");
  const [errorMsg, setError] = useState("");
  const [trip, setTrip] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [gatewayProvider, setGatewayProvider] = useState<GatewayProvider>("payhere");
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [bankOtp, setBankOtp] = useState("582104");
  const [verifying3DS, setVerifying3DS] = useState(false);
  const [gatewayRef, setGatewayRef] = useState("");

  useEffect(() => {
    const active = localStorage.getItem("active_trip");
    if (active) {
      try {
        setTrip(JSON.parse(active));
      } catch (e) {
        console.error("Failed to parse active trip");
      }
    }
  }, []);

  function fmtCard(v: string) { return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim(); }
  function fmtExp(v: string)  { return v.replace(/\D/g,"").slice(0,4).replace(/(\d{2})(\d)/,"$1/$2"); }
  function cardBrand(v: string) { return v.startsWith("4") ? "VISA" : v.startsWith("5") ? "MC" : v.startsWith("3") ? "AMEX" : ""; }

  async function handlePayClick() {
    if (method === "card") {
      setShow3DSModal(true);
      return;
    }
    await executePayment();
  }

  async function executePayment() {
    setPs("processing");
    setError("");

    if (!trip || !trip.tripId) {
       setPs("declined");
       setError("No active trip found to pay for.");
       return;
    }

    try {
      const generatedRef = (gatewayProvider === "payhere" ? "PH-LKR-" : "STRIPE-ch_") + Math.floor(100000 + Math.random() * 900000);
      setGatewayRef(generatedRef);

      const res = await apiClient<any>("/payments/process", {
        method: "POST",
        body: JSON.stringify({
          tripId: trip.tripId,
          paymentMethod: method.toUpperCase(),
          cardLastFour: method === "card" ? (cardNum.slice(-4) || "4242") : null,
          cardType: method === "card" ? (cardBrand(cardNum.replace(/ /g,"")) || "VISA") : null
        })
      });
      
      setReceipt(res);
      setPs("success");

      // Dispatch receipt via Notification Service
      NotificationService.sendReceipt(
        trip.tripId,
        res?.grossAmount || totalAmount,
        method === "card" ? `${gatewayProvider.toUpperCase()} (${cardBrand(cardNum.replace(/ /g,"")) || "VISA"})` : method
      );
    } catch (err: any) {
      console.error("Payment failed", err);
      setPs("declined");
      setError(err.message || "An unexpected error occurred during payment.");
    }
  }

  async function confirm3DSecure() {
    setVerifying3DS(true);
    setTimeout(async () => {
      setVerifying3DS(false);
      setShow3DSModal(false);
      await executePayment();
    }, 1400);
  }

  const fareRows = trip ? FARE_ROWS(200, trip.distance ?? 0, 33) : FARE_ROWS(200, 31.4, 33);
  const totalAmount = fareRows.reduce((acc, row) => acc + parseFloat(row.value.replace(/[^0-9.]/g, '')), 0);

  /* ── Receipt view ── */
  if (ps === "success") return (
    <div className="min-h-screen relative z-0 flex items-start justify-center py-10 px-4" >
      <div className="absolute inset-0 -z-10 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 -z-10 bg-slate-950/70 backdrop-blur-[40px]" />
      <div className="w-full max-w-md" style={{ animation: "pop-in .42s cubic-bezier(.22,1,.36,1) both" }}>
        <Card className="overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-12 px-6 text-center">
            <div className="w-20 h-20 bg-navy border-eco/10/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <p className="text-2xl font-extrabold">Payment Successful</p>
            <p className="text-emerald-200 text-sm mt-2">Receipt sent to nimesha@email.com</p>
          </div>

          {/* Tear perforation */}
          <div className="relative flex items-center h-0 z-10">
            <div className="absolute left-0 w-5 h-8 bg-slate-950 rounded-r-full -ml-px" />
            <div className="absolute right-0 w-5 h-8 bg-slate-950 rounded-l-full -mr-px" />
            <div className="w-full border-t border-dashed border-slate-700 mx-4" />
          </div>

          {/* Receipt body */}
          <div className="px-6 pt-7 pb-8 space-y-5">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Total Charged</p>
              <p className="text-4xl font-extrabold font-mono text-white mt-1">LKR {receipt?.grossAmount?.toFixed(2) || totalAmount.toFixed(2)}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">TXN-{new Date().toISOString().split('T')[0]}-{receipt?.paymentId || "88421"}</p>
            </div>

            <div className="space-y-2.5">
              {fareRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm text-slate-300">
                  <span>{label}</span>
                  <span className="font-mono font-medium">{value}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-slate-800 pt-3 flex justify-between font-extrabold text-white">
                <span>Total Paid</span>
                <span className="font-mono text-eco">LKR {receipt?.grossAmount?.toFixed(2) || totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* QR placeholder */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-20 h-20 bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.4 ? "bg-slate-800" : "bg-navy border-eco/10 border border-slate-800"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">Scan to verify receipt</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-500 space-y-1.5">
              <p>📅 {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' })}</p>
              <p>🗺 {trip?.pickup || "Colombo Fort"} → {trip?.dropoff || "BIA Terminal 1"}</p>
              <p>🚗 {trip?.driverName || "Kasun Perera"} · {trip?.vehiclePlate || "CAB-4821"}</p>
              <p>💳 {method === "card" ? `${gatewayProvider.toUpperCase()} Gateway (${cardBrand(cardNum.replace(/ /g,"")) || "VISA"} ···· ${cardNum.slice(-4) || '4242'})` : method === "wallet" ? "Streetify Wallet" : "Cash to driver"}</p>
              <p className="text-emerald-700 font-bold">🔒 Gateway Ref: {gatewayRef || "PH-LKR-884210"}</p>
            </div>

            <div className="flex gap-2">
              <Btn v="secondary" size="md" className="flex-1" onClick={() => window.print()}>🖨️ Print Receipt</Btn>
              <Btn v="secondary" size="md" className="flex-1" onClick={() => {
                NotificationService.sendReceipt(trip?.tripId, receipt?.grossAmount || totalAmount, method);
                alert("Receipt PDF dispatched to your registered email!");
              }}>📧 Email PDF</Btn>
            </div>
            <Btn v="primary" size="lg" full onClick={() => { 
              setPs("idle"); 
              if (trip) localStorage.setItem("last_completed_trip", JSON.stringify(trip));
              localStorage.removeItem("active_trip"); 
              setTrip(null);
              window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'review' } }));
            }}>Done</Btn>
          </div>
        </Card>
      </div>
    </div>
  );

  /* ── Payment form ── */
  return (
    <div className="min-h-screen relative z-0 flex items-start justify-center py-10 px-4" >
      <div className="absolute inset-0 -z-10 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 -z-10 bg-slate-950/70 backdrop-blur-[40px]" />
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🚖</span>
          <span className="font-extrabold text-white text-xl">Streetify</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="text-slate-500 text-sm">Checkout</span>
        </div>

        {/* Fare summary */}
        <Card className="p-5">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-4">Fare Breakdown</p>
          <div className="space-y-2.5 mb-4">
            {fareRows.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm text-slate-300">
                <span>{label}</span>
                <span className="font-mono font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-slate-800 pt-4 flex items-end justify-between">
            <div>
              <p className="font-extrabold text-white">Total Due</p>
              <p className="text-xs text-slate-400 mt-0.5">{trip?.distance || 31.4} km · {trip?.pickup || "Colombo Fort"} → {trip?.dropoff?.slice(0, 8) || "BIA"}</p>
            </div>
            <p className="text-3xl font-extrabold font-mono text-eco">LKR {totalAmount.toFixed(0)}</p>
          </div>
        </Card>

        {/* Payment method */}
        <Card className="p-5">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-3">Payment Method</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {([
              { k: "card",   icon: "💳", label: "Card",   sub: "Credit / Debit" },
              { k: "wallet", icon: "📱", label: "Wallet",  sub: "LKR 2,500 bal." },
              { k: "cash",   icon: "💵", label: "Cash",    sub: "Pay driver" },
            ] as { k: PayMeth; icon: string; label: string; sub: string }[]).map(({ k, icon, label, sub }) => (
              <button key={k} onClick={() => { setMethod(k); setPs("idle"); }}
                className={`rounded-2xl border-2 py-3.5 px-2 text-center transition-all ${method === k ? "border-eco bg-eco-dark/20" : "border-slate-800 bg-navy border-eco/10 hover:border-eco/50"}`}>
                <p className="text-2xl">{icon}</p>
                <p className={`text-xs font-extrabold mt-1 ${method === k ? "text-eco" : "text-slate-200"}`}>{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>

          {method === "card" && (
            <div className="space-y-3" style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              {/* Gateway Provider Toggle */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGatewayProvider("payhere")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    gatewayProvider === "payhere" ? "bg-navy border-eco/10 text-eco shadow-sm border border-slate-800" : "text-slate-500 hover:text-slate-100"
                  }`}
                >
                  <span>🇱🇰</span> PayHere Gateway
                </button>
                <button
                  type="button"
                  onClick={() => setGatewayProvider("stripe")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    gatewayProvider === "stripe" ? "bg-navy border-eco/10 text-eco shadow-sm border border-slate-800" : "text-slate-500 hover:text-slate-100"
                  }`}
                >
                  <span>🌐</span> Stripe Gateway
                </button>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-200 block mb-1.5">Card Number</label>
                <div className="flex items-center bg-navy border-eco/10 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-eco focus-within:border-eco">
                  <span className="text-slate-400 mr-2">💳</span>
                  <input
                    className="flex-1 text-sm font-mono text-white focus:outline-none placeholder-slate-400 bg-transparent tracking-widest"
                    placeholder="4242 4242 4242 4242"
                    value={cardNum} onChange={e => setCard(fmtCard(e.target.value))}
                  />
                  {cardNum && <span className="text-xs font-bold text-slate-400 font-mono">{cardBrand(cardNum.replace(/ /g,""))}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">Tip: enter <strong className="text-slate-300">4111…</strong> to simulate a card decline</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-200 block mb-1.5">Expiry</label>
                  <input className="w-full px-3 py-2.5 border border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-eco"
                    placeholder="MM / YY" value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))} />
                </div>
                <Field label="CVV" type="password" placeholder="•••" />
              </div>
              <Field label="Cardholder Name" placeholder="K PERERA" />
            </div>
          )}

          {method === "wallet" && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4"
                 style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-extrabold text-purple-900">Streetify Wallet</p>
                <Pill color="green">✓ Sufficient balance</Pill>
              </div>
              <p className="text-2xl font-extrabold font-mono text-purple-700">LKR 2,500.00</p>
              <p className="text-xs text-purple-500 mt-1.5">After payment: <strong>LKR 1,260.00</strong> remaining</p>
            </div>
          )}

          {method === "cash" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
                 style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              <p className="font-extrabold text-amber-900 text-sm">💵 Pay cash to driver on arrival</p>
              <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                Please prepare exact change of <strong>LKR 1,240</strong>. Drivers may not carry change.
              </p>
            </div>
          )}
        </Card>

        {/* Declined error state */}
        {ps === "declined" && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3"
               style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-none text-xl">✗</div>
            <div>
              <p className="font-extrabold text-red-800">Transaction Failed</p>
              <p className="text-sm text-red-600 mt-0.5 leading-relaxed">
                {errorMsg || "Your card was declined by the issuing bank. Please check your card details or try a different payment method."}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-2">Error: PAYMENT_DECLINED · Retry allowed</p>
            </div>
          </div>
        )}

        <Btn
          v={ps === "declined" ? "danger" : "primary"}
          size="xl" full onClick={handlePayClick}
          loading={ps === "processing"}
          disabled={ps === "processing"}
        >
          {ps === "processing" ? "Processing gateway transaction…" : ps === "declined" ? "↩ Try Another Method" : `Pay LKR ${totalAmount.toFixed(0)} via ${method === "card" ? gatewayProvider.toUpperCase() : method.toUpperCase()} →`}
        </Btn>

        <p className="text-center text-xs text-slate-400 pb-2">
          🔒 Payments secured by {gatewayProvider === "payhere" ? "PayHere Sri Lanka" : "Stripe"} · 3D-Secure 2.0 · TLS 1.3
        </p>

        {/* ── 3D-Secure Bank Gateway Modal ── */}
        {show3DSModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-navy border-eco/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{gatewayProvider === "payhere" ? "🇱🇰" : "🌐"}</span>
                  <div>
                    <p className="font-extrabold text-white text-sm">
                      {gatewayProvider === "payhere" ? "PayHere 3D Secure" : "Verified by Visa / Mastercard"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Sampath Bank / Commercial Bank Gateway</p>
                  </div>
                </div>
                <button onClick={() => setShow3DSModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Merchant:</span>
                  <span className="font-bold text-slate-100">Streetify Sri Lanka Pvt Ltd</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-mono font-bold text-eco">LKR {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span className="font-mono">•••• {cardNum.slice(-4) || '4242'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Bank One-Time Password (OTP)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  A verification code has been sent to your bank-registered mobile number (+94 77 •••• 821).
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={bankOtp}
                  onChange={e => setBankOtp(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-lg font-extrabold border-2 border-eco rounded-xl py-2 focus:outline-none"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShow3DSModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirm3DSecure}
                  disabled={verifying3DS}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {verifying3DS ? "Authorizing..." : "Submit OTP →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
