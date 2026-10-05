const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'if (!confirm(`Are you sure you want to completely delete trip ${id}?`)) return;',
  'if (!(await showConfirm("Delete Trip", `Are you sure you want to completely delete trip ${id}?`))) return;'
);

code = code.replace(
  "if (!confirm(`Are you sure you want to ${action} driver ${id}?`)) return;",
  'if (!(await showConfirm(`${action === "APPROVE" ? "Approve" : "Reject"} Driver`, `Are you sure you want to ${action} driver ${id}?`))) return;'
);

fs.writeFileSync(file, code);
console.log("Replaced remaining confirm calls");
