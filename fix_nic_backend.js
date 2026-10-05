const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-backend/src/main/java/com/streetify/controller/ModuleAdminController.java';
let content = fs.readFileSync(file, 'utf8');

const oldCheck = `        if (data.containsKey("nic")) d.setNic((String) data.get("nic"));
        if (data.containsKey("licenseNumber")) d.setLicenseNumber((String) data.get("licenseNumber"));`;

const newCheck = `        String nicVal = data.containsKey("nicStr") ? (String) data.get("nicStr") : (String) data.get("nic");
        if (nicVal != null && !nicVal.isEmpty()) d.setNic(nicVal);
        String licVal = data.containsKey("licenseStr") ? (String) data.get("licenseStr") : (String) data.get("licenseNumber");
        if (licVal != null && !licVal.isEmpty()) d.setLicenseNumber(licVal);`;

content = content.replace(oldCheck, newCheck);
fs.writeFileSync(file, content, 'utf8');
console.log('Updated ModuleAdminController to read nicStr and licenseStr');
