import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AlertCircle, Loader2, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Footer } from '../components/Footer';
import html2canvas from 'html2canvas';

export function PublicIdCard() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      
      const image = canvas.toDataURL('image/png');
      const safeName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      const link = document.createElement('a');
      link.href = image;
      link.download = `IDSphere-ID-${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download ID card:', err);
      alert('Failed to download ID card. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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
      <div className="flex-1 py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
        <div ref={cardRef} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-sm flex flex-col mb-8">
        <div className="bg-blue-700 px-6 py-6 text-center text-white">
           <h1 className="text-xl font-bold">{data.orgName}</h1>
           <p className="text-blue-200 text-sm font-medium mt-1 uppercase tracking-widest">Digital Identity</p>
        </div>
        
        <div className="px-8 pt-8 pb-6 flex flex-col items-center flex-1">
           <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-50 mb-6">
             {data.photoUrl ? (
               <img src={data.photoUrl} alt={studentName} className="w-full h-full object-cover" crossOrigin="anonymous" />
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
                   <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                     ID Expired
                   </span>
                 );
               } else {
                 return (
                   <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                     Active / Verified
                   </span>
                 );
               }
             }
             
             return (
               <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                 {data.status}
               </span>
             );
           })()}
           
           <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 inline-block">
             <QRCode value={verifyUrl} size={160} level="H" />
           </div>
           <p className="text-slate-400 text-xs mt-3 uppercase tracking-wider font-medium hidden">Scan to Verify</p>
        </div>
        
        <div className="bg-slate-50 py-1.5 px-6 flex items-center justify-center border-t border-slate-200 gap-2 mt-auto">
           <img src="/favicon.svg" alt="IDSphere" className="h-4 w-auto grayscale opacity-60" crossOrigin="anonymous" />
           <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Powered by IDSphere</span>
        </div>
      </div>
      
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        Download ID Card
      </button>
      </div>
      <Footer />
    </div>
  );
}
