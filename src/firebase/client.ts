'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

export function initializeFirebaseSDKs() {
  const firebaseApp: FirebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

  const auth: Auth = getAuth(firebaseApp);

  let firestore: Firestore | null = null;
  try {
    firestore = getFirestore(firebaseApp);
  } catch (e) {
    console.warn('Firestore unavailable:', e);
  }

  let storage: FirebaseStorage | null = null;
  try {
    storage = getStorage(firebaseApp);
  } catch (e) {
    console.warn('Storage unavailable:', e);
  }

  return { firebaseApp, auth, firestore, storage };
}
