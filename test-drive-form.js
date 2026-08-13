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

const drive = google.drive({ version: 'v3', auth });
const formsAPI = google.forms({ version: 'v1', auth });

async function test() {
  try {
    // Try creating a form using Drive API instead of Forms API, directly inside the shared folder
    console.log('Creating form via Drive API...');
    const res = await drive.files.create({
      requestBody: {
        name: 'Test Drive Form',
        mimeType: 'application/vnd.google-apps.form',
        parents: ['143l8g37ABUoZUx_aIHTea_F1RQGnp3ll']
      },
      fields: 'id,webViewLink'
    });
    console.log('Form created via Drive:', res.data.id);
    
    // Now use Forms API to get/update it
    console.log('Getting form details via Forms API...');
    const formRes = await formsAPI.forms.get({ formId: res.data.id });
    console.log('Form responderUri:', formRes.data.responderUri);
    
    console.log('Adding questions...');
    await formsAPI.forms.batchUpdate({
      formId: res.data.id,
      requestBody: {
        requests: [
          { createItem: { item: { title: 'Full Name', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } }, location: { index: 0 } } },
        ]
      }
    });
    console.log('Questions added successfully!');

  } catch (e) {
    console.error('API Error:', e.message);
  }
}
test();
