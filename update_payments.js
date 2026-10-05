const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-backend/src/main/java/com/streetify/controller/ModuleAdminController.java';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    '\"tripId\",            p.getTrip() != null ? p.getTrip().getId() : null',
    '\"tripId\",            p.getTrip() != null ? p.getTrip().getId() : null,\n            \"driverName\",        p.getDriver() != null ? p.getDriver().getFirstName() + \" \" + p.getDriver().getLastName() : \"Unknown\"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully added driverName to GET /payments response');
