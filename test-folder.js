import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function test() {
  try {
    const res = await drive.files.get({
      fileId: '143l8g37ABUoZUx_aIHTea_F1RQGnp3ll',
      fields: '*',
      supportsAllDrives: true
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('API Error:', e.message);
  }
}
test();
