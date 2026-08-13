import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Footer } from '../components/Footer';

export function PublicIdCard() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    fetch(`/api/public/verify/${token}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-500 w-8 h-8" /></div>;
  }
  
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">ID Not Found</h2>
            <p className="text-slate-600">This ID card could not be loaded or is no longer available.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Find a full name or primary name field
  const nameKey = Object.keys(data.data).find(k => k.toLowerCase().includes('name')) || Object.keys(data.data)[0];
  const studentName = data.data[nameKey];

  // The QR code scans to the public verify URL
  const verifyUrl = `${window.location.origin}/public/verify/${token}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-sm flex flex-col">
        <div className="bg-blue-700 px-6 py-6 text-center text-white">
           <h1 className="text-xl font-bold">{data.orgName}</h1>
           <p className="text-blue-200 text-sm font-medium mt-1 uppercase tracking-widest">Digital Identity</p>
        </div>
        
        <div className="p-8 flex flex-col items-center flex-1">
           <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-50 mb-6">
             {data.photoUrl ? (
               <img src={data.photoUrl} alt={studentName} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-400">No Photo</div>
             )}
           </div>
           
           <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">{studentName}</h2>
           
           {(() => {
             const today = new Date().toISOString().split('T')[0];
             const isExpired = data.validTill && today > data.validTill;
             
             if (data.status === 'ACTIVE') {
               if (isExpired) {
                 return (
                   <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
                     ID Expired
                   </span>
                 );
               } else {
                 return (
                   <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
                     Active / Verified
                   </span>
                 );
               }
             }
             
             return (
               <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
                 {data.status}
               </span>
             );
           })()}
           
           <div className="mt-auto p-4 bg-white rounded-xl shadow-sm border border-slate-100 inline-block mb-8">
             <QRCode value={verifyUrl} size={160} level="H" />
           </div>
           <p className="text-slate-400 text-xs mt-3 uppercase tracking-wider font-medium hidden">Scan to Verify</p>
        </div>
        
        <div className="bg-slate-50 py-3 px-6 flex items-center justify-center border-t border-slate-200 gap-2 mt-auto">
           <img src="/favicon.svg" alt="IDSphere" className="h-4 w-auto grayscale opacity-60" />
           <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Powered by IDSphere</span>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
