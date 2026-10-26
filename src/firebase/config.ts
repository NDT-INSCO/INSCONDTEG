import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-inscointeractive-2ab74c2d-acdd-4fa3-a16b-53ea46221179',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'ai-studio-inscointeractive-2ab74c2d-acdd-4fa3-a16b-53ea46221179.firebaseapp.com',
  apiKey: env.VITE_FIREBASE_API_KEY,
};

/**
 * Auth is only initialised when an API key is actually configured. Calling
 * `getAuth` without one throws `auth/invalid-api-key` and prints a console error
 * on every page load, which made a production build look broken.
 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.info('Firebase unavailable — local storage only:', err);
  }
}

export { app, db, auth };
