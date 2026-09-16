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

