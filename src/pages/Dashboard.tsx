import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Organization, Registration } from '../types';


export function Dashboard() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  


  useEffect(() => {
    if (user?.email) {
      apiClient.getOrganization(user.email)
        .then(async (o) => {
           setOrg(o);
           try {
             const regs = await apiClient.getRegistrations(user!.email!, o.organizationId);
             const active = regs.filter((r: Registration) => r.status === 'ACTIVE').length;
             setActiveUsers(active);
           } catch (e) { console.error(e); }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));


    }
  }, [user]);



  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
        Welcome back, {user?.displayName || user?.email}
      </h1>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-lg bg-slate-50 border border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 mb-2">Organization Overview</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading organization details...</p>
          ) : error ? (
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md border border-red-100">
              <p className="font-semibold mb-1">Configuration Error</p>
              <p>{error}</p>
              <p className="mt-2 text-xs opacity-80">Make sure the Master Spreadsheet is configured and contains this user.</p>
            </div>
          ) : org ? (
            <div className="space-y-4 mt-4 text-sm text-slate-700">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Organization Name</span>
                <span>{org.organizationName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Status</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-medium">{org.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Form Limit</span>
                <span>{org.maxForms}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">User Limit</span>
                <span>{activeUsers} / {org.maxUsers}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No organization data found.</p>
          )}
        </div>



      </div>
    </div>
  );
}
