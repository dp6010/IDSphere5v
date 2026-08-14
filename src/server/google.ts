import { google } from 'googleapis';
import { Readable } from 'stream';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// We need a Service Account to interact with Google APIs from the backend.
const getGoogleAuth = () => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials missing in .env');
  }
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/forms.body',
      'https://www.googleapis.com/auth/forms.responses.readonly'
    ],
  });
};

const getSheets = () => google.sheets({ version: 'v4', auth: getGoogleAuth() });
export const getDrive = () => google.drive({ version: 'v3', auth: getGoogleAuth() });

const RAW_MASTER_SHEET_ID = process.env.MASTER_SPREADSHEET_ID || '';

console.log(`[Diagnostic Env Check] MASTER_SPREADSHEET_ID exists: ${!!RAW_MASTER_SHEET_ID}`);
console.log(`[Diagnostic Env Check] Length: ${RAW_MASTER_SHEET_ID.length}`);
console.log(`[Diagnostic Env Check] Starts with http: ${RAW_MASTER_SHEET_ID.toLowerCase().startsWith('http')}`);
console.log(`[Diagnostic Env Check] Contains docs.google.com: ${RAW_MASTER_SHEET_ID.includes('docs.google.com')}`);
console.log(`[Diagnostic Env Check] Contains /spreadsheets/d/: ${RAW_MASTER_SHEET_ID.includes('/spreadsheets/d/')}`);
console.log(`[Diagnostic Env Check] Contains /edit: ${RAW_MASTER_SHEET_ID.includes('/edit')}`);

// Robust extraction to fix the error if a URL is provided
let MASTER_SHEET_ID = RAW_MASTER_SHEET_ID;
if (RAW_MASTER_SHEET_ID.includes('/spreadsheets/d/')) {
  const match = RAW_MASTER_SHEET_ID.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    MASTER_SHEET_ID = match[1];
    console.log(`[Diagnostic Env Check] Extracted raw Spreadsheet ID successfully.`);
  }
}

const maskId = (id: string) => {
  if (!id) return 'UNKNOWN';
  if (id.length < 8) return '***';
  return `${id.substring(0, 4)}***${id.substring(id.length - 4)}`;
};

const safeLog = (operation: string, resourceType: string, id: string, status: number | string, success: boolean) => {
  console.log(`[Diagnostic] Op: ${operation} | Type: ${resourceType} | ID: ${maskId(id)} | Status: ${status} | Success: ${success}`);
};




const ensureRegistrationsCache = new Set<string>();

const folderCache = new Map<string, string>();

let orgsCache: { data: any[], expiresAt: number } | null = null;
let formsCache: Record<string, { data: any[], expiresAt: number }> = {};

