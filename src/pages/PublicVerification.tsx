import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function PublicVerification() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  
  useEffect(() => {
    fetch(`/api/public/verify/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setVerificationData(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500">Verifying Identity...</p></div>;
  }
  
  if (error || !verificationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Not Found</h2>
          <p className="text-slate-600">This identity card could not be verified or is invalid.</p>
        </div>
      </div>
    );
  }

  const { orgName, formName, status, validTill, data, photoUrl } = verificationData;
  
  const today = new Date().toISOString().split('T')[0];
  const isExpired = validTill && today > validTill;
  const isActive = status === 'ACTIVE' && !isExpired;
  
  let headerTitle = 'Identity Not Active';
  let headerColor = 'bg-red-600';
  let Icon = XCircle;
  let statusText = status;
  
  if (status === 'ACTIVE') {
    if (isExpired) {
      headerTitle = 'Identity Expired';
      headerColor = 'bg-red-600';
      statusText = 'ID EXPIRED';
    } else {
      headerTitle = 'Identity Verified';
      headerColor = 'bg-emerald-600';
      statusText = 'VALID ID';
      Icon = CheckCircle;
    }
  } else if (status === 'REJECTED') {
    headerTitle = 'Identity Invalid';
    statusText = 'INVALID ID';
  } else if (status === 'DEACTIVE') {
    headerTitle = 'Identity Inactive';
    statusText = 'ID INACTIVE';
  } else if (status === 'PENDING') {
    headerTitle = 'Pending Verification';
    headerColor = 'bg-yellow-500';
    statusText = 'ID PENDING VERIFICATION';
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className={`px-6 py-8 text-center ${headerColor}`}>
          <Icon className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-1">
            {headerTitle}
          </h1>
          <p className="text-white/80 font-medium uppercase tracking-wider text-xs">{statusText}</p>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">{orgName}</h2>
            <p className="text-sm text-slate-500">{formName}</p>
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-sm">No Photo</span>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(data).map(([key, value]) => {
               if (key.toLowerCase().includes('photo')) return null;
               return (
                 <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <p className="text-xs font-semibold text-slate-500 uppercase">{key}</p>
                   <p className="text-slate-900 font-medium mt-1">{value as React.ReactNode}</p>
                 </div>
               );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
