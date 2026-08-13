const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

const targetImports = "import { AlertCircle, Lock, RefreshCw } from 'lucide-react';";
const replacementImports = "import { AlertCircle, Lock, RefreshCw, Search, Trash2 } from 'lucide-react';";
code = code.replace(targetImports, replacementImports);

const targetState = `  const [authError, setAuthError] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);`;

const replacementState = `  const [authError, setAuthError] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (registrationId: string) => {
    if (!user?.email || !org) return;
    if (!window.confirm("Delete student permanently?\\n\\nThis will permanently remove this student's registration and associated ID data. This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(registrationId);
    try {
      await apiClient.deleteRegistration(user.email, org.organizationId, registrationId);
      setRegistrations(prev => prev.filter(r => r.registrationId !== registrationId));
      if (selectedReg?.registrationId === registrationId) {
        setSelectedReg(null);
      }
      alert("Registration deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete registration: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAndSortedRegistrations = registrations
    .filter(reg => {
      if (filterStatus !== 'ALL' && reg.status !== filterStatus && !(filterStatus === 'PENDING' && !reg.status)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (reg.registrationId.toLowerCase().includes(query)) return true;
        if (reg.formId.toLowerCase().includes(query)) return true;
        const vals = Object.values(reg.submittedData).filter(v => typeof v === 'string').map(v => (v as string).toLowerCase());
        return vals.some(v => v.includes(query));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'NEWEST':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'OLDEST':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'STATUS':
          return (a.status || 'PENDING').localeCompare(b.status || 'PENDING');
        case 'NAME_ASC':
        case 'NAME_DESC':
          const getName = (reg: Registration) => {
            const nameKey = Object.keys(reg.submittedData).find(k => k.toLowerCase().includes('name'));
            return nameKey ? (reg.submittedData[nameKey] || '') : '';
          };
          const nameA = getName(a);
          const nameB = getName(b);
          if (sortOption === 'NAME_ASC') return nameA.localeCompare(nameB);
          return nameB.localeCompare(nameA);
        default:
          return 0;
      }
    });
`;

code = code.replace(targetState, replacementState);

const targetUIHeader = `      {registrations.length === 0 && !authError && !loading && !syncing ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">`;

const replacementUIHeader = `      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students (name, email, phone, ID)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
            <option value="NAME_ASC">Name A-Z</option>
            <option value="NAME_DESC">Name Z-A</option>
            <option value="STATUS">Status</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVE">Deactive</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {filteredAndSortedRegistrations.length === 0 && registrations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
           No registrations match your search criteria.
        </div>
      )}

      {registrations.length === 0 && !authError && !loading && !syncing ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">`;

code = code.replace(targetUIHeader, replacementUIHeader);

const targetMap = `            {registrations.map((reg) => (
              <li key={reg.registrationId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedReg(reg)}>`;

const replacementMap = `            {filteredAndSortedRegistrations.map((reg) => (
              <li key={reg.registrationId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedReg(reg)}>`;

code = code.replace(targetMap, replacementMap);

const targetDeleteRow = `                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <select
                    value={selectedReg.status || 'PENDING'}
                    onChange={(e) => updateStatus(selectedReg.registrationId, e.target.value)}`;

const replacementDeleteRow = `                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center justify-between gap-4">
                  <select
                    value={selectedReg.status || 'PENDING'}
                    onChange={(e) => updateStatus(selectedReg.registrationId, e.target.value)}
                    className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DEACTIVE">Deactive</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REMOVED">Removed</option>
                  </select>
                  <button
                    onClick={() => handleDelete(selectedReg.registrationId)}
                    disabled={deletingId === selectedReg.registrationId}
                    className="flex-shrink-0 text-red-600 hover:text-red-800 flex items-center gap-1 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors disabled:opacity-50 text-xs"
                  >
                    <Trash2 size={14} />
                    {deletingId === selectedReg.registrationId ? 'Deleting...' : 'Delete'}
                  </button>
                  </div>
                </div>
                <div className="hidden">
                  <select`; // Hidden select to preserve the rest of replace regex matching

code = code.replace(targetDeleteRow, replacementDeleteRow);
code = code.replace(`                <div className="hidden">\n                  <select\n                    className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"\n                  >\n                    <option value="PENDING">Pending</option>\n                    <option value="VERIFIED">Verified</option>\n                    <option value="ACTIVE">Active</option>\n                    <option value="DEACTIVE">Deactive</option>\n                    <option value="REJECTED">Rejected</option>\n                    <option value="REMOVED">Removed</option>\n                  </select>\n                </div>`, "");

fs.writeFileSync('src/pages/Registrations.tsx', code);
