const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

const oldResend = `                              onClick={async () => {
                                try {
                                  await apiClient.resendIdEmail(user!.email!, org!.organizationId, selectedReg.registrationId);
                                  alert('ID email sent successfully.');
                                } catch(e: any) {
                                  alert('Failed to send ID email: ' + e.message);
                                }
                              }}`;

const newResend = `                              onClick={async () => {
                                try {
                                  await apiClient.resendIdEmail(user!.email!, org!.organizationId, selectedReg.registrationId);
                                  alert('ID email sent successfully.');
                                  setRegistrations(prev => prev.map(r => r.registrationId === selectedReg.registrationId ? { ...r, idEmailSent: true } : r));
                                  setSelectedReg({ ...selectedReg, idEmailSent: true });
                                } catch(e: any) {
                                  alert('Failed to send ID email: ' + e.message);
                                }
                              }}`;

code = code.replace(oldResend, newResend);
fs.writeFileSync('src/pages/Registrations.tsx', code);