export const googleService = {
    async _getAllOrganizations() {
    if (orgsCache && orgsCache.expiresAt > Date.now()) {
      return orgsCache.data;
    }
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
      orgsCache = { data: orgs, expiresAt: Date.now() + 60000 }; // 1 min cache
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

    return foundOrg;
  },

  async getOrganizationById(orgId: string) {
    const orgs = await this._getAllOrganizations();
    const foundOrg = orgs.find(o => o.organizationId === orgId);
    if (!foundOrg) throw new Error('ORGANIZATION_NOT_FOUND');
    
    // Extract valid folder ID if it's a URL
    let cleanFolderId = foundOrg.googleDriveFolderId;
    if (cleanFolderId.includes('folders/')) {
      cleanFolderId = cleanFolderId.match(/folders\/([a-zA-Z0-9-_]+)/)?.[1] || cleanFolderId;
    } else if (cleanFolderId.includes('id=')) {
      cleanFolderId = cleanFolderId.match(/id=([a-zA-Z0-9-_]+)/)?.[1] || cleanFolderId;
    } else {
      const match = cleanFolderId.match(/^([a-zA-Z0-9-_]+)(\?|$)/);
      if (match) cleanFolderId = match[1];
    }
    foundOrg.googleDriveFolderId = cleanFolderId;
    
    return foundOrg;
  },

async getForms(orgId: string) {
    if (formsCache[orgId] && formsCache[orgId].expiresAt > Date.now()) {
      return formsCache[orgId].data;
    }
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('ORGANIZATION_NOT_FOUND');
    const sheets = getSheets();
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: org.googleSpreadsheetId,
        range: 'Forms!A:G',
      });
      safeLog('ReadForms', 'SpreadsheetTab', org.googleSpreadsheetId, 200, true);
      const rows = response.data.values || [];
      const forms = [];
      for (let i = 1; i < rows.length; i++) {
        forms.push({
          formId: rows[i][0],
          name: rows[i][1],
          responderUri: rows[i][2],
          organizationId: rows[i][3],
          status: rows[i][4],
          createdAt: rows[i][5],
          fields: (() => {
            if (!rows[i][6]) return [];
            try {
              const parsed = JSON.parse(rows[i][6]);
              return Array.isArray(parsed) ? parsed : [];
            } catch(e) {
              return [];
            }
          })()
        });
      }
      formsCache[orgId] = { data: forms, expiresAt: Date.now() + 60000 }; // 1 min cache
      return forms;
    } catch (error: any) {
      const status = error.code || error.status || 'UNKNOWN';
      safeLog('ReadForms', 'SpreadsheetTab', org.googleSpreadsheetId, status, false);
      if (status === 400 || status === 404) {
        return []; // Gracefully handle if the Forms tab doesn't exist yet
      }
      throw error;
    }
  },

  async getForm(orgId: string, formId: string) {
    const forms = await this.getForms(orgId);
    return forms.find(f => f.formId === formId) || null;
  },


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
    console.log('[Delete Form Diagnostic] Number of rows fetched: ' + rows.length);
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === formId) {
        rowIndex = i; // 0-indexed for batchUpdate
        break;
      }
    }
    if (rowIndex === -1) {
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
      range: 'Registrations!A:H',
    });
    const rows = response.data.values || [];
    console.log('[Delete Registration Diagnostic] Number of rows fetched: ' + rows.length);
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
    if (rowIndex === -1) {
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
    
    // Attempt to delete photo from Supabase if it exists
    if (photoReference) {
      if (photoReference.startsWith(process.env.SUPABASE_STORAGE_BUCKET || 'student-photos')) {
        try {
          const { supabaseService } = await import('./supabase');
          await supabaseService.deleteFile(photoReference);
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Supabase)');
        } catch (e: any) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Supabase):', e);
          throw new Error('Registration row deleted, but failed to delete photo from Supabase: ' + e.message);
        }
      }
    }
  },

  async updateForm(orgId: string, formId: string, name: string, customFields: string[]) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    const sheets = getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Forms!A:G',
    });
    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === formId) {
        rowIndex = i + 1; // 1-indexed, row 1 is header
        break;
      }
    }
    if (rowIndex === -1) throw new Error('Form not found');

    await sheets.spreadsheets.values.update({
      spreadsheetId: org.googleSpreadsheetId,
      range: `Forms!B${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[name]] }
    });
    
    // G is the 7th column (index 6)
    await sheets.spreadsheets.values.update({
      spreadsheetId: org.googleSpreadsheetId,
      range: `Forms!G${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[JSON.stringify(customFields)]] }
    });

    delete formsCache[orgId];
    return { success: true };
  },

  async createForm(orgId: string, name: string, customFields: string[] = []) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');

    const sheets = getSheets();
    const formId = crypto.randomUUID();
    const responderUri = '';
    const photoEntryId = '';

    // Save reference to Sheet (create tab if missing)
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: org.googleSpreadsheetId,
        range: 'Forms!A:G',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ formId, name, responderUri, orgId, 'ACTIVE', new Date().toISOString(), JSON.stringify(customFields) ]]
        }
      });
    } catch (error: any) {
      console.warn('Could not append to Forms tab, trying to create it first', error.message);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: org.googleSpreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: 'Forms' } } }] }
      });
      await sheets.spreadsheets.values.append({
        spreadsheetId: org.googleSpreadsheetId,
        range: 'Forms!A:G',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ formId, name, responderUri, orgId, 'ACTIVE', new Date().toISOString(), photoEntryId || '' ]]
        }
      });
    }
    return { formId, responderUri, photoEntryId };
  },
  
