import { useState, useEffect } from "react";
import { Btn, Card, Pill } from "../ui";
import { apiClient } from "../api/apiClient";

type AdminTab = "users" | "drivers" | "bookings" | "driver-trips" | "driver-docs" | "payments" | "reviews" | "system";

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
    allowedTabs.push({ key: "drivers", icon: "👨‍✈️", label: "Driver Profiles" });
    allowedTabs.push({ key: "driver-trips", icon: "🚗", label: "Driver Trips" });
    allowedTabs.push({ key: "driver-docs", icon: "📄", label: "Driver Verifications" });
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
          {tab === "drivers" && <DriversPanel />}
          {tab === "bookings" && <BookingsPanel />}
          {tab === "driver-trips" && <DriverTripsPanel />}
          {tab === "driver-docs" && <DriverDocsPanel />}
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    const firstName = prompt("First Name:"); if (!firstName) return;
    const lastName = prompt("Last Name:"); if (!lastName) return;
    const email = prompt("Email:"); if (!email) return;
    const phone = prompt("Phone:"); if (!phone) return;
    try {
      await apiClient('/module-admin/users', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, phone }) });
      fetchUsers();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (u: any) => {
    const firstName = prompt("Edit First Name:", u.firstName); if (!firstName) return;
    const lastName = prompt("Edit Last Name:", u.lastName); if (!lastName) return;
    const phone = prompt("Edit Phone:", u.phone); if (!phone) return;
    try {
      await apiClient(`/module-admin/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ firstName, lastName, phone, active: u.active }) });
      fetchUsers();
    } catch (e) { alert("Error: " + e); }
  };

  const handleToggleStatus = async (u: any) => {
    try {
      if (u.active) {
        await apiClient(`/module-admin/users/${u.id}`, { method: 'DELETE' });
      } else {
        await apiClient(`/module-admin/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ active: true }) });
      }
      fetchUsers();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">User Management</p>
        <Btn size="sm" onClick={handleAdd}>+ Add User</Btn>
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
                  <Btn size="xs" v="secondary" onClick={() => handleEdit(u)}>Edit</Btn>
                  <Btn size="xs" v={u.active ? "secondary" : "secondary"} onClick={() => handleToggleStatus(u)}>
                    {u.active ? "Deactivate" : "Activate"}
                  </Btn>
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleAdd = async () => {
    const pickupAddress = prompt("Pickup Address:"); if (!pickupAddress) return;
    const dropoffAddress = prompt("Dropoff Address:"); if (!dropoffAddress) return;
    try {
      await apiClient('/module-admin/bookings', { method: 'POST', body: JSON.stringify({ pickupAddress, dropoffAddress }) });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (t: any) => {
    const pickupAddress = prompt("Edit Pickup Address:", t.pickupAddress); if (pickupAddress === null) return;
    const dropoffAddress = prompt("Edit Dropoff Address:", t.dropoffAddress); if (dropoffAddress === null) return;
    const status = prompt("Update Status (REQUESTED, ACTIVE, COMPLETED, CANCELLED):", t.status); if (status === null) return;
    const estimatedFare = prompt("Estimated Fare:", t.totalFare || 0);
    try {
      await apiClient(`/module-admin/bookings/${t.id}`, { method: 'PUT', body: JSON.stringify({ pickupAddress, dropoffAddress, status, estimatedFare: Number(estimatedFare) }) });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const handleCancel = async (id: number) => {
    try {
      await apiClient(`/module-admin/bookings/${id}`, { method: 'DELETE' });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Booking Management</p>
        <Btn size="sm" onClick={handleAdd}>+ Add Booking</Btn>
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
                  <Btn size="xs" v="secondary" onClick={() => handleEdit(t)}>Edit</Btn>
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleAdd = async () => {
    const pickupAddress = prompt("Enter Pickup Address:", "Dummy Pickup Address"); if (!pickupAddress) return;
    const dropoffAddress = prompt("Enter Dropoff Address:", "Dummy Dropoff Address"); if (!dropoffAddress) return;
    const driverId = prompt("Enter Driver ID (Optional):");
    try {
      await apiClient('/module-admin/driver-trips', { 
        method: 'POST', 
        body: JSON.stringify({ 
          pickupAddress, 
          dropoffAddress, 
          driverId: driverId ? Number(driverId) : null 
        }) 
      });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (t: any) => {
    const pickupAddress = prompt("Edit Pickup Address:", t.pickupAddress || "Dummy Pickup Address"); if (!pickupAddress) return;
    const dropoffAddress = prompt("Edit Dropoff Address:", t.dropoffAddress || "Dummy Dropoff Address"); if (!dropoffAddress) return;
    try {
      await apiClient(`/module-admin/driver-trips/${t.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ pickupAddress, dropoffAddress }) 
      });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to completely delete trip ${id}?`)) return;
    try {
      await apiClient(`/module-admin/driver-trips/${id}`, { method: 'DELETE' });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const assignDriver = async (t: any) => {
    const driverId = prompt("Assign Driver ID:", t.driver?.id || "");
    if (!driverId) return;

    try {
      await apiClient(`/module-admin/driver-trips/${t.id}`, { method: 'PUT', body: JSON.stringify({ driverId: Number(driverId) }) });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const updateStatus = async (t: any) => {
    const status = prompt("Update Status (REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED):", t.status);
    if (!status) return;

    try {
      await apiClient(`/module-admin/driver-trips/${t.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  const unassignDriver = async (id: number) => {
    try {
      await apiClient(`/module-admin/driver-trips/${id}`, { method: 'PUT', body: JSON.stringify({ driverId: null }) });
      fetchTrips();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Driver Trip Management</p>
        <Btn size="sm" onClick={handleAdd}>+ Add Trip</Btn>
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
                  <Btn size="xs" v="primary" onClick={() => assignDriver(t)}>
                    {t.driver ? "Reassign" : "Assign"}
                  </Btn>
                  <Btn size="xs" v="secondary" onClick={() => updateStatus(t)}>Update Status</Btn>
                  <Btn size="xs" v="secondary" onClick={() => handleEdit(t)}>Edit Route</Btn>
                  {t.driver && (
                    <Btn size="xs" v="danger" onClick={() => unassignDriver(t.id)}>Unassign</Btn>
                  )}
                  <Btn size="xs" v="danger" onClick={() => handleDelete(t.id)}>Delete</Btn>
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleAdd = async () => {
    const tripId = prompt("Enter Trip ID:"); if (!tripId) return;
    const grossAmount = prompt("Amount (LKR):"); if (!grossAmount) return;
    const paymentMethod = prompt("Method (CASH, CARD):", "CASH"); if (!paymentMethod) return;
    try {
      await apiClient('/module-admin/payments', { method: 'POST', body: JSON.stringify({ tripId: Number(tripId), grossAmount: Number(grossAmount), paymentMethod }) });
      fetchPayments();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (p: any) => {
    const grossAmount = prompt("Edit Gross Amount (LKR):", p.grossAmount); if (!grossAmount) return;
    const commission = prompt("Edit Commission (LKR):", p.platformCommission); if (!commission) return;
    const driverNet = prompt("Edit Driver Net (LKR):", p.driverNet); if (!driverNet) return;
    try {
      await apiClient(`/module-admin/payments/${p.id}`, { method: 'PUT', body: JSON.stringify({ grossAmount: Number(grossAmount), platformCommission: Number(commission), driverNet: Number(driverNet) }) });
      fetchPayments();
    } catch (e) { alert("Error: " + e); }
  };

  const setStatus = async (id: number, status: string) => {
    try {
      await apiClient(`/module-admin/payments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      fetchPayments();
    } catch (e) { alert("Error: " + e); }
  };

  const voidPayment = async (id: number) => {
    try {
      await apiClient(`/module-admin/payments/${id}`, { method: 'DELETE' });
      fetchPayments();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Payment Management</p>
        <Btn size="sm" onClick={handleAdd}>+ Add Payment</Btn>
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
                  <Btn size="xs" v="secondary" onClick={() => handleEdit(p)}>Edit Amounts</Btn>
                  <Btn size="xs" onClick={() => setStatus(p.id, 'SUCCESS')}>Success</Btn>
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleAdd = async () => {
    const tripId = prompt("Enter Trip ID:"); if (!tripId) return;
    const rating = prompt("Rating (1-5):"); if (!rating) return;
    const comment = prompt("Comment:"); if (!comment) return;
    try {
      await apiClient('/module-admin/reviews', { method: 'POST', body: JSON.stringify({ tripId: Number(tripId), rating: Number(rating), comment }) });
      fetchReviews();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (r: any) => {
    const rating = prompt("Edit Rating (1-5):", r.rating); if (!rating) return;
    const comment = prompt("Edit Comment:", r.comment); if (!comment) return;
    try {
      await apiClient(`/module-admin/reviews/${r.id}`, { method: 'PUT', body: JSON.stringify({ rating: Number(rating), comment }) });
      fetchReviews();
    } catch (e) { alert("Error: " + e); }
  };

  const deleteReview = async (id: number) => {
    try {
      await apiClient(`/module-admin/reviews/${id}`, { method: 'DELETE' });
      fetchReviews();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Review Management</p>
        <Btn size="sm" onClick={handleAdd}>+ Add Review</Btn>
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
                  <Btn size="xs" v="secondary" onClick={() => handleEdit(r)}>Edit</Btn>
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

const AUDIT_CLR: Record<string,string> = { 
  suspend:"bg-red-500", revoke:"bg-red-400", warn:"bg-orange-400", approve:"bg-emerald-500", resolve:"bg-blue-500",
  CREATE_USER:"bg-green-500", UPDATE_USER:"bg-blue-500", DEACTIVATE_USER:"bg-red-500",
  CREATE_BOOKING:"bg-green-500", UPDATE_BOOKING:"bg-blue-500", CANCEL_BOOKING:"bg-red-500",
  ASSIGN_DRIVER:"bg-purple-500", UPDATE_TRIP_STATUS:"bg-blue-500", UNASSIGN_DRIVER:"bg-orange-500",
  APPROVE_DRIVER:"bg-emerald-500", REJECT_DRIVER:"bg-red-500",
  CREATE_PAYMENT:"bg-green-500", UPDATE_PAYMENT:"bg-blue-500", VOID_PAYMENT:"bg-red-500",
  CREATE_REVIEW:"bg-green-500", UPDATE_REVIEW:"bg-blue-500", DELETE_REVIEW:"bg-red-500",
};

function SystemPanel() {
  const [audit, setAudit] = useState<any[]>([]);

  const fetchAudit = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/audit');
      setAudit(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAudit(); }, []);

  const handleAdd = async () => {
    const actionType = prompt("Enter Action Type (e.g. MANUAL_ENTRY):", "MANUAL_ENTRY"); if (!actionType) return;
    const description = prompt("Enter Description:"); if (!description) return;
    try {
      await apiClient('/module-admin/audit', { method: 'POST', body: JSON.stringify({ actionType, description }) });
      fetchAudit();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (log: any) => {
    const actionType = prompt("Edit Action Type:", log.actionType); if (!actionType) return;
    const description = prompt("Edit Description:", log.description); if (!description) return;
    try {
      await apiClient(`/module-admin/audit/${log.id}`, { method: 'PUT', body: JSON.stringify({ actionType, description }) });
      fetchAudit();
    } catch (e) { alert("Error: " + e); }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient(`/module-admin/audit/${id}`, { method: 'DELETE' });
      fetchAudit();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="font-extrabold text-slate-800">System Audit Log (CRUD Mode)</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            GET /api/module-admin/audit?limit=50 · CRUD Enabled for Evaluation
          </p>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" onClick={handleAdd}>+ Add Log</Btn>
          <Btn v="secondary" size="sm" onClick={() => fetchAudit()}>🔄 Refresh</Btn>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {audit.map((log, i) => (
          <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-none ${AUDIT_CLR[log.actionType] ?? "bg-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 font-semibold leading-snug">{log.description}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{log.performedByEmail} • {log.actionType}</p>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex-none whitespace-nowrap pt-1">
              {new Date(log.createdAt).toLocaleString()}
            </p>
            <div className="flex gap-2 items-center flex-none ml-2">
              <Btn size="xs" v="secondary" onClick={() => handleEdit(log)}>Edit</Btn>
              <Btn size="xs" v="danger" onClick={() => handleDelete(log.id)}>Delete</Btn>
            </div>
          </div>
        ))}
        {audit.length === 0 && <div className="p-4 text-center">No logs found</div>}
      </div>
    </Card>
  );
}

function DriverDocsPanel() {
  const [drivers, setDrivers] = useState<any[]>([]);

  const fetchDrivers = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/driver-docs');
      setDrivers(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleAdd = async () => {
    const driverId = prompt("Enter Driver ID to verify:"); if (!driverId) return;
    const nic = prompt("Enter NIC (Optional):");
    const license = prompt("Enter License (Optional):");
    try {
      await apiClient('/module-admin/driver-docs', { method: 'POST', body: JSON.stringify({ driverId: Number(driverId), nic, license }) });
      fetchDrivers();
    } catch (e) { alert("Error: " + e); }
  };

  const handleVerify = async (id: number, action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Are you sure you want to ${action} driver ${id}?`)) return;
    try {
      await apiClient(`/module-admin/driver-docs/${id}`, { method: 'PUT', body: JSON.stringify({ action }) });
      fetchDrivers();
    } catch (e) { alert("Error: " + e); }
  };

  const handleViewDetails = (d: any) => {
    let details = `Driver Profile:\n`;
    details += `Name: ${d.firstName} ${d.lastName}\n`;
    details += `Email: ${d.email || 'N/A'}\n`;
    details += `Phone: ${d.phone || 'N/A'}\n`;
    details += `NIC: ${d.nic || 'N/A'}\n`;
    details += `License: ${d.licenseNumber || 'N/A'}\n\n`;
    
    if (d.vehicle) {
      details += `Vehicle Information:\n`;
      details += `Type: ${d.vehicle.type || 'N/A'}\n`;
      details += `Make & Model: ${d.vehicle.make || 'N/A'} ${d.vehicle.model || 'N/A'} (${d.vehicle.year || 'N/A'})\n`;
      details += `Color: ${d.vehicle.color || 'N/A'}\n`;
      details += `Plate: ${d.vehicle.plate || 'N/A'}\n`;
    } else {
      details += `No vehicle registered.\n`;
    }
    
    alert(details);
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Pending Driver Verifications</p>
        <Btn size="sm" onClick={handleAdd}>+ Add Verification</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">Driver ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">NIC</th>
              <th className="px-4 py-3 text-left">License</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono">{d.id}</td>
                <td className="px-4 py-3 font-bold">{d.firstName} {d.lastName}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{d.nic}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{d.licenseNumber}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" v="secondary" onClick={() => handleViewDetails(d)}>View Details</Btn>
                  <Btn size="xs" onClick={() => handleVerify(d.id, 'APPROVE')}>Approve</Btn>
                  <Btn size="xs" v="danger" onClick={() => handleVerify(d.id, 'REJECT')}>Reject</Btn>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && <tr><td colSpan={5} className="text-center p-4">No pending verifications found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DriversPanel() {
  const [drivers, setDrivers] = useState<any[]>([]);
  
  const fetchDrivers = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/drivers');
      setDrivers(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleAdd = async () => {
    const firstName = prompt("First Name:"); if (!firstName) return;
    const lastName = prompt("Last Name:"); if (!lastName) return;
    const email = prompt("Email:"); if (!email) return;
    const phone = prompt("Phone:"); if (!phone) return;
    try {
      await apiClient('/module-admin/drivers', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, phone }) });
      fetchDrivers();
    } catch (e) { alert("Error: " + e); }
  };

  const handleEdit = async (d: any) => {
    const firstName = prompt("Edit First Name:", d.firstName); if (!firstName) return;
    const lastName = prompt("Edit Last Name:", d.lastName); if (!lastName) return;
    const phone = prompt("Edit Phone:", d.phone); if (!phone) return;
    try {
      await apiClient(`/module-admin/users/${d.id}`, { method: 'PUT', body: JSON.stringify({ firstName, lastName, phone, active: d.active }) });
      fetchDrivers();
    } catch (e) { alert("Error: " + e); }
  };

  const handleToggleStatus = async (d: any) => {
    try {
      if (d.active) {
        await apiClient(`/module-admin/users/${d.id}`, { method: 'DELETE' });
      } else {
        await apiClient(`/module-admin/users/${d.id}`, { method: 'PUT', body: JSON.stringify({ active: true }) });
      }
      fetchDrivers();
    } catch (e) { alert("Error: " + e); }
  };

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-extrabold text-slate-800">Driver Profiles Management</p>
        <Btn size="sm" onClick={handleAdd}>+ Add Driver</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono">{d.id}</td>
                <td className="px-4 py-3 font-bold">{d.firstName} {d.lastName}</td>
                <td className="px-4 py-3 text-slate-500">{d.email}</td>
                <td className="px-4 py-3 font-mono">{d.phone}</td>
                <td className="px-4 py-3">
                  <Pill color={d.active ? "green" : "red"}>{d.active ? "Active" : "Inactive"}</Pill>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <Btn size="xs" v="secondary" onClick={() => handleEdit(d)}>Edit Name</Btn>
                  <Btn size="xs" v={d.active ? "danger" : "primary"} onClick={() => handleToggleStatus(d)}>
                    {d.active ? "Deactivate" : "Activate"}
                  </Btn>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && <tr><td colSpan={6} className="text-center p-4">No drivers found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
