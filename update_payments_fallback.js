const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFetch = `  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>('/module-admin/payments');
      if (Array.isArray(data) && data.length > 0) {
        setPayments(data);
      } else {
        setPayments(SEED_PAYMENTS_RECORDS);
      }
    } catch (e) {
      console.warn("Using verified payments fallback:", e);
      setPayments(SEED_PAYMENTS_RECORDS);
    } finally {
      setLoading(false);
    }
  };`;

const newFetch = `  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>('/module-admin/payments');
      if (Array.isArray(data)) {
        setPayments(data);
      } else {
        setPayments([]);
      }
    } catch (e) {
      console.warn("Error fetching payments:", e);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldFetch, newFetch);

const oldReseed = `  const handleReSeed = async () => {
    try {
      for (const p of SEED_PAYMENTS_RECORDS) {
        await apiClient('/module-admin/payments', {
          method: 'POST',
          body: JSON.stringify(p)
        });
      }
      fetchPayments();
    } catch (e) {
      setPayments(SEED_PAYMENTS_RECORDS);
    }
  };`;

const newReseed = `  const handleReSeed = async () => {
    try {
      for (const p of SEED_PAYMENTS_RECORDS) {
        await apiClient('/module-admin/payments', {
          method: 'POST',
          body: JSON.stringify(p)
        });
      }
      fetchPayments();
      showToast("Seed data restored successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Error restoring seed data. Make sure there are enough unpaid trips.", "error");
      fetchPayments();
    }
  };`;

content = content.replace(oldReseed, newReseed);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated Admin.tsx to prevent fake data fallback');
