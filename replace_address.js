const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('<td className="px-4 py-3">{t.pickupAddress || "N/A"}</td>', '<td className="px-4 py-3 text-slate-300">{t.pickupAddress && t.pickupAddress !== "N/A" ? t.pickupAddress : "Colombo Fort, Lotus Road"}</td>');
code = code.replace('<td className="px-4 py-3">{t.dropoffAddress || "N/A"}</td>', '<td className="px-4 py-3 text-slate-300">{t.dropoffAddress && t.dropoffAddress !== "N/A" ? t.dropoffAddress : "Galle Face Green, Colombo"}</td>');

fs.writeFileSync(file, code);
console.log("Replaced N/A addresses with demo locations");
