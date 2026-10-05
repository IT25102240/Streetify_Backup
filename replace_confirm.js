const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add Confirm Logic
if (!code.includes('export const showConfirm')) {
  const confirmLogic = `
export const showConfirm = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const handler = (e: any) => {
      resolve(e.detail.confirmed);
      window.removeEventListener('admin-confirm-close', handler);
    };
    window.addEventListener('admin-confirm-close', handler);
    window.dispatchEvent(new CustomEvent('admin-confirm-open', { detail: { title, message } }));
  });
};

export function ConfirmContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState({ title: "", message: "" });
  useEffect(() => {
    const handleOpen = (e: any) => {
      setDetails(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('admin-confirm-open', handleOpen);
    return () => window.removeEventListener('admin-confirm-open', handleOpen);
  }, []);
  const handleClose = (confirmed: boolean) => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('admin-confirm-close', { detail: { confirmed } }));
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-navy border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>⚠️</span> {details.title}
          </h2>
        </div>
        <div className="p-6 text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
          {details.message}
        </div>
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={() => handleClose(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={() => handleClose(true)} className="px-5 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">Confirm</button>
        </div>
      </div>
    </div>
  );
}
`;
  code = code.replace('export const showToast', confirmLogic + '\nexport const showToast');
}

// Ensure ConfirmContainer is rendered next to ToastContainer
if (!code.includes('<ConfirmContainer />')) {
  code = code.replace('<ToastContainer />', '<ToastContainer />\n      <ConfirmContainer />');
}

// Replace exact window.confirm calls using regex or string replace
// Since there are only 4 calls, we can manually replace them:

code = code.replace(
  'if (!window.confirm("Are you sure you want to permanently delete this trip and its payment records?")) return;',
  'if (!(await showConfirm("Delete Trip", "Are you sure you want to permanently delete this trip and its payment records?"))) return;'
);

code = code.replace(
  'if (!window.confirm(`Are you sure you want to void payment #${id}? This will mark it as VOID/FAILED.`)) return;',
  'if (!(await showConfirm("Void Payment", `Are you sure you want to void payment #${id}? This will mark it as VOID/FAILED.`))) return;'
);

code = code.replace(
  'if (!window.confirm(`⚠️ Permanently DELETE payment record #${id} from the database? This action cannot be undone.`)) return;',
  'if (!(await showConfirm("Delete Payment", `⚠️ Permanently DELETE payment record #${id} from the database? This action cannot be undone.`))) return;'
);

code = code.replace(
  'const confirm = window.confirm(`Permanently delete driver "${d.firstName} ${d.lastName}" (${d.email})?\\n\\nThis will completely remove the driver account and fleet record from the database.`);',
  'const confirm = await showConfirm("Delete Driver", `Permanently delete driver "${d.firstName} ${d.lastName}" (${d.email})?\\n\\nThis will completely remove the driver account and fleet record from the database.`);'
);

fs.writeFileSync(file, code);
console.log("Replaced window.confirm with showConfirm");
