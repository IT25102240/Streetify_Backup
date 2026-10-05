const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Remove 'title' prop from Btn
content = content.replace(
  `<Btn size="xs" v="danger" onClick={() => handleDelete(t.id)} title="Delete Permanently">Delete</Btn>`,
  `<Btn size="xs" v="danger" onClick={() => handleDelete(t.id)}>Delete</Btn>`
);

// Fix 2: Add drivers state to DriverTripsPanel and parameter typing
const oldTripsState = `  const [trips, setTrips] = useState<any[]>([]);

  const fetchTrips = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/driver-trips');
      setTrips(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchTrips(); 
    const unsub = tripSyncService.subscribeAll(() => {
      fetchTrips();
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    const driverOptions = drivers.map(d => \`\${d.id} - \${d.firstName} \${d.lastName}\`);`;

const newTripsState = `  const [trips, setTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  const fetchTrips = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/driver-trips');
      setTrips(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDrivers = async () => {
    try {
      const data = await apiClient<any[]>('/module-admin/drivers');
      setDrivers(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchTrips(); 
    fetchDrivers();
    const unsub = tripSyncService.subscribeAll(() => {
      fetchTrips();
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    const driverOptions = drivers.map((d: any) => \`\${d.id} - \${d.firstName} \${d.lastName}\`);`;

content = content.replace(oldTripsState, newTripsState);

// Fix 3: Parameter typing in handleManageTrip
const oldManage = `  const handleManageTrip = async (t: any) => {
    const driverOptions = drivers.map(d => \`\${d.id} - \${d.firstName} \${d.lastName}\`);`;

const newManage = `  const handleManageTrip = async (t: any) => {
    const driverOptions = drivers.map((d: any) => \`\${d.id} - \${d.firstName} \${d.lastName}\`);`;

content = content.replace(oldManage, newManage);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully fixed typescript issues in Admin.tsx');
