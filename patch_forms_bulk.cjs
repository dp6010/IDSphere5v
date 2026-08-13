const fs = require('fs');
let code = fs.readFileSync('src/pages/Forms.tsx', 'utf8');

const targetState = "const [deletingId, setDeletingId] = useState<string | null>(null);";
const replacementState = "const [deletingId, setDeletingId] = useState<string | null>(null);\n  const [selectedForms, setSelectedForms] = useState<string[]>([]);\n  const [isBulkDeleting, setIsBulkDeleting] = useState(false);";
code = code.replace(targetState, replacementState);

const handleBulkDelete = `
  const handleBulkDelete = async () => {
    if (!user?.email || !org || selectedForms.length === 0) return;
    if (!window.confirm(\`Delete \${selectedForms.length} forms permanently?\\n\\nThese forms will be permanently removed. This action cannot be undone.\`)) {
      return;
    }
    
    setIsBulkDeleting(true);
    try {
      await apiClient.deleteFormsBulk(user.email, org.organizationId, selectedForms);
      setForms(prev => prev.filter(f => !selectedForms.includes(f.formId)));
      setSelectedForms([]);
      alert("Forms deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete forms: " + err.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };
`;

code = code.replace("  const handleDelete = async", handleBulkDelete + "\n  const handleDelete = async");

const targetHeaderUI = `      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredAndSortedForms.length === 0 ? (`;
const replacementHeaderUI = `      {selectedForms.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium text-slate-700">{selectedForms.length} form(s) selected</span>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredAndSortedForms.length === 0 ? (`;

code = code.replace(targetHeaderUI, replacementHeaderUI);

const targetTableHead = `            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>`;

const replacementTableHead = `            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={filteredAndSortedForms.length > 0 && selectedForms.length === filteredAndSortedForms.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedForms(filteredAndSortedForms.map(f => f.formId));
                      } else {
                        setSelectedForms([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 font-medium">Name</th>`;

code = code.replace(targetTableHead, replacementTableHead);

const targetTableRow = `            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedForms.map(form => (
                <tr key={form.formId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{form.name}</td>`;

const replacementTableRow = `            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedForms.map(form => (
                <tr key={form.formId} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedForms.includes(form.formId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForms(prev => [...prev, form.formId]);
                        } else {
                          setSelectedForms(prev => prev.filter(id => id !== form.formId));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{form.name}</td>`;

code = code.replace(targetTableRow, replacementTableRow);

fs.writeFileSync('src/pages/Forms.tsx', code);
