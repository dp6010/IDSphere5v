const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

const targetState = "const [deletingId, setDeletingId] = useState<string | null>(null);";
const replacementState = "const [deletingId, setDeletingId] = useState<string | null>(null);\n  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);\n  const [isBulkDeleting, setIsBulkDeleting] = useState(false);";
code = code.replace(targetState, replacementState);

const handleBulkDelete = `
  const handleBulkDelete = async () => {
    if (!user?.email || !org || selectedRegistrations.length === 0) return;
    if (!window.confirm(\`Delete \${selectedRegistrations.length} students permanently?\\n\\nThis will permanently remove the selected registrations and their associated identity data. This action cannot be undone.\`)) {
      return;
    }
    
    setIsBulkDeleting(true);
    try {
      await apiClient.deleteRegistrationsBulk(user.email, org.organizationId, selectedRegistrations);
      setRegistrations(prev => prev.filter(r => !selectedRegistrations.includes(r.registrationId)));
      setSelectedRegistrations([]);
      if (selectedReg && selectedRegistrations.includes(selectedReg.registrationId)) {
        setSelectedReg(null);
      }
      alert("Registrations deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete registrations: " + err.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };
`;

code = code.replace("  const handleDelete = async", handleBulkDelete + "\n  const handleDelete = async");

const targetHeaderUI = `      {filteredAndSortedRegistrations.length === 0 && registrations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">`;

const replacementHeaderUI = `      {selectedRegistrations.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium text-slate-700">{selectedRegistrations.length} student(s) selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {filteredAndSortedRegistrations.length > 0 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm flex items-center gap-3">
          <input 
            type="checkbox" 
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            checked={selectedRegistrations.length > 0 && selectedRegistrations.length === filteredAndSortedRegistrations.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRegistrations(filteredAndSortedRegistrations.map(r => r.registrationId));
              } else {
                setSelectedRegistrations([]);
              }
            }}
          />
          <span className="text-sm text-gray-600 font-medium">Select All</span>
        </div>
      )}

      {filteredAndSortedRegistrations.length === 0 && registrations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">`;

code = code.replace(targetHeaderUI, replacementHeaderUI);

const targetListItem = `              <li key={reg.registrationId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedReg(reg)}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>`;

const replacementListItem = `              <li key={reg.registrationId} className="hover:bg-gray-50 cursor-pointer">
                <div className="px-6 py-4 flex items-center gap-4">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      checked={selectedRegistrations.includes(reg.registrationId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRegistrations(prev => [...prev, reg.registrationId]);
                        } else {
                          setSelectedRegistrations(prev => prev.filter(id => id !== reg.registrationId));
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-between" onClick={() => setSelectedReg(reg)}>
                    <div>`;

code = code.replace(targetListItem, replacementListItem);
code = code.replace(`                  </div>
                  <div className="flex items-center">`, `                    </div>
                    <div className="flex items-center">`);
                    
code = code.replace(`                      {reg.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </li>`, `                      {reg.status || 'PENDING'}
                    </span>
                    </div>
                  </div>
                </div>
              </li>`);

fs.writeFileSync('src/pages/Registrations.tsx', code);
