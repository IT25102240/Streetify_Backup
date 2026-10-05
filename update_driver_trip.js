const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace handleAdd inside Driver Trips
const handleAddRegex = /const handleAdd = async \(\) => \{\s+const data = await openAdminForm\("Add New Trip", \[\s+\{ id: "pickupAddress", label: "Pickup Address", type: "location", defaultValue: "Dummy Pickup Address" \},\s+\{ id: "dropoffAddress", label: "Dropoff Address", type: "location", defaultValue: "Dummy Dropoff Address" \},\s+\{ id: "driverId", label: "Driver ID \(Optional\)", type: "number" \}\s+\]\);\s+if \(\!data \|\| \!data\.pickupAddress \|\| \!data\.dropoffAddress\) return;\s+try \{\s+await apiClient\('\/module-admin\/driver-trips', \{\s+method: 'POST',\s+body: JSON\.stringify\(\{\s+pickupAddress: data\.pickupAddress,\s+dropoffAddress: data\.dropoffAddress,\s+driverId: data\.driverId \? Number\(data\.driverId\) : null\s+\}\)\s+\}\);\s+fetchTrips\(\);\s+showToast\("Action completed successfully!", "success"\);\s+\} catch \(e\) \{ showToast\("Error: " \+ e, "error"\); \}\s+\};/;

const newHandleAdd = `const handleAdd = async () => {
    const driverOptions = drivers.map(d => \`\${d.id} - \${d.firstName} \${d.lastName}\`);
    const data = await openAdminForm("Add New Trip", [
      { id: "pickupAddress", label: "Pickup Address", type: "location", defaultValue: "" },
      { id: "dropoffAddress", label: "Dropoff Address", type: "location", defaultValue: "" },
      { id: "driverId", label: "Driver", type: "select", options: driverOptions }
    ]);
    if (!data || !data.pickupAddress || !data.dropoffAddress) return;
    try {
      await apiClient('/module-admin/driver-trips', { 
        method: 'POST', 
        body: JSON.stringify({ 
          pickupAddress: data.pickupAddress, 
          dropoffAddress: data.dropoffAddress, 
          driverId: data.driverId && String(data.driverId).includes("-") ? Number(String(data.driverId).split("-")[0].trim()) : (data.driverId ? Number(data.driverId) : null)
        }) 
      });
      fetchTrips();
      showToast("Action completed successfully!", "success");
    } catch (e) { showToast("Error: " + e, "error"); }
  };`;

code = code.replace(handleAddRegex, newHandleAdd);

// Replace handleManageTrip
const handleManageTripRegex = /const handleManageTrip = async \(t: any\) => \{\s+const data = await openAdminForm\("Manage Trip", \[\s+\{ id: "driverId", label: "Driver ID \(Optional\)", type: "number", defaultValue: t\.driver\?\.id \|\| "" \},\s+\{ id: "status", label: "Status", type: "select", options: \["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"\], defaultValue: t\.status \},\s+\{ id: "pickupAddress", label: "Pickup Address", type: "location", defaultValue: t\.pickupAddress \|\| "" \},\s+\{ id: "dropoffAddress", label: "Dropoff Address", type: "location", defaultValue: t\.dropoffAddress \|\| "" \}\s+\]\);\s+if \(\!data\) return;\s+try \{\s+await apiClient\(`\/module-admin\/driver-trips\/\$\{t\.id\}`,\s*\{\s+method: 'PUT',\s+body: JSON\.stringify\(\{\s+driverId: data\.driverId \? Number\(data\.driverId\) : null,\s+status: data\.status,\s+pickupAddress: data\.pickupAddress,\s+dropoffAddress: data\.dropoffAddress\s+\}\)\s+\}\);\s+fetchTrips\(\);\s+showToast\("Action completed successfully!", "success"\);\s+\} catch \(e\) \{ showToast\("Error: " \+ e, "error"\); \}\s+\};/;

const newHandleManageTrip = `const handleManageTrip = async (t: any) => {
    const driverOptions = drivers.map(d => \`\${d.id} - \${d.firstName} \${d.lastName}\`);
    const defaultDriver = t.driver ? \`\${t.driver.id} - \${t.driver.firstName} \${t.driver.lastName}\` : "";
    const data = await openAdminForm("Manage Trip", [
      { id: "driverId", label: "Driver", type: "select", options: driverOptions, defaultValue: defaultDriver },
      { id: "status", label: "Status", type: "select", options: ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], defaultValue: t.status },
      { id: "pickupAddress", label: "Pickup Address", type: "location", defaultValue: t.pickupAddress || "" },
      { id: "dropoffAddress", label: "Dropoff Address", type: "location", defaultValue: t.dropoffAddress || "" }
    ]);
    if (!data) return;

    try {
      await apiClient(\`/module-admin/driver-trips/\${t.id}\`, { 
        method: 'PUT', 
        body: JSON.stringify({
          driverId: data.driverId && String(data.driverId).includes("-") ? Number(String(data.driverId).split("-")[0].trim()) : (data.driverId ? Number(data.driverId) : null),
          status: data.status,
          pickupAddress: data.pickupAddress,
          dropoffAddress: data.dropoffAddress
        }) 
      });
      fetchTrips();
      showToast("Action completed successfully!", "success");
    } catch (e) { showToast("Error: " + e, "error"); }
  };`;

code = code.replace(handleManageTripRegex, newHandleManageTrip);

fs.writeFileSync(file, code);
console.log("Updated Driver Trip handling functions");
