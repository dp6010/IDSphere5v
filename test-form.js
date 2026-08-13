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
        }
      }
    });
    console.log('Form created:', createRes.data.formId);
    
    console.log('Adding questions...');
    await formsAPI.forms.batchUpdate({
      formId: createRes.data.formId,
      requestBody: {
        requests: [
          { createItem: { item: { title: 'Full Name', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } }, location: { index: 0 } } },
          { createItem: { item: { title: 'Photo', questionItem: { question: { required: true, fileUploadQuestion: { folderId: '143l8g37ABUoZUx_aIHTea_F1RQGnp3ll', types: ['IMAGE'], maxFiles: 1 } } } }, location: { index: 1 } } }
        ]
      }
    });
    console.log('Success!');
  } catch (e) {
    console.error('API Error:', e.message, e.response?.data);
  }
}
test();
