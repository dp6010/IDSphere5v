const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const duplicateStart = code.indexOf('async updateRegistrationPhoto(orgId: string, registrationId: string, photoReference: string) {');
if (duplicateStart > -1) {
  const duplicateEnd = code.indexOf('async addRegistration(orgId: string, formId: string, customData: Record<string, string>) {');
  if (duplicateEnd > -1) {
    code = code.substring(0, duplicateStart) + code.substring(duplicateEnd);
  }
}

// Ensure the remaining one sets both 'Photo Reference' and 'Photo' so we're backward/forward compatible
code = code.replace(
  "existingData['Photo Reference'] = fileId;",
  "existingData['Photo Reference'] = fileId;\n    existingData['Photo'] = fileId;"
);

fs.writeFileSync('src/server/google.ts', code);
