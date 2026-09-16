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

type PayMeth  = "card"|"wallet"|"cash";
type PayState = "idle"|"processing"|"declined"|"success";

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

  async function pay() {
    setPs("processing");
    setError("");

    if (!trip || !trip.tripId) {
       setPs("declined");
       setError("No active trip found to pay for.");
       return;
    }

    try {
      const res = await apiClient<any>("/payments/process", {
        method: "POST",
        body: JSON.stringify({
          tripId: trip.tripId,
          paymentMethod: method.toUpperCase(),
          cardLastFour: method === "card" ? cardNum.slice(-4) : null,
          cardType: method === "card" ? cardBrand(cardNum.replace(/ /g,"")) : null
        })
      });
      
      setReceipt(res);
      setPs("success");
    } catch (err: any) {
      console.error("Payment failed", err);
      setPs("declined");
      setError(err.message || "An unexpected error occurred during payment.");
    }
  }

  const fareRows = trip ? FARE_ROWS(200, trip.distance || 0, 33) : FARE_ROWS(200, 31.4, 33);
  const totalAmount = trip ? trip.fare : 1240;

  /* ── Receipt view ── */
  if (ps === "success") return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md" style={{ animation: "pop-in .42s cubic-bezier(.22,1,.36,1) both" }}>
        <Card className="overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-12 px-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <p className="text-2xl font-extrabold">Payment Successful</p>
            <p className="text-emerald-200 text-sm mt-2">Receipt sent to nimesha@email.com</p>
          </div>

          {/* Tear perforation */}
          <div className="relative flex items-center h-0 z-10">
            <div className="absolute left-0 w-5 h-8 bg-slate-50 rounded-r-full -ml-px" />
            <div className="absolute right-0 w-5 h-8 bg-slate-50 rounded-l-full -mr-px" />
            <div className="w-full border-t border-dashed border-slate-300 mx-4" />
          </div>

          {/* Receipt body */}
          <div className="px-6 pt-7 pb-8 space-y-5">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Total Charged</p>
              <p className="text-4xl font-extrabold font-mono text-slate-900 mt-1">LKR {receipt?.grossAmount?.toFixed(2) || totalAmount.toFixed(2)}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">TXN-{new Date().toISOString().split('T')[0]}-{receipt?.paymentId || "88421"}</p>
            </div>

            <div className="space-y-2.5">
              {fareRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm text-slate-600">
                  <span>{label}</span>
                  <span className="font-mono font-medium">{value}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between font-extrabold text-slate-900">
                <span>Total Paid</span>
                <span className="font-mono text-blue-700">LKR {receipt?.grossAmount?.toFixed(2) || totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* QR placeholder */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.4 ? "bg-slate-800" : "bg-white border border-slate-200"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">Scan to verify receipt</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-500 space-y-1.5">
              <p>📅 {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' })}</p>
              <p>🗺 {trip?.pickup || "Colombo Fort"} → {trip?.dropoff || "BIA Terminal 1"}</p>
              <p>🚗 {trip?.driverName || "Kasun Perera"} · {trip?.vehiclePlate || "CAB-4821"}</p>
              <p>💳 {method === "card" ? `Visa ···· ${cardNum.slice(-4) || '4242'}` : method === "wallet" ? "Streetify Wallet" : "Cash to driver"}</p>
            </div>

            <div className="flex gap-3">
              <Btn v="secondary" size="md" className="flex-1">📧 Email PDF</Btn>
              <Btn v="secondary" size="md" className="flex-1">📲 Share</Btn>
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
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🚖</span>
          <span className="font-extrabold text-slate-900 text-xl">Streetify</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="text-slate-500 text-sm">Checkout</span>
        </div>

        {/* Fare summary */}
        <Card className="p-5">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-4">Fare Breakdown</p>
          <div className="space-y-2.5 mb-4">
            {fareRows.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm text-slate-600">
                <span>{label}</span>
                <span className="font-mono font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-slate-200 pt-4 flex items-end justify-between">
            <div>
              <p className="font-extrabold text-slate-900">Total Due</p>
              <p className="text-xs text-slate-400 mt-0.5">{trip?.distance || 31.4} km · {trip?.pickup || "Colombo Fort"} → {trip?.dropoff?.slice(0, 8) || "BIA"}</p>
            </div>
            <p className="text-3xl font-extrabold font-mono text-blue-700">LKR {totalAmount.toFixed(0)}</p>
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
                className={`rounded-2xl border-2 py-3.5 px-2 text-center transition-all ${method === k ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`}>
                <p className="text-2xl">{icon}</p>
                <p className={`text-xs font-extrabold mt-1 ${method === k ? "text-blue-700" : "text-slate-700"}`}>{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>

          {method === "card" && (
            <div className="space-y-3" style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Card Number</label>
                <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <span className="text-slate-400 mr-2">💳</span>
                  <input
                    className="flex-1 text-sm font-mono text-slate-900 focus:outline-none placeholder-slate-400 bg-transparent tracking-widest"
                    placeholder="4242 4242 4242 4242"
                    value={cardNum} onChange={e => setCard(fmtCard(e.target.value))}
                  />
                  {cardNum && <span className="text-xs font-bold text-slate-400 font-mono">{cardBrand(cardNum.replace(/ /g,""))}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">Tip: enter <strong className="text-slate-600">4111…</strong> to simulate a card decline</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Expiry</label>
                  <input className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          size="xl" full onClick={pay}
          loading={ps === "processing"}
          disabled={ps === "processing"}
        >
          {ps === "processing" ? "Processing payment…" : ps === "declined" ? "↩ Try Another Method" : `Pay LKR ${totalAmount.toFixed(0)} →`}
        </Btn>

        <p className="text-center text-xs text-slate-400 pb-2">
          🔒 Payments secured by Stripe · PCI DSS Level 1 · TLS 1.3
        </p>
      </div>
    </div>
  );
}
