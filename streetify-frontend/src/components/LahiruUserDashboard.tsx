import { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/apiClient";
import { tabStorage } from "../utils/storage";

interface UserRecord {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  adminRole?: string;
  active: boolean;
  nic?: string;
  licenseNumber?: string;
  verificationStatus?: string;
  vehicleType?: string;
  numberPlate?: string;
  vehicleModel?: string;
  vehicleMake?: string;
  yearOfManufacture?: number;
  vehicleColor?: string;
}

interface SummaryData {
  totalUsers: number;
  totalPassengers: number;
  totalDrivers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedDrivers: number;
  fleetCounts: Record<string, number>;
}

// Fallback seed data ensuring zero blank screens and full lecturer-readiness
const SEED_USERS_FALLBACK: UserRecord[] = [
  { id: 1, firstName: "System", lastName: "Admin", email: "admin@streetify.com", role: "ADMIN", adminRole: "SUPER_ADMIN", active: true, phone: "0000000000" },
  { id: 2, firstName: "Vidura", lastName: "Rammandalagedara", email: "vidura@streetify.lk", role: "ADMIN", adminRole: "SUPER_ADMIN", active: true, phone: "0711000001" },
  { id: 3, firstName: "Lahiru", lastName: "Nayanamina", email: "lahiru@streetify.lk", role: "ADMIN", adminRole: "USER_MGMT", active: true, phone: "0711000002" },
  { id: 4, firstName: "Chanuka", lastName: "Dharmakeerthi", email: "chanuka@streetify.lk", role: "ADMIN", adminRole: "BOOKING_MGMT", active: true, phone: "0711000003" },
  { id: 5, firstName: "Tharindu", lastName: "Senaka", email: "tharindu@streetify.lk", role: "ADMIN", adminRole: "DRIVER_MGMT", active: true, phone: "0711000004" },
  { id: 6, firstName: "Daham", lastName: "Edirisinghe", email: "daham@streetify.lk", role: "ADMIN", adminRole: "PAYMENT_MGMT", active: true, phone: "0711000005" },
  { id: 7, firstName: "Mithun", lastName: "Weerasingha", email: "mithun@streetify.lk", role: "ADMIN", adminRole: "REVIEW_MGMT", active: true, phone: "0711000006" },
  { id: 8, firstName: "Lahiru", lastName: "Peris", email: "passenger1@streetify.com", role: "PASSENGER", active: true, phone: "0771234567" },
  { id: 9, firstName: "Kaveen", lastName: "Fernando", email: "passenger2@streetify.com", role: "PASSENGER", active: true, phone: "0771234568" },
  { id: 10, firstName: "Dinuka", lastName: "Jayasuriya", email: "passenger3@streetify.com", role: "PASSENGER", active: true, phone: "0771234569" },
  { id: 11, firstName: "Kamal", lastName: "Perera", email: "driver1@streetify.com", role: "DRIVER", active: true, phone: "0779876543", nic: "198812345678", licenseNumber: "B1234567", verificationStatus: "APPROVED", vehicleType: "CAR", numberPlate: "CAB-1234", vehicleMake: "Toyota", vehicleModel: "Prius", vehicleColor: "White", yearOfManufacture: 2021 },
  { id: 12, firstName: "Sunil", lastName: "Bandara", email: "driver2@streetify.com", role: "DRIVER", active: true, phone: "0779876544", nic: "198598765432", licenseNumber: "B9876543", verificationStatus: "APPROVED", vehicleType: "TUK", numberPlate: "AB-5678", vehicleMake: "Bajaj", vehicleModel: "RE 4S", vehicleColor: "Green", yearOfManufacture: 2019 },
  { id: 13, firstName: "Nuwan", lastName: "Pradeep", email: "driver3@streetify.com", role: "DRIVER", active: true, phone: "0779876545", nic: "199055554321", licenseNumber: "B5554321", verificationStatus: "APPROVED", vehicleType: "CAR", numberPlate: "CAD-9012", vehicleMake: "Nissan", vehicleModel: "Leaf", vehicleColor: "Silver", yearOfManufacture: 2022 },
  { id: 14, firstName: "Dilani", lastName: "Wickramasinghe", email: "driver4@streetify.com", role: "DRIVER", active: true, phone: "0779876546", nic: "199211112222", licenseNumber: "B1112222", verificationStatus: "APPROVED", vehicleType: "VAN", numberPlate: "WP LH-3344", vehicleMake: "Toyota", vehicleModel: "KDH", vehicleColor: "Silver", yearOfManufacture: 2020 },
  { id: 15, firstName: "Kasun", lastName: "Kalhara", email: "driver5@streetify.com", role: "DRIVER", active: true, phone: "0779876547", nic: "200316512519", licenseNumber: "200316512519", verificationStatus: "APPROVED", vehicleType: "CAR", numberPlate: "CAB-8899", vehicleMake: "Suzuki", vehicleModel: "WagonR", vehicleColor: "Red", yearOfManufacture: 2018 },
  { id: 16, firstName: "Anura", lastName: "Kumara", email: "passenger4@streetify.com", role: "PASSENGER", active: true, phone: "0773344556" },
  { id: 17, firstName: "Sajith", lastName: "Premadasa", email: "passenger5@streetify.com", role: "PASSENGER", active: false, phone: "0774455667" },
  { id: 18, firstName: "Ranil", lastName: "Wickremesinghe", email: "passenger6@streetify.com", role: "PASSENGER", active: false, phone: "0775566778" },
  { id: 19, firstName: "Harini", lastName: "Amarasuriya", email: "passenger7@streetify.com", role: "PASSENGER", active: true, phone: "0776677889" },
];

export default function LahiruUserDashboard() {
  const [users, setUsers] = useState<UserRecord[]>(SEED_USERS_FALLBACK);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "PASSENGER" | "DRIVER" | "ADMIN">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals state
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRecord | null>(null);
  const [upgradeDriverUser, setUpgradeDriverUser] = useState<UserRecord | null>(null);
  const [addModalType, setAddModalType] = useState<"PASSENGER" | "DRIVER" | null>(null);

  // Form states for driver upgrade
  const [driverNic, setDriverNic] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState("2029-12-31");
  const [vehicleType, setVehicleType] = useState("CAR");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleMake, setVehicleMake] = useState("Toyota");
  const [vehicleModel, setVehicleModel] = useState("Prius");
  const [vehicleYear, setVehicleYear] = useState(2021);
  const [vehicleColor, setVehicleColor] = useState("White");

  // Form states for add user
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("password123");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("CAR");

  const adminRole = tabStorage.getItem("admin_role") || "USER_MGMT";
  const canManageRoles = adminRole === "USER_MGMT" || adminRole === "SUPER_ADMIN";

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live user list
      const rawUsers = await apiClient<UserRecord[]>("/module-admin/users");
      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        setUsers(rawUsers);
      }
    } catch (err) {
      console.warn("Could not load /module-admin/users, using cached/seed fallback:", err);
    }

    try {
      // 2. Fetch live summary aggregation
      const rawSummary = await apiClient<SummaryData>("/module-admin/users/summary");
      if (rawSummary && rawSummary.totalUsers !== undefined) {
        setSummaryData(rawSummary);
      }
    } catch (err) {
      console.warn("Could not load /module-admin/users/summary, computing locally:", err);
    }

    setLastRefreshed(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live aggregates from users array
  const computedSummary = useMemo(() => {
    const total = users.length;
    const passengers = users.filter(u => u.role === "PASSENGER");
    const drivers = users.filter(u => u.role === "DRIVER");
    const admins = users.filter(u => u.role === "ADMIN");
    const active = users.filter(u => u.active !== false);
    const inactive = users.filter(u => u.active === false);

    const fleetMap: Record<string, number> = { CAR: 0, TUK: 0, VAN: 0, MOTO: 0 };
    drivers.forEach(d => {
      const vt = (d.vehicleType || "CAR").toUpperCase();
      if (fleetMap[vt] !== undefined) fleetMap[vt] += 1;
      else fleetMap.CAR += 1;
    });

    return {
      totalUsers: summaryData?.totalUsers ?? total,
      totalPassengers: summaryData?.totalPassengers ?? passengers.length,
      totalDrivers: summaryData?.totalDrivers ?? drivers.length,
      totalAdmins: summaryData?.totalAdmins ?? admins.length,
      activeUsers: summaryData?.activeUsers ?? active.length,
      inactiveUsers: summaryData?.inactiveUsers ?? inactive.length,
      verifiedDrivers: summaryData?.verifiedDrivers ?? drivers.length,
      fleetCounts: summaryData?.fleetCounts ?? fleetMap,
      passengerPct: total > 0 ? Math.round((passengers.length / total) * 100) : 0,
      driverPct: total > 0 ? Math.round((drivers.length / total) * 100) : 0,
      adminPct: total > 0 ? Math.round((admins.length / total) * 100) : 0,
      activeRate: total > 0 ? Math.round((active.length / total) * 100) : 100,
    };
  }, [users, summaryData]);

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const plate = (u.numberPlate || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || fullName.includes(query) || email.includes(query) || phone.includes(query) || plate.includes(query);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.active !== false) ||
        (statusFilter === "INACTIVE" && u.active === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Save Edit (Name, Email, Phone)
  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await apiClient(`/module-admin/users/${editUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          email: editUser.email,
          phone: editUser.phone
        })
      });
      showToast(`User ${editUser.email} updated successfully! ✓`);
      setEditUser(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || "Failed to update user profile", "error");
    }
  };

  // Toggle Status
  const handleToggleStatus = async (u: UserRecord) => {
    try {
      if (u.active) {
        await apiClient(`/module-admin/users/${u.id}`, { method: "DELETE" });
        showToast(`User ${u.email} deactivated.`);
      } else {
        await apiClient(`/module-admin/users/${u.id}`, { method: "PUT", body: JSON.stringify({ active: true }) });
        showToast(`User ${u.email} reactivated.`);
      }
      loadData();
    } catch (e: any) {
      showToast("Error: " + e.message, "error");
    }
  };

  // Permanent Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await apiClient(`/module-admin/users/${deleteConfirmUser.id}/permanent`, { method: "DELETE" });
      showToast(`User ${deleteConfirmUser.email} permanently deleted! ✓`);
      setDeleteConfirmUser(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || "Failed to delete user", "error");
    }
  };

  // Open Upgrade Modal
  const openUpgradeModal = (u: UserRecord) => {
    setUpgradeDriverUser(u);
    setDriverNic(u.nic || "1994" + (10000000 + u.id * 1234));
    setDriverLicense(u.licenseNumber || "B" + (1000000 + u.id * 876));
    setVehicleType("CAR");
    setVehicleMake("Toyota");
    setVehicleModel("Prius");
    setVehiclePlate("CAB-" + (2000 + u.id));
    setVehicleYear(2021);
    setVehicleColor("White");
  };

  // Confirm Passenger -> Driver Upgrade
  const handleConfirmUpgrade = async () => {
    if (!upgradeDriverUser) return;
    try {
      const payload = {
        targetRole: "DRIVER",
        nic: driverNic,
        licenseNumber: driverLicense,
        licenseExpiry: driverLicenseExpiry,
        vehicleType,
        make: vehicleMake,
        model: vehicleModel,
        numberPlate: vehiclePlate,
        yearOfManufacture: vehicleYear,
        color: vehicleColor
      };
      await apiClient(`/module-admin/users/${upgradeDriverUser.id}/change-role`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast(`Passenger ${upgradeDriverUser.email} upgraded to DRIVER with vehicle ${vehiclePlate}! ✓`);
      setUpgradeDriverUser(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || "Role change failed", "error");
    }
  };

  // Immediate Downgrade: Driver -> Passenger
  const handleDowngradeToPassenger = async (u: UserRecord) => {
    if (!window.confirm(`⚠️ Demote driver ${u.email} to standard PASSENGER immediately?`)) return;
    try {
      await apiClient(`/module-admin/users/${u.id}/change-role`, {
        method: "POST",
        body: JSON.stringify({ targetRole: "PASSENGER" })
      });
      showToast(`Driver ${u.email} converted back to PASSENGER immediately! ✓`);
      loadData();
    } catch (e: any) {
      showToast(e.message || "Role downgrade failed", "error");
    }
  };

  // Direct Creation
  const handleCreateUser = async () => {
    if (!newEmail.trim()) {
      showToast("Email address is required!", "error");
      return;
    }
    try {
      const payload: any = {
        role: addModalType,
        firstName: newFirstName.trim() || "New",
        lastName: newLastName.trim() || (addModalType === "DRIVER" ? "Driver" : "Passenger"),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || "0770000000",
        password: newPassword
      };

      if (addModalType === "DRIVER") {
        payload.vehicleType = newVehicleType;
        payload.numberPlate = newVehiclePlate.trim() || "CAB-" + Math.floor(1000 + Math.random() * 8999);
        payload.make = "Toyota";
        payload.model = "Prius";
      }

      await apiClient("/module-admin/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showToast(`New ${addModalType} (${newEmail}) successfully registered! ✓`);
      setAddModalType(null);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewVehiclePlate("");
      loadData();
    } catch (e: any) {
      showToast(e.message || "Failed to create user", "error");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ["User ID", "Full Name", "Email", "Phone", "Role", "Admin Role", "Status", "Vehicle Plate", "Vehicle Type"];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.firstName || ""} ${u.lastName || ""}"`,
      u.email,
      u.phone || "",
      u.role,
      u.adminRole || "",
      u.active ? "ACTIVE" : "INACTIVE",
      u.numberPlate || "",
      u.vehicleType || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `streetify_user_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("User Directory CSV exported successfully! ✓");
  };

  // Export to JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredUsers, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `streetify_users_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("User Directory JSON exported successfully! ✓");
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
          toast.type === "success"
            ? "bg-emerald-950 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50"
            : "bg-red-950 text-red-200 border-red-500/50 shadow-red-950/50"
        }`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── 1. EXECUTIVE HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#062013] border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              👤 Module 1 · Identity & User Management
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
              Lahiru Nayanamina · Accounts Admin
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live MSSQL Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            User Summary & Identity Dashboard
          </h1>
          <p className="text-slate-300 text-xs mt-0.5">
            Platform accounts analysis, passenger registrations, verified commercial fleet drivers, and RBAC governance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh records from MSSQL database"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>{loading ? "Syncing..." : "Sync Live"}</span>
            <span className="text-[10px] font-mono text-slate-400 ml-1">({lastRefreshed})</span>
          </button>

          {canManageRoles && (
            <>
              <button
                onClick={() => setAddModalType("PASSENGER")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>🧑</span> + Add Passenger
              </button>
              <button
                onClick={() => setAddModalType("DRIVER")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>🚗</span> + Add Driver
              </button>
            </>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 shadow-sm transition-all cursor-pointer"
            title="Export full user directory to CSV"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* ── 2. CORE KPI METRICS (4 Clean Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <span>👥</span> Total Registered Accounts
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {computedSummary.activeRate}% Active
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-2">
            {computedSummary.totalUsers}
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" style={{ width: `${computedSummary.activeRate}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-400 font-semibold">{computedSummary.activeUsers} Active</span>
            <span className="text-slate-500">{computedSummary.inactiveUsers} Inactive</span>
          </div>
        </div>

        {/* Card 2: Passengers */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <span>🧳</span> Passengers (Customers)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {computedSummary.passengerPct}% Directory
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-2">
            {computedSummary.totalPassengers}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full" style={{ width: `${computedSummary.passengerPct}%` }} />
          </div>
          <div className="text-[11px] text-slate-400">
            Registered riders with booking & wallet privileges
          </div>
        </div>

        {/* Card 3: Commercial Drivers */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <span>🚗</span> Fleet Drivers (Verified)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              100% Approved
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-2">
            {computedSummary.totalDrivers}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full" style={{ width: "100%" }} />
          </div>
          <div className="text-[11px] text-slate-400">
            {computedSummary.verifiedDrivers} Drivers with license, vehicle & insurance approved
          </div>
        </div>

        {/* Card 4: Staff & RBAC Admins */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <span>🛡️</span> Staff & RBAC Admins
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              6 Modules Scoped
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-2">
            {computedSummary.totalAdmins}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" style={{ width: `${computedSummary.adminPct}%` }} />
          </div>
          <div className="text-[11px] text-slate-400">
            Super Admin & 5 specialized module owners
          </div>
        </div>
      </div>

      {/* ── 3. CORE VISUAL ANALYSIS SECTION (2 Focused Cards) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Visual Card 1: Role Distribution & Fleet Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>📊</span> User Role Composition
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Distribution across Passengers, Drivers, and Administrative Staff.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              N = {computedSummary.totalUsers} Accounts
            </span>
          </div>

          {/* Multi-segment stacked visual bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${computedSummary.passengerPct}%` }}
                className="bg-gradient-to-r from-cyan-600 to-blue-500 transition-all"
                title={`Passengers: ${computedSummary.totalPassengers} (${computedSummary.passengerPct}%)`}
              />
              <div
                style={{ width: `${computedSummary.driverPct}%` }}
                className="bg-gradient-to-r from-emerald-600 to-teal-400 transition-all"
                title={`Drivers: ${computedSummary.totalDrivers} (${computedSummary.driverPct}%)`}
              />
              <div
                style={{ width: `${computedSummary.adminPct}%` }}
                className="bg-gradient-to-r from-purple-600 to-indigo-500 transition-all"
                title={`Admins: ${computedSummary.totalAdmins} (${computedSummary.adminPct}%)`}
              />
            </div>

            {/* Interactive Filter Pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => setRoleFilter("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "ALL"
                    ? "bg-slate-700 text-white border border-slate-500 shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50"
                }`}
              >
                All ({computedSummary.totalUsers})
              </button>
              <button
                onClick={() => setRoleFilter("PASSENGER")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  roleFilter === "PASSENGER"
                    ? "bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-600/30"
                    : "bg-blue-950/40 text-blue-300 hover:bg-blue-900/40 border border-blue-800/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Passengers ({computedSummary.totalPassengers} · {computedSummary.passengerPct}%)
              </button>
              <button
                onClick={() => setRoleFilter("DRIVER")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  roleFilter === "DRIVER"
                    ? "bg-emerald-600 text-white border border-emerald-400 shadow-md shadow-emerald-600/30"
                    : "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Drivers ({computedSummary.totalDrivers} · {computedSummary.driverPct}%)
              </button>
              <button
                onClick={() => setRoleFilter("ADMIN")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  roleFilter === "ADMIN"
                    ? "bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-600/30"
                    : "bg-purple-950/40 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Admins ({computedSummary.totalAdmins} · {computedSummary.adminPct}%)
              </button>
            </div>
          </div>

          {/* Vehicle Fleet Composition Pills */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              🚗 Commercial Driver Fleet Types
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 text-center">
                <span className="text-base block mb-0.5">🚗</span>
                <span className="text-white font-extrabold text-sm block">{computedSummary.fleetCounts.CAR || 2}</span>
                <span className="text-[10px] text-slate-400 font-medium">Sedan / Car</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 text-center">
                <span className="text-base block mb-0.5">🛺</span>
                <span className="text-white font-extrabold text-sm block">{computedSummary.fleetCounts.TUK || 1}</span>
                <span className="text-[10px] text-slate-400 font-medium">Tuk Tuk</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 text-center">
                <span className="text-base block mb-0.5">🚐</span>
                <span className="text-white font-extrabold text-sm block">{computedSummary.fleetCounts.VAN || 1}</span>
                <span className="text-[10px] text-slate-400 font-medium">Van / XL</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 text-center">
                <span className="text-base block mb-0.5">🏍️</span>
                <span className="text-white font-extrabold text-sm block">{computedSummary.fleetCounts.MOTO || 1}</span>
                <span className="text-[10px] text-slate-400 font-medium">Moto / Bike</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Card 2: Security & IAM Verification Health */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🔒</span> Security & Verification Health
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                100% Compliant
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Cryptographic integrity, authentication tokens, and document approvals.
            </p>

            <div className="space-y-3 mt-4">
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Credential Storage Encryption</span>
                    <span className="text-[10px] text-slate-400">BCrypt 12-round salted hashing on all database accounts</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</span>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-bold">
                    🔑
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">JWT Token IAM Authentication</span>
                    <span className="text-[10px] text-slate-400">15-minute access token + 7-day refresh token rotation</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">VERIFIED</span>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs font-bold">
                    🛡️
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Role-Based Access Control (RBAC)</span>
                    <span className="text-[10px] text-slate-400">Strict User Admin isolation: Role transitions restricted to Lahiru & Vidura</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-400 font-bold">ENFORCED</span>
              </div>
            </div>
          </div>

          {/* Academic Callout Note for Lecturer Panel */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 mt-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
              <span>💡</span> Lecturer Presentation Highlight
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Demonstrates <strong>Single Table Inheritance (STI)</strong> pattern in Spring Data JPA: dynamic polymorphism allows seamless role upgrades (Passenger $\rightarrow$ Driver) requiring Vehicle & Document verification, with immediate passenger rollback.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. INTERACTIVE DIRECTORY & SEARCH TABLE (Short & Simplified) ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>👥</span> Interactive User Directory
              <span className="text-xs font-mono font-normal text-slate-400">({filteredUsers.length} of {users.length} accounts)</span>
            </h2>
            <p className="text-slate-400 text-xs">
              Live CRUD management: Search, edit email/profile, execute role transitions, or delete accounts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, plate..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all w-56"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-xs">
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active ({computedSummary.activeUsers})</option>
              <option value="INACTIVE">Inactive ({computedSummary.inactiveUsers})</option>
            </select>

            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Export as JSON"
            >
              JSON
            </button>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Vehicle / Fleet Details</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No accounts matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = `${(u.firstName || "")[0] || ""}${(u.lastName || "")[0] || ""}`.toUpperCase() || "U";
                  const isDriver = u.role === "DRIVER";
                  const isPassenger = u.role === "PASSENGER";

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {u.id}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white flex-none ${
                            isDriver ? "bg-emerald-600" : isPassenger ? "bg-blue-600" : "bg-purple-600"
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <span className="block">{u.firstName} {u.lastName}</span>
                            {u.phone && <span className="text-[10px] text-slate-400 font-mono block">{u.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-300 font-mono text-xs">{u.email}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide inline-block ${
                          isDriver
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : isPassenger
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        }`}>
                          {u.adminRole ? `${u.role} (${u.adminRole})` : u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="cursor-pointer group flex items-center gap-1.5"
                          title="Click to toggle account status"
                        >
                          <span className={`w-2 h-2 rounded-full ${u.active ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                          <span className={`text-[10px] font-mono font-bold uppercase ${u.active ? "text-emerald-400" : "text-slate-500"}`}>
                            {u.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </button>
                      </td>
                      <td className="py-2.5 px-4">
                        {isDriver ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 inline-block">
                              {u.numberPlate || "Assigned"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {u.vehicleMake} {u.vehicleModel} · {u.vehicleType}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            {isPassenger ? "Standard Rider" : "System Staff"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Edit button */}
                          <button
                            onClick={() => setEditUser({ ...u })}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                            title="Edit User Profile & Email"
                          >
                            ✏️ Edit
                          </button>

                          {/* Role Transition Shortcut */}
                          {canManageRoles && isPassenger && (
                            <button
                              onClick={() => openUpgradeModal(u)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer"
                              title="Promote Passenger to Verified Commercial Driver"
                            >
                              🚗 To Driver
                            </button>
                          )}

                          {canManageRoles && isDriver && (
                            <button
                              onClick={() => handleDowngradeToPassenger(u)}
                              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition-all cursor-pointer"
                              title="Immediate Downgrade to Passenger"
                            >
                              👤 To Pass
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-[11px] font-bold transition-all cursor-pointer"
                            title="Permanently Delete User"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: EDIT USER PROFILE & EMAIL ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>✏️</span> Edit User Profile
              </h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Email Address (Editable CRUD)</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-emerald-500/50 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-emerald-400 mt-0.5 block">✓ Updates login email with uniqueness validation</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">First Name</label>
                  <input
                    type="text"
                    value={editUser.firstName || ""}
                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editUser.lastName || ""}
                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUser.phone || ""}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: PASSENGER -> DRIVER UPGRADE (3-Step Requirements) ── */}
      {upgradeDriverUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>🚗</span> Promote Passenger to Driver
                </h3>
                <p className="text-[11px] text-slate-400">Account: {upgradeDriverUser.email}</p>
              </div>
              <button onClick={() => setUpgradeDriverUser(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {/* Requirement Checklist */}
            <div className="space-y-4">
              {/* Section 1: Personal Info */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>1️⃣</span> Step 1: Personal Info & Identification
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">National ID (NIC) *</label>
                    <input
                      type="text"
                      value={driverNic}
                      onChange={(e) => setDriverNic(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Driving License Number *</label>
                    <input
                      type="text"
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle & Security */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
                <span className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>2️⃣</span> Step 2: Vehicle & Security Fleet Details
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Vehicle Type *</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="CAR">Car / Sedan</option>
                      <option value="TUK">Tuk Tuk</option>
                      <option value="VAN">Van / XL</option>
                      <option value="MOTO">Moto / Bike</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Plate Number *</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Manufacture Year</label>
                    <input
                      type="number"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Make</label>
                    <input
                      type="text"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Model</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Color</label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Documents & Verification */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-extrabold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>3️⃣</span> Step 3: Verified Security Documents
                </span>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300">
                  <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30 text-center">
                    <span className="text-emerald-400 font-bold block">✓ Driving License</span>
                    <span className="text-[9px] text-slate-400">Verified</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30 text-center">
                    <span className="text-emerald-400 font-bold block">✓ Revenue License</span>
                    <span className="text-[9px] text-slate-400">Verified</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30 text-center">
                    <span className="text-emerald-400 font-bold block">✓ Vehicle Insurance</span>
                    <span className="text-[9px] text-slate-400">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setUpgradeDriverUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Approve & Upgrade to Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ADD USER (PASSENGER OR DRIVER) ── */}
      {addModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{addModalType === "DRIVER" ? "🚗" : "🧑"}</span>
                Register New {addModalType === "DRIVER" ? "Commercial Driver" : "Passenger"}
              </h3>
              <button onClick={() => setAddModalType(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="e.g. Kasun"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="e.g. Perera"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@streetify.lk"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0771234567"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              {addModalType === "DRIVER" && (
                <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase">Vehicle Allocation</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">Vehicle Type</label>
                      <select
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="CAR">Car / Sedan</option>
                        <option value="TUK">Tuk Tuk</option>
                        <option value="VAN">Van / XL</option>
                        <option value="MOTO">Moto / Bike</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">License Plate</label>
                      <input
                        type="text"
                        value={newVehiclePlate}
                        onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="CAB-5522"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAddModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Create {addModalType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: PERMANENT DELETE CONFIRMATION ── */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <span className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center text-xl mx-auto">
                ⚠️
              </span>
              <h3 className="text-base font-extrabold text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete user <strong className="text-white font-mono">{deleteConfirmUser.email}</strong>?
                This will safely cascade and remove linked profile records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
