const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSeed = `const SEED_PAYMENTS_RECORDS = [
  { id: 1, grossAmount: 1925, platformCommission: 288.75, driverNet: 1636.25, status: "SUCCESS" },
  { id: 2, grossAmount: 1076, platformCommission: 161.40, driverNet: 914.60, status: "SUCCESS" },
  { id: 3, grossAmount: 485, platformCommission: 72.75, driverNet: 412.25, status: "SUCCESS" },
  { id: 4, grossAmount: 313, platformCommission: 46.95, driverNet: 266.05, status: "SUCCESS" },
  { id: 5, grossAmount: 286, platformCommission: 42.90, driverNet: 243.10, status: "SUCCESS" }
];`;

const newSeed = `const SEED_PAYMENTS_RECORDS = [
  { id: 1, tripId: 101, driverName: "John Doe", grossAmount: 1925, platformCommission: 288.75, driverNet: 1636.25, status: "SUCCESS" },
  { id: 2, tripId: 102, driverName: "Jane Smith", grossAmount: 1076, platformCommission: 161.40, driverNet: 914.60, status: "SUCCESS" },
  { id: 3, tripId: 103, driverName: "Alex Brown", grossAmount: 485, platformCommission: 72.75, driverNet: 412.25, status: "SUCCESS" },
  { id: 4, tripId: 104, driverName: "Emily Davis", grossAmount: 313, platformCommission: 46.95, driverNet: 266.05, status: "SUCCESS" },
  { id: 5, tripId: 105, driverName: "Michael Lee", grossAmount: 286, platformCommission: 42.90, driverNet: 243.10, status: "SUCCESS" }
];`;

content = content.replace(oldSeed, newSeed);
fs.writeFileSync(file, content, 'utf8');
console.log('Updated SEED_PAYMENTS_RECORDS');
