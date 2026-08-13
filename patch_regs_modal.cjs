const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

const modalCode = `
  const [regToDelete, setRegToDelete] = useState<string | null>(null);
  
  const confirmDelete = async () => {
    if (!regToDelete || !user?.email || !org) return;
    setDeletingId(regToDelete);
    try {
      await apiClient.deleteRegistration(user.email, org.organizationId, regToDelete);
      setRegistrations(prev => prev.filter(r => r.registrationId !== regToDelete));
      if (selectedReg?.registrationId === regToDelete) {
        setSelectedReg(null);
      }
      alert("Registration deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete registration: " + err.message);
    } finally {
      setDeletingId(null);
      setRegToDelete(null);
    }
  };

  const handleDeleteClick = (regId: string) => {
    setRegToDelete(regId);
  };
`;

code = code.replace(/  const handleDelete = async \(registrationId: string\) => \{[\s\S]*?  \};\n/g, modalCode);
code = code.replace(/onClick=\{\(\) => handleDelete\(selectedReg\.registrationId\)\}/g, "onClick={() => handleDeleteClick(selectedReg.registrationId)}");

const modalUI = `
      {regToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete student permanently?</h3>
              <p className="text-sm text-slate-600 mb-6">This will permanently remove this student's registration and associated ID data. This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRegToDelete(null)}
                  disabled={deletingId === regToDelete}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === regToDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingId === regToDelete ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
`;

code = code.replace(/    <\/div>\n  \);\n\}\n?/g, modalUI + "}\n");
fs.writeFileSync('src/pages/Registrations.tsx', code);
