const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

const targetUpdateStatus = `  const updateStatus = async (regId: string, newStatus: string) => {
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

const newUpdateStatus = `  const updateStatusAndValidity = async (regId: string, newStatus: string, validTillOverride?: string | null) => {
    if (!org || !user?.email) return;
    try {
      const currentReg = registrations.find(r => r.registrationId === regId);
      const validFrom = currentReg?.validFrom || new Date().toISOString().split('T')[0];
      const validTill = validTillOverride !== undefined ? validTillOverride : currentReg?.validTill;
      
      const res = await apiClient.updateRegistrationStatus(user.email, org.organizationId, regId, newStatus, validFrom, validTill || undefined);
      setRegistrations(prev => prev.map(r => r.registrationId === regId ? { ...r, status: newStatus, idEmailSent: res.idEmailSent ?? r.idEmailSent, validFrom, validTill } : r));
      if (selectedReg && selectedReg.registrationId === regId) {
        setSelectedReg({ ...selectedReg, status: newStatus, idEmailSent: res.idEmailSent ?? selectedReg.idEmailSent, validFrom, validTill });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };`;

code = code.replace(targetUpdateStatus, newUpdateStatus);

const targetSelect = `                  <select
                    value={selectedReg.status || 'PENDING'}
                    onChange={(e) => updateStatus(selectedReg.registrationId, e.target.value)}`;
const newSelect = `                  <select
                    value={selectedReg.status || 'PENDING'}
                    onChange={(e) => updateStatusAndValidity(selectedReg.registrationId, e.target.value)}`;

code = code.replace(targetSelect, newSelect);

const targetValidityUI = `<p className="text-sm text-green-800 font-medium">Digital ID Access</p>
                          <p className="text-xs text-green-700">This student's Digital ID is active.</p>`;

const replacementValidityUI = `<p className="text-sm text-green-800 font-medium">Digital ID Access</p>
                          <p className="text-xs text-green-700">This student's Digital ID is active.</p>
                          
                          <div className="my-3 p-3 bg-white border border-green-100 rounded-md">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Valid Till</label>
                            <input 
                              type="date"
                              value={selectedReg.validTill ? selectedReg.validTill.split('T')[0] : ''}
                              onChange={(e) => updateStatusAndValidity(selectedReg.registrationId, selectedReg.status || 'ACTIVE', e.target.value)}
                              className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="mt-2 flex gap-2">
                               <button onClick={() => {
                                 const d = new Date(); d.setDate(d.getDate() + 30);
                                 updateStatusAndValidity(selectedReg.registrationId, selectedReg.status || 'ACTIVE', d.toISOString().split('T')[0]);
                               }} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">30 days</button>
                               <button onClick={() => {
                                 const d = new Date(); d.setDate(d.getDate() + 180);
                                 updateStatusAndValidity(selectedReg.registrationId, selectedReg.status || 'ACTIVE', d.toISOString().split('T')[0]);
                               }} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">180 days</button>
                               <button onClick={() => {
                                 const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                                 updateStatusAndValidity(selectedReg.registrationId, selectedReg.status || 'ACTIVE', d.toISOString().split('T')[0]);
                               }} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">1 year</button>
                            </div>
                          </div>`;

code = code.replace(targetValidityUI, replacementValidityUI);

fs.writeFileSync('src/pages/Registrations.tsx', code);
