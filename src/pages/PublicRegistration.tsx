import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Footer } from '../components/Footer';

export function PublicRegistration() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    fetch(`/api/public/register/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setFormConfig(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setError('You must agree to the Privacy Policy and Terms and Conditions before submitting your registration.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/public/register/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData, consent: consentGiven })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      
      setSuccessData(data);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500">Loading form...</p></div>;
  }
  
  if (error && !formConfig) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Form Not Found</h2>
            <p className="text-slate-600 text-sm">{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 py-12 px-4 flex justify-center items-start">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Registration Submitted</h2>
            <p className="text-slate-600 mb-6">Your registration data has been submitted successfully to {formConfig?.organizationName}.</p>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 text-sm">
              <strong>Action Required:</strong> Your photo is required to complete your registration.
            </div>
            <button
              onClick={() => navigate(`/photo-upload/${successData.photoUploadToken}`)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Upload Photo
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fields = formConfig?.fields || ['Full Name', 'Date of Birth', 'Address', 'Phone Number'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
          <div className="bg-slate-900 px-6 py-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{formConfig?.name}</h1>
          <p className="text-slate-300 text-sm">{formConfig?.organizationName}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {fields.map((field: string, idx: number) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field} *</label>
                <input
                  type={field.toLowerCase().includes('date') || field === 'DOB' ? 'date' : 'text'}
                  required
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            ))}
          </div>
          
          <div className="flex items-start gap-3 mt-6">
            <div className="flex items-center h-5">
              <input
                id="consent"
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <label htmlFor="consent" className="text-sm text-slate-600">
              I have read and agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a> and <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms and Conditions</a>.
            </label>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? 'Submitting...' : 'Next: Upload Photo'}
          </button>
        </form>
      </div>
      </div>
      <Footer />
    </div>
  );
}
