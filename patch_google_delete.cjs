const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const newFunctions = `
  async deleteForm(orgId: string, formId: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    const sheets = getSheets();

    // Find row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Forms!A:A',
    });
    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === formId) {
        rowIndex = i; // 0-indexed for batchUpdate
        break;
      }
    }
    if (rowIndex === -1) throw new Error('Form not found in spreadsheet');

    // Get sheetId
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: org.googleSpreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'Forms');
    if (!sheet || sheet.properties?.sheetId === undefined) throw new Error('Forms tab not found');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: org.googleSpreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });
    
    // Invalidate cache
    delete formsCache[orgId];
  },

  async deleteRegistration(orgId: string, registrationId: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    const sheets = getSheets();

    // Find row to get photoReference before deleting
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:F',
    });
    const rows = response.data.values || [];
    let rowIndex = -1;
    let photoReference = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === registrationId) {
        rowIndex = i; // 0-indexed for batchUpdate
        
        try {
          if (rows[i][4]) {
            const data = JSON.parse(rows[i][4]);
            for (const [key, val] of Object.entries(data)) {
               if (key.toLowerCase() === 'photo') {
                 photoReference = val;
                 break;
               }
            }
          }
        } catch(e) {}
        break;
      }
    }
    if (rowIndex === -1) throw new Error('Registration not found');

    // Get sheetId
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: org.googleSpreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'Registrations');
    if (!sheet || sheet.properties?.sheetId === undefined) throw new Error('Registrations tab not found');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: org.googleSpreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });
    
    // Attempt to delete photo from Drive if it exists
    if (photoReference) {
      try {
        const drive = getDrive();
        await drive.files.delete({ fileId: photoReference });
      } catch (e) {
        console.error('Failed to delete photo from Drive:', e);
      }
    }
  },
`;

code = code.replace("  async updateForm(orgId: string, formId: string, name: string, customFields: string[]) {", newFunctions + "\n  async updateForm(orgId: string, formId: string, name: string, customFields: string[]) {");

fs.writeFileSync('src/server/google.ts', code);
