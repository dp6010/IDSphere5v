const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const targetDeleteForm = `    if (rowIndex === -1) throw new Error('Form not found in spreadsheet');

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
    });`;
    
const replaceDeleteForm = `    if (rowIndex === -1) {
      console.log('[Delete Form Diagnostic] Located Row: false');
      throw new Error('Form not found in spreadsheet');
    }
    console.log('[Delete Form Diagnostic] Located Row: true, Row Index: ' + rowIndex);

    // Get sheetId
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: org.googleSpreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'Forms');
    if (!sheet || sheet.properties?.sheetId === undefined) throw new Error('Forms tab not found');

    console.log('[Delete Form Diagnostic] Delete Request: sent');
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
    });`;

code = code.replace(targetDeleteForm, replaceDeleteForm);


const targetDeleteReg = `    if (rowIndex === -1) throw new Error('Registration not found');

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
    }`;

const replaceDeleteReg = `    if (rowIndex === -1) {
      console.log('[Delete Registration Diagnostic] Located Row: false');
      throw new Error('Registration not found');
    }
    console.log('[Delete Registration Diagnostic] Located Row: true, Row Index: ' + rowIndex);

    // Get sheetId
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: org.googleSpreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'Registrations');
    if (!sheet || sheet.properties?.sheetId === undefined) throw new Error('Registrations tab not found');

    console.log('[Delete Registration Diagnostic] Delete Request: sent');
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
      if (photoReference.startsWith(process.env.SUPABASE_STORAGE_BUCKET || 'student-photos')) {
        try {
          const { supabaseService } = require('./supabase');
          await supabaseService.deleteFile(photoReference);
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Supabase)');
        } catch (e) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Supabase):', e);
        }
      } else {
        try {
          const drive = getDrive();
          await drive.files.delete({ fileId: photoReference });
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Drive)');
        } catch (e) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Drive):', e);
        }
      }
    }`;

code = code.replace(targetDeleteReg, replaceDeleteReg);
fs.writeFileSync('src/server/google.ts', code);
