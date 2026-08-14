import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Registration, Organization, Form } from '../types';
import { AlertCircle, Lock, RefreshCw, Search, Trash2 } from 'lucide-react';



function SecurePhoto({ orgId, regId, fileId, label }: { orgId: string, regId: string, fileId: string, label: string, key?: React.Key }) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    if (!fileId) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    let currentUrl: string | null = null;
    
    apiClient.getRegistrationPhotoBlob(user.email, orgId, regId, fileId)
      .then(blob => {
        currentUrl = URL.createObjectURL(blob);
        setPhotoUrl(currentUrl);
        setError(false);
      })
      .catch(err => {
        console.error('Failed to load photo:', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [user?.email, orgId, regId, fileId]);

  return (
    <div className="col-span-1 md:col-span-2 mt-2">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden" style={{ width: '150px', height: '200px' }}>
        {loading ? (
          <span className="text-xs text-gray-500">Loading photo...</span>
        ) : error || !photoUrl ? (
          <span className="text-xs text-red-500">Photo unavailable</span>
        ) : (
          <img 
            src={photoUrl} 
            alt="Registration Photo" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

    </div>
  );
}

export function Registrations() {
  const { user } = useAuth();
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);


  const handleBulkDelete = async () => {
    if (!user?.email || !org || selectedRegistrations.length === 0) return;
    if (!window.confirm(`Delete ${selectedRegistrations.length} students permanently?\n\nThis will permanently remove the selected registrations and their associated identity data. This action cannot be undone.`)) {
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


  const [regToDelete, setRegToDelete] = useState<Registration | null>(null);
  
  const confirmDelete = async () => {
    if (!regToDelete || !user?.email || !org) return;
    setDeletingId(regToDelete.registrationId);
    try {
      await apiClient.deleteRegistration(user.email, org.organizationId, regToDelete.registrationId);
      setRegistrations(prev => prev.filter(r => r.registrationId !== regToDelete.registrationId));
      if (selectedReg?.registrationId === regToDelete.registrationId) {
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

  const handleDeleteClick = (reg: Registration) => {
    setRegToDelete(reg);
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


  const isLikelyFileId = (key: string, value: any) => {
    if (typeof value !== 'string') return false;
    if (value.length < 25) return false;
    const k = key.toLowerCase();
    return k.includes('photo') || k.includes('image') || k.includes('picture') || k.includes('upload') || k.includes('file');
  };


  const fetchRegistrations = async (o: Organization) => {
    try {
      setLoading(true);
      const [regs, formsList] = await Promise.all([
        apiClient.getRegistrations(user!.email!, o.organizationId),
        apiClient.getForms(user!.email!, o.organizationId)
      ]);
      setRegistrations(regs);
      const formsMap = formsList.reduce((acc: any, f: any) => ({ ...acc, [f.formId]: f }), {});
      setForms(formsMap);
    } catch (err: any) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      apiClient.getOrganization(user.email).then(o => {
        setOrg(o);
        fetchRegistrations(o);
      }).catch(console.error);
    }
  }, [user]);

  const updateStatusAndValidity = async (regId: string, newStatus: string, validTillOverride?: string | null) => {
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
  };

  if (loading && !registrations.length) return <div className="p-8 text-sm text-gray-500">Loading registrations...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
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
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

      {selectedRegistrations.length > 0 && (
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
           No registrations match your search criteria.
        </div>
      )}

      {registrations.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Registrations will appear here when submitted.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedRegistrations.map((reg) => (
              <li key={reg.registrationId} className="hover:bg-gray-50 cursor-pointer">
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
                    <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {reg.submittedData['Full Name'] || reg.submittedData['Participant Name'] || Object.values(reg.submittedData)[0] || 'Unknown'}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {forms[reg.formId]?.formName || 'Unknown Form'} • {new Date(reg.submittedAt).toLocaleDateString()}
                    </p>
                    </div>
                    <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reg.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      reg.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                      reg.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      reg.status === 'DEACTIVE' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reg.status || 'PENDING'}
                    </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedReg && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-medium text-gray-900">Registration Details</h3>
              <button 
                onClick={() => setSelectedReg(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 rounded-lg border border-gray-100 gap-4">
                <div className="mb-4 md:mb-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Form</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{forms[selectedReg.formId]?.formName || 'Unknown Form'}</p>
                </div>
                
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Student Email</p>
                  <p className="mt-1 text-sm text-gray-900 break-all">
                    {Object.entries(selectedReg.submittedData).find(([k]) => k.toLowerCase() === 'email')?.[1] || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center justify-between gap-4">
                  <select
                    value={selectedReg.status || 'PENDING'}
                    onChange={(e) => updateStatusAndValidity(selectedReg.registrationId, e.target.value)}
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
                    onClick={() => handleDeleteClick(selectedReg)}
                    disabled={deletingId === selectedReg.registrationId}
                    className="flex-shrink-0 text-red-600 hover:text-red-800 flex items-center gap-1 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors disabled:opacity-50 text-xs"
                  >
                    <Trash2 size={14} />
                    {deletingId === selectedReg.registrationId ? 'Deleting...' : 'Delete'}
                  </button>
                  </div>
                </div>

              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Response Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Submitted At</p>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedReg.submittedAt).toLocaleString()}</p>
                  </div>
                  
                  
                  {!Object.entries(selectedReg.submittedData).some(([k, v]) => isLikelyFileId(k, v)) && (
                    <div className="col-span-1 md:col-span-2 mt-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-amber-800 font-medium">Missing Photo</p>
                          <p className="text-xs text-amber-700">This registration does not have an attached photo.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                              try {
                                const res = await apiClient.getPhotoToken(user!.email!, org!.organizationId, selectedReg.registrationId);
                                const url = `${(import.meta as any).env.VITE_APP_URL || window.location.origin}/photo-upload/${res.token}`;
                                
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
                                  alert('Upload link copied!');
                                } else {
                                  prompt('Upload link generated \u2014 copy it below:', url);
                                }
                              } catch(e: any) {
                                alert('Failed to generate token: ' + e.message);
                              }
                            }}
                            className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded w-max hover:bg-amber-700 transition-colors"
                          >
                            Copy Upload Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {selectedReg.status === 'ACTIVE' && (
                    <div className="col-span-1 md:col-span-2 mt-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-green-800 font-medium">Digital ID Access</p>
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
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await apiClient.getIdentityToken(user!.email!, org!.organizationId, selectedReg.registrationId);
                                  const url = `${(import.meta as any).env.VITE_APP_URL || window.location.origin}/id/${res.token}`;
                                  
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
                                    alert('ID link copied!');
                                  } else {
                                    prompt('ID link generated \u2014 copy it below:', url);
                                  }
                                } catch(e: any) {
                                  alert('Failed to generate token: ' + e.message);
                                }
                              }}
                              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded w-max hover:bg-green-700 transition-colors"
                            >
                              Copy ID Link
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await apiClient.resendIdEmail(user!.email!, org!.organizationId, selectedReg.registrationId);
                                  alert('ID email sent successfully.');
                                  setRegistrations(prev => prev.map(r => r.registrationId === selectedReg.registrationId ? { ...r, idEmailSent: true } : r));
                                  setSelectedReg({ ...selectedReg, idEmailSent: true });
                                } catch(e: any) {
                                  alert('Failed to send ID email: ' + e.message);
                                }
                              }}
                              className="text-xs border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded w-max hover:bg-green-50 transition-colors"
                            >
                              {selectedReg.idEmailSent ? 'Resend ID Email' : 'Send ID Email'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {Object.entries(selectedReg.submittedData).map(([key, value]) => {
                    if (key === 'error') return null;
                    // Check if it is a file ID
                    if (isLikelyFileId(key, value)) {
                      return (
                        <SecurePhoto 
                          key={key} 
                          orgId={org!.organizationId} 
                          regId={selectedReg.registrationId} 
                          fileId={value as string} 
                          label={key} 
                        />
                      );
                    }
                    
                    return (
                      <div key={key} className="col-span-1 md:col-span-2">
                        <p className="text-xs font-medium text-gray-500">{key}</p>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{value || '-'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {regToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete student permanently?</h3>
              <p className="text-sm text-slate-600 mb-6">This will permanently remove this student's registration and associated ID data. This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRegToDelete(null)}
                  disabled={deletingId === regToDelete?.registrationId}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === regToDelete?.registrationId}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingId === regToDelete?.registrationId ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
