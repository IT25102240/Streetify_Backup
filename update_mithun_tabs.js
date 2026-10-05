const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update getDefaultTabForRole
const oldDefaultTab = `  if (role === "DRIVER_MGMT" || name.toLowerCase().includes("tharindu")) return "analytics";
  if (role === "REVIEW_MGMT" || name.toLowerCase().includes("mithun")) return "analytics";`;

const newDefaultTab = `  if (role === "DRIVER_MGMT" || name.toLowerCase().includes("tharindu")) return "analytics";
  if (role === "REVIEW_MGMT" || name.toLowerCase().includes("mithun")) return "review-summary";`;

content = content.replace(oldDefaultTab, newDefaultTab);

// 2. Add isMithunReviewAdmin to allowedTabs
const oldAllowedTabs = `  } else if (isDahamPaymentAdmin) {
    // Daham's dedicated custom dashboard only for summary payment/financial details of platform
    allowedTabs.push({ key: "payment-summary", icon: "📊", label: "Payment Summary Dashboard" });
    allowedTabs.push({ key: "payments", icon: "💳", label: "Payment Management" });
    allowedTabs.push({ key: "export", icon: "📁", label: "Export Payment Reports" });
  } else {
    // Analytics dashboard — visible to all admin roles
    allowedTabs.push({ key: "analytics", icon: "📊", label: "System Summary Dashboard" });`;

const newAllowedTabs = `  } else if (isDahamPaymentAdmin) {
    // Daham's dedicated custom dashboard only for summary payment/financial details of platform
    allowedTabs.push({ key: "payment-summary", icon: "📊", label: "Payment Summary Dashboard" });
    allowedTabs.push({ key: "payments", icon: "💳", label: "Payment Management" });
    allowedTabs.push({ key: "export", icon: "📁", label: "Export Payment Reports" });
  } else if (isMithunReviewAdmin) {
    // Mithun's dedicated custom dashboard for review/dispute platform summary
    allowedTabs.push({ key: "review-summary", icon: "⭐", label: "Review Summary (Mithun)" });
    allowedTabs.push({ key: "reviews", icon: "⭐", label: "Review Management" });
    allowedTabs.push({ key: "disputes", icon: "🎫", label: "Dispute Tickets" });
    allowedTabs.push({ key: "branch-kiosk", icon: "🏢", label: "Branch Walk-in Desk" });
    allowedTabs.push({ key: "export", icon: "📁", label: "Export Review Reports" });
  } else {
    // Analytics dashboard — visible to all admin roles
    allowedTabs.push({ key: "analytics", icon: "📊", label: "System Summary Dashboard" });`;

content = content.replace(oldAllowedTabs, newAllowedTabs);

// 3. Update the bottom if (adminRole === "SUPER_ADMIN" || adminRole === "REVIEW_MGMT")
// Wait, if I do #2, the else block won't run for Mithun, so I don't need to change the if statements inside the else block! They will just be skipped, which is correct because I already added his tabs in the else if block.
// Let's verify line 610 update.
const oldRender = `{tab === "review-summary" && isSuperAdmin && <MithunReviewDashboard />}`;
const newRender = `{tab === "review-summary" && (isSuperAdmin || isMithunReviewAdmin) && <MithunReviewDashboard />}`;
content = content.replace(oldRender, newRender);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated Admin.tsx for Mithun tabs');
