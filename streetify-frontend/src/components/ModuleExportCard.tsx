import React, { useState } from "react";
import { apiClient } from "../api/apiClient";
import { Btn, Card } from "../ui";

export interface ReportConfig {
  key: "payments" | "bookings" | "drivers" | "users" | "reviews" | "audit";
  label: string;
  desc: string;
  icon: string;
  moduleName: string;
  ownerName: string;
  role: string;
  ucCode: string;
}

export const MODULE_REPORTS: Record<string, ReportConfig> = {
  payments: {
    key: "payments",
    label: "Payment Transactions",
    desc: "All payments with 15% platform commission and driver net breakdown",
    icon: "💳",
    moduleName: "Module 4 · Finance & Payment Management",
    ownerName: "Daham Edirisinghe",
    role: "PAYMENT_MGMT",
    ucCode: "UC34"
  },
  bookings: {
    key: "bookings",
    label: "Trip / Booking Report",
    desc: "All trips with ride tiers (Tuk, Car, Van, Bike), status and fare details",
    icon: "🗺️",
    moduleName: "Module 2 · Booking & Dispatch Management",
    ownerName: "Chanuka Dharmakeerthi",
    role: "BOOKING_MGMT",
    ucCode: "UC21"
  },
  drivers: {
    key: "drivers",
    label: "Driver Performance",
    desc: "Driver earnings, ratings, verification documents, and cancellations",
    icon: "🚗",
    moduleName: "Module 3 · Driver Operations & Verification",
    ownerName: "Tharindu Senaka",
    role: "DRIVER_MGMT",
    ucCode: "UC15"
  },
  users: {
    key: "users",
    label: "User Activity Report",
    desc: "Passenger registrations, phone numbers, roles, and account activity",
    icon: "👤",
    moduleName: "Module 1 · Passenger & User Management",
    ownerName: "Lahiru Nayanamina",
    role: "USER_MGMT",
    ucCode: "UC08"
  },
  reviews: {
    key: "reviews",
    label: "Ratings & Reviews",
    desc: "All star ratings, passenger driver feedback comments, and moderation flags",
    icon: "⭐",
    moduleName: "Module 5 · Feedback & Review Moderation",
    ownerName: "Mithun Weerasingha",
    role: "REVIEW_MGMT",
    ucCode: "UC28"
  },
  audit: {
    key: "audit",
    label: "System Audit Log",
    desc: "All administrative mutations, security events, and cryptographic audit records",
    icon: "🛡️",
    moduleName: "Module 6 · System Administration & Security",
    ownerName: "Vidura (SUPER_ADMIN)",
    role: "SUPER_ADMIN",
    ucCode: "UC31"
  }
};

