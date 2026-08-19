import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signInWithCredential, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { User, Role } from '../types';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    });

    const handleNativeAuth = async (event: Event) => {
      if (!window.ReactNativeWebView) return;
      
      // Security: Only process native bridge events if running on the intended origin or localhost for testing
      const isTrustedOrigin = window.location.origin === 'https://idsphere-three.vercel.app' || 
                              window.location.hostname === 'localhost' || 
                              window.location.hostname.includes('run.app');
                              
      if (!isTrustedOrigin) return;

      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      
      if (!detail || typeof detail.idToken !== 'string' || detail.idToken.trim() === '') {
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(detail.idToken);
        await signInWithCredential(auth, credential);
      } catch (error) {
        // Do not expose token in error messages
        console.error('Native authentication failed.');
      }
    };

    window.addEventListener('NATIVE_GOOGLE_AUTH', handleNativeAuth);

    return () => {
      unsubscribe();
      window.removeEventListener('NATIVE_GOOGLE_AUTH', handleNativeAuth);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_GOOGLE' }));
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      if (e.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked. Please allow popups for this site and try again.');
      }
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        throw new Error('Google authorization was cancelled.');
      }
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
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
