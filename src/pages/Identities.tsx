import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Organization, Registration, Form } from '../types';
import { AlertCircle, Lock, RefreshCw, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';

function isLikelyFileId(key: string, val: any): boolean {
  if (typeof val !== 'string') return false;
  return key.toLowerCase().includes('photo') && val.length > 20;
}

function IDCard({ org, reg, formName }: { org: Organization, reg: Registration, formName: string }) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  
  const fullName = reg.submittedData['Full Name'] || reg.submittedData['Participant Name'] || 'Unknown Name';
  const photoField = Object.entries(reg.submittedData).find(([k, v]) => isLikelyFileId(k, v));
  const fileId = photoField ? (photoField[1] as string) : null;

  useEffect(() => {
    if (!user?.email || !fileId) return;
    let currentUrl: string | null = null;
    
    apiClient.getRegistrationPhotoBlob(user.email, org.organizationId, reg.registrationId, fileId)
      .then(blob => {
        currentUrl = URL.createObjectURL(blob);
        setPhotoUrl(currentUrl);
      })
      .catch(err => {
        console.error('Failed to load photo:', err);
      });

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [user?.email, org.organizationId, reg.registrationId, fileId]);

  useEffect(() => {
    if (!user?.email) return;
    apiClient.getVerificationToken(user.email, org.organizationId, reg.registrationId)
      .then(res => setVerifyToken(res.token))
      .catch(err => console.error('Failed to generate token', err));
  }, [user?.email, org.organizationId, reg.registrationId]);

  const qrUrl = verifyToken ? `${window.location.origin}/public/verify/${verifyToken}` : '';

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 w-[300px] h-[480px] flex flex-col mx-auto id-card-print">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 text-center">
        <h2 className="text-xl font-bold text-white tracking-tight uppercase">{org.organizationName}</h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center pt-6 px-6 relative bg-gradient-to-b from-slate-50 to-white">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 z-10 flex items-center justify-center mb-4">
          {photoUrl ? (
            <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 text-sm font-medium">No Photo</span>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-6 text-center">{fullName}</h3>
        
        {qrUrl ? (
          <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
            <QRCode 
              value={qrUrl} 
              size={150}
              level="M"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
        ) : (
          <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center animate-pulse mb-6">
            <span className="text-slate-400 text-xs">Loading QR...</span>
          </div>
        )}
      </div>
      <div className="bg-slate-50 py-3 px-6 flex items-center justify-center border-t border-slate-200 gap-2 mt-auto">
         <img src="/favicon.svg" alt="IDSphere" className="h-4 w-auto grayscale opacity-60" />
         <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Powered by IDSphere</span>
      </div>
    </div>
  );
}

export function Identities() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const o = await apiClient.getOrganization(user!.email!);
      setOrg(o);
      
      const [regs, formsList] = await Promise.all([
        apiClient.getRegistrations(user!.email!, o.organizationId),
        apiClient.getForms(user!.email!, o.organizationId)
      ]);
      
      const formsMap = formsList.reduce((acc, f) => {
        acc[f.formId] = f;
        return acc;
      }, {} as Record<string, Form>);
      setForms(formsMap);
      
      // Filter ONLY ACTIVE registrations
      setRegistrations(regs.filter(r => r.status === 'ACTIVE'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Cards</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generated ID cards for all <strong>ACTIVE</strong> registrations.
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={registrations.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Printer size={16} />
          Print IDs
        </button>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center print:hidden">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Active Registrations</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            You don't have any ACTIVE registrations yet. Go to the Registrations tab to approve students.
          </p>
        </div>
      ) : (
        <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {registrations.map(reg => (
            <div key={reg.registrationId} className="print-card-wrapper break-inside-avoid">
              <IDCard 
                org={org!} 
                reg={reg} 
                formName={forms[reg.formId]?.name || forms[reg.formId]?.formName || 'Registration'} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Global styles for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .id-card-print, .id-card-print * {
            visibility: visible;
          }
          .print-card-wrapper {
            position: relative;
            page-break-inside: avoid;
            margin-bottom: 2rem;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
          }
          .grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
        }
      `}} />
    </div>
  );
}
