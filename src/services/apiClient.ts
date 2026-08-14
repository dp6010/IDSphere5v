import { User } from '../types';

async function authFetch(url: string, userEmail: string | undefined, options: RequestInit = {}) {
  if (!userEmail) throw new Error('Not authenticated');

  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers: {
      ...options.headers,
      'x-user-email': userEmail,
      'Content-Type': 'application/json'
    }
  });

  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    let errorData: any = {};
    if (contentType && contentType.includes('application/json')) {
      errorData = await res.json().catch(() => ({}));
    }
    throw new Error(errorData.error || `API request failed: HTTP ${res.status}`);
  }
  
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  } else {
    throw new Error(`API request failed: Expected JSON but received ${contentType}`);
  }
}

export const apiClient = {
  getOrganization: (email: string) => authFetch('/api/organizations/me', email),
  getForms: (email: string, orgId: string) => authFetch(`/api/organizations/${orgId}/forms`, email),
  getPublicFormToken: (email: string, orgId: string, formId: string) => authFetch(`/api/organizations/${orgId}/forms/${formId}/public-token`, email),
  createForm: (email: string, orgId: string, form: any) => 
    authFetch(`/api/organizations/${orgId}/forms`, email, { 
      method: 'POST', 
      body: JSON.stringify(form) 
    }),
  updateForm: (email: string, orgId: string, formId: string, form: any) =>
    authFetch(`/api/organizations/${orgId}/forms/${formId}`, email, {
      method: 'PATCH',
      body: JSON.stringify(form)
    }),
  getRegistrations: (email: string, orgId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations`, email),
  getPhotoToken: (email: string, orgId: string, registrationId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}/photo-token`, email),
  getIdentityToken: (email: string, orgId: string, registrationId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}/identity-token`, email),
  resendIdEmail: (email: string, orgId: string, registrationId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}/resend-id-email`, email, { method: 'POST' }),
  resendPhotoEmail: (email: string, orgId: string, registrationId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}/resend-photo-email`, email, { method: 'POST' }),
  getVerificationToken: (email: string, orgId: string, registrationId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}/verify-token`, email),

  updateRegistrationStatus: (email: string, orgId: string, registrationId: string, status: string, validFrom?: string, validTill?: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}/status`, email, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, validFrom, validTill })
    }),
  deleteForm: (email: string, orgId: string, formId: string) => 
    authFetch(`/api/organizations/${orgId}/forms/${formId}`, email, {
      method: 'DELETE'
    }),
  deleteFormsBulk: (email: string, orgId: string, formIds: string[]) => 
    authFetch(`/api/organizations/${orgId}/forms/bulk?ids=${encodeURIComponent(formIds.join(','))}`, email, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formIds })
    }),
  deleteRegistration: (email: string, orgId: string, registrationId: string) => 
    authFetch(`/api/organizations/${orgId}/registrations/${registrationId}`, email, {
      method: 'DELETE'
    }),
  deleteRegistrationsBulk: (email: string, orgId: string, registrationIds: string[]) => 
    authFetch(`/api/organizations/${orgId}/registrations/bulk?ids=${encodeURIComponent(registrationIds.join(','))}`, email, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationIds })
    }),


  getRegistrationPhotoBlob: async (email: string, orgId: string, registrationId: string, fileId: string) => {
    if (!email) throw new Error('Not authenticated');
    const res = await fetch(`/api/organizations/${orgId}/registrations/${registrationId}/photo/${encodeURIComponent(fileId)}`, {
      headers: {
        'x-user-email': email
      }
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      let errorData: any = {};
      if (contentType && contentType.includes('application/json')) {
        errorData = await res.json().catch(() => ({}));
      }
      throw new Error(errorData.error || `Failed to load photo: ${res.status}`);
    }
    return res.blob();
  },
  checkEmailStatus: (email: string) => 
    authFetch(`/api/email/status`, email),
  sendTestEmail: (email: string) => 
    authFetch(`/api/email/test`, email, { method: 'POST' })
};