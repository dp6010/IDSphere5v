const fs = require('fs');
let code = fs.readFileSync('src/pages/Forms.tsx', 'utf8');

const modalCode = `
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  
  const confirmDelete = async () => {
    if (!formToDelete || !user?.email || !org) return;
    setDeletingId(formToDelete);
    try {
      await apiClient.deleteForm(user.email, org.organizationId, formToDelete);
      setForms(prev => prev.filter(f => f.formId !== formToDelete));
      alert("Form deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete form: " + err.message);
    } finally {
      setDeletingId(null);
      setFormToDelete(null);
    }
  };

  const handleDeleteClick = (formId: string) => {
    setFormToDelete(formId);
  };
`;

const handleDeleteReplacement = modalCode;

code = code.replace(/  const handleDelete = async \(formId: string\) => \{[\s\S]*?  \};\n/g, handleDeleteReplacement);
code = code.replace(/onClick=\{\(\) => handleDelete\(form\.formId\)\}/g, "onClick={() => handleDeleteClick(form.formId)}");

const modalUI = `
      {formToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete this form permanently?</h3>
              <p className="text-sm text-slate-600 mb-6">This will permanently remove this form and its associated form configuration. This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setFormToDelete(null)}
                  disabled={deletingId === formToDelete}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === formToDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingId === formToDelete ? 'Deleting...' : 'Delete Permanently'}
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
fs.writeFileSync('src/pages/Forms.tsx', code);
