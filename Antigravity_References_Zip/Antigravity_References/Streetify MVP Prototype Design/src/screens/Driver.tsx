/**
 * Screen C — Driver Trip Dashboard
 * Dark theme · large touch targets · online/offline toggle
 * Sequential trip state machine · no-show 5-min cancel timer
 *
 * API hooks:
 *   PATCH /api/drivers/:id/status  { online: boolean }        → { ok }
 *   GET   /api/trips/current       → Trip | null
 *   PATCH /api/trips/:id/state     { state: TripState }       → { ok }
 *   POST  /api/trips/:id/noshow    → { cancelled: true, penalty: 0 }
 *   WS    /ws/trips                → incoming trip assignments
 */
import { useState, useEffect, useRef } from "react";
import OsmMap, { DriverPin } from "../OsmMap";
import { Btn, Card, Pill, WsLive } from "../ui";
import { apiClient } from "../api/apiClient";

type TripState = "idle" | "assigned" | "en_route" | "arrived" | "in_trip" | "completed";

interface Trip {
  id: string;
  passenger: string;
  avatar: string;
  rating: number;
  pickup: string;
  dropoff: string;
  fare: string;
  fareNum: number;
  km: string;
  commission: number;
}

// Remove static ACTIVE_TRIP default

const STATE_ORDER: TripState[] = ["assigned", "en_route", "arrived", "in_trip", "completed"];

const STATE_META: Record<TripState, { label: string; icon: string; next: string }> = {
  idle:      { label: "Idle",           icon: "💤", next: "" },
  assigned:  { label: "Accepted",       icon: "✅", next: "▶ Start Navigation to Pickup" },
  en_route:  { label: "En Route",       icon: "🚗", next: "📍 I Have Arrived at Pickup" },
  arrived:   { label: "Arrived",        icon: "📍", next: "✅ Passenger On Board — Start Trip" },
  in_trip:   { label: "Trip In Progress", icon: "🛣️", next: "🏁 Complete Trip & Collect Payment" },
  completed: { label: "Completed",      icon: "🏁", next: "" },
};

