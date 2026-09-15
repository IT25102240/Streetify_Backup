/**
 * Screen F — System Administrator / Coordinator Dashboard
 * Widescreen · navy sidebar · Verifications · Live Fleet · Audit Logs
 *
 * API hooks (MSSQL via Node/Express gateway):
 *   GET  /api/admin/verifications      → PendingDoc[]
 *   GET  /api/admin/flagged            → FlaggedAccount[]
 *   GET  /api/admin/audit?limit=50     → AuditEntry[]
 *   GET  /api/admin/revenue/daily      → HourlyRevenue[]
 *   POST /api/admin/suspend            { userId, duration, auditNote } → { ok }
 *   POST /api/auth/revoke-jwt          { userId } → { revokedCount }
 *   WS   wss://api.streetify.lk/fleet  → DriverPosition[]
 */
import { useState, useEffect } from "react";
import OsmMap, { DriverPin } from "../OsmMap";
import { Btn, Card, Pill, StatCard, WsLive } from "../ui";

type AdminTab = "verifications" | "fleet" | "audit";

/* ── Static mock data (swap for apiGet calls) ── */
const FLAGGED = [
  { id:"USR-4521", name:"Roshan Mendis",        type:"Driver",    infraction:"Route deviation (3 incidents in 7 days)", status:"Under Review",  risk:"high",   since:"12 Sep" },
  { id:"USR-3302", name:"Priya Silva",           type:"Passenger", infraction:"Fraudulent chargeback claim × 2",        status:"Suspended",     risk:"high",   since:"10 Sep" },
  { id:"USR-6617", name:"Thilak Fernando",       type:"Driver",    infraction:"7 missed trips within 30 days",          status:"Warning",       risk:"medium", since:"13 Sep" },
  { id:"USR-1189", name:"Amara Wijesinghe",      type:"Passenger", infraction:"Abusive behaviour reported × 2",        status:"Investigating", risk:"medium", since:"14 Sep" },
  { id:"USR-8803", name:"Dilshan Perera",        type:"Driver",    infraction:"Expired insurance certificate",          status:"Blocked",       risk:"low",    since:"11 Sep" },
  { id:"USR-2291", name:"Sachini Ratnayake",     type:"Passenger", infraction:"Profile photo mismatch flagged",         status:"Under Review",  risk:"low",    since:"14 Sep" },
];

const PENDING = [
  { id:"DRV-2241", name:"Nuwan Bandara",         doc:"Vehicle Registration",   date:"12 Sep", size:"2.1 MB", wait:"2d" },
  { id:"DRV-2198", name:"Chamari Rajapaksa",     doc:"Driving Licence",        date:"13 Sep", size:"1.8 MB", wait:"1d" },
  { id:"DRV-2176", name:"Isuru Wickramasinghe",  doc:"Insurance Certificate",  date:"13 Sep", size:"3.4 MB", wait:"1d" },
];

const AUDIT = [
  { ts:"14 Sep · 14:22", admin:"admin@streetify.lk",  action:"Suspended USR-3302 for 30 days — fraud confirmed",           type:"suspend" },
  { ts:"14 Sep · 13:55", admin:"coord@streetify.lk",  action:"Approved vehicle registration for DRV-2103",                 type:"approve" },
  { ts:"14 Sep · 11:30", admin:"admin@streetify.lk",  action:"Revoked all JWT session tokens for USR-3302",               type:"revoke"  },
  { ts:"13 Sep · 17:44", admin:"coord@streetify.lk",  action:"Issued formal warning to USR-6617 (missed trips)",           type:"warn"    },
  { ts:"13 Sep · 09:12", admin:"admin@streetify.lk",  action:"Resolved dispute TKT-88312 — partial refund LKR 340",        type:"resolve" },
  { ts:"12 Sep · 16:00", admin:"coord@streetify.lk",  action:"Approved DRV-2105 onboarding — all 3 documents verified",   type:"approve" },
  { ts:"12 Sep · 14:08", admin:"admin@streetify.lk",  action:"Escalated TKT-88280 to legal team",                         type:"suspend" },
  { ts:"11 Sep · 10:32", admin:"coord@streetify.lk",  action:"Cleared USR-7741 from investigation — no violation found",   type:"resolve" },
];

/* Hourly revenue data — 24 hours (index 0 = midnight, 23 = 11pm) */
const REVENUE_HOURS = [
  4, 3, 2, 1, 2, 5, 12, 22, 31, 38, 42, 45,
  48, 52, 49, 55, 61, 68, 74, 79, 71, 58, 38, 22,
];
const NOW_HOUR = 14; // 2pm