async ensureRegistrationsTab(spreadsheetId: string) {
    if (ensureRegistrationsCache.has(spreadsheetId)) return;
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
            range: `Registrations!A1:E${newRows.length}`,
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

  async getRegistrations(orgId: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    await this.ensureRegistrationsTab(org.googleSpreadsheetId);
    
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:H',
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
        photoReference: photoRef,
        idEmailSent: row[5] === 'TRUE',
        validFrom: row[6] || null,
        validTill: row[7] || null
      });
    }
    
    return registrations.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  
  async addRegistration(orgId: string, formId: string, customData: Record<string, string>) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    await this.ensureRegistrationsTab(org.googleSpreadsheetId);
    
    const sheets = getSheets();
    const responseId = crypto.randomUUID();
    const dataJson = JSON.stringify(customData);
    const newRowData = [
      responseId,
      formId,
      new Date().toISOString(),
      'PENDING',
      dataJson
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newRowData]
      }
    });
    
    return responseId;
  },

  async updateRegistrationStatus(orgId: string, registrationId: string, newStatus: string, validFrom?: string, validTill?: string) {
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
      range: `Registrations!D${rowIndex}:H${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[newStatus, eCol, fCol, validFrom || '', validTill || '']] }
    });
    
    return { success: true, newStatus, validFrom, validTill };
  },

  
  async updateRegistrationPhoto(orgId: string, registrationId: string, fileId: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: org.googleSpreadsheetId,
      range: 'Registrations!A:H',
    });
    
    const rows = response.data.values || [];
    let rowIndex = -1;
    let existingData = {};
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === registrationId) {
        rowIndex = i + 1;
        try {
          if (rows[i][4]) existingData = JSON.parse(rows[i][4]);
        } catch (e) {}
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Registration not found');
    
    // Set Photo Reference
    existingData['Photo Reference'] = fileId;
    existingData['Photo'] = fileId;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: org.googleSpreadsheetId,
      range: `Registrations!E${rowIndex}:E${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[JSON.stringify(existingData)]] }
    });
    
    return { success: true };
  },

  async getRegistrationPhotoStream(adminEmail: string, orgId: string, registrationId: string, fileId: string) {
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Org not found');
    
    // 1. Verify that the authenticated user is the ORG_ADMIN for that organization.
    if (org.admin !== adminEmail) {
      const err: any = new Error('Forbidden: Organization mismatch');
      err.status = 403;
      throw err;
    }

    // 2. Read the registration
    const registrations = await this.getRegistrations(orgId);
    const reg = registrations.find(r => r.registrationId === registrationId);
    
    if (!reg) {
      const err: any = new Error('Registration not found');
      err.status = 404;
      throw err;
    }

    // 3. Verify that the requested fileId is actually part of this registration's custom data
    const dataValues = Object.values(reg.submittedData || {});
    if (!dataValues.includes(fileId)) {
      const err: any = new Error('Forbidden: File does not belong to this registration');
      err.status = 403;
      throw err;
    }

    // 4. Stream from Google Drive
    const drive = getDrive();
    try {
      const fileMeta = await drive.files.get({ fileId, fields: 'mimeType' });
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
      return {
        mimeType: fileMeta.data.mimeType || 'application/octet-stream',
        stream: response.data as import('stream').Readable
      };
    } catch (e: any) {
      console.error('[Drive API Error]', e.message);
      const err: any = new Error('Failed to retrieve photo from Google Drive');
      err.status = e.status || 500;
      throw err;
    }
  },

  async ensureDriveFolder(drive: any, folderName: string, parentId: string) {
    const cacheKey = `${parentId}_${folderName}`;
    if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);
    
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    if (res.data.files && res.data.files.length > 0) {
      folderCache.set(cacheKey, res.data.files[0].id!);
      return res.data.files[0].id;
    }
    const createRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id'
    });
    folderCache.set(cacheKey, createRes.data.id!);
    return createRes.data.id;
  },

  async uploadStudentPhoto(orgId: string, formId: string, file: any) {
    throw new Error('Student photo upload to Google Drive is deprecated.');
  },

  async markIdEmailSent(orgId: string, registrationId: string) {
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
      range: `Registrations!F${rowIndex}:F${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['TRUE']] }
    });
  }
};