function pad(n: number) { return String(Math.floor(n)).padStart(2, "0"); }

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function ScreenDriver() {
  const [online, setOnline]       = useState(false);
  const [tripState, setState]     = useState<TripState>("idle");
  const [showIncoming, setIncoming] = useState(false);
  const [elapsedSec, setElapsed]  = useState(0);
  const [arrivedSec, setArrived]  = useState(0);
  const [todayEarnings, setEarnings] = useState(6340);
  const [commDebt, setCommDebt]   = useState(1840);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripsToday, setTripsToday] = useState(7);

  const driverName = localStorage.getItem("user_name") || "Kasun Perera";
  const driverInitials = driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const vehicleInfo = localStorage.getItem("vehicle_info") || "CAB-4821 · Toyota Prius";

  const tripTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const arrivedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Poll for available trips when online */
  useEffect(() => {
    if (!online || tripState !== "idle") return;
    
    const fetchTrips = async () => {
      try {
        const trips = await apiClient<any[]>('/rides/available');
        if (trips && trips.length > 0 && !activeTrip) {
          const t = trips[0]; // Just take the first available trip for MVP
          setActiveTrip({
            id: `TRIP-${t.id}`,
            passenger: t.passengerName || "Passenger",
            avatar: "P",
            rating: 5.0,
            pickup: t.pickupAddress,
            dropoff: t.dropoffAddress,
            fare: `LKR ${t.estimatedFare}`,
            fareNum: t.estimatedFare,
            km: t.estimatedDistanceKm?.toString() || "8.4",
            commission: Math.round(t.estimatedFare * 0.15), // 15% commission
          });
          setIncoming(true);
        }
      } catch (err) {
        console.error("Failed to fetch trips", err);
      }
    };

    fetchTrips(); // initial fetch
    const t = setInterval(fetchTrips, 3000); // poll every 3 seconds
    return () => clearInterval(t);
  }, [online, tripState, activeTrip]);

  /* Elapsed trip timer */
  useEffect(() => {
    if (tripState === "in_trip") {
      tripTimer.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (tripTimer.current) clearInterval(tripTimer.current);
      if (tripState !== "completed") setElapsed(0);
    }
    return () => { if (tripTimer.current) clearInterval(tripTimer.current); };
  }, [tripState]);

  /* No-show arrival timer */
  useEffect(() => {
    if (tripState === "arrived") {
      setArrived(0);
      arrivedTimer.current = setInterval(() => setArrived(s => s + 1), 1000);
    } else {
      if (arrivedTimer.current) clearInterval(arrivedTimer.current);
      setArrived(0);
    }
    return () => { if (arrivedTimer.current) clearInterval(arrivedTimer.current); };
  }, [tripState]);

  async function acceptTrip() {
    if (!activeTrip) return;
    try {
      const tripId = activeTrip.id.replace("TRIP-", "");
      await apiClient(`/rides/accept/${tripId}`, { method: 'POST' });
      setIncoming(false);
      setState("assigned");
      setEarnings(e => e + activeTrip.fareNum - activeTrip.commission);
      setCommDebt(d => Math.max(0, d - activeTrip.commission));
      setTripsToday(t => t + 1);
    } catch (err: any) {
      alert("Failed to accept trip: " + err.message);
    }
  }

  function declineTrip() {
    setIncoming(false);
  }

  function advanceState() {
    const idx = STATE_ORDER.indexOf(tripState);
    if (idx < STATE_ORDER.length - 1) setState(STATE_ORDER[idx + 1] as TripState);
  }

  function cancelNoShow() {
    setState("idle");
    setIncoming(false);
  }

  function goOffline() {
    setOnline(false);
    setState("idle");
    setIncoming(false);
  }

  const tripActive = tripState !== "idle" && tripState !== "completed";
  const noShowMin  = arrivedSec >= 300;    // 5 minutes
  const noShowWarn = arrivedSec >= 60;     // 1 minute
  const arrivedMin = Math.floor(arrivedSec / 60);
  const arrivedS   = arrivedSec % 60;

  const stepIndexMap: Record<TripState, number> = {
    idle: -1, assigned: 0, en_route: 1, arrived: 2, in_trip: 3, completed: 4,
  };
  const curIdx = stepIndexMap[tripState];

  return (
    <div
      className="flex flex-col bg-[#0f1923] text-white"
      style={{ minHeight: "100dvh", maxWidth: 430, margin: "0 auto" }}
    >
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-slate-800/80 flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-extrabold text-sm shadow">
            {driverInitials}
          </div>
          <div>
            <p className="font-extrabold text-white leading-tight">{driverName}</p>
            <p className="text-xs text-slate-400 font-mono">{vehicleInfo} · ★ 4.91</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <WsLive label="WS" connected={online} />
          {/* Toggle */}
          <button
            onClick={() => online ? goOffline() : setOnline(true)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${online ? "bg-emerald-500" : "bg-slate-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${online ? "translate-x-7" : ""}`} />
          </button>
          <span className={`text-xs font-extrabold tracking-wide ${online ? "text-emerald-400" : "text-slate-500"}`}>
            {online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      {/* ── Map strip ── */}
      <div className="flex-none" style={{ height: "26dvh" }}>
        <OsmMap
          height="100%"
          dark
          animate={tripActive}
          showPickup={tripActive}
          showDropoff={tripState === "in_trip" || tripState === "completed"}
          className="w-full h-full"
        >
          {online && <DriverPin top="52%" left="30%" label="You" online />}
        </OsmMap>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">

        {/* ── OFFLINE ── */}
        {!online && (
          <>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 px-5 py-8 text-center">
              <p className="text-5xl mb-4">🌙</p>
              <p className="font-extrabold text-white text-xl mb-1">You are offline</p>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Go online to receive trip requests and start earning. Trips are assigned via WebSocket in real-time.
              </p>
              <Btn v="primary" size="xl" full onClick={() => setOnline(true)}>
                Go Online
              </Btn>
            </div>

            {/* Commission debt warning */}
            {commDebt > 0 && (
              <div className="bg-orange-950/50 border border-orange-700/60 rounded-2xl px-4 py-4 flex items-start gap-3">
                <span className="text-2xl flex-none">⚠️</span>
                <div>
                  <p className="font-extrabold text-orange-300 text-sm">Outstanding Commission Debt</p>
                  <p className="text-orange-400 font-mono text-lg font-extrabold mt-0.5">
                    LKR {commDebt.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-500 mt-1 leading-relaxed">
                    This amount will be automatically deducted from your next completed trip payout. Complete {Math.ceil(commDebt / 124)} more trips to clear.
                  </p>
                </div>
              </div>
            )}

            {/* Today's summary */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Trips Today",  v: tripsToday.toString(),             color: "text-blue-300"   },
                { l: "Net Earned",   v: `LKR ${todayEarnings.toLocaleString()}`, color: "text-emerald-400" },
                { l: "Commission",   v: `LKR ${commDebt.toLocaleString()}`,     color: "text-orange-400" },
              ].map(({ l, v, color }) => (
                <div key={l} className="bg-slate-800 rounded-2xl p-3 border border-slate-700 text-center">
                  <p className={`font-extrabold font-mono text-sm ${color}`}>{v}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ONLINE IDLE — waiting for trip ── */}
        {online && tripState === "idle" && !showIncoming && (
          <div className="rounded-2xl bg-slate-800/80 border border-slate-700 px-5 py-8 text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[0,1,2].map(i => (
                <span
                  key={i}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                  style={{ animation: `blink 1.2s ease-in-out ${i * 0.22}s infinite` }}
                />
              ))}
            </div>
            <p className="font-extrabold text-white text-base">Waiting for a trip request…</p>
            <p className="text-sm text-slate-400 mt-1.5 font-mono">WS /ws/trips · Colombo Metro</p>
            <p className="text-xs text-slate-600 mt-4">You will receive an audio + screen alert</p>
          </div>
        )}

        {/* ── INCOMING TRIP OFFER ── */}
        {showIncoming && tripState === "idle" && activeTrip && (
          <div
            className="rounded-2xl bg-blue-950 border-2 border-blue-500 px-5 py-5 shadow-2xl"
            style={{ animation: "slide-in .35s cubic-bezier(.22,1,.36,1) both" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full ws-dot" />
                <p className="font-extrabold text-white">New Trip Request</p>
              </div>
              <Pill color="blue">Via WebSocket</Pill>
            </div>

            {/* Passenger & fare */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center font-extrabold text-white flex-none border border-slate-600">
                {activeTrip.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-white">{activeTrip.passenger}</p>
                <p className="text-xs text-blue-300 font-mono">★ {activeTrip.rating} passenger rating</p>
              </div>
              <div className="text-right flex-none">
                <p className="font-extrabold font-mono text-emerald-400 text-xl">{activeTrip.fare}</p>
                <p className="text-xs text-slate-400 font-mono">{activeTrip.km} km</p>
              </div>
            </div>

            {/* Route */}
            <div className="bg-slate-900/60 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full flex-none mt-0.5" />
                <p className="text-xs text-slate-300 font-mono leading-snug">{activeTrip.pickup}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full flex-none mt-0.5" />
                <p className="text-xs text-slate-300 font-mono leading-snug">{activeTrip.dropoff}</p>
              </div>
            </div>

            {/* Commission info */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-4 px-1">
              <span>Your net: <strong className="text-emerald-400">LKR {(activeTrip.fareNum - activeTrip.commission).toLocaleString()}</strong></span>
              <span>Commission: <strong className="text-orange-400">LKR {activeTrip.commission}</strong> (15%)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Btn v="danger" size="lg" full onClick={declineTrip}>Decline</Btn>
              <Btn v="primary" size="lg" full onClick={acceptTrip}>Accept Trip</Btn>
            </div>
          </div>
        )}

        {/* ── ACTIVE TRIP ── */}
        {tripActive && activeTrip && (
          <>
            {/* Progress stepper */}
            <div className="flex items-center px-1">
              {STATE_ORDER.filter(s => s !== "completed").map((s, i) => {
                const idx = STATE_ORDER.indexOf(s);
                const done   = idx < curIdx;
                const active = idx === curIdx;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-none transition-all
                      ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "bg-slate-700 text-slate-500"}`}>
                      {done ? "✓" : STATE_META[s].icon}
                    </div>
                    {i < STATE_ORDER.filter(s => s !== "completed").length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${done ? "bg-emerald-500" : "bg-slate-700"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* State label */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                {STATE_META[tripState].label}
              </p>
              <p className="text-xs text-slate-500 font-mono">{activeTrip.id}</p>
            </div>

            {/* Passenger card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center font-extrabold border border-slate-600 flex-none">
                  {activeTrip.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-white">{activeTrip.passenger}</p>
                  <p className="text-xs text-slate-400 font-mono">★ {activeTrip.rating}</p>
                </div>
                <div className="text-right flex-none">
                  <p className="font-extrabold font-mono text-emerald-400">{activeTrip.fare}</p>
                  <p className="text-xs text-slate-500 font-mono">{activeTrip.km} km</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-700/60 pt-3">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full flex-none mt-1" />
                  <p className="text-xs text-slate-300 font-mono leading-snug">{activeTrip.pickup}</p>
                </div>
                <div className="w-0.5 h-3 bg-slate-700 ml-0.75 rounded-full" />
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full flex-none mt-1" />
                  <p className="text-xs text-slate-300 font-mono leading-snug">{activeTrip.dropoff}</p>
                </div>
              </div>
            </div>

            {/* Elapsed timer during trip */}
            {tripState === "in_trip" && (
              <div className="bg-slate-800 rounded-2xl border border-emerald-700/40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full ws-dot" />
                  <span className="text-xs font-bold text-emerald-400">Trip in progress</span>
                </div>
                <p className="font-extrabold font-mono text-white text-2xl">{formatTime(elapsedSec)}</p>
              </div>
            )}

            {/* No-show timer — arrives state */}
            {tripState === "arrived" && noShowWarn && (
              <div className={`rounded-2xl border px-4 py-3.5 transition-colors ${
                noShowMin
                  ? "bg-orange-950/60 border-orange-500/70"
                  : "bg-slate-800 border-slate-700"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`font-extrabold text-sm ${noShowMin ? "text-orange-300" : "text-slate-300"}`}>
                      {noShowMin ? "⚠️ Passenger No-Show" : "⏳ Waiting for passenger"}
                    </p>
                    <p className={`text-xs font-mono mt-1 ${noShowMin ? "text-orange-400" : "text-slate-500"}`}>
                      {arrivedMin}m {arrivedS}s waiting
                      {noShowMin
                        ? " — You may cancel without penalty"
                        : ` — Cancel available after 5:00`}
                    </p>
                    {!noShowMin && (
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden w-40">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${Math.min((arrivedSec / 300) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {noShowMin && (
                    <button
                      onClick={cancelNoShow}
                      className="flex-none bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg whitespace-nowrap"
                    >
                      Cancel Trip
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Main action button */}
            {STATE_META[tripState].next && (
              <Btn v="primary" size="xl" full onClick={advanceState}>
                {STATE_META[tripState].next}
              </Btn>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "📞", label: "Call" },
                { icon: "💬", label: "Message" },
                { icon: "🗺️", label: "Navigate" },
              ].map(({ icon, label }) => (
                <button key={label}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3.5 text-center text-xs font-bold text-slate-300 transition-colors active:scale-95">
                  <span className="block text-lg mb-0.5">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── COMPLETED ── */}
        {tripState === "completed" && activeTrip && (
          <div
            className="bg-emerald-950/50 border border-emerald-700/50 rounded-2xl px-5 py-7 text-center"
            style={{ animation: "slide-in .4s cubic-bezier(.22,1,.36,1) both" }}
          >
            <p className="text-6xl mb-3">🏁</p>
            <p className="font-extrabold text-white text-2xl">Trip Completed!</p>
            <p className="text-emerald-400 font-mono text-2xl font-extrabold mt-2">{activeTrip.fare}</p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {activeTrip.id} · {activeTrip.km} km · {formatTime(elapsedSec)}
            </p>
            <div className="bg-slate-800/60 rounded-xl p-3 mt-4 text-xs font-mono text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross fare</span>
                <span className="text-white font-bold">{activeTrip.fare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commission (15%)</span>
                <span className="text-orange-400 font-bold">− LKR {activeTrip.commission}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1">
                <span className="text-slate-400 font-semibold">Your net</span>
                <span className="text-emerald-400 font-extrabold">
                  LKR {(activeTrip.fareNum - activeTrip.commission).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Btn v="secondary" size="lg" full onClick={() => setState("idle")}>Accept Next</Btn>
              <Btn v="ghost" size="lg" full onClick={goOffline}>Go Offline</Btn>
            </div>
          </div>
        )}

        {/* Earnings strip — always shown when online */}
        {online && (
          <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Today Earned</p>
              <p className="text-xl font-extrabold font-mono text-emerald-400">
                LKR {todayEarnings.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">net · {tripsToday} trips</p>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Commission Debt</p>
              <p className={`text-xl font-extrabold font-mono ${commDebt > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                LKR {commDebt.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                {commDebt > 0 ? "auto-deducted next trip" : "all clear ✓"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
