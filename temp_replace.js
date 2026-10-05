const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleAdd = async \(\) => \{\s*const data = await openAdminForm\("Add New Driver", \[\s*\{ id: "firstName", label: "First Name" \},\s*\{ id: "lastName", label: "Last Name" \},\s*\{ id: "email", label: "Email Address", helpText: "Must contain '@' \(e\.g\. driver@streetify\.lk\)" \},\s*\{ id: "phone", label: "Phone Number", helpText: DRIVER_PHONE_HELP_TEXT \},\s*\{ id: "password", label: "Login Password", defaultValue: "1111", helpText: "Driver login password \(default: 1111\)" \}\s*\]\);/;

const newHandleAdd = `const handleAdd = async () => {
    const data = await openAdminForm("Add New Driver", [
      // Personal Info
      { id: "firstName", label: "First Name (Personal Info)" },
      { id: "lastName", label: "Last Name" },
      { id: "email", label: "Email Address", helpText: "Must contain '@' (e.g. driver@streetify.lk)" },
      { id: "phone", label: "Phone Number", helpText: DRIVER_PHONE_HELP_TEXT },
      { id: "password", label: "Login Password", defaultValue: "1111", helpText: "Driver login password (default: 1111)" },
      
      // Vehicle and Security
      { id: "vehicleType", label: "Vehicle Type (Vehicle and Security)", type: "select", options: ["car", "tuk", "van", "moto"], defaultValue: "car" },
      { id: "make", label: "Vehicle Make", defaultValue: "Toyota" },
      { id: "model", label: "Vehicle Model", defaultValue: "Prius" },
      { id: "numberPlate", label: "Number Plate", defaultValue: "CBA-1234" },
      { id: "year", label: "Year of Manufacture", type: "number", defaultValue: 2015 },
      { id: "color", label: "Color", defaultValue: "White" },
      
      // Documents
      { id: "nic", label: "NIC Number (Documents)", defaultValue: "951234567V" },
      { id: "licenseNumber", label: "License Number", defaultValue: "B1234567" }
    ]);`;

if (regex.test(content)) {
  content = content.replace(regex, newHandleAdd);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated Admin.tsx');
} else {
  console.error('Could not find old handleAdd in Admin.tsx');
}
