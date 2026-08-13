import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Form, Organization } from '../types';
import { Plus, Link as LinkIcon, AlertCircle, Copy, Search, Trash2 } from 'lucide-react';

export function Forms() {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);


  const handleBulkDelete = async () => {
    if (!user?.email || !org || selectedForms.length === 0) return;
    if (!window.confirm(`Delete ${selectedForms.length} forms permanently?\n\nThese forms will be permanently removed. This action cannot be undone.`)) {
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


  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  
  const confirmDelete = async () => {
    if (!formToDelete || !user?.email || !org) return;
    setDeletingId(formToDelete.formId);
    try {
      await apiClient.deleteForm(user.email, org.organizationId, formToDelete.formId);
      setForms(prev => prev.filter(f => f.formId !== formToDelete.formId));
      alert("Form deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete form: " + err.message);
    } finally {
      setDeletingId(null);
      setFormToDelete(null);
    }
  };

  const handleDeleteClick = (form: Form) => {
    setFormToDelete(form);
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


  useEffect(() => {
    if (user?.email) {
      apiClient.getOrganization(user.email).then(o => {
        setOrg(o);
        if (o) {
          apiClient.getForms(user.email!, o.organizationId)
            .then(setForms)
            .catch(err => console.error('Failed to load forms:', err))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.error('Failed to load organization:', err);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div>Loading forms...</div>;
  if (!org) return <div>Organization not found.</div>;

  const canCreate = forms.length < org.maxForms;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Forms</h1>
        {canCreate ? (
          <Link 
            to="/forms/new" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Form
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-md border border-amber-200">
            <AlertCircle size={16} />
            Form limit reached ({org.maxForms}/{org.maxForms})
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
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

      {selectedForms.length > 0 && (
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
        {filteredAndSortedForms.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No forms created yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
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
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Link</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                  <td className="px-6 py-4 font-medium text-slate-900">{form.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${form.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                      {form.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{new Date(form.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {form.status === 'ACTIVE' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await apiClient.getPublicFormToken(user!.email!, org!.organizationId, form.formId);
                              const url = `${(import.meta as any).env.VITE_APP_URL || window.location.origin}/public/register/${res.token}`;
                              
                              let success = false;
                              try {
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  await navigator.clipboard.writeText(url);
                                  success = true;
                                } else {
                                  throw new Error("Clipboard API not available");
                                }
                              } catch (err) {
                                try {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = url;
                                  textArea.style.position = "fixed";
                                  textArea.style.left = "-999999px";
                                  textArea.style.top = "-999999px";
                                  document.body.appendChild(textArea);
                                  textArea.focus();
                                  textArea.select();
                                  success = document.execCommand('copy');
                                  textArea.remove();
                                } catch (fallbackErr) {
                                  success = false;
                                }
                              }
                              
                              if (success) {
                                alert('Public Registration Link copied!');
                              } else {
                                prompt('Public Registration Link generated \u2014 copy it below:', url);
                              }
                            } catch (e: any) {
                              alert('Error generating link: ' + e.message);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-transparent border-none cursor-pointer p-0 text-sm"
                        >
                          <Copy size={14} /> Copy Public Link
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 flex flex-col gap-2">
                    <Link 
                      to={`/forms/${form.formId}/edit`}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded w-max transition-colors"
                    >
                      Edit Form
                    </Link>
                    <div className="flex items-center gap-1 text-amber-600 text-[11px] font-medium uppercase tracking-wide">
                      <AlertCircle size={12} /> Photo setup required
                    </div>
                    <button
                      onClick={() => handleDeleteClick(form)}
                      disabled={deletingId === form.formId}
                      className="mt-2 text-red-600 hover:text-red-800 flex items-center gap-1 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded w-max transition-colors disabled:opacity-50 text-xs"
                    >
                      <Trash2 size={14} />
                      {deletingId === form.formId ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete this form permanently?</h3>
              <p className="text-sm text-slate-600 mb-6">This will permanently remove this form and its associated form configuration. This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setFormToDelete(null)}
                  disabled={deletingId === formToDelete?.formId}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === formToDelete?.formId}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingId === formToDelete?.formId ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
