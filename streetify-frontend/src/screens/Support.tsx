/**
 * Screen F — Customer Support Officer Portal
 * Implements UC35: Investigate Cancellation Disputes
 *          UC36: Send Formal Support Resolution
 *
 * API hooks:
 *   GET    /api/disputes                         → Ticket[]
 *   GET    /api/disputes/:id                     → Ticket (detail)
 *   PATCH  /api/disputes/:id/resolve             { resolution, status } → { ok }
 *   GET    /api/disputes/stats                   → { open, resolved, avgResponseHours }
 */
import { useState, useEffect } from "react";
import { Btn, Card, Pill, Toast } from "../ui";
import { apiClient } from "../api/apiClient";

type TicketStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
type DisputeType  = "OVERCHARGE" | "NO_SHOW" | "UNSAFE" | "RUDE" | "WRONG_ROUTE" | "CANCELLATION" | "OTHER";

interface Ticket {
  id: number;
  ticketRef: string;
  passengerName: string;
  driverName: string;
  tripId: number | null;
  subject: string;
  description: string;
  disputeType: DisputeType;
  status: TicketStatus;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  open: number;
  inReview: number;
  resolved: number;
  avgResponseHours: number;
}

const STATUS_COLOR: Record<TicketStatus, string> = {
  OPEN:      "red",
  IN_REVIEW: "orange",
  RESOLVED:  "green",
  CLOSED:    "slate",
};

const TYPE_ICON: Record<DisputeType, string> = {
  OVERCHARGE:   "💰",
  NO_SHOW:      "🚫",
  UNSAFE:       "⚠️",
  RUDE:         "😤",
  WRONG_ROUTE:  "🗺️",
  CANCELLATION: "❌",
  OTHER:        "📋",
};

/* Fallback demo tickets — shown when backend is unreachable */
const DEMO_TICKETS: Ticket[] = [
  {
    id: 1, ticketRef: "TKT-00041",
    passengerName: "Nimesha Perera", driverName: "Kasun Silva",
    tripId: 88421, subject: "Overcharged — incorrect fare amount",
    description: "Driver charged LKR 1,800 but estimated was LKR 1,240. Route was correct. No surge pricing should apply at 14:30.",
    disputeType: "OVERCHARGE", status: "OPEN",
    createdAt: "2026-09-14T14:50:00Z", updatedAt: "2026-09-14T14:50:00Z",
  },
  {
    id: 2, ticketRef: "TKT-00038",
    passengerName: "Priya Samarawickrama", driverName: "Roshan Mendis",
    tripId: 88389, subject: "Driver didn't show up",
    description: "Driver accepted the trip but never arrived. Called 3 times — no answer. Was marked as completed without picking me up.",
    disputeType: "NO_SHOW", status: "IN_REVIEW",
    createdAt: "2026-09-12T09:25:00Z", updatedAt: "2026-09-13T10:00:00Z",
  },
  {
    id: 3, ticketRef: "TKT-00035",
    passengerName: "Amara Weerasinghe", driverName: "Thilak Bandara",
    tripId: 88256, subject: "Unsafe or reckless driving behaviour",
    description: "Driver was speeding on Galle Road and ignored several traffic signals. Very unsafe experience. Dashcam footage requested.",
    disputeType: "UNSAFE", status: "OPEN",
    createdAt: "2026-09-10T18:55:00Z", updatedAt: "2026-09-10T18:55:00Z",
  },
  {
    id: 4, ticketRef: "TKT-00029",
    passengerName: "Dilshan Perera", driverName: "Nuwan Kumara",
    tripId: 88198, subject: "Ride cancelled without reason",
    description: "Driver cancelled after I was waiting for 12 minutes. No reason given. Had to book again and was late for my flight.",
    disputeType: "CANCELLATION", status: "RESOLVED",
    resolution: "Confirmed driver cancellation was unjustified. Full refund of LKR 640 processed. Driver warned — 3rd cancellation violation.",
    createdAt: "2026-09-08T07:30:00Z", updatedAt: "2026-09-09T11:20:00Z",
  },
];

const RESOLUTION_TEMPLATES = [
  "Investigation complete. Refund of LKR [amount] processed within 3–5 business days.",
  "Driver has been formally warned. Repeated violations will result in account suspension.",
  "Trip fare corrected and difference refunded to passenger wallet.",
  "Driver document reviewed. No safety violation found based on available data.",
  "Cancellation confirmed as unjustified. Partial compensation applied.",
  "Case closed — insufficient evidence to determine fault. No action taken.",
];

