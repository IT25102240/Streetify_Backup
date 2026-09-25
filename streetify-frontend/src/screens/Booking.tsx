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
import { useState, useEffect, useRef, useCallback } from "react";
import OsmMap, { DriverPin } from "../OsmMap";
import { Btn, Card, Pill, WsLive } from "../ui";
import { apiClient } from "../api/apiClient";
import { useGeolocation, reverseGeocode } from "../hooks/useGeolocation";
import { NotificationService } from "../services/notificationService";
import type L from "leaflet";

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
  const [pickup, setPickup]       = useState("Detecting your location…");
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
  const leafletMapRef = useRef<L.Map | null>(null);

  /* Real GPS location */
  const { coords: myCoords, error: geoError, loading: geoLoading } = useGeolocation();

  const DISTANCE = 8.4;
  const selected = RIDE_TYPES.find(r => r.key === rideType)!;
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [bookingError, setBookingError] = useState("");
  const fare = estimatedFare || Math.round(selected.base + estimatedDistance * selected.perKm);

  /* Reverse-geocode real GPS position → set as pickup address */
  useEffect(() => {
    if (!myCoords) return;
    reverseGeocode(myCoords.lat, myCoords.lng).then(addr => {
      setPickup(addr);
    });
  }, [myCoords?.lat, myCoords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Recenter map to real GPS on 🎯 button press */
  const recenterToMyLocation = useCallback(() => {
    if (leafletMapRef.current && myCoords) {
      leafletMapRef.current.setView([myCoords.lat, myCoords.lng], 16, { animate: true });
    }
  }, [myCoords]);

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
      setEstimatedFare(data.totalFare ?? data.estimatedFare ?? data.fare ?? 0);
      setEstimatedDistance(data.distanceKm ?? data.estimatedDistanceKm ?? DISTANCE);
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
        const matchedDriver = drivers[0] ?? INITIAL_DRIVERS[0];
        setMatch(matchedDriver);
        setStep("matched");
        NotificationService.sendTripAlert(
          "Driver Assigned! 🚖",
          `${matchedDriver.name} is on the way in ${matchedDriver.plate} (ETA ${matchedDriver.eta}m)`
        );
      }, 3200);
      return () => { clearTimeout(t); if (dotRef.current) clearInterval(dotRef.current); };
    }
  }, [step]); // Removed drivers dependency so the 3.2s timeout doesn't keep resetting

  function pickSavedPlace(addr: string) {
    setDropoff(addr);
    setStep("selecting");
    setFareReady(false);
  }

  const handleCancelTrip = async () => {
    try {
      const activeStr = localStorage.getItem('active_trip');
      if (activeStr) {
        const active = JSON.parse(activeStr);
        if (active?.tripId) {
          await apiClient(`/rides/${active.tripId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason: 'PASSENGER_CANCELLED' })
          }).catch(() => {});
        }
      }
    } catch {}
    localStorage.removeItem('active_trip');
    if (dotRef.current) clearInterval(dotRef.current);
    setStep("idle");
    setMatch(null);
    NotificationService.sendTripAlert("Trip Cancelled ✕", "Your ride request has been cancelled.");
  };

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
        {/* Geo error/loading banner */}
        {(geoLoading || geoError) && (
          <div className="absolute top-0 left-0 right-0 z-[900] px-3 pt-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm border ${
              geoError
                ? "bg-orange-900/80 border-orange-600/60 text-orange-200"
                : "bg-slate-900/80 border-slate-700/60 text-slate-300"
            }`}>
              <span>{geoError ? "⚠️" : "📡"}</span>
              <span>{geoError ?? "Getting your GPS location…"}</span>
            </div>
          </div>
        )}

        <OsmMap
          height="100%"
          dark
          animate={step === "confirm" || step === "searching" || step === "matched"}
          showPickup
          showDropoff={!!dropoff}
          pickupAddress={pickup}
          dropoffAddress={dropoff}
          myLat={myCoords?.lat}
          myLng={myCoords?.lng}
          onMapReady={(map) => { leafletMapRef.current = map; }}
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
              <div
                className="rounded-2xl px-7 py-6 text-center shadow-2xl"
                style={{
                  animation: "pop-in .4s cubic-bezier(.22,1,.36,1) both",
                  background: "rgba(15,36,64,0.95)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="flex justify-center gap-1.5 mb-3">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "#22c55e", animation: `blink 1.2s ease-in-out ${i * 0.22}s infinite` }}
                    />
                  ))}
                </div>
                <p className="font-extrabold text-white">Finding your driver{"."[searchDots % 4] ?? "..."}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: "#4ade80" }}>WS /ws/drivers · Colombo Metro</p>
              </div>
            </div>
          )}
        </OsmMap>

        {/* WS status badge */}
        <div className="absolute top-3 left-3 bg-[#0f1923]/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
          <WsLive label={`${drivers.length} nearby`} connected={wsConnected} />
        </div>

        {/* Map controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => leafletMapRef.current?.zoomIn()}
            title="Zoom in"
            aria-label="Zoom in"
            className="w-8 h-8 bg-white/95 hover:bg-white active:scale-90 rounded-lg shadow text-slate-700 font-extrabold text-base flex items-center justify-center hover:text-blue-600 transition-all cursor-pointer select-none"
          >
            +
          </button>
          <button
            onClick={() => leafletMapRef.current?.zoomOut()}
            title="Zoom out"
            aria-label="Zoom out"
            className="w-8 h-8 bg-white/95 hover:bg-white active:scale-90 rounded-lg shadow text-slate-700 font-extrabold text-base flex items-center justify-center hover:text-blue-600 transition-all cursor-pointer select-none"
          >
            −
          </button>
        </div>

        {/* My location button — re-centers map to real GPS */}
        <button
          onClick={recenterToMyLocation}
          title="Center map on my location"
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-lg active:scale-95 transition-all ${
            myCoords ? "bg-white hover:bg-blue-50" : "bg-white/50 cursor-not-allowed"
          }`}>
          {geoLoading ? "⏳" : "🎯"}
        </button>
      </div>

      {/* ── BOOKING CARD (bottom 42%) ── */}
      <div className="flex-1 rounded-t-3xl -mt-5 overflow-y-auto" style={{ background: "rgba(9,20,40,0.97)", borderTop: "1px solid rgba(34,197,94,0.15)" }}>
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
                  className="w-full px-3 py-2 eco-input text-sm font-semibold"
                />
                <input
                  value={dropoff}
                  onChange={e => { setDropoff(e.target.value); if (e.target.value.length > 2) setStep("selecting"); }}
                  placeholder="Where to? — type or pick below"
                  className="w-full px-3 py-2 eco-input text-sm font-semibold"
                  style={{ borderColor: "rgba(34,197,94,0.4)" }}
                />
              </div>
              {dropoff && (
                <button onClick={() => { setDropoff(""); setStep("idle"); }}
                  className="text-ash-dark hover:text-white text-lg flex-none transition-colors">✕</button>
              )}
            </div>

            {/* Saved places */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {SAVED_PLACES.map(p => (
                <button
                  key={p.label}
                  onClick={() => pickSavedPlace(p.addr)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-none"
                  style={{
                    background: dropoff === p.addr ? "rgba(34,197,94,0.2)" : "rgba(15,36,64,0.6)",
                    border: dropoff === p.addr ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(30,58,95,0.5)",
                    color: dropoff === p.addr ? "#4ade80" : "#94a3b8",
                  }}
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
                const f = Math.round(r.base + (estimatedDistance > 0 ? estimatedDistance : DISTANCE) * r.perKm);
                const isSelected = rideType === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => { setRide(r.key); if (step === "confirm") setStep("selecting"); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                    style={{
                      background: isSelected ? "rgba(34,197,94,0.1)" : "rgba(15,36,64,0.5)",
                      border: isSelected ? "2px solid rgba(34,197,94,0.4)" : "1px solid rgba(30,58,95,0.5)",
                      boxShadow: isSelected ? "0 0 16px rgba(34,197,94,0.1)" : "none",
                    }}
                  >
                    <span className="text-2xl flex-none">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-white text-sm">{r.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{r.desc}</p>
                    </div>
                    <div className="text-right flex-none">
                      <p className="font-extrabold font-mono text-sm" style={{ color: isSelected ? "#4ade80" : "#94a3b8" }}>
                        LKR {f.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: "#4a6580" }}>{estimatedDistance > 0 ? estimatedDistance.toFixed(1) : DISTANCE} km est.</p>
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
                <p className="font-extrabold text-white">Fare Estimate</p>
                <Pill color="eco">Confirmed</Pill>
              </div>

              <div className="space-y-2 mb-3">
                {FARE_ROWS.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <span className="font-mono font-bold" style={{ color: "#94a3b8" }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(34,197,94,0.12)" }}>
                  <span className="font-extrabold text-white text-sm">Total</span>
                  <span className="font-extrabold font-mono text-lg" style={{ color: "#4ade80" }}>LKR {fare.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2 mb-3" style={{ background: "rgba(15,36,64,0.5)", border: "1px solid rgba(30,58,95,0.4)", color: "#64748b" }}>
                <span>💳</span>
                <span className="font-mono flex-1">Visa ···· 4821</span>
                <button className="font-semibold hover:underline" style={{ color: "#4ade80" }}>Change</button>
              </div>

              {bookingError && (
                <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-2 border border-red-200">
                  {bookingError}
                </div>
              )}
              {step === "confirm" && (
                <Btn v="primary" size="lg" full onClick={async () => {
                  setStep("searching");
                  NotificationService.sendTripAlert("Ride Requested 📍", `Searching for available ${selected.label} drivers near ${pickup.slice(0, 25)}…`);
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
                      tripId: response.tripId ?? response.id,
                      fare: response.totalFare ?? fare,
                      distance: response.distanceKm ?? estimatedDistance ?? DISTANCE,
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
                <div className="space-y-2">
                  <Btn v="secondary" size="lg" full disabled>
                    <span className="flex items-center gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full ws-dot"
                              style={{ animationDelay: `${i * 0.18}s` }} />
                      ))}
                    </span>
                    Searching for drivers…
                  </Btn>
                  <Btn v="ghost" size="sm" full onClick={handleCancelTrip}>
                    ✕ Cancel Search
                  </Btn>
                </div>
              )}
              {step === "matched" && (
                <div className="space-y-2">
                  <Btn v="primary" size="lg" full onClick={() => {
                    // Navigate to Payment screen via custom event
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'payment' } }));
                  }}>💳 Go to Payment →</Btn>
                  <Btn v="danger" size="lg" full onClick={handleCancelTrip}>
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
            <div className="text-center py-8" style={{ color: "#4a6580" }}>
              <p className="text-5xl mb-3">📍</p>
              <p className="font-extrabold text-lg" style={{ color: "#94a3b8" }}>Where are you going?</p>
              <p className="text-sm mt-1">Type a destination or choose a saved place above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
