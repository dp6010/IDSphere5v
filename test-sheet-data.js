import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const RAW_ID = process.env.MASTER_SPREADSHEET_ID;
let ID = RAW_ID;
if (RAW_ID.includes('/spreadsheets/d/')) {
  ID = RAW_ID.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)[1];
}

async function test() {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: ID, range: 'Sheet1!A:J' });
    console.log('Data:', res.data.values);
  } catch (e) {
    console.error('API Error:', e.message);
  }
}
test();
