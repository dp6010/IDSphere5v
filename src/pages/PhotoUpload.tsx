import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Footer } from '../components/Footer';

export function PhotoUpload() {
  const { token } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a photo');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const payload = new FormData();
      payload.append('photo', file);
      
      const res = await fetch(`/api/public/photo-upload/${token}`, {
        method: 'POST',
        body: payload
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setSuccess(true);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 py-12 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful</h2>
            <p className="text-slate-600 mb-6">Your photo has been securely uploaded and attached to your registration.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-max mt-8">
        <div className="bg-slate-900 px-6 py-8 text-center">
          <Camera className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Student Photo</h1>
          <p className="text-slate-300 text-sm">Upload your passport-size photo.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div>
            <div className="mt-1">
              <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  required
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                <span className="block text-base font-medium text-slate-900 mb-1">
                  {file ? file.name : "Click to select photo"}
                </span>
                <span className="block text-sm text-slate-500">
                  Passport size, JPG/PNG up to 5MB
                </span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={submitting || !file}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </button>
        </form>
      </div>
      </div>
      <Footer />
    </div>
  );
}