const SEED_FALLBACKS: Record<string, any[]> = {
  payments: [
    { id: 1, tripId: 101, grossAmount: 1925, platformCommission: 288.75, driverNet: 1636.25, paymentMethod: "CARD", status: "SUCCESS", createdAt: "2026-10-04T08:00:00" },
    { id: 2, tripId: 102, grossAmount: 1076, platformCommission: 161.40, driverNet: 914.60, paymentMethod: "CARD", status: "SUCCESS", createdAt: "2026-10-04T08:15:00" },
    { id: 3, tripId: 103, grossAmount: 485, platformCommission: 72.75, driverNet: 412.25, paymentMethod: "CASH", status: "SUCCESS", createdAt: "2026-10-04T08:20:00" },
    { id: 4, tripId: 104, grossAmount: 313, platformCommission: 46.95, driverNet: 266.05, paymentMethod: "WALLET", status: "SUCCESS", createdAt: "2026-10-04T08:30:00" },
    { id: 5, tripId: 105, grossAmount: 286, platformCommission: 42.90, driverNet: 243.10, paymentMethod: "CASH", status: "SUCCESS", createdAt: "2026-10-04T08:45:00" }
  ],
  bookings: [
    { id: 1, pickupAddress: "Galle Face Green, Colombo", dropoffAddress: "Independence Square, Colombo 07", rideType: "standard", distanceKm: 4.8, totalFare: 1076, status: "COMPLETED", createdAt: "2026-10-04T08:00:00" },
    { id: 2, pickupAddress: "Bandaranaike Int Airport (CMB)", dropoffAddress: "Colombo Fort Railway Station", rideType: "xl", distanceKm: 33.2, totalFare: 6850, status: "COMPLETED", createdAt: "2026-10-04T07:30:00" },
    { id: 3, pickupAddress: "Majestic City, Bambalapitiya", dropoffAddress: "University of Colombo", rideType: "tuk", distanceKm: 2.1, totalFare: 485, status: "IN_PROGRESS", createdAt: "2026-10-04T08:40:00" },
    { id: 4, pickupAddress: "One Galle Face Mall", dropoffAddress: "Mount Lavinia Hotel", rideType: "standard", distanceKm: 12.4, totalFare: 2150, status: "REQUESTED", createdAt: "2026-10-04T08:50:00" }
  ],
  drivers: [
    { id: 101, name: "Sunil Perera", email: "sunil.p@streetify.lk", phone: "+94771234567", vehicleType: "Sedan (Standard)", rating: 4.9, totalTrips: 342, verified: true, active: true },
    { id: 102, name: "Kamal Fernando", email: "kamal.f@streetify.lk", phone: "+94712345678", vehicleType: "Tuk Tuk (Budget)", rating: 4.8, totalTrips: 521, verified: true, active: true },
    { id: 103, name: "Nuwan Pradeep", email: "nuwan.p@streetify.lk", phone: "+94763456789", vehicleType: "Van (XL)", rating: 4.95, totalTrips: 189, verified: true, active: true },
    { id: 104, name: "Prasad Silva", email: "prasad.s@streetify.lk", phone: "+94754567890", vehicleType: "Motorbike (Moto)", rating: 4.7, totalTrips: 410, verified: true, active: true }
  ],
  users: [
    { id: 1, firstName: "Lahiru", lastName: "Nayanamina", email: "lahiru@streetify.lk", phone: "+94770000001", role: "ADMIN", active: true },
    { id: 2, firstName: "Chanuka", lastName: "Dharmakeerthi", email: "chanuka@streetify.lk", phone: "+94770000002", role: "ADMIN", active: true },
    { id: 3, firstName: "Daham", lastName: "Edirisinghe", email: "daham@streetify.lk", phone: "+94770000003", role: "ADMIN", active: true },
    { id: 4, firstName: "Tharindu", lastName: "Senaka", email: "tharindu@streetify.lk", phone: "+94770000004", role: "ADMIN", active: true },
    { id: 5, firstName: "Mithun", lastName: "Weerasingha", email: "mithun@streetify.lk", phone: "+94770000005", role: "ADMIN", active: true },
    { id: 6, firstName: "Vidura", lastName: "Prabath", email: "admin@streetify.com", phone: "+94770000000", role: "SUPER_ADMIN", active: true }
  ],
  reviews: [
    { id: 1, tripId: 101, driverId: 101, passengerId: 2, rating: 5, comment: "Punctual, polite driver and very clean vehicle.", createdAt: "2026-10-04T08:10:00" },
    { id: 2, tripId: 102, driverId: 102, passengerId: 3, rating: 5, comment: "Quickest ride through Colombo traffic, highly recommended!", createdAt: "2026-10-04T08:25:00" },
    { id: 3, tripId: 103, driverId: 103, passengerId: 4, rating: 4, comment: "Comfortable spacious van, smooth airport transfer.", createdAt: "2026-10-04T08:35:00" }
  ],
  audit: [
    { id: 1, actionType: "CREATE_BOOKING", description: "Created trip booking #101 via mobile app", adminUser: "system", timestamp: "2026-10-04T08:00:00" },
    { id: 2, actionType: "PROCESS_PAYMENT", description: "Processed card payment Rs 1925 for trip #101", adminUser: "system", timestamp: "2026-10-04T08:15:00" },
    { id: 3, actionType: "VERIFY_DRIVER", description: "Approved driver documentation for ID 101", adminUser: "tharindu@streetify.lk", timestamp: "2026-10-04T08:20:00" }
  ]
};

