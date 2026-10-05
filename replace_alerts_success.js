const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let code = fs.readFileSync(file, 'utf8');

// We want to add showToast("Action completed successfully!", "success"); 
// right after a fetchXYZ(); that follows an apiClient call inside a try block.
// Example:
// await apiClient(`/module-admin/bookings/${id}`, { method: 'DELETE' });
// fetchTrips();
// } catch ...
// We can use a regex: (await apiClient\(.*?\);[\s\S]*?fetch[A-Za-z]+\(\);)
// But to be safer, we can just replace the specific fetch calls inside try blocks.

code = code.replace(/(await apiClient\([\s\S]*?\);\s*fetch[A-Za-z]+\(\);)/g, '$1\n      showToast("Action completed successfully!", "success");');

fs.writeFileSync(file, code);
console.log("Done adding success toasts");
