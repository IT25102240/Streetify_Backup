import { useState, useEffect, useMemo } from "react";
import { Btn, Card, Pill } from "../ui";
import { apiClient } from "../api/apiClient";
import { tripSyncService } from "../services/tripSyncService";
import { tabStorage } from "../utils/storage";

interface BookingTrip {
  id: number;
  tripId: number;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  status: string;
  rideType?: string;
  distanceKm?: number;
  totalFare?: number;
  estimatedFare?: number;
  paymentMethod?: string;
  paid?: boolean;
  isPaid?: boolean;
  createdAt?: string;
  passengerName?: string;
  passengerPhone?: string;
  driverName?: string;
  driverPhone?: string;
}

interface RideTypeSummary {
  rideType: string;
  totalTrips: number;
  totalRevenue: number;
  avgDistanceKm: number;
  avgFare: number;
}

interface BookingSummaryData {
  totalBookings: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  avgDistanceKm: number;
  avgFare: number;
  byStatus: Record<string, number>;
  byRideType: RideTypeSummary[];
  activeOngoingTrips: BookingTrip[];
  recentTrips: BookingTrip[];
}

interface Props {
  onOpenCreateModal?: () => void;
  onOpenEditModal?: (trip: BookingTrip) => void;
}

const RIDE_TYPE_META: Record<string, { label: string; icon: string; badgeCls: string; barColor: string }> = {
  standard: { label: "Standard (Sedan/Car)", icon: "🚗", badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/30", barColor: "from-blue-600 to-cyan-500" },
  car: { label: "Standard (Sedan/Car)", icon: "🚗", badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/30", barColor: "from-blue-600 to-cyan-500" },
  xl: { label: "XL (Van / SUV)", icon: "🚐", badgeCls: "bg-purple-500/15 text-purple-400 border-purple-500/30", barColor: "from-purple-600 to-pink-500" },
  van: { label: "XL (Van / SUV)", icon: "🚐", badgeCls: "bg-purple-500/15 text-purple-400 border-purple-500/30", barColor: "from-purple-600 to-pink-500" },
  moto: { label: "Moto (Bike)", icon: "🏍️", badgeCls: "bg-amber-500/15 text-amber-400 border-amber-500/30", barColor: "from-amber-500 to-orange-500" },
  bike: { label: "Moto (Bike)", icon: "🏍️", badgeCls: "bg-amber-500/15 text-amber-400 border-amber-500/30", barColor: "from-amber-500 to-orange-500" },
  tuk: { label: "Tuk (3-Wheeler)", icon: "🛺", badgeCls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", barColor: "from-emerald-500 to-teal-400" },
};

export default function ChanukaBookingDashboard({ onOpenCreateModal, onOpenEditModal }: Props) {
  const [summary, setSummary] = useState<BookingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedRideTypeFilter, setSelectedRideTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const adminRole = tabStorage.getItem("admin_role") || "";
  const adminUser = tabStorage.getItem("user_name") || "Chanuka Dharmakeerthi";
  const isSuperAdmin = adminRole === "SUPER_ADMIN" || adminUser.toLowerCase().includes("vidura");
  const isChanuka = adminRole === "BOOKING_MGMT" || adminUser.toLowerCase().includes("chanuka");

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch summary aggregated directly matching Chanuka's SQL queries (2.1, 2.2, 2.3)
      const data = await apiClient<BookingSummaryData>("/module-admin/bookings/summary");
      if (data && data.totalBookings !== undefined) {
        setSummary(data);
      } else {
        // Fallback: fetch raw bookings if summary endpoint is missing
        const rawTrips = await apiClient<BookingTrip[]>("/module-admin/bookings");
        computeFallbackSummary(rawTrips || []);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch {
      // Graceful fallback from raw bookings
      try {
        const rawTrips = await apiClient<BookingTrip[]>("/module-admin/bookings");
        computeFallbackSummary(rawTrips || []);
      } catch (e) {
        console.error("Failed to load booking summary:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const computeFallbackSummary = (trips: BookingTrip[]) => {
    const total = trips.length;
    const active = trips.filter(t => ["REQUESTED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "ACTIVE"].includes((t.status || "").toUpperCase())).length;
    const completed = trips.filter(t => (t.status || "").toUpperCase() === "COMPLETED").length;
    const cancelled = trips.filter(t => (t.status || "").toUpperCase() === "CANCELLED").length;
    const totalRev = trips.reduce((acc, t) => acc + (t.totalFare || t.estimatedFare || 0), 0);
    const totalDist = trips.reduce((acc, t) => acc + (t.distanceKm || 8.5), 0);
    const avgDist = total > 0 ? totalDist / total : 0;
    const avgF = total > 0 ? totalRev / total : 0;

    const byStatus: Record<string, number> = {};
    trips.forEach(t => {
      const s = (t.status || "REQUESTED").toUpperCase();
      byStatus[s] = (byStatus[s] || 0) + 1;
    });

    const rtMap: Record<string, { count: number; rev: number; dist: number }> = {
      standard: { count: 0, rev: 0, dist: 0 },
      xl: { count: 0, rev: 0, dist: 0 },
      moto: { count: 0, rev: 0, dist: 0 },
      tuk: { count: 0, rev: 0, dist: 0 },
    };

    trips.forEach(t => {
      const rt = (t.rideType || "standard").toLowerCase();
      const key = rtMap[rt] ? rt : "standard";
      rtMap[key].count += 1;
      rtMap[key].rev += (t.totalFare || t.estimatedFare || 0);
      rtMap[key].dist += (t.distanceKm || 8.5);
    });

    const byRideType: RideTypeSummary[] = Object.keys(rtMap).map(k => ({
      rideType: k,
      totalTrips: rtMap[k].count,
      totalRevenue: rtMap[k].rev,
      avgDistanceKm: rtMap[k].count > 0 ? Math.round((rtMap[k].dist / rtMap[k].count) * 10) / 10 : 0,
      avgFare: rtMap[k].count > 0 ? Math.round(rtMap[k].rev / rtMap[k].count) : 0,
    }));

    const activeList = trips.filter(t => ["REQUESTED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "ACTIVE"].includes((t.status || "").toUpperCase()));

    setSummary({
      totalBookings: total,
      activeTrips: active,
      completedTrips: completed,
      cancelledTrips: cancelled,
      totalRevenue: totalRev,
      avgDistanceKm: Math.round(avgDist * 10) / 10,
      avgFare: Math.round(avgF),
      byStatus,
      byRideType,
      activeOngoingTrips: activeList,
      recentTrips: trips,
    });
  };

  useEffect(() => {
    loadData();
    const unsub = tripSyncService.subscribeAll(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  // Filtered trips for Query 2.1 registry table
  const filteredTrips = useMemo(() => {
    if (!summary?.recentTrips) return [];
    return summary.recentTrips.filter(t => {
      const statusMatch = selectedStatusFilter === "ALL" || (t.status || "").toUpperCase() === selectedStatusFilter;
      const rideMatch = selectedRideTypeFilter === "ALL" || (t.rideType || "standard").toLowerCase() === selectedRideTypeFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const searchMatch = !q ||
        t.id?.toString().includes(q) ||
        (t.pickupAddress || "").toLowerCase().includes(q) ||
        (t.dropoffAddress || "").toLowerCase().includes(q) ||
        (t.passengerName || "").toLowerCase().includes(q) ||
        (t.driverName || "").toLowerCase().includes(q);
      return statusMatch && rideMatch && searchMatch;
    });
  }, [summary, selectedStatusFilter, selectedRideTypeFilter, searchQuery]);

  const completionRate = summary && summary.totalBookings > 0
    ? Math.round((summary.completedTrips / summary.totalBookings) * 100)
    : 0;

  const cancellationRate = summary && summary.totalBookings > 0
    ? Math.round((summary.cancelledTrips / summary.totalBookings) * 100)
    : 0;

  const exportSummaryCsv = () => {
    if (!summary) return;
    const rows = [
      ["Trip ID", "Ride Type", "Passenger", "Driver", "Pickup Address", "Dropoff Address", "Distance (km)", "Fare (LKR)", "Payment Method", "Paid", "Status", "Created At"],
      ...summary.recentTrips.map(t => [
        t.id,
        t.rideType || "standard",
        `"${t.passengerName || 'Walk-in'}"`,
        `"${t.driverName || 'NOT_ASSIGNED'}"`,
        `"${t.pickupAddress || ''}"`,
        `"${t.dropoffAddress || ''}"`,
        t.distanceKm || 0,
        t.totalFare || t.estimatedFare || 0,
        t.paymentMethod || "CASH",
        t.paid || t.isPaid ? "YES" : "NO",
        t.status,
        t.createdAt || ""
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chanuka_platform_bookings_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Executive Header for Chanuka's Module ── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                🚖 Module 2 · Booking & Dispatch Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                Chanuka Dharmakeerthi · Lead Admin
              </span>
              {isSuperAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                  Vidura Viewing · Super Admin Access
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Platform Booking & Trip Summary</span>
              <span className="text-teal-400 text-xs px-2 py-0.5 rounded-md bg-teal-950/80 border border-teal-500/30 font-mono">
                LIVE TELEMETRY
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Live executive overview of platform ride requests, active vehicle dispatches, trip lifecycle transitions, and revenue breakdown by ride tier.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all disabled:opacity-50"
              title="Refresh telemetry from MSSQL database"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>Sync</span>
              <span className="text-[10px] text-slate-400 font-mono ml-1">{lastRefreshed}</span>
            </button>

            <button
              onClick={exportSummaryCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-teal-300 border border-teal-500/30 shadow-sm transition-all"
              title="Export complete Query 2.1 summary as CSV"
            >
              <span>📊</span>
              <span>Export CSV</span>
            </button>

            {onOpenCreateModal && (
              <Btn size="sm" v="eco" onClick={onOpenCreateModal}>
                + New Booking
              </Btn>
            )}
          </div>
        </div>
      </div>

      {/* ── 6 Core Platform KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Bookings */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
            <span className="text-lg">🗺️</span>
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            {summary ? summary.totalBookings.toLocaleString() : "—"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Query 2.1 total requests</span>
          </p>
        </div>

        {/* Active Ongoing Trips */}
        <div className="bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-500/40 rounded-2xl p-4 transition-all shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-teal-400" />
          </div>
          <div className="flex items-center justify-between text-teal-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Ongoing</span>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-2xl font-extrabold text-teal-300 font-mono">
            {summary ? summary.activeTrips.toLocaleString() : "—"}
          </p>
          <p className="text-[11px] text-teal-400/80 mt-1">
            Query 2.2 live tracking
          </p>
        </div>

        {/* Completed Trips */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <span className="text-lg">✅</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">
            {summary ? summary.completedTrips.toLocaleString() : "—"}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">
            {completionRate}% completion rate
          </p>
        </div>

        {/* Cancelled Bookings */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-red-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cancelled</span>
            <span className="text-lg">❌</span>
          </div>
          <p className="text-2xl font-extrabold text-red-400 font-mono">
            {summary ? summary.cancelledTrips.toLocaleString() : "—"}
          </p>
          <p className="text-[11px] text-red-400/80 mt-1 font-mono">
            {cancellationRate}% drop rate
          </p>
        </div>

        {/* Total Platform Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">
            {summary ? `LKR ${(summary.totalRevenue).toLocaleString()}` : "—"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Avg: LKR {summary ? summary.avgFare.toLocaleString() : "—"}/trip
          </p>
        </div>

        {/* Average Distance */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Distance</span>
            <span className="text-lg">📏</span>
          </div>
          <p className="text-2xl font-extrabold text-blue-400 font-mono">
            {summary ? `${summary.avgDistanceKm} km` : "—"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Platform trip mean
          </p>
        </div>
      </div>

      {/* ── Status Lifecycle Pipeline Distribution ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📋 Dispatch Lifecycle Status Pipeline</span>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                CLICK TO FILTER
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor real-time transition of bookings across platform lifecycle phases
            </p>
          </div>
          {selectedStatusFilter !== "ALL" && (
            <button
              onClick={() => setSelectedStatusFilter("ALL")}
              className="text-xs text-teal-400 hover:text-teal-300 font-bold underline"
            >
              Reset filter (Show all)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {[
            { key: "REQUESTED", label: "Requested", icon: "🟡", desc: "Waiting driver match", cls: "from-amber-950/40 to-slate-900 border-amber-500/30 text-amber-300" },
            { key: "ACCEPTED", label: "Accepted", icon: "🔵", desc: "Driver assigned", cls: "from-blue-950/40 to-slate-900 border-blue-500/30 text-blue-300" },
            { key: "ARRIVED", label: "Arrived", icon: "🟣", desc: "Waiting at pickup", cls: "from-purple-950/40 to-slate-900 border-purple-500/30 text-purple-300" },
            { key: "IN_PROGRESS", label: "In Progress", icon: "🟢", desc: "Trip on road", cls: "from-emerald-950/40 to-slate-900 border-emerald-500/30 text-emerald-300" },
            { key: "COMPLETED", label: "Completed", icon: "🏁", desc: "Delivered & paid", cls: "from-slate-900 to-slate-950 border-slate-700 text-slate-300" },
            { key: "CANCELLED", label: "Cancelled", icon: "🔴", desc: "Aborted / void", cls: "from-red-950/40 to-slate-900 border-red-500/30 text-red-300" },
          ].map(phase => {
            const count = summary?.byStatus[phase.key] || 0;
            const isSelected = selectedStatusFilter === phase.key;
            return (
              <button
                key={phase.key}
                onClick={() => setSelectedStatusFilter(isSelected ? "ALL" : phase.key)}
                className={`p-3 rounded-xl border bg-gradient-to-b text-left transition-all relative ${phase.cls} ${
                  isSelected ? "ring-2 ring-teal-400 shadow-lg scale-102 bg-slate-900" : "hover:border-slate-600 hover:scale-101"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{phase.icon}</span>
                  <span className="text-lg font-mono font-extrabold">{count}</span>
                </div>
                <p className="text-xs font-bold leading-tight truncate">{phase.label}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{phase.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Section 2.3: Trip Summary Breakdown by Ride Type (SQL Query 2.3) ── */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>🚗 Trip Summary Breakdown by Vehicle Tier</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                SQL QUERY 2.3 (GROUP BY ride_type)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Platform volume, average distance travelled, and gross revenue categorized by vehicle fleet tier.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Filter by tier:</span>
            <select
              value={selectedRideTypeFilter}
              onChange={e => setSelectedRideTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-teal-400 font-mono"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="standard">Standard (Sedan)</option>
              <option value="xl">XL (Van/SUV)</option>
              <option value="moto">Moto (Bike)</option>
              <option value="tuk">Tuk (3-Wheeler)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(summary?.byRideType || []).map(rt => {
            const meta = RIDE_TYPE_META[rt.rideType.toLowerCase()] || RIDE_TYPE_META.standard;
            const pct = summary && summary.totalBookings > 0
              ? Math.round((rt.totalTrips / summary.totalBookings) * 100)
              : 0;

            return (
              <div
                key={rt.rideType}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{meta.icon}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${meta.badgeCls}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-white font-mono">{rt.totalTrips}</p>
                      <p className="text-[11px] text-slate-400">Total Trips Booked</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/20">
                      {pct}% share
                    </span>
                  </div>

                  {/* Volume bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${meta.barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Gross Revenue</p>
                    <p className="font-extrabold text-amber-400 font-mono">
                      LKR {rt.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Avg Distance</p>
                    <p className="font-extrabold text-blue-400 font-mono">
                      {rt.avgDistanceKm} km
                    </p>
                  </div>
                  <div className="col-span-2 mt-1">
                    <p className="text-[10px] text-slate-400">Avg Fare / Trip</p>
                    <p className="font-mono text-slate-200 font-semibold">
                      LKR {rt.avgFare.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Section 2.2: Active Ongoing Trips Live Monitor (SQL Query 2.2) ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Ongoing Trips Requiring Live Dispatch Tracking</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SQL QUERY 2.2
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trips in REQUESTED, ACCEPTED, DRIVER_ARRIVED, or IN_PROGRESS requiring GPS waypoint tracking.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {summary?.activeOngoingTrips?.length || 0} active on platform
          </span>
        </div>

        {!summary?.activeOngoingTrips || summary.activeOngoingTrips.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <span className="text-3xl block mb-2">🟢</span>
            <p className="font-bold text-slate-300 text-sm">All trips currently fulfilled or waiting in queue</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              There are no live trips actively driving on the road right now. Create a new booking or dispatch an active ride to monitor live telemetry.
            </p>
            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="mt-3 px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all"
              >
                + Dispatch Demo Booking
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.activeOngoingTrips.map(trip => {
              const meta = RIDE_TYPE_META[(trip.rideType || "standard").toLowerCase()] || RIDE_TYPE_META.standard;
              const isLive = ["IN_PROGRESS", "ACCEPTED", "ARRIVED"].includes((trip.status || "").toUpperCase());

              return (
                <div
                  key={trip.id}
                  className="bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 flex flex-col justify-between transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-extrabold text-teal-400">
                          #TRP-{trip.id}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${meta.badgeCls}`}>
                          {meta.icon} {trip.rideType || "Standard"}
                        </span>
                      </div>
                      <Pill color={isLive ? "green" : "yellow"}>
                        {trip.status}
                      </Pill>
                    </div>

                    {/* Route Details */}
                    <div className="space-y-2 mt-3 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 text-sm mt-0.5">🟢</span>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-mono">PICKUP</p>
                          <p className="text-white font-medium truncate">{trip.pickupAddress}</p>
                          {trip.pickupLat && trip.pickupLng && (
                            <p className="text-[9px] font-mono text-slate-500">
                              [{trip.pickupLat.toFixed(4)}, {trip.pickupLng.toFixed(4)}]
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-rose-400 text-sm mt-0.5">🔴</span>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-mono">DROPOFF</p>
                          <p className="text-white font-medium truncate">{trip.dropoffAddress}</p>
                          {trip.dropoffLat && trip.dropoffLng && (
                            <p className="text-[9px] font-mono text-slate-500">
                              [{trip.dropoffLat.toFixed(4)}, {trip.dropoffLng.toFixed(4)}]
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Passenger & Driver */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                        <p className="font-semibold text-slate-200 truncate">{trip.passengerName || "Walk-In"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Assigned Driver</p>
                        <p className={`font-semibold truncate ${trip.driverName === "NOT_ASSIGNED" ? "text-amber-400 italic" : "text-slate-200"}`}>
                          {trip.driverName || "Waiting match"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Est. Fare</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        LKR {(trip.totalFare || trip.estimatedFare || 0).toLocaleString()}
                      </span>
                    </div>

                    {onOpenEditModal && (
                      <button
                        onClick={() => onOpenEditModal(trip)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                      >
                        Manage Status
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Section 2.1: Full Platform Trip Requests & Status Table (SQL Query 2.1) ── */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <span>📋 Complete Platform Trips Registry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                SQL QUERY 2.1
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive platform trip log with passenger, driver, vehicle type, route distance, payment method, and dispatch status.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search by ID, Address, or Name…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400 w-56"
            />
            {onOpenCreateModal && (
              <Btn size="sm" onClick={onOpenCreateModal}>+ Add Booking</Btn>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs">
                <th className="px-4 py-3 text-left">Trip ID</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Passenger / Driver</th>
                <th className="px-4 py-3 text-left">Pickup ➔ Dropoff</th>
                <th className="px-4 py-3 text-left">Distance</th>
                <th className="px-4 py-3 text-left">Total Fare</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 font-mono text-xs">
                    <span className="inline-block animate-spin mr-2">🔄</span> Loading booking records from MSSQL database…
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    <p className="font-semibold text-slate-300">No bookings match the active filters</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the status or vehicle tier filter.</p>
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => {
                  const meta = RIDE_TYPE_META[(trip.rideType || "standard").toLowerCase()] || RIDE_TYPE_META.standard;

                  return (
                    <tr key={trip.id} className="border-b border-slate-800/80 hover:bg-slate-950/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-400">
                        #{trip.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${meta.badgeCls}`}>
                          <span>{meta.icon}</span>
                          <span className="uppercase">{trip.rideType || "standard"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white text-xs">{trip.passengerName || "Walk-In Passenger"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Driver: {trip.driverName || "NOT_ASSIGNED"}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs text-slate-200 truncate flex items-center gap-1">
                          <span className="text-[10px]">🟢</span> {trip.pickupAddress}
                        </p>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                          <span className="text-[10px]">🔴</span> {trip.dropoffAddress}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {trip.distanceKm ? `${trip.distanceKm} km` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-xs">
                        LKR {(trip.totalFare || trip.estimatedFare || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {trip.paymentMethod || "CASH"}
                        </span>
                        {trip.paid || trip.isPaid ? (
                          <span className="text-[10px] text-emerald-400 font-mono ml-1">● PAID</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-mono ml-1">● PENDING</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Pill>{trip.status}</Pill>
                      </td>
                      <td className="px-4 py-3">
                        {onOpenEditModal && (
                          <Btn size="xs" v="secondary" onClick={() => onOpenEditModal(trip)}>
                            Edit
                          </Btn>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