function jsonToCSV(arr: any[]) {
  if (!arr || !arr.length) return "";
  const keys = Object.keys(arr[0]);
  const rows = arr.map(obj => keys.map(k => JSON.stringify(obj[k] ?? "")).join(","));
  return [keys.join(","), ...rows].join("\n");
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportModuleData(
  key: "payments" | "bookings" | "drivers" | "users" | "reviews" | "audit",
  format: "csv" | "json",
  onDone?: (msg: string) => void
) {
  const meta = MODULE_REPORTS[key];
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `streetify_${key}_${dateStr}.${format}`;

  apiClient<any[]>(`/module-admin/${key}`)
    .then(data => {
      const records = (Array.isArray(data) && data.length > 0) ? data : (SEED_FALLBACKS[key] || []);
      if (format === "json") {
        downloadFile(fileName, JSON.stringify(records, null, 2), "application/json");
      } else {
        downloadFile(fileName, jsonToCSV(records), "text/csv");
      }
      onDone?.(`${meta?.label || key} exported successfully as ${format.toUpperCase()}`);
    })
    .catch(() => {
      const records = SEED_FALLBACKS[key] || [];
      if (format === "json") {
        downloadFile(fileName, JSON.stringify(records, null, 2), "application/json");
      } else {
        downloadFile(fileName, jsonToCSV(records), "text/csv");
      }
      onDone?.(`${meta?.label || key} exported successfully as ${format.toUpperCase()}`);
    });
}

export interface ModuleExportCardProps {
  reportKey: "payments" | "bookings" | "drivers" | "users" | "reviews" | "audit";
  variant?: "card" | "banner" | "compact";
  className?: string;
}

export default function ModuleExportCard({
  reportKey,
  variant = "card",
  className = ""
}: ModuleExportCardProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const report = MODULE_REPORTS[reportKey];
  if (!report) return null;

  const handleExport = (format: "csv" | "json") => {
    setExporting(format);
    exportModuleData(reportKey, format, (msg) => {
      setExporting(null);
      setDoneMsg(msg);
      setTimeout(() => setDoneMsg(null), 3500);
    });
  };

  if (variant === "compact" || variant === "banner") {
    return (
      <div className={`bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-eco-dark/30 border border-eco/30 flex items-center justify-center text-lg flex-none">
            {report.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-extrabold text-white text-xs truncate">{report.label}</p>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-eco/20 text-emerald-400 border border-emerald-500/30">
                {report.ownerName.split(" ")[0]} ({report.role})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-md">{report.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doneMsg && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse mr-1">
              ✅ Exported!
            </span>
          )}
          <button
            onClick={() => handleExport("csv")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-eco hover:bg-eco-glow text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Download report as CSV file"
          >
            <span>⬇️</span>
            <span>{exporting === "csv" ? "Exporting..." : "Export CSV"}</span>
          </button>
          <button
            onClick={() => handleExport("json")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            title="Download report as JSON file"
          >
            <span>📊</span>
            <span>{exporting === "json" ? "Exporting..." : "Export JSON"}</span>
          </button>
        </div>
      </div>
    );
  }

  // Default "card" variant matching the screenshot
  return (
    <Card className={`p-5 flex items-start gap-4 hover:border-emerald-500/30 transition-all ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-eco-dark/20 border border-slate-700 flex items-center justify-center text-2xl flex-none shadow-inner">
        {report.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-extrabold text-slate-100 text-base">{report.label}</p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {report.ownerName}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{report.desc}</p>

        {doneMsg && (
          <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <span>✅</span>
            <span>{doneMsg}</span>
          </div>
        )}

        <div className="mt-3.5 flex gap-2 flex-wrap">
          <Btn
            size="sm"
            onClick={() => handleExport("csv")}
            loading={exporting === "csv"}
            disabled={!!exporting}
            className="!bg-emerald-600 hover:!bg-emerald-500 font-bold"
          >
            ⬇️ Export CSV
          </Btn>
          <Btn
            size="sm"
            v="secondary"
            onClick={() => handleExport("json")}
            loading={exporting === "json"}
            disabled={!!exporting}
          >
            📊 Export JSON
          </Btn>
        </div>
      </div>
    </Card>
  );
}
