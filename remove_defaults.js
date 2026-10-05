const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldDocs = `      // Documents
      { id: "nicStr", label: "NIC Number (Documents)", defaultValue: "951234567V" },
      { id: "nicFile", label: "Upload NIC Image/Document", type: "file" },
      { id: "licenseStr", label: "License Number", defaultValue: "B1234567" },
      { id: "licenseFile", label: "Upload License Image/Document", type: "file" }`;

const newDocs = `      // Documents
      { id: "nicStr", label: "NIC Number (Documents)", defaultValue: "" },
      { id: "nicFile", label: "Upload NIC Image/Document", type: "file" },
      { id: "licenseStr", label: "License Number", defaultValue: "" },
      { id: "licenseFile", label: "Upload License Image/Document", type: "file" }`;

content = content.replace(oldDocs, newDocs);
fs.writeFileSync(file, content, 'utf8');
console.log('Removed hardcoded default values for nic and license');
