const fs = require('fs');
let code = fs.readFileSync('src/services/apiClient.ts', 'utf8');

const target = `  updateRegistrationStatus: (email: string, orgId: string, registrationId: string, status: string, validFrom?: string, validTill?: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}/status\`, email, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, validFrom, validTill })
    }),`;

const additions = `
  deleteForm: (email: string, orgId: string, formId: string) => 
    authFetch(\`/api/organizations/\${orgId}/forms/\${formId}\`, email, {
      method: 'DELETE'
    }),
  deleteFormsBulk: (email: string, orgId: string, formIds: string[]) => 
    authFetch(\`/api/organizations/\${orgId}/forms/bulk\`, email, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formIds })
    }),
  deleteRegistration: (email: string, orgId: string, registrationId: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}\`, email, {
      method: 'DELETE'
    }),
  deleteRegistrationsBulk: (email: string, orgId: string, registrationIds: string[]) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/bulk\`, email, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationIds })
    }),
`;

code = code.replace(target, target + additions);
fs.writeFileSync('src/services/apiClient.ts', code);
