/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';
import { Forms } from './pages/Forms';
import { FormBuilder } from './pages/FormBuilder';
import { Registrations } from './pages/Registrations';
import { Identities } from './pages/Identities';
import { PhotoUpload } from './pages/PhotoUpload';
import { PublicRegistration } from './pages/PublicRegistration';
import { PublicVerification } from './pages/PublicVerification';
import { PublicIdCard } from './pages/PublicIdCard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          
                    {/* Public Photo Upload */}
          <Route path="/public/register/:token" element={<PublicRegistration />} />
          <Route path="/public/verify/:token" element={<PublicVerification />} />
          <Route path="/id/:token" element={<PublicIdCard />} />
          
          <Route path="/photo-upload/:token" element={<PhotoUpload />} />
          

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/forms" element={<Forms />} />
              <Route path="/forms/new" element={<FormBuilder />} />
              <Route path="/forms/:formId/edit" element={<FormBuilder />} />
              <Route path="/registrations" element={<Registrations />} />
              <Route path="/identities" element={<Identities />} />
            </Route>
          </Route>

          {/* Unauthorized access fallback */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
