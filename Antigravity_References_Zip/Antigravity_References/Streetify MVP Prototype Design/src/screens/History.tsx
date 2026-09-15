/**
 * Screen G — Passenger / Driver Trip History
 * NEW screen — browse past rides, download receipts, re-book
 *
 * API hooks:
 *   GET /api/trips?userId=...&page=1&limit=20 → Trip[]
 *   GET /api/payments/receipt/:txnId           → { pdf_url }
 */
import { useState } from "react";
import { Btn, Card, Pill } from "../ui";

type ViewMode = "passenger" | "driver";

const PASSENGER_TRIPS = [
  { id:"RIDE-88421", date:"14 Sep 2026", time:"14:32", from:"Colombo Fort", to:"BIA Terminal 1",   driver:"Kasun Perera",  fare:"LKR 1,240", km:"31.4", status:"completed", rating:5, method:"card"   },
  { id:"RIDE-88389", date:"12 Sep 2026", time:"09:14", from:"Bambalapitiya", to:"Pettah Bus Stand", driver:"Thilak Perera",fare:"LKR 340",   km:"8.2",  status:"completed", rating:4, method:"wallet" },
  { id:"RIDE-88301", date:"10 Sep 2026", time:"18:47", from:"Dehiwala",     to:"Wellawatte",       driver:"Roshan Silva",  fare:"LKR 180",   km:"3.5",  status:"cancelled", rating:0, method:"cash"   },
  { id:"RIDE-88256", date:"08 Sep 2026", time:"07:22", from:"Kottawa",      to:"Fort Railway Stn", driver:"Amara Niroshan",fare:"LKR 920",  km:"22.8", status:"completed", rating:4, method:"card"   },
  { id:"RIDE-88198", date:"05 Sep 2026", time:"13:55", from:"Maharagama",   to:"Kollupitiya",      driver:"Nuwan Bandara", fare:"LKR 640",   km:"16.1", status:"completed", rating:5, method:"wallet" },
];

const DRIVER_TRIPS = [
  { id:"TRIP-4821-088", date:"14 Sep 2026", time:"14:32", from:"Colombo Fort", to:"BIA Terminal 1",   passenger:"Nimesha A.",  fare:"LKR 1,240", km:"31.4", status:"completed", commission:"LKR 124" },
  { id:"TRIP-4821-087", date:"14 Sep 2026", time:"11:02", from:"Wellawatte",  to:"Borella",            passenger:"Priya S.",    fare:"LKR 290",   km:"7.1",  status:"completed", commission:"LKR 29"  },
  { id:"TRIP-4821-086", date:"14 Sep 2026", time:"09:35", from:"Pettah",      to:"Nugegoda",           passenger:"Roshan M.",   fare:"LKR 510",   km:"12.8", status:"cancelled", commission:"LKR 0"   },
  { id:"TRIP-4821-085", date:"13 Sep 2026", time:"17:44", from:"Malabe",      to:"Colombo 07",         passenger:"Amara W.",    fare:"LKR 780",   km:"19.5", status:"completed", commission:"LKR 78"  },
  { id:"TRIP-4821-084", date:"13 Sep 2026", time:"14:12", from:"Moratuwa",    to:"Fort Station",       passenger:"Dilshan P.",  fare:"LKR 640",   km:"16.0", status:"completed", commission:"LKR 64"  },
];

const STATUS_COLOR: Record<string, string> = { completed: "green", cancelled: "red" };
const METHOD_ICON:  Record<string, string> = { card: "💳", wallet: "📱", cash: "💵" };