const FLEET_DRIVERS = [
  { id:"DRV-04", style:{ left:"18%", top:"56%" }, status:"in_trip" },
  { id:"DRV-11", style:{ left:"36%", top:"38%" }, status:"in_trip" },
  { id:"DRV-07", style:{ left:"52%", top:"63%" }, status:"waiting" },
  { id:"DRV-19", style:{ left:"67%", top:"44%" }, status:"in_trip" },
  { id:"DRV-22", style:{ left:"80%", top:"28%" }, status:"waiting" },
  { id:"DRV-31", style:{ left:"44%", top:"76%" }, status:"in_trip" },
];

const RISK_C: Record<string,string>   = { high:"red", medium:"orange", low:"gray" };
const STATUS_C: Record<string,string> = {
  "Under Review":"yellow","Suspended":"red","Warning":"orange",
  "Investigating":"blue","Blocked":"gray",
};
const AUDIT_CLR: Record<string,string> = {
  suspend:"bg-red-500", revoke:"bg-red-400",
  warn:"bg-orange-400", approve:"bg-emerald-500", resolve:"bg-blue-500",
};

function Sparkline({ data, color = "bg-blue-400" }: { data:number[]; color?:string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-px h-8">
      {data.map((v, i) => (
        <div key={i}
          className={`flex-1 rounded-sm ${color} transition-all`}
          style={{ height: `${(v / max) * 100}%`, opacity: i === data.length - 1 ? 1 : 0.65 }}
        />
      ))}
    </div>
  );
}

