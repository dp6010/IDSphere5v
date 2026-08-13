import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/forms.body'
  ],
});

const formsAPI = google.forms({ version: 'v1', auth });

async function test() {
  try {
    console.log('Creating form...');
    const createRes = await formsAPI.forms.create({
      requestBody: {
        info: {
          title: 'Diagnostic Test Form',
          documentTitle: 'Diagnostic Test Form'
        }
      }
    });
    console.log('Form created:', createRes.data.formId);
  } catch (e) {
    console.error('API Error:', JSON.stringify(e.response?.data, null, 2));
  }
}
test();
