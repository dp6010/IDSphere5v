const fs = require('fs');
let code = fs.readFileSync('src/services/apiClient.ts', 'utf8');

const target = `updateRegistrationStatus: (email: string, orgId: string, registrationId: string, status: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}/status\`, email, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }),`;

const replacement = `updateRegistrationStatus: (email: string, orgId: string, registrationId: string, status: string, validFrom?: string, validTill?: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}/status\`, email, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, validFrom, validTill })
    }),`;

code = code.replace(target, replacement);

const targetBulkForms = `  deleteForm: (email: string, orgId: string, formId: string) => 
    authFetch(\`/api/organizations/\${orgId}/forms/\${formId}\`, email, {
      method: 'DELETE'
    }),`;
    
const replacementBulkForms = `  deleteForm: (email: string, orgId: string, formId: string) => 
    authFetch(\`/api/organizations/\${orgId}/forms/\${formId}\`, email, {
      method: 'DELETE'
    }),
    
  deleteFormsBulk: (email: string, orgId: string, formIds: string[]) => 
    authFetch(\`/api/organizations/\${orgId}/forms/bulk\`, email, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formIds })
    }),`;
    
code = code.replace(targetBulkForms, replacementBulkForms);

const targetBulkRegs = `  deleteRegistration: (email: string, orgId: string, registrationId: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}\`, email, {
      method: 'DELETE'
    }),`;
    
const replacementBulkRegs = `  deleteRegistration: (email: string, orgId: string, registrationId: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}\`, email, {
      method: 'DELETE'
    }),
    
  deleteRegistrationsBulk: (email: string, orgId: string, registrationIds: string[]) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/bulk\`, email, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationIds })
    }),`;

code = code.replace(targetBulkRegs, replacementBulkRegs);
fs.writeFileSync('src/services/apiClient.ts', code);
