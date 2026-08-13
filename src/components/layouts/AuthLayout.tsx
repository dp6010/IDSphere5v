import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Footer } from '../Footer';

export function AuthLayout() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
