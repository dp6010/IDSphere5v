import React from 'react';
import { Link } from 'react-router-dom';

export function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-6">
          You do not have the required permissions to access this page.
        </p>
        <Link 
          to="/"
          className="inline-flex bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-lg transition-colors font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
