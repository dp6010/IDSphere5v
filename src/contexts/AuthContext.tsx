import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  requireGoogleFormsAccess: () => Promise<string>;
  googleAccessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let activeAuthPromise: Promise<string> | null = null;
let currentToken: string | null = null; // Global tracker for closure safety

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  
  // Single-flight promise for Google Auth to prevent popup-blocked / cancelled errors


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // In a complete implementation, this would fetch the user's role from Google Sheets/backend
        // For the MVP foundation, we assign a default structure to satisfy the type.
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          // Temporarily mock role so routing foundation can be tested
          role: (firebaseUser.email?.includes('admin') ? 'SUPER_ADMIN' : 'ORG_ADMIN') as Role,
        };
        setUser(appUser);
      } else {
        setUser(null);
        setGoogleAccessToken(null);
        currentToken = null;
    currentToken = null;
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

    const signInWithGoogle = async () => {
    await requireGoogleFormsAccess();
  };

    const requireGoogleFormsAccess = async () => {
    if (googleAccessToken) return googleAccessToken;
    if (currentToken) return currentToken;
    
    if (activeAuthPromise) {
      return await activeAuthPromise;
    }
    
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/forms.body');
    provider.addScope('https://www.googleapis.com/auth/drive');
    provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
    provider.setCustomParameters({ prompt: 'consent' });

    const promise = signInWithPopup(auth, provider).then(result => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        currentToken = credential.accessToken;
        return credential.accessToken;
      }
      throw new Error('Failed to obtain Google authorization.');
    }).catch(e => {
      if (e.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked. Please allow popups for this site and try again.');
      }
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        throw new Error('Google authorization was cancelled.');
      }
      throw e;
    }).finally(() => {
      activeAuthPromise = null;
    });
    
    activeAuthPromise = promise;
    return await promise;
  };

  const logout = async () => {
    await signOut(auth);
    setGoogleAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, requireGoogleFormsAccess, googleAccessToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
