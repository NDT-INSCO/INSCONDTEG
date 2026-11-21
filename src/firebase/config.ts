import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const ADMIN_BOOTSTRAP_EMAIL = 'inscondtco@gmail.com';

export const isFirebaseConfigured = Boolean(
  firebaseConfig?.apiKey &&
    firebaseConfig?.projectId &&
    firebaseConfig.projectId !== 'remixed-project-id'
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.info('Firebase unavailable — local storage only:', err);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  _path: string | null
): never {
  // Diagnostics must not include document IDs, email, phone, or provider payloads.
  const rawCode = (error as { code?: unknown } | null)?.code;
  const code = typeof rawCode === 'string' && /^[a-z-]{1,40}$/.test(rawCode) ? rawCode : 'unknown';
  console.error('Firestore operation failed:', { operationType, code });
  throw Object.assign(new Error(`Firestore ${operationType} failed (${code})`), { code });
}

let connectionTested = false;

export async function testConnection(): Promise<boolean> {
  if (!db || connectionTested) return Boolean(db);
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

export { app, db, auth, firebaseConfig };
