/**
 * Screen B — Passenger Booking
 * Mobile split-view: map top 58vh, booking card bottom scrollable
 *
 * API hooks:
 *   POST /api/rides/estimate   { pickup, dropoff, rideType } → { fare, duration, distance }
 *   POST /api/rides/book       { pickupCoords, dropoffCoords, rideType, paymentMethodId }
 *                              → { rideId, driverId, eta }
 *   WS   /ws/drivers           → { driverId, lat, lng, heading }[]
 *   WS   /ws/trips/:rideId     → { state, driverLat, driverLng, eta }
 */
import { useState, useEffect, useRef } from "react";
import OsmMap, { DriverPin } from "../OsmMap";
import { Btn, Card, Pill, WsLive } from "../ui";
import { apiClient } from "../api/apiClient";

type RideType = "standard" | "xl" | "moto";
type BookingStep = "idle" | "selecting" | "estimating" | "confirm" | "searching" | "matched";

interface DriverPos {
  id: string;
  name: string;
  plate: string;
  top: number;
  left: number;
  eta: number;
  rating: number;
}

const RIDE_TYPES: { key: RideType; label: string; icon: string; desc: string; base: number; perKm: number }[] = [
  { key: "standard", label: "Standard",     icon: "🚗",  desc: "Sedan · up to 4 passengers",   base: 200, perKm: 33 },
  { key: "xl",       label: "Streetify XL", icon: "🚐",  desc: "SUV/Van · up to 7 passengers",  base: 340, perKm: 48 },
  { key: "moto",     label: "Moto",         icon: "🏍️", desc: "Motorcycle · fastest & cheapest", base: 80,  perKm: 18 },
];

const SAVED_PLACES = [
  { icon: "🏠", label: "Home",           addr: "42/B Kotte Road, Nugegoda", lat: 6.8649, lng: 79.8997 },
  { icon: "🏢", label: "Office",         addr: "World Trade Centre, Col 01", lat: 6.9329, lng: 79.8438 },
  { icon: "✈️", label: "BIA Terminal 1", addr: "Bandaranaike Int. Airport", lat: 7.1805, lng: 79.8837 },
  { icon: "🏥", label: "Nawaloka",       addr: "Nawaloka Hospital, Col 02", lat: 6.9208, lng: 79.8519 },
];

const getCoords = (address: string) => {
  const place = SAVED_PLACES.find(p => p.addr.toLowerCase() === address.toLowerCase() || p.label.toLowerCase() === address.toLowerCase());
  if (place) return { lat: place.lat, lng: place.lng };
  // Default coordinates for unknown places (Colombo Fort)
  return { lat: 6.9329, lng: 79.8438 };
};

const INITIAL_DRIVERS: DriverPos[] = [
  { id: "d1", name: "Kasun P.",  plate: "CAB-4821", top: 40, left: 34, eta: 4, rating: 4.91 },
  { id: "d2", name: "Roshan M.", plate: "WP-5503",  top: 58, left: 64, eta: 7, rating: 4.78 },
  { id: "d3", name: "Amara N.",  plate: "WP-2217",  top: 26, left: 21, eta: 9, rating: 4.85 },
];