export default function ScreenAdmin() {
  const [tab, setTab]         = useState<AdminTab>("verifications");
  const [modal, setModal]     = useState<typeof FLAGGED[0] | null>(null);
  const [dur, setDur]         = useState("7");
  const [note, setNote]       = useState("");
  const [revoking, setRevoking] = useState(false);
  const [done, setDone]       = useState(false);
  const [search, setSearch]   = useState("");
  const [notifOpen, setNotif] = useState(false);
  const [liveTrips, setLiveTrips] = useState(23);
  const [approvedIds, setApproved] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setLiveTrips(p => Math.max(18, Math.min(32, p + (Math.random() > 0.5 ? 1 : -1)))), 3800);
    return () => clearInterval(t);
  }, []);

  const filtered = FLAGGED.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
  );

  async function executeSuspend() {
    setRevoking(true);
    // TODO: await apiPost("/api/admin/suspend",   { userId: modal!.id, duration: dur, auditNote: note });
    // TODO: await apiPost("/api/auth/revoke-jwt", { userId: modal!.id });
    await new Promise(r => setTimeout(r, 2000));
    setRevoking(false);
    setDone(true);
    setTimeout(() => { setModal(null); setDone(false); setNote(""); }, 1800);
  }

  const NAV: { key: AdminTab; icon: string; label: string; count?: number }[] = [
    { key:"verifications", icon:"📋", label:"Pending Verifications", count: PENDING.filter(p => !approvedIds.has(p.id) && !rejectedIds.has(p.id)).length },
    { key:"fleet",         icon:"📡", label:"Live Fleet Monitor" },
    { key:"audit",         icon:"📜", label:"Audit Log" },
  ];

  const maxRevenue = Math.max(...REVENUE_HOURS);

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ══ Navy Sidebar ══ */}
      <aside className="w-56 bg-[#1e3a8a] flex flex-col flex-none min-h-screen shadow-xl">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-blue-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🚖</span>
            </div>
            <div>
              <p className="font-extrabold text-white text-sm leading-tight">Streetify</p>
              <p className="text-blue-400 text-[11px] font-mono">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ key, icon, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                ${tab === key
                  ? "bg-blue-600/80 text-white shadow-sm"
                  : "text-blue-200 hover:bg-blue-800/60 hover:text-white"}`}>
              <span>{icon}</span>
              <span className="flex-1 truncate text-sm">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="bg-orange-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-extrabold flex-none">
                  {count}
                </span>
              )}
            </button>
          ))}

          {/* Live metrics */}
          <div className="pt-5">
            <p className="text-blue-500/80 text-[10px] font-extrabold uppercase tracking-widest px-3 mb-2">Live Metrics</p>
            {[
              { l:"Active Drivers", v:"47",                      c:"text-emerald-400" },
              { l:"Trips Live",     v:`${liveTrips}`,            c:"text-blue-300"    },
              { l:"Open Disputes",  v:"4",                       c:"text-amber-400"   },
              { l:"Revenue Today",  v:"LKR 284,920",             c:"text-emerald-300" },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-blue-300/60 text-[11px]">{l}</span>
                <span className={`font-extrabold font-mono text-[11px] ${c}`}>{v}</span>
              </div>
            ))}
          </div>

          {/* Mini sparkline */}
          <div className="mx-3 mt-3 bg-blue-950/50 rounded-xl p-3 border border-blue-800/30">
            <p className="text-blue-400 text-[10px] font-semibold mb-2">Trip Volume — Today</p>
            <Sparkline data={REVENUE_HOURS.slice(0, NOW_HOUR + 1)} />
            <div className="flex justify-between mt-1">
              <span className="text-blue-600 text-[9px] font-mono">00:00</span>
              <span className="text-blue-600 text-[9px] font-mono">Now</span>
            </div>
          </div>
        </nav>

        {/* Admin profile */}
        <div className="p-4 border-t border-blue-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-extrabold text-white text-xs">SA</div>
            <div className="min-w-0">
              <p className="text-white text-xs font-extrabold truncate">Super Admin</p>
              <p className="text-blue-400 text-[10px] font-mono truncate">admin@streetify.lk</p>
            </div>
            <button className="text-blue-400 hover:text-blue-200 text-sm ml-auto">⚙</button>
          </div>
        </div>
      </aside>

      {/* ══ Main area ══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between flex-none shadow-sm">
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg leading-tight">
              {tab === "verifications" && "Pending Verifications & Flagged Accounts"}
              {tab === "fleet"         && "Live Fleet Monitor"}
              {tab === "audit"         && "System Audit Log"}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              14 Sep 2026 · 14:32 WIB · MSSQL · GET /api/admin/{tab}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <WsLive label="Fleet live" connected />
            <Pill color="navy">🗄 MSSQL</Pill>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotif(p => !p)}
                className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-base hover:bg-slate-200 transition-colors relative">
                🔔
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-extrabold flex items-center justify-center">3</span>
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ animation: "slide-down .28s cubic-bezier(.22,1,.36,1) both" }}
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-extrabold text-slate-800 text-sm">Notifications</p>
                    <button onClick={() => setNotif(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
                  </div>
                  {[
                    { icon:"🚨", title:"High-risk account flagged",   sub:"USR-4521 — route deviation × 3", time:"2m",   c:"bg-red-100"    },
                    { icon:"📋", title:"New verification pending",    sub:"DRV-2241 submitted documents",   time:"18m",  c:"bg-blue-100"   },
                    { icon:"💬", title:"Dispute escalated to admin",  sub:"TKT-88419 — passenger claim",    time:"1h",   c:"bg-amber-100"  },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3.5 flex items-start gap-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none ${n.c}`}>{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{n.sub}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono flex-none">{n.time} ago</p>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 text-center">
                    <button className="text-xs text-blue-600 font-semibold hover:underline">View all notifications →</button>
                  </div>
                </div>
              )}
            </div>

            <Btn v="secondary" size="sm">⬇ Export</Btn>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ══ VERIFICATIONS TAB ══ */}
          {tab === "verifications" && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Pending Reviews"  value={PENDING.filter(p => !approvedIds.has(p.id) && !rejectedIds.has(p.id)).length.toString()}
                          icon="📋" sub="Awaiting action" trend="+1 today" />
                <StatCard label="Flagged Accounts" value={FLAGGED.length.toString()}
                          icon="🚩" sub="Require review"  trend="+2 today" />
                <StatCard label="Approved Today"   value="12" icon="✅"
                          sub="Docs cleared" accent trend="+12 today" />
                <StatCard label="Suspended Today"  value="1"  icon="🔒"
                          sub="JWT revoked"  trend="0 today" />
              </div>

              {/* Revenue bar chart */}
              <Card className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-extrabold text-slate-800">Platform Revenue — 14 Sep 2026</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">GET /api/admin/revenue/daily · MSSQL aggregate · LKR thousands</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold font-mono text-blue-700">LKR 284,920</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">↑ 12.4% vs yesterday</p>
                  </div>
                </div>

                {/* 24-bar hourly chart */}
                <div className="flex items-end gap-1 h-16">
                  {REVENUE_HOURS.map((v, i) => {
                    const isPast   = i < NOW_HOUR;
                    const isCurrent = i === NOW_HOUR;
                    const pct = (v / maxRevenue) * 100;
                    return (
                      <div
                        key={i}
                        title={`${String(i).padStart(2,"0")}:00 — LKR ${(v * 1000).toLocaleString()}`}
                        className={`flex-1 rounded-t transition-all cursor-default group relative
                          ${isCurrent ? "bg-blue-700" : isPast ? "bg-blue-300 hover:bg-blue-500" : "bg-slate-200"}`}
                        style={{ height: `${pct}%`, minHeight: 3 }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  {["00:00","03:00","06:00","09:00","12:00","15:00","18:00","21:00","23:00"].map(t => (
                    <span key={t} className="text-slate-400 text-[10px] font-mono">{t}</span>
                  ))}
                </div>
              </Card>

              {/* Document review queue */}
              <Card>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800">Document Review Queue</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      GET /api/admin/verifications · {PENDING.filter(p => !approvedIds.has(p.id) && !rejectedIds.has(p.id)).length} pending
                    </p>
                  </div>
                  <Pill color="orange">{PENDING.filter(p => !approvedIds.has(p.id) && !rejectedIds.has(p.id)).length} Pending</Pill>
                </div>
                <div className="divide-y divide-slate-100">
                  {PENDING.map(d => {
                    const approved = approvedIds.has(d.id);
                    const rejected = rejectedIds.has(d.id);
                    return (
                      <div key={d.id} className={`px-5 py-4 flex items-center gap-4 transition-colors ${approved || rejected ? "opacity-60 bg-slate-50" : "hover:bg-slate-50"}`}>
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center font-extrabold text-blue-700 text-sm flex-none">
                          {d.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{d.id} · {d.doc} · {d.size}</p>
                        </div>
                        <div className="text-right flex-none mr-2">
                          <p className="text-[11px] text-slate-400 font-mono">{d.date}</p>
                          <p className="text-[10px] text-orange-500 font-mono">{d.wait} waiting</p>
                        </div>
                        <div className="flex gap-2 flex-none">
                          {approved
                            ? <Pill color="green">✓ Approved</Pill>
                            : rejected
                            ? <Pill color="red">✗ Rejected</Pill>
                            : (
                              <>
                                <Btn v="ghost" size="xs">👁 View</Btn>
                                <Btn v="success" size="xs" onClick={() => setApproved(s => new Set([...s, d.id]))}>✓ Approve</Btn>
                                <Btn v="danger"  size="xs" onClick={() => setRejected(s => new Set([...s, d.id]))}>✗ Reject</Btn>
                              </>
                            )
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Flagged accounts table */}
              <Card>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-slate-800">Flagged Accounts</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      GET /api/admin/flagged · sorted by risk · {filtered.length} of {FLAGGED.length} records · MSSQL
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      <input
                        placeholder="Search name or ID…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                      />
                    </div>
                    <Pill color="red">{FLAGGED.filter(f => f.risk === "high").length} High Risk</Pill>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[820px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["User ID","Name","Type","Infraction","Status","Risk","Flagged","Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">{a.id}</td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-800 whitespace-nowrap">{a.name}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <Pill color={a.type === "Driver" ? "blue" : "gray"}>{a.type}</Pill>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[200px] truncate" title={a.infraction}>{a.infraction}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <Pill color={STATUS_C[a.status] ?? "gray"}>{a.status}</Pill>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <Pill color={RISK_C[a.risk] ?? "gray"}>{a.risk.toUpperCase()}</Pill>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">{a.since}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <Btn v="ghost"  size="xs">View</Btn>
                              <Btn v="danger" size="xs" onClick={() => setModal(a)}>Suspend</Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                            <p className="text-3xl mb-2">🔍</p>
                            <p className="font-semibold">No results for &ldquo;{search}&rdquo;</p>
                            <button onClick={() => setSearch("")} className="text-xs text-blue-600 hover:underline mt-1">Clear search</button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ══ FLEET TAB ══ */}
          {tab === "fleet" && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Active Drivers"    value="47"              icon="🟢" sub="Online now"       accent trend="+3" />
                <StatCard label="Trips In Progress" value={`${liveTrips}`} icon="🛣️"  sub="Live via WS"              trend="" />
                <StatCard label="Awaiting Pickup"   value="8"              icon="⏳" sub="Driver dispatched"          trend="" />
                <StatCard label="Offline Drivers"   value="12"             icon="😴" sub="Available pool"             trend="" />
              </div>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-extrabold text-slate-800">Live Fleet — Colombo Metro Area</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      WS wss://api.streetify.lk/fleet · positions update every 2s · 47 active vehicles
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <WsLive label="47 vehicles" connected />
                    <Pill color="green">Live</Pill>
                  </div>
                </div>
                <OsmMap height="400px" animate showPickup showDropoff>
                  {FLEET_DRIVERS.map(d => (
                    <DriverPin key={d.id} style={d.style} label={d.id} online={d.status === "in_trip"} />
                  ))}
                </OsmMap>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-blue-600 rounded-full" />
                    In trip ({FLEET_DRIVERS.filter(d => d.status === "in_trip").length})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-slate-400 rounded-full" />
                    Waiting ({FLEET_DRIVERS.filter(d => d.status === "waiting").length})
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ══ AUDIT TAB ══ */}
          {tab === "audit" && (
            <Card>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-800">System Audit Log</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    GET /api/admin/audit?limit=50 · Immutable append-only · MSSQL · {AUDIT.length} entries shown
                  </p>
                </div>
                <Btn v="secondary" size="sm">⬇ Export CSV</Btn>
              </div>
              <div className="divide-y divide-slate-100">
                {AUDIT.map((log, i) => (
                  <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-none ${AUDIT_CLR[log.type] ?? "bg-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-semibold leading-snug">{log.action}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{log.admin}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono flex-none whitespace-nowrap">{log.ts}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ══ Suspend Modal ══ */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ animation: "fade-in .2s ease both" }}
          onClick={e => { if (e.target === e.currentTarget) { setModal(null); setNote(""); } }}
        >
          <Card
            className="w-full max-w-lg"
            style={{ animation: "pop-in .38s cubic-bezier(.22,1,.36,1) both" }}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between">
              <div>
                <p className="font-extrabold text-slate-900 text-lg">Suspend Account</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{modal.id} · {modal.name} · {modal.type}</p>
              </div>
              <button onClick={() => { setModal(null); setNote(""); }}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-4 mt-0.5 transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Infraction summary */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-none text-lg">⚠</div>
                <div>
                  <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-widest font-mono mb-1.5">Infraction on Record</p>
                  <p className="text-sm text-red-800 font-bold leading-snug">{modal.infraction}</p>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <Pill color="red">Risk: {modal.risk.toUpperCase()}</Pill>
                    <Pill color={STATUS_C[modal.status] ?? "gray"}>{modal.status}</Pill>
                    <span className="text-xs text-slate-400 font-mono">Since {modal.since}</span>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-extrabold text-slate-700 block mb-1.5">Suspension Duration</label>
                <div className="relative">
                  <select value={dur} onChange={e => setDur(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 pr-8">
                    <option value="1">1 Day — Minor violation / first offence</option>
                    <option value="3">3 Days — Repeated minor violations</option>
                    <option value="7">7 Days — Serious infraction</option>
                    <option value="30">30 Days — Critical / safety violation</option>
                    <option value="permanent">Permanent Ban — Zero tolerance breach</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▾</span>
                </div>
              </div>

              {/* Audit notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-extrabold text-slate-700">
                    Audit Notes <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${note.length > 270 ? "text-orange-500" : "text-slate-400"}`}>
                    {note.length}/300
                  </span>
                </div>
                <textarea
                  value={note} onChange={e => setNote(e.target.value.slice(0, 300))} rows={3}
                  placeholder="Record the justification for this action. This note is permanent and immutable in the audit log…"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-slate-800 placeholder-slate-400"
                />
                <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${note.length > 270 ? "bg-orange-500" : "bg-blue-500"}`}
                       style={{ width: `${(note.length / 300) * 100}%` }} />
                </div>
                {!note.trim() && (
                  <p className="text-xs text-red-500 mt-1.5 font-semibold">⚠ Audit notes are required before proceeding.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Btn v="secondary" size="lg" className="flex-1"
                  onClick={() => { setModal(null); setNote(""); }}>
                  Cancel
                </Btn>
                <button
                  onClick={executeSuspend}
                  disabled={!note.trim() || revoking || done}
                  className={`flex-1 py-3 rounded-xl font-extrabold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed
                    ${done ? "bg-emerald-600" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {done
                    ? "✓ Account Suspended & JWT Revoked"
                    : revoking
                    ? <><span className="spinner w-4 h-4" /> Revoking JWT Session…</>
                    : "🔒 Revoke JWT & Suspend Account"}
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-400 font-mono">
                This action is logged to the immutable audit trail and cannot be undone without manual override.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