export default function ScreenHistory() {
  const [mode, setMode]     = useState<ViewMode>("passenger");
  const [selected, setSelected] = useState<string|null>(null);
  const [search, setSearch] = useState("");

  const pTrips = PASSENGER_TRIPS.filter(t =>
    !search || t.from.toLowerCase().includes(search.toLowerCase()) ||
    t.to.toLowerCase().includes(search.toLowerCase()) ||
    t.driver.toLowerCase().includes(search.toLowerCase())
  );
  const dTrips = DRIVER_TRIPS.filter(t =>
    !search || t.from.toLowerCase().includes(search.toLowerCase()) ||
    t.to.toLowerCase().includes(search.toLowerCase())
  );

  const passengerTotal = PASSENGER_TRIPS
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + parseInt(t.fare.replace(/\D/g,"")), 0);

  const driverTotal = DRIVER_TRIPS
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + parseInt(t.fare.replace(/\D/g,"")), 0);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Trip History</h1>
            <p className="text-sm text-slate-500 mt-0.5">Browse past rides, download receipts, and re-book</p>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
            {(["passenger", "driver"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setSearch(""); setSelected(null); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize ${mode === m ? "bg-blue-700 text-white" : "text-slate-500 hover:text-slate-700"}`}>
                {m === "passenger" ? "🧍 As Passenger" : "🚗 As Driver"}
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        {(() => {
          const stats = mode === "passenger"
            ? [
                { l: "Total Trips",  v: PASSENGER_TRIPS.filter(t => t.status === "completed").length.toString(), icon: "🛣️" },
                { l: "Total Spent",  v: `LKR ${passengerTotal.toLocaleString()}`, icon: "💸" },
                { l: "Avg Rating",   v: "4.8 ★", icon: "⭐" },
              ]
            : [
                { l: "Trips Completed", v: DRIVER_TRIPS.filter(t => t.status === "completed").length.toString(), icon: "✅" },
                { l: "Total Earned",    v: `LKR ${driverTotal.toLocaleString()}`, icon: "💰" },
                { l: "Commission",      v: "LKR 295", icon: "🏦" },
              ];
          return (
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ l, v, icon }) => (
                <Card key={l} className="p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="font-extrabold font-mono text-slate-900 text-sm">{v}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l}</p>
                </Card>
              ))}
            </div>
          );
        })()}

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            placeholder="Search by location or name…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Trip list */}
        <div className="space-y-3">
          {(mode === "passenger" ? pTrips : dTrips).map(t => {
            const isSelected = selected === t.id;
            return (
              <Card key={t.id} hover className="overflow-hidden" onClick={() => setSelected(isSelected ? null : t.id)}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Route icon */}
                    <div className="flex flex-col items-center gap-0.5 pt-1 flex-none">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      {[0,1,2].map(i => <div key={i} className="w-0.5 h-1.5 bg-slate-300 rounded-full" />)}
                      <div className="w-3 h-3 bg-blue-700 rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-mono">{t.from}</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-2">{t.to}</p>
                    </div>

                    <div className="text-right flex-none">
                      <p className="font-extrabold font-mono text-blue-700">{t.fare}</p>
                      <Pill color={STATUS_COLOR[t.status]}>{t.status}</Pill>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{t.date} · {t.time}</span>
                      <span>·</span>
                      <span className="font-mono">{t.km} km</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      {mode === "passenger" ? (
                        <>
                          <span>{METHOD_ICON[(t as typeof PASSENGER_TRIPS[0]).method]}</span>
                          {(t as typeof PASSENGER_TRIPS[0]).rating > 0 && (
                            <span className="text-amber-500">{"★".repeat((t as typeof PASSENGER_TRIPS[0]).rating)}</span>
                          )}
                          <span className="text-slate-400 text-xs">
                            {(t as typeof PASSENGER_TRIPS[0]).driver}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-600 font-mono font-bold">{(t as typeof DRIVER_TRIPS[0]).commission}</span>
                          <span className="text-slate-400">commission</span>
                        </>
                      )}
                      <span className="text-slate-300">·</span>
                      <span>{isSelected ? "▲" : "▾"}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 flex items-center justify-between gap-3 flex-wrap"
                       style={{ animation: "slide-up .3s cubic-bezier(.22,1,.36,1) both" }}>
                    <p className="text-xs text-slate-500 font-mono">{t.id}</p>
                    <div className="flex gap-2">
                      {t.status === "completed" && (
                        <>
                          <Btn v="secondary" size="xs">📧 Email Receipt</Btn>
                          <Btn v="secondary" size="xs">📄 Download PDF</Btn>
                        </>
                      )}
                      {mode === "passenger" && t.status === "completed" && (
                        <Btn v="primary" size="xs">↩ Re-book Trip</Btn>
                      )}
                      {t.status === "cancelled" && (
                        <Btn v="ghost" size="xs">📩 View Cancellation</Btn>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {(mode === "passenger" ? pTrips : dTrips).length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No trips match your search</p>
              <button onClick={() => setSearch("")} className="text-sm text-blue-600 hover:underline mt-1">Clear search</button>
            </div>
          )}
        </div>

        <Btn v="secondary" size="md" full>Load More Trips</Btn>
      </div>
    </div>
  );
}
