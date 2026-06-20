import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'studio-4511819966-bc14f.firebasestorage.app';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-4511819966-bc14f';

  // If a service account key is explicitly provided (local dev), use it
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({ credential: cert(serviceAccount), projectId, storageBucket: STORAGE_BUCKET });
  }

  // On Firebase App Hosting / Google Cloud: Application Default Credentials
  // are automatically available — no service account key needed
  return initializeApp({ projectId, storageBucket: STORAGE_BUCKET });
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
