const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const ensureIndex = code.indexOf('  async ensureRegistrationsTab');
if (ensureIndex === -1) throw new Error('ensureRegistrationsTab not found');

const newMethods = `async ensureRegistrationsTab(spreadsheetId: string) {
    const sheets = getSheets();
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetTitles = meta.data.sheets?.map(s => s.properties?.title) || [];
      
      if (!sheetTitles.includes('Registrations')) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: 'Registrations' } } }] }
        });
        
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Registrations!A1:E1',
          valueInputOption: 'RAW',
          requestBody: { values: [['responseId', 'formId', 'submittedAt', 'status', 'data']] }
        });
      } else {
        // check for migration
        const existingRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Registrations!A:I',
        });
        const rows = existingRes.data.values || [];
        if (rows.length > 0 && rows[0].length >= 4 && rows[0][3] === 'fullName') {
          console.log('[Migration] Migrating old Registrations tab to new format...');
          const newRows = [];
          newRows.push(['responseId', 'formId', 'submittedAt', 'status', 'data']); // new headers
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const responseId = row[0] || '';
            const formId = row[1] || '';
            const submittedAt = row[2] || '';
            const fullName = row[3] || '';
            const dateOfBirth = row[4] || '';
            const address = row[5] || '';
            const phoneNumber = row[6] || '';
            const photo = row[7] || '';
            const status = row[8] || 'PENDING';
            
            const dataObj = {};
            if (fullName) dataObj['Full Name'] = fullName;
            if (dateOfBirth) dataObj['Date of Birth'] = dateOfBirth;
            if (address) dataObj['Address'] = address;
            if (phoneNumber) dataObj['Phone Number'] = phoneNumber;
            if (photo) dataObj['Photo'] = photo;
            
            newRows.push([
              responseId,
              formId,
              submittedAt,
              status,
              JSON.stringify(dataObj)
            ]);
          }
          
          // Clear old data
          await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Registrations!A:I'
          });
          
          // Write new data
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: \`Registrations!A1:E\${newRows.length}\`,
            valueInputOption: 'RAW',
            requestBody: { values: newRows }
          });
          console.log('[Migration] Migration complete.');
        }
      }
    } catch (e: any) {
      console.error('Failed to ensure Registrations tab:', e);
      throw e;
    }
  },

  async syncRegistrations(orgId: string, userAccessToken: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    const forms = await this.getForms(orgId);
    
    if (!userAccessToken) {
      throw new Error('GOOGLE_FORMS_RESPONSE_PERMISSION_DENIED: Google authorization required to synchronize registrations.');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: userAccessToken });
    const formsAPI = google.forms({ version: 'v1', auth: oauth2Client });
    
    await this.ensureRegistrationsTab(org.googleSpreadsheetId);
    
    const sheets = getSheets();
    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:E',
    });
    const existingRows = existingRes.data.values || [];
    const existingMap = new Map();
    for (let i = 1; i < existingRows.length; i++) {
      existingMap.set(existingRows[i][0], { rowIndex: i + 1, data: existingRows[i] });
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const form of forms) {
      if (!form.formId) continue;
      try {
        const formDetails = await formsAPI.forms.get({ formId: form.formId });
        const questions = formDetails.data.items || [];
        const questionMap = questions.reduce((acc: any, item: any) => {
          if (item.questionItem && item.questionItem.question) {
            acc[item.questionItem.question.questionId] = item.title;
          }
          return acc;
        }, {});

        const res = await formsAPI.forms.responses.list({ formId: form.formId });
        console.log(\`[Forms Response Diagnostic]\\nOperation: forms.responses.list\\nForm ID: ***\${form.formId.slice(-4)}\\nCredential Type: GOOGLE_OAUTH\\nOAuth Token Present: \${!!userAccessToken}\\nHTTP Status: \${res.status}\\nSuccess: true\`);
        const responses = res.data.responses || [];
        
        for (const r of responses) {
          const customData: Record<string, string> = {};

          if (r.answers) {
            for (const [questionId, answer] of Object.entries(r.answers)) {
              const questionTitle = questionMap[questionId] || questionId;
              if (answer.fileUploadAnswers && answer.fileUploadAnswers.answers) {
                const fileId = answer.fileUploadAnswers.answers[0]?.fileId;
                if (fileId) {
                  customData[questionTitle] = fileId;
                }
              } else if (answer.textAnswers && answer.textAnswers.answers) {
                const value = answer.textAnswers.answers[0]?.value || '';
                customData[questionTitle] = value;
              }
            }
          }
          
          const responseId = r.responseId;
          const dataJson = JSON.stringify(customData);
          const newRowData = [
            responseId,
            form.formId,
            r.createTime,
            'PENDING', // status
            dataJson
          ];
          
          if (existingMap.has(responseId)) {
            const existing = existingMap.get(responseId);
            const changed = existing.data[4] !== dataJson;
            if (changed) {
              newRowData[3] = existing.data[3] || 'PENDING'; // preserve existing status
              await sheets.spreadsheets.values.update({
                spreadsheetId: org.googleSpreadsheetId,
                range: \`Registrations!A\${existing.rowIndex}:E\${existing.rowIndex}\`,
                valueInputOption: 'RAW',
                requestBody: { values: [newRowData] }
              });
              updated++;
            } else {
              skipped++;
            }
          } else {
            await sheets.spreadsheets.values.append({
              spreadsheetId: org.googleSpreadsheetId,
              range: 'Registrations!A:E',
              valueInputOption: 'RAW',
              requestBody: { values: [newRowData] }
            });
            added++;
            existingMap.set(responseId, { data: newRowData }); 
          }
        }
      } catch (e: any) {
        console.error(\`[Forms Response Diagnostic]\\nOperation: forms.responses.list\\nForm ID: ***\${form.formId.slice(-4)}\\nCredential Type: GOOGLE_OAUTH\\nOAuth Token Present: \${!!userAccessToken}\\nHTTP Status: \${e.status || e.code || 500}\\nSuccess: false\`);
        console.error(\`[Forms Response Error]\\nHTTP Status: \${e.status || e.code || 500}\\nReason: \${e.errors?.[0]?.reason || e.reason || 'UNKNOWN'}\\nMessage: \${e.message || 'Unknown error'}\`);
        if (e.status === 401 || e.status === 403 || e.message?.includes('permission')) {
          throw new Error('GOOGLE_FORMS_RESPONSE_PERMISSION_DENIED: Google authorization does not have permission to read this form\\'s responses. Please reconnect your Google account.');
        }
      }
    }
    
    return { added, updated, skipped };
  },

  async getRegistrations(orgId: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    await this.ensureRegistrationsTab(org.googleSpreadsheetId);
    
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:E',
    });
    
    const rows = response.data.values || [];
    const registrations = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      let submittedData = {};
      try {
        if (row[4]) submittedData = JSON.parse(row[4]);
      } catch (e) {
        submittedData = { error: 'Invalid JSON data format' };
      }
      
      let photoRef = null;
      for (const [key, val] of Object.entries(submittedData)) {
        if (key.toLowerCase() === 'photo') {
          photoRef = val;
          break;
        }
      }
      
      registrations.push({
        registrationId: row[0],
        formId: row[1],
        submittedAt: row[2],
        status: row[3] || 'PENDING',
        submittedData: submittedData,
        photoReference: photoRef
      });
    }
    
    return registrations.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  async updateRegistrationStatus(orgId: string, registrationId: string, newStatus: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:E',
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
  }
};`;

code = code.substring(0, ensureIndex) + newMethods;
fs.writeFileSync('src/server/google.ts', code);
