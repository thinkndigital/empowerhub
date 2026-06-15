import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-4511819966-bc14f';

  // Use service account if available, otherwise use application default credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({ credential: cert(serviceAccount), projectId });
  }

  // Fallback: initialize with just projectId (works in Firebase Studio / emulator)
  return initializeApp({ projectId });
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
