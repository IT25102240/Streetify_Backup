import { useState, useEffect } from "react";
import { Btn, Card, Pill } from "../ui";
import { apiClient } from "../api/apiClient";

type AdminTab = "users" | "bookings" | "driver-trips" | "payments" | "reviews" | "system";

export default function AdminDashboard() {
  const adminRole = localStorage.getItem("admin_role") || "UNKNOWN";
  const adminEmail = localStorage.getItem("user_name") || "Admin";

  const allowedTabs: { key: AdminTab; icon: string; label: string }[] = [];
  if (adminRole === "SUPER_ADMIN" || adminRole === "USER_MGMT") {
    allowedTabs.push({ key: "users", icon: "🧑", label: "User Management" });
  }
  if (adminRole === "SUPER_ADMIN" || adminRole === "BOOKING_MGMT") {
    allowedTabs.push({ key: "bookings", icon: "🗺️", label: "Booking Management" });
  }
  if (adminRole === "SUPER_ADMIN" || adminRole === "DRIVER_MGMT") {
    allowedTabs.push({ key: "driver-trips", icon: "🚗", label: "Driver Trips" });
  }
  if (adminRole === "SUPER_ADMIN" || adminRole === "PAYMENT_MGMT") {
    allowedTabs.push({ key: "payments", icon: "💳", label: "Payment Management" });
  }
  if (adminRole === "SUPER_ADMIN" || adminRole === "REVIEW_MGMT") {
    allowedTabs.push({ key: "reviews", icon: "⭐", label: "Review Management" });
  }
  if (adminRole === "SUPER_ADMIN") {
    allowedTabs.push({ key: "system", icon: "🛡️", label: "System Control" });
  }

  const [tab, setTab] = useState<AdminTab>(allowedTabs[0]?.key || "system");

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-[#1e3a8a] flex flex-col flex-none min-h-screen shadow-xl">
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
        <nav className="flex-1 p-3 space-y-1">
          {allowedTabs.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                ${tab === key
                  ? "bg-blue-600/80 text-white shadow-sm"
                  : "text-blue-200 hover:bg-blue-800/60 hover:text-white"}`}>
              <span>{icon}</span>
              <span className="flex-1 truncate text-sm">{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-extrabold text-white text-xs">{adminRole.substring(0,2)}</div>
            <div className="min-w-0">
              <p className="text-white text-xs font-extrabold truncate">{adminEmail}</p>
              <p className="text-blue-400 text-[10px] font-mono truncate">{adminRole}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between flex-none shadow-sm">
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg leading-tight">
              {allowedTabs.find(t => t.key === tab)?.label || "Dashboard"}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              MSSQL · /api/module-admin/{tab}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === "users" && <UsersPanel />}
          {tab === "bookings" && <BookingsPanel />}
          {tab === "driver-trips" && <DriverTripsPanel />}
          {tab === "payments" && <PaymentsPanel />}
          {tab === "reviews" && <ReviewsPanel />}
          {tab === "system" && <SystemPanel />}
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  
  const fetchUsers = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/users');
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeactivate = async (id: number) => {
    try {
      await apiClient(`/module-admin/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (e) {
      alert("Error: " + e);
    }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">User Management</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3 font-bold">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3"><Pill color="blue">{u.role}</Pill></td>
                <td className="px-4 py-3"><Pill color={u.active ? "green" : "red"}>{u.active ? "Active" : "Inactive"}</Pill></td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" disabled={!u.active} onClick={() => handleDeactivate(u.id)}>Deactivate</Btn>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="text-center p-4">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BookingsPanel() {
  const [trips, setTrips] = useState<any[]>([]);

  const fetchTrips = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/bookings');
      setTrips(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleCancel = async (id: number) => {
    try {
      await apiClient(`/module-admin/bookings/${id}`, { method: 'DELETE' });
      fetchTrips();
    } catch (e) {
      alert("Error: " + e);
    }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Booking Management</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">Trip ID</th>
              <th className="px-4 py-3 text-left">Pickup</th>
              <th className="px-4 py-3 text-left">Dropoff</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono">{t.id}</td>
                <td className="px-4 py-3 max-w-xs truncate">{t.pickupAddress}</td>
                <td className="px-4 py-3 max-w-xs truncate">{t.dropoffAddress}</td>
                <td className="px-4 py-3"><Pill>{t.status}</Pill></td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" v="danger" onClick={() => handleCancel(t.id)}>Cancel</Btn>
                </td>
              </tr>
            ))}
            {trips.length === 0 && <tr><td colSpan={5} className="text-center p-4">No bookings found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DriverTripsPanel() {
  const [trips, setTrips] = useState<any[]>([]);

  const fetchTrips = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/driver-trips');
      setTrips(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const unassignDriver = async (id: number) => {
    try {
      await apiClient(`/module-admin/driver-trips/${id}`, { method: 'DELETE' });
      fetchTrips();
    } catch (e) {
      alert("Error: " + e);
    }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Driver Trip Management</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">Trip ID</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono">{t.id}</td>
                <td className="px-4 py-3 font-bold">{t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "Unassigned"}</td>
                <td className="px-4 py-3"><Pill>{t.status}</Pill></td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" disabled={!t.driver} onClick={() => unassignDriver(t.id)}>Unassign</Btn>
                </td>
              </tr>
            ))}
            {trips.length === 0 && <tr><td colSpan={4} className="text-center p-4">No driver trips found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PaymentsPanel() {
  const [payments, setPayments] = useState<any[]>([]);

  const fetchPayments = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/payments');
      setPayments(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const voidPayment = async (id: number) => {
    try {
      await apiClient(`/module-admin/payments/${id}`, { method: 'DELETE' });
      fetchPayments();
    } catch (e) {
      alert("Error: " + e);
    }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Payment Management</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Gross Amount</th>
              <th className="px-4 py-3 text-left">Commission</th>
              <th className="px-4 py-3 text-left">Driver Net</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono">{p.id}</td>
                <td className="px-4 py-3">Rs {p.grossAmount}</td>
                <td className="px-4 py-3">Rs {p.platformCommission}</td>
                <td className="px-4 py-3">Rs {p.driverNet}</td>
                <td className="px-4 py-3"><Pill>{p.status}</Pill></td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" v="danger" onClick={() => voidPayment(p.id)}>Void</Btn>
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={6} className="text-center p-4">No payments found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ReviewsPanel() {
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchReviews = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/reviews');
      setReviews(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const deleteReview = async (id: number) => {
    try {
      await apiClient(`/module-admin/reviews/${id}`, { method: 'DELETE' });
      fetchReviews();
    } catch (e) {
      alert("Error: " + e);
    }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Review Management</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Rating</th>
              <th className="px-4 py-3 text-left">Comment</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono">{r.id}</td>
                <td className="px-4 py-3 text-lg font-mono">{r.rating} ⭐</td>
                <td className="px-4 py-3 max-w-sm truncate">{r.comment}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" v="danger" onClick={() => deleteReview(r.id)}>Delete</Btn>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan={4} className="text-center p-4">No reviews found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const AUDIT = [
  { ts:"14 Sep · 14:22", admin:"admin@streetify.lk",  action:"Suspended USR-3302 for 30 days — fraud confirmed",           type:"suspend" },
  { ts:"14 Sep · 13:55", admin:"coord@streetify.lk",  action:"Approved vehicle registration for DRV-2103",                 type:"approve" },
  { ts:"14 Sep · 11:30", admin:"admin@streetify.lk",  action:"Revoked all JWT session tokens for USR-3302",               type:"revoke"  },
  { ts:"13 Sep · 17:44", admin:"coord@streetify.lk",  action:"Issued formal warning to USR-6617 (missed trips)",           type:"warn"    },
  { ts:"13 Sep · 09:12", admin:"admin@streetify.lk",  action:"Resolved dispute TKT-88312 — partial refund LKR 340",        type:"resolve" },
];
const AUDIT_CLR: Record<string,string> = { suspend:"bg-red-500", revoke:"bg-red-400", warn:"bg-orange-400", approve:"bg-emerald-500", resolve:"bg-blue-500" };

function SystemPanel() {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="font-extrabold text-slate-800">System Audit Log</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            GET /api/admin/audit?limit=50 · Immutable append-only
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
  );
}