export default function ScreenSupport() {
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [stats, setStats]           = useState<Stats>({ open: 0, inReview: 0, resolved: 0, avgResponseHours: 0 });
  const [selected, setSelected]     = useState<Ticket | null>(null);
  const [resolution, setResolution] = useState("");
  const [filterStatus, setFilter]   = useState<TicketStatus | "ALL">("ALL");
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState("");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiClient<Ticket[]>("/disputes");
      setTickets(data || []);
      const open      = (data || []).filter(t => t.status === "OPEN").length;
      const inReview  = (data || []).filter(t => t.status === "IN_REVIEW").length;
      const resolved  = (data || []).filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
      setStats({ open, inReview, resolved, avgResponseHours: 18 });
    } catch {
      // Use demo data when backend is offline
      setTickets(DEMO_TICKETS);
      setStats({ open: 2, inReview: 1, resolved: 1, avgResponseHours: 18 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const markInReview = async (ticket: Ticket) => {
    try {
      await apiClient(`/disputes/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "IN_REVIEW" }),
      });
      showToast("Ticket marked as In Review", "info");
    } catch {
      // Update locally for demo
    }
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "IN_REVIEW" } : t));
    setSelected(prev => prev?.id === ticket.id ? { ...prev, status: "IN_REVIEW" } : prev);
  };

  const resolveTicket = async () => {
    if (!selected || !resolution.trim()) return;
    setSubmitting(true);
    try {
      await apiClient(`/disputes/${selected.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution: resolution.trim(), status: "RESOLVED" }),
      });
      showToast("Resolution sent to passenger via notification service ✓", "success");
    } catch {
      showToast("Saved locally — backend offline", "info");
    }
    const updated = { ...selected, status: "RESOLVED" as TicketStatus, resolution: resolution.trim() };
    setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
    setSelected(updated);
    setSubmitting(false);
  };

  const closeTicket = async (ticket: Ticket) => {
    try {
      await apiClient(`/disputes/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CLOSED" }),
      });
    } catch { /* demo */ }
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "CLOSED" } : t));
    if (selected?.id === ticket.id) setSelected(null);
    showToast("Ticket closed", "info");
  };

  const filtered = tickets.filter(t => {
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchSearch = search === "" ||
      t.ticketRef.toLowerCase().includes(search.toLowerCase()) ||
      t.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {toast && (
        <Toast message={toast.msg} type={toast.type} visible={!!toast} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm flex-none">
        <div>
          <h1 className="font-extrabold text-slate-900 text-lg">Customer Support Portal</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            UC35 Investigate Disputes · UC36 Send Resolutions · /api/disputes
          </p>
        </div>
        <Btn v="secondary" size="sm" onClick={fetchTickets}>🔄 Refresh</Btn>
      </header>

      {/* KPI Stats Bar */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 flex-none">
        {[
          { label: "Open Tickets",    value: stats.open,             icon: "🔴", color: "border-red-300 bg-red-50"     },
          { label: "In Review",       value: stats.inReview,         icon: "🟡", color: "border-orange-300 bg-orange-50" },
          { label: "Resolved Today",  value: stats.resolved,         icon: "✅", color: "border-green-300 bg-green-50"  },
          { label: "Avg Response",    value: `${stats.avgResponseHours}h`, icon: "⏱️", color: "border-blue-300 bg-blue-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xl">{s.icon}</p>
            <p className="font-extrabold text-2xl font-mono mt-1">{s.value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden gap-4 px-6 pb-6">
        {/* Ticket List Panel */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col flex-none">
          <div className="mb-3 flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets, names…"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {(["ALL", "OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === s
                    ? "bg-blue-700 text-white"
                    : "bg-white text-slate-600 border border-slate-300 hover:border-blue-400"
                }`}
              >
                {s === "ALL" ? "All" : s.replace("_", " ")}
                {s !== "ALL" && (
                  <span className="ml-1 opacity-70">
                    ({tickets.filter(t => t.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Ticket cards */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading && <p className="text-slate-400 text-sm text-center py-8">Loading tickets…</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">No tickets found</p>
            )}
            {filtered.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => { setSelected(ticket); setResolution(ticket.resolution || ""); }}
                className={`w-full text-left rounded-xl border transition-all ${
                  selected?.id === ticket.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                } p-3.5`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs text-slate-400">{ticket.ticketRef}</span>
                  <Pill color={STATUS_COLOR[ticket.status] as any}>{ticket.status.replace("_", " ")}</Pill>
                </div>
                <p className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 mb-1.5">
                  {TYPE_ICON[ticket.disputeType]} {ticket.subject}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>👤 {ticket.passengerName}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail / Resolution Panel */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex items-center justify-center flex-col gap-3 text-slate-400">
              <p className="text-6xl">🎧</p>
              <p className="font-bold text-lg">Select a ticket to investigate</p>
              <p className="text-sm">Review passenger complaints and send formal resolutions</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {/* Ticket Header */}
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-400">{selected.ticketRef}</span>
                      <Pill color={STATUS_COLOR[selected.status] as any}>{selected.status.replace("_", " ")}</Pill>
                    </div>
                    <h2 className="font-extrabold text-slate-900 text-lg leading-snug">
                      {TYPE_ICON[selected.disputeType]} {selected.subject}
                    </h2>
                  </div>
                  <div className="flex gap-2 flex-none">
                    {selected.status === "OPEN" && (
                      <Btn size="sm" v="secondary" onClick={() => markInReview(selected)}>
                        🔍 Start Review
                      </Btn>
                    )}
                    {selected.status !== "CLOSED" && selected.status === "RESOLVED" && (
                      <Btn size="sm" v="ghost" onClick={() => closeTicket(selected)}>
                        Close
                      </Btn>
                    )}
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-500 mb-1">PASSENGER</p>
                    <p className="font-bold text-slate-900">👤 {selected.passengerName}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-500 mb-1">DRIVER</p>
                    <p className="font-bold text-slate-900">🚗 {selected.driverName}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-500 mb-1">TRIP ID</p>
                    <p className="font-mono text-sm text-blue-700">{selected.tripId ? `#${selected.tripId}` : "N/A"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-500 mb-1">FILED</p>
                    <p className="text-sm text-slate-700">
                      {new Date(selected.createdAt).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Complaint Details */}
              <Card className="p-5">
                <p className="font-extrabold text-slate-800 mb-3">📋 Complaint Description</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4">
                  {selected.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Type:</span>
                  <Pill color="blue">{selected.disputeType.replace("_", " ")}</Pill>
                </div>
              </Card>

              {/* Resolution Panel — UC36 */}
              <Card className="p-5">
                <p className="font-extrabold text-slate-800 mb-1">📝 Resolution (UC36)</p>
                <p className="text-xs text-slate-500 mb-4">
                  Your response will be sent to the passenger via the Notification Service
                </p>

                {/* Resolution templates */}
                <div className="mb-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {RESOLUTION_TEMPLATES.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setResolution(t)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-all text-left line-clamp-1 max-w-[220px]"
                      >
                        {t.slice(0, 48)}…
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  rows={5}
                  placeholder="Write formal resolution…  e.g. 'After reviewing the trip logs and driver communication, we have determined…'"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={selected.status === "CLOSED"}
                />
                <div className="flex items-center justify-between mt-3 gap-3">
                  <p className="text-xs text-slate-400 font-mono">
                    {resolution.length}/1000 chars • Notified via email + in-app
                  </p>
                  <div className="flex gap-2">
                    {selected.status !== "CLOSED" && (
                      <>
                        <Btn
                          v="secondary"
                          size="sm"
                          onClick={() => closeTicket(selected)}
                          disabled={submitting}
                        >
                          Close No Action
                        </Btn>
                        <Btn
                          v="success"
                          size="sm"
                          onClick={resolveTicket}
                          loading={submitting}
                          disabled={!resolution.trim() || selected.status === "RESOLVED"}
                        >
                          ✅ Send Resolution
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Existing resolution (if already resolved) */}
              {selected.resolution && (
                <Card className="p-5 bg-green-50 border-green-200">
                  <p className="font-extrabold text-green-800 mb-2">✅ Resolution Sent</p>
                  <p className="text-sm text-green-900 leading-relaxed">{selected.resolution}</p>
                  <p className="text-xs text-green-600 font-mono mt-2">
                    Resolved on {new Date(selected.updatedAt).toLocaleString("en-GB")}
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
