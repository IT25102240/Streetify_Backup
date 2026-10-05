const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('export const showToast')) {
  const toastLogic = `
export type ToastType = 'success' | 'error' | 'info';
export type ToastMessage = { id: string, message: string, type: ToastType };
let toastCount = 0;
export const showToast = (message: string, type: ToastType = 'info') => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { id: 'toast-' + (++toastCount), message, type } }));
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  useEffect(() => {
    const handleToast = (e: any) => {
      setToasts(prev => [...prev, e.detail]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== e.detail.id));
      }, 5000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={\`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-white font-medium animate-in slide-in-from-right-8 fade-in duration-300 \${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-emerald-500' : 'bg-slate-800'}\`}>
          <div className="flex items-center gap-2">
            <span>{t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span className="whitespace-pre-wrap">{t.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
`;
  code = code.replace('export const openAdminForm', toastLogic + '\nexport const openAdminForm');
}

// Replace alert
code = code.replace(/catch \((.*?)\) \{ alert\((.*?)\); \}/g, 'catch ($1) { showToast($2, "error"); }');
code = code.replace(/alert\((.*?)\);/g, 'showToast($1, "error");');

if (!code.includes('<ToastContainer />')) {
  code = code.replace('<div className="min-h-screen bg-navy text-slate-300 font-sans flex">', '<div className="min-h-screen bg-navy text-slate-300 font-sans flex">\n      <ToastContainer />');
}

// Replace some specific actions with success toasts if we can identify them.
// Let's replace catch (e) { showToast("Error: " + e, "error"); } which I did above.
// Add success messages after fetchTrips() etc ? That's a bit harder. We can add a few.
// e.g. await apiClient(... method 'POST' or 'PUT' or 'DELETE' ); fetchTrips(); showToast('Success', 'success');
// But the user just asked to replace the alerts, which we did.

fs.writeFileSync(file, code);
console.log("Done");
