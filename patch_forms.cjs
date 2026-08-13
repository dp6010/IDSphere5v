const fs = require('fs');
let code = fs.readFileSync('src/pages/Forms.tsx', 'utf8');

const targetImports = "import { Plus, Link as LinkIcon, AlertCircle, Copy } from 'lucide-react';";
const replacementImports = "import { Plus, Link as LinkIcon, AlertCircle, Copy, Search, Trash2 } from 'lucide-react';";

code = code.replace(targetImports, replacementImports);

const targetState = `  const [forms, setForms] = useState<Form[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);`;

const replacementState = `  const [forms, setForms] = useState<Form[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (formId: string) => {
    if (!user?.email || !org) return;
    if (!window.confirm("Delete this form permanently?\\n\\nThis will permanently remove this form and its associated form configuration. This action cannot be undone.\\n\\nNote: Associated registration data may also be affected.")) {
      return;
    }
    
    setDeletingId(formId);
    try {
      await apiClient.deleteForm(user.email, org.organizationId, formId);
      setForms(prev => prev.filter(f => f.formId !== formId));
      alert("Form deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete form: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAndSortedForms = forms
    .filter(form => {
      if (filterStatus !== 'ALL' && form.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return form.name.toLowerCase().includes(query) || form.formId.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'NEWEST':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'OLDEST':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
`;

code = code.replace(targetState, replacementState);

const targetUIHeader = `      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {forms.length === 0 ? (`;

const replacementUIHeader = `      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search forms by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
            <option value="NAME_ASC">Name A-Z</option>
            <option value="NAME_DESC">Name Z-A</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredAndSortedForms.length === 0 ? (`;

code = code.replace(targetUIHeader, replacementUIHeader);

const targetMap = `            <tbody className="divide-y divide-slate-100">
              {forms.map(form => (`;

const replacementMap = `            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedForms.map(form => (`;

code = code.replace(targetMap, replacementMap);

const targetDeleteRow = `                    <div className="flex items-center gap-1 text-amber-600 text-[11px] font-medium uppercase tracking-wide">
                      <AlertCircle size={12} /> Photo setup required
                    </div>
                  </td>`;

const replacementDeleteRow = `                    <div className="flex items-center gap-1 text-amber-600 text-[11px] font-medium uppercase tracking-wide">
                      <AlertCircle size={12} /> Photo setup required
                    </div>
                    <button
                      onClick={() => handleDelete(form.formId)}
                      disabled={deletingId === form.formId}
                      className="mt-2 text-red-600 hover:text-red-800 flex items-center gap-1 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded w-max transition-colors disabled:opacity-50 text-xs"
                    >
                      <Trash2 size={14} />
                      {deletingId === form.formId ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>`;

code = code.replace(targetDeleteRow, replacementDeleteRow);

fs.writeFileSync('src/pages/Forms.tsx', code);
