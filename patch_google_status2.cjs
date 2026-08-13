const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const oldMethod = `  async updateRegistrationStatus(orgId: string, registrationId: string, newStatus: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:H',
    });
    
    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === registrationId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Registration not found');
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: org.googleSpreadsheetId,
      range: \`Registrations!D\${rowIndex}:D\${rowIndex}\`,
      valueInputOption: 'RAW',
      requestBody: { values: [[newStatus]] }
    });
    
    return { success: true, newStatus };
  },`;

const newMethod = `  async updateRegistrationStatus(orgId: string, registrationId: string, newStatus: string, validFrom?: string, validTill?: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:H',
    });
    
    const rows = response.data.values || [];
    let rowIndex = -1;
    let existingRow = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === registrationId) {
        rowIndex = i + 1;
        existingRow = rows[i];
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Registration not found');
    
    const eCol = existingRow[4] || '';
    const fCol = existingRow[5] || '';
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: org.googleSpreadsheetId,
      range: \`Registrations!D\${rowIndex}:H\${rowIndex}\`,
      valueInputOption: 'RAW',
      requestBody: { values: [[newStatus, eCol, fCol, validFrom || '', validTill || '']] }
    });
    
    return { success: true, newStatus, validFrom, validTill };
  },`;

code = code.replace(oldMethod, newMethod);
fs.writeFileSync('src/server/google.ts', code);