export default function ScreenBooking() {
  const [pickup, setPickup]       = useState("Colombo Fort Railway Station");
  const [dropoff, setDropoff]     = useState("");
  const [rideType, setRide]       = useState<RideType>("standard");
  const [step, setStep]           = useState<BookingStep>("idle");
  const [fareReady, setFareReady] = useState(false);
  const [wsConnected, setWsConn]  = useState(true);
  const [drivers, setDrivers]     = useState<DriverPos[]>([]);
  const [matchedDriver, setMatch] = useState<DriverPos | null>(null);
  const [searchDots, setDots]     = useState(0);
  const wsTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const DISTANCE = 8.4;
  const selected = RIDE_TYPES.find(r => r.key === rideType)!;
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [bookingError, setBookingError] = useState("");
  const fare = estimatedFare || Math.round(selected.base + estimatedDistance * selected.perKm);

  /* Simulate WS driver positions arriving + drifting */
  useEffect(() => {
    const t = setTimeout(() => setDrivers(INITIAL_DRIVERS), 700);
    wsTickRef.current = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        top:  Math.max(10, Math.min(88, d.top  + (Math.random() - 0.5) * 1.5)),
        left: Math.max(8,  Math.min(90, d.left + (Math.random() - 0.5) * 1.5)),
        eta:  Math.max(1, d.eta + (Math.random() > 0.6 ? -1 : Math.random() > 0.8 ? 1 : 0)),
      })));
    }, 3000);
    return () => { clearTimeout(t); if (wsTickRef.current) clearInterval(wsTickRef.current); };
  }, []);

  /* Real API call for fare estimate */
  useEffect(() => {
    if (step !== "estimating") return;
    setFareReady(false);
    setBookingError("");

    const pCoords = getCoords(pickup);
    const dCoords = getCoords(dropoff);

    apiClient<any>('/rides/estimate', {
      method: 'POST',
      body: JSON.stringify({
        pickupAddress: pickup,
        pickupLat: pCoords.lat,
        pickupLng: pCoords.lng,
        dropoffAddress: dropoff,
        dropoffLat: dCoords.lat,
        dropoffLng: dCoords.lng,
        rideType: rideType.toUpperCase()
      })
    })
    .then(data => {
      setEstimatedFare(data.totalFare || data.estimatedFare || data.fare || 0);
      setEstimatedDistance(data.distanceKm || data.estimatedDistanceKm || DISTANCE);
      setFareReady(true);
      setStep("confirm");
    })
    .catch(err => {
      console.error(err);
      setBookingError(err.message || "Failed to estimate fare.");
      setStep("selecting");
    });
  }, [step, rideType, pickup, dropoff]);

  /* Searching animation dots */
  useEffect(() => {
    if (step === "searching") {
      dotRef.current = setInterval(() => setDots(d => (d + 1) % 4), 500);
      const t = setTimeout(() => {
        if (dotRef.current) clearInterval(dotRef.current);
        setMatch(drivers[0] ?? INITIAL_DRIVERS[0]);
        setStep("matched");
      }, 3200);
      return () => { clearTimeout(t); if (dotRef.current) clearInterval(dotRef.current); };
    }
  }, [step, drivers]);

  function pickSavedPlace(addr: string) {
    setDropoff(addr);
    setStep("selecting");
    setFareReady(false);
  }

  const FARE_ROWS = [
    { label: "Base fare",    value: `LKR ${selected.base}` },
    { label: `${estimatedDistance.toFixed(1)} km × LKR ${selected.perKm}`, value: `LKR ${Math.round(estimatedDistance * selected.perKm)}` },
    { label: "Platform fee", value: "LKR 4" },
  ];

  return (
    <div
      className="flex flex-col bg-[#0f1923] overflow-hidden"
      style={{ minHeight: "100dvh", maxWidth: 430, margin: "0 auto" }}
    >
      {/* ── MAP (top 58%) ── */}
      <div className="relative flex-none" style={{ height: "58dvh" }}>
        <OsmMap
          height="100%"
          dark
          animate={step === "confirm" || step === "searching" || step === "matched"}
          showPickup
          showDropoff={!!dropoff}
          className="w-full h-full"
        >
          {drivers.map(d => (
            <DriverPin
              key={d.id}
              top={`${d.top}%`}
              left={`${d.left}%`}
              label={`${d.name} · ${d.eta}m`}
              online={wsConnected}
            />
          ))}

          {/* Searching overlay */}
          {step === "searching" && (
            <div className="absolute inset-0 bg-[#0f1923]/70 flex items-center justify-center">
              <div className="bg-white rounded-2xl px-7 py-6 text-center shadow-2xl"
                   style={{ animation: "pop-in .4s cubic-bezier(.22,1,.36,1) both" }}>
                <div className="flex justify-center gap-1.5 mb-3">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 bg-blue-700 rounded-full"
                      style={{ animation: `blink 1.2s ease-in-out ${i * 0.22}s infinite` }}
                    />
                  ))}
                </div>
                <p className="font-extrabold text-slate-900">Finding your driver{"."[searchDots % 4] ?? "..."}</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">WS /ws/drivers · Colombo Metro</p>
              </div>
            </div>
          )}
        </OsmMap>

        {/* WS status badge */}
        <div className="absolute top-3 left-3 bg-[#0f1923]/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
          <WsLive label={`${drivers.length} nearby`} connected={wsConnected} />
        </div>

        {/* Map controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {["+","−"].map(c => (
            <button key={c}
              className="w-8 h-8 bg-white rounded-lg shadow text-slate-700 font-extrabold text-base flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
              {c}
            </button>
          ))}
        </div>

        {/* My location button */}
        <button className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-lg hover:bg-slate-50 active:scale-95 transition-all">
          🎯
        </button>
      </div>

      {/* ── BOOKING CARD (bottom 42%) ── */}
      <div className="flex-1 bg-slate-100 rounded-t-3xl -mt-5 overflow-y-auto">
        <div className="px-4 pt-5 pb-8 space-y-3">

          {/* Driver matched banner */}
          {step === "matched" && matchedDriver && (
            <div
              className="bg-emerald-600 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-lg"
              style={{ animation: "slide-in .4s cubic-bezier(.22,1,.36,1) both" }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-none">🚗</div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-white">Driver on the way!</p>
                <p className="text-xs text-emerald-100 font-mono truncate">
                  {matchedDriver.name} · {matchedDriver.plate} · ★ {matchedDriver.rating} · ETA {matchedDriver.eta} min
                </p>
              </div>
              <Pill color="green">Matched</Pill>
            </div>
          )}

          {/* Location inputs */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {/* Route dots */}
              <div className="flex flex-col items-center gap-0.5 flex-none py-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm" />
                {[0,1,2,3].map(i => <div key={i} className="w-0.5 h-1.5 bg-slate-300 rounded-full mt-0.5" />)}
                <div className="w-3 h-3 bg-blue-700 rounded-full shadow-sm mt-0.5" />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <input
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  placeholder="Pickup location"
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  value={dropoff}
                  onChange={e => { setDropoff(e.target.value); if (e.target.value.length > 2) setStep("selecting"); }}
                  placeholder="Where to? — type or pick below"
                  className="w-full px-3 py-2 bg-white border-2 border-blue-500 rounded-xl text-sm text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {dropoff && (
                <button onClick={() => { setDropoff(""); setStep("idle"); }}
                  className="text-slate-400 hover:text-slate-600 text-lg flex-none transition-colors">✕</button>
              )}
            </div>

            {/* Saved places */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {SAVED_PLACES.map(p => (
                <button
                  key={p.label}
                  onClick={() => pickSavedPlace(p.addr)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-none border
                    ${dropoff === p.addr
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                >
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Ride type selector */}
          {(step === "selecting" || step === "confirm" || step === "matched") && (
            <div className="space-y-2" style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              {RIDE_TYPES.map(r => {
                const f = Math.round(r.base + DISTANCE * r.perKm);
                return (
                  <button
                    key={r.key}
                    onClick={() => { setRide(r.key); if (step === "confirm") setStep("selecting"); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all
                      ${rideType === r.key
                        ? "border-blue-700 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <span className="text-2xl flex-none">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm">{r.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                    <div className="text-right flex-none">
                      <p className={`font-extrabold font-mono text-sm ${rideType === r.key ? "text-blue-700" : "text-slate-700"}`}>
                        LKR {f.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{estimatedDistance > 0 ? estimatedDistance.toFixed(1) : DISTANCE} km est.</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Fare skeleton */}
          {step === "estimating" && !fareReady && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="skeleton h-3.5 w-28 rounded" />
                <div className="skeleton h-3.5 w-16 rounded ml-auto" />
              </div>
              {[0,1,2].map(i => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
              <div className="skeleton h-11 rounded-xl" />
            </Card>
          )}

          {/* Fare confirmed */}
          {(step === "confirm" || step === "searching" || step === "matched") && (
            <Card className="p-4" style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-extrabold text-slate-900">Fare Estimate</p>
                <Pill color="green">Confirmed</Pill>
              </div>

              <div className="space-y-2 mb-3">
                {FARE_ROWS.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono font-bold text-slate-700">{value}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">Total</span>
                  <span className="font-extrabold font-mono text-blue-700 text-lg">LKR {fare.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-3">
                <span>💳</span>
                <span className="font-mono flex-1">Visa ···· 4821</span>
                <button className="text-blue-600 font-semibold hover:underline">Change</button>
              </div>

              {bookingError && (
                <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-2 border border-red-200">
                  {bookingError}
                </div>
              )}
              {step === "confirm" && (
                <Btn v="primary" size="lg" full onClick={async () => {
                  setStep("searching");
                  const pCoords = getCoords(pickup);
                  const dCoords = getCoords(dropoff);
                  try {
                    const response: any = await apiClient('/rides/book', {
                      method: 'POST',
                      body: JSON.stringify({
                        pickupAddress: pickup,
                        pickupLat: pCoords.lat,
                        pickupLng: pCoords.lng,
                        dropoffAddress: dropoff,
                        dropoffLat: dCoords.lat,
                        dropoffLng: dCoords.lng,
                        rideType: rideType.toUpperCase(),
                        paymentMethod: "CASH"
                      })
                    });
                    localStorage.setItem('active_trip', JSON.stringify({
                      tripId: response.tripId || response.id,
                      fare: response.totalFare || fare,
                      distance: response.distanceKm || estimatedDistance || DISTANCE,
                      pickup: pickup,
                      dropoff: dropoff,
                      driverName: response.driverName || "Assigning...",
                      vehiclePlate: response.vehiclePlate || "..."
                    }));
                  } catch (err: any) {
                    setStep("confirm");
                    setBookingError(err.message || "Failed to book ride");
                  }
                }}>
                  Book {selected.label} — LKR {fare.toLocaleString()} →
                </Btn>
              )}
              {step === "searching" && (
                <Btn v="secondary" size="lg" full disabled>
                  <span className="flex items-center gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full ws-dot"
                            style={{ animationDelay: `${i * 0.18}s` }} />
                    ))}
                  </span>
                  Searching for drivers…
                </Btn>
              )}
              {step === "matched" && (
                <div className="space-y-2">
                  <Btn v="primary" size="lg" full onClick={() => {
                    // Navigate to Payment screen via custom event
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'payment' } }));
                  }}>💳 Go to Payment →</Btn>
                  <Btn v="danger" size="lg" full onClick={() => { setStep("idle"); setMatch(null); localStorage.removeItem('active_trip'); }}>
                    Cancel Ride
                  </Btn>
                </div>
              )}
            </Card>
          )}

          {/* Get estimate CTA */}
          {step === "selecting" && (
            <Btn v="primary" size="lg" full onClick={() => setStep("estimating")} disabled={!dropoff}>
              Get Fare Estimate →
            </Btn>
          )}

          {/* Empty state */}
          {step === "idle" && (
            <div className="text-center py-8 text-slate-400">
              <p className="text-5xl mb-3">📍</p>
              <p className="font-extrabold text-slate-600 text-base">Where are you going?</p>
              <p className="text-sm mt-1">Type a destination or choose a saved place above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
