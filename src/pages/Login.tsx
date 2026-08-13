import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export function Login() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setError(`Failed to sign in: ${err.message || err.code || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white mb-4 text-xl">
          ID
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome to IDSphere</h1>
        <p className="text-slate-500 mt-2 text-sm text-center">
          Sign in to manage digital ID cards or access your portal.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-100">
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium"
      >
        <LogIn size={18} />
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
}
