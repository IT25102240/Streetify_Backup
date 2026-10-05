const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update handleAdd
const oldHandleAdd = `const handleAdd = async () => {
    const data = await openAdminForm("Add New Payment Record", [
      { id: "grossAmount", label: "Gross Amount (LKR)", type: "number", defaultValue: 1500 },
      { id: "commission", label: "Platform Commission (15%)", type: "number", defaultValue: 225 },
      { id: "driverNet", label: "Driver Net Disbursement (85%)", type: "number", defaultValue: 1275 }
    ]);
    if (!data || !data.grossAmount) return;`;

const newHandleAdd = `const handleAdd = async () => {
    const data = await openAdminForm("Add New Payment Record", [
      { id: "tripId", label: "Trip ID", type: "number", defaultValue: 1 },
      { id: "grossAmount", label: "Gross Amount (LKR)", type: "number", defaultValue: 1500 },
      { id: "commission", label: "Platform Commission (15%)", type: "number", defaultValue: 225 },
      { id: "driverNet", label: "Driver Net Disbursement (85%)", type: "number", defaultValue: 1275 }
    ]);
    if (!data || !data.grossAmount) return;`;

content = content.replace(oldHandleAdd, newHandleAdd);

// 2. Update handleAdd payload
const oldAddPayload = `body: JSON.stringify({
          grossAmount: Number(data.grossAmount),`;

const newAddPayload = `body: JSON.stringify({
          tripId: Number(data.tripId) || null,
          grossAmount: Number(data.grossAmount),`;

content = content.replace(oldAddPayload, newAddPayload);

// 3. Update handleEdit
const oldHandleEdit = `const handleEdit = async (p: any) => {
    const data = await openAdminForm("Edit Payment", [
      { id: "grossAmount", label: "Gross Amount (LKR)", type: "number", defaultValue: p.grossAmount },
      { id: "commission", label: "Commission (LKR)", type: "number", defaultValue: p.platformCommission },
      { id: "driverNet", label: "Driver Net (LKR)", type: "number", defaultValue: p.driverNet }
    ]);`;

const newHandleEdit = `const handleEdit = async (p: any) => {
    const data = await openAdminForm("Edit Payment", [
      { id: "tripId", label: "Trip ID", type: "number", defaultValue: p.tripId },
      { id: "grossAmount", label: "Gross Amount (LKR)", type: "number", defaultValue: p.grossAmount },
      { id: "commission", label: "Commission (LKR)", type: "number", defaultValue: p.platformCommission },
      { id: "driverNet", label: "Driver Net (LKR)", type: "number", defaultValue: p.driverNet }
    ]);`;

content = content.replace(oldHandleEdit, newHandleEdit);

// 4. Update handleEdit payload
const oldEditPayload = `await apiClient(\`/module-admin/payments/\${p.id}\`, { method: 'PUT', body: JSON.stringify({ grossAmount: Number(data.grossAmount), platformCommission: Number(data.commission), driverNet: Number(data.driverNet) }) });`;

const newEditPayload = `await apiClient(\`/module-admin/payments/\${p.id}\`, { method: 'PUT', body: JSON.stringify({ tripId: Number(data.tripId), grossAmount: Number(data.grossAmount), platformCommission: Number(data.commission), driverNet: Number(data.driverNet) }) });`;

content = content.replace(oldEditPayload, newEditPayload);

// 5. Update Table Header
const oldTableHeader = `<th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Gross Amount</th>`;

const newTableHeader = `<th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Trip ID</th>
                <th className="px-4 py-3 text-left">Driver Name</th>
                <th className="px-4 py-3 text-left">Gross Amount</th>`;

content = content.replace(oldTableHeader, newTableHeader);

// 6. Update Table Rows
const oldTableRow = `<td className="px-4 py-3 font-mono">{p.id}</td>
                  <td className="px-4 py-3">Rs {p.grossAmount}</td>`;

const newTableRow = `<td className="px-4 py-3 font-mono">{p.id}</td>
                  <td className="px-4 py-3 font-mono">{p.tripId || 'N/A'}</td>
                  <td className="px-4 py-3 font-bold">{p.driverName || 'Unknown'}</td>
                  <td className="px-4 py-3">Rs {p.grossAmount}</td>`;

content = content.replace(oldTableRow, newTableRow);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated Admin.tsx payments panel');
