const fs = require('fs');
let code = fs.readFileSync('src/services/apiClient.ts', 'utf8');

const newMethods = `
  deleteForm: (email: string, orgId: string, formId: string) => 
    authFetch(\`/api/organizations/\${orgId}/forms/\${formId}\`, email, {
      method: 'DELETE'
    }),
    
  deleteRegistration: (email: string, orgId: string, registrationId: string) => 
    authFetch(\`/api/organizations/\${orgId}/registrations/\${registrationId}\`, email, {
      method: 'DELETE'
    }),
`;

code = code.replace("  getFormToken: (email: string, orgId: string, formId: string) => ", newMethods + "\n  getFormToken: (email: string, orgId: string, formId: string) => ");

fs.writeFileSync('src/services/apiClient.ts', code);
