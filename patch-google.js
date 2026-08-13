import fs from 'fs';

let content = fs.readFileSync('src/server/google.ts', 'utf-8');

// Replace getOrganizationByAdminEmail
const startEmail = content.indexOf('async getOrganizationByAdminEmail');
const endEmail = content.indexOf('async getOrganizationById');

// Replace getOrganizationById
const startId = content.indexOf('async getOrganizationById');
const endId = content.indexOf('async getForms');

const newCode = `  async _getAllOrganizations() {
    if (!MASTER_SHEET_ID) throw new Error('MASTER_SPREADSHEET_ID missing in .env');
    const sheets = getSheets();
    let rangeToUse = 'Organizations!A:K';
    
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
      const sheetTitles = meta.data.sheets?.map(s => s.properties?.title) || [];
      if (!sheetTitles.includes('Organizations') && sheetTitles.includes('Sheet1')) {
        rangeToUse = 'Sheet1!A:K';
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: MASTER_SHEET_ID,
        range: rangeToUse,
      });
      safeLog('ReadMaster', 'Spreadsheet', MASTER_SHEET_ID, 200, true);
      
      const rows = response.data.values || [];
      if (rows.length < 1) return [];
      
      const headers = rows[0].map(h => h.trim());
      const orgIdIdx = headers.indexOf('organizationId');
      const nameIdx = headers.indexOf('organizationName');
      const emailIdx = headers.indexOf('adminEmail');
      const spreadsheetIdx = headers.indexOf('spreadsheetId');
      const driveIdx = headers.indexOf('driveFolderId');
      const maxUsersIdx = headers.indexOf('maxUsers');
      const maxFormsIdx = headers.indexOf('maxForms');
      const maxTemplatesIdx = headers.indexOf('maxTemplates');
      const maxStorageIdx = headers.indexOf('maxStorageGB');
      
      const orgs = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[orgIdIdx]) continue;
        orgs.push({
          organizationId: row[orgIdIdx],
          organizationName: row[nameIdx],
          admin: row[emailIdx],
          googleSpreadsheetId: row[spreadsheetIdx],
          googleDriveFolderId: row[driveIdx],
          maxUsers: parseInt(row[maxUsersIdx] || '0', 10),
          maxForms: parseInt(row[maxFormsIdx] || '0', 10),
          maxTemplates: parseInt(row[maxTemplatesIdx] || '0', 10),
          maxStorageGB: parseInt(row[maxStorageIdx] || '0', 10),
          status: 'ACTIVE'
        });
      }
      return orgs;
    } catch (error) {
      const status = error.code || error.status || 'UNKNOWN';
      safeLog('ReadMaster', 'Spreadsheet', MASTER_SHEET_ID, status, false);
      if (status === 404 || status === 400) throw new Error('MASTER_SHEET_NOT_FOUND');
      if (status === 403 || status === 401) throw new Error('MASTER_SHEET_PERMISSION_DENIED');
      throw error;
    }
  },

  async getOrganizationByAdminEmail(email: string) {
    const orgs = await this._getAllOrganizations();
    const foundOrg = orgs.find(o => o.admin === email);
    if (!foundOrg) throw new Error('ORGANIZATION_NOT_FOUND');

    const sheets = getSheets();
    const drive = getDrive();

    try {
      await sheets.spreadsheets.get({ spreadsheetId: foundOrg.googleSpreadsheetId });
      safeLog('TestOrgSheet', 'Spreadsheet', foundOrg.googleSpreadsheetId, 200, true);
    } catch (error: any) {
      const status = error.code || error.status || 'UNKNOWN';
      safeLog('TestOrgSheet', 'Spreadsheet', foundOrg.googleSpreadsheetId, status, false);
      if (status === 404) throw new Error('ORGANIZATION_SHEET_NOT_FOUND');
      if (status === 403 || status === 401) throw new Error('ORGANIZATION_SHEET_PERMISSION_DENIED');
      throw error;
    }

    try {
      // Extract valid folder ID if it's a URL
      let cleanFolderId = foundOrg.googleDriveFolderId;
      if (cleanFolderId.includes('folders/')) {
        cleanFolderId = cleanFolderId.match(/folders\\/([a-zA-Z0-9-_]+)/)?.[1] || cleanFolderId;
      } else if (cleanFolderId.includes('id=')) {
        cleanFolderId = cleanFolderId.match(/id=([a-zA-Z0-9-_]+)/)?.[1] || cleanFolderId;
      } else {
        // Fallback for messy URLs like 143l8g37ABUoZUx_aIHTea_F1RQGnp3ll?usp=drive_link
        const match = cleanFolderId.match(/^([a-zA-Z0-9-_]+)(\\?|$)/);
        if (match) cleanFolderId = match[1];
      }
      foundOrg.googleDriveFolderId = cleanFolderId;

      await drive.files.get({ fileId: cleanFolderId, fields: 'id' });
      safeLog('TestOrgDrive', 'DriveFolder', cleanFolderId, 200, true);
    } catch (error: any) {
      const status = error.code || error.status || 'UNKNOWN';
      safeLog('TestOrgDrive', 'DriveFolder', foundOrg.googleDriveFolderId, status, false);
      if (status === 404) throw new Error('DRIVE_FOLDER_NOT_FOUND');
      if (status === 403 || status === 401) throw new Error('DRIVE_FOLDER_PERMISSION_DENIED');
      throw error;
    }

    return foundOrg;
  },

  async getOrganizationById(orgId: string) {
    const orgs = await this._getAllOrganizations();
    const foundOrg = orgs.find(o => o.organizationId === orgId);
    if (!foundOrg) throw new Error('ORGANIZATION_NOT_FOUND');
    
    // Extract valid folder ID if it's a URL
    let cleanFolderId = foundOrg.googleDriveFolderId;
    if (cleanFolderId.includes('folders/')) {
      cleanFolderId = cleanFolderId.match(/folders\\/([a-zA-Z0-9-_]+)/)?.[1] || cleanFolderId;
    } else if (cleanFolderId.includes('id=')) {
      cleanFolderId = cleanFolderId.match(/id=([a-zA-Z0-9-_]+)/)?.[1] || cleanFolderId;
    } else {
      const match = cleanFolderId.match(/^([a-zA-Z0-9-_]+)(\\?|$)/);
      if (match) cleanFolderId = match[1];
    }
    foundOrg.googleDriveFolderId = cleanFolderId;
    
    return foundOrg;
  },

`;

content = content.substring(0, startEmail) + newCode + content.substring(endId);

// Need to fix regex escaping in the string above since I am using template literals inside a node script
content = content.replace(/folders\\\\/g, 'folders/');

fs.writeFileSync('src/server/google.ts', content);
console.log('google.ts patched!');
