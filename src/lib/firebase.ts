import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

// Firebase configuration for LOCALOS AI / Qorbiq AI
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "localos-ai-prod-saas.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "localos-ai-prod-saas",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "localos-ai-prod-saas.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "625748049908",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:625748049908:web:bd232258d7cd85150803a1"
};

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let appCheck: AppCheck | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // App Check configuration
    if (typeof window !== 'undefined') {
      const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (appCheckSiteKey) {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true
        });
      } else if (import.meta.env.DEV) {
        // Allow App Check debug token in local development mode
        // @ts-expect-error self.FIREBASE_APPCHECK_DEBUG_TOKEN is used for local testing
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
    }
  } catch (error) {
    console.warn('[Firebase] Initialization error:', error);
  }
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');

export { app, auth, db, storage, appCheck };
