const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

const oldUpdate = `  const updateStatus = async (regId: string, newStatus: string) => {
    if (!org || !user?.email) return;
    try {
      await apiClient.updateRegistrationStatus(user.email, org.organizationId, regId, newStatus);
      setRegistrations(prev => prev.map(r => r.registrationId === regId ? { ...r, status: newStatus } : r));
      if (selectedReg && selectedReg.registrationId === regId) {
        setSelectedReg({ ...selectedReg, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };`;

const newUpdate = `  const updateStatus = async (regId: string, newStatus: string) => {
    if (!org || !user?.email) return;
    try {
      const res = await apiClient.updateRegistrationStatus(user.email, org.organizationId, regId, newStatus);
      setRegistrations(prev => prev.map(r => r.registrationId === regId ? { ...r, status: newStatus, idEmailSent: res.idEmailSent ?? r.idEmailSent } : r));
      if (selectedReg && selectedReg.registrationId === regId) {
        setSelectedReg({ ...selectedReg, status: newStatus, idEmailSent: res.idEmailSent ?? selectedReg.idEmailSent });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };`;

code = code.replace(oldUpdate, newUpdate);

fs.writeFileSync('src/pages/Registrations.tsx', code);
