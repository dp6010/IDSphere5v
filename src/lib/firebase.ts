import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
export const googleProvider = new GoogleAuthProvider();

// Scopes required for Phase 1+ interactions with Google Drive & Sheets
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
