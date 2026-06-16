'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

export function initializeFirebaseSDKs() {
  const firebaseApp: FirebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

  const auth: Auth = getAuth(firebaseApp);

  let firestore: Firestore | null = null;
  try {
    // Use initializeFirestore with explicit settings for better mobile compatibility
    firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e: any) {
    // Already initialized (e.g. hot reload) — get the existing instance
    try {
      const { getFirestore } = require('firebase/firestore');
      firestore = getFirestore(firebaseApp);
    } catch {
      console.warn('Firestore unavailable:', e?.message);
    }
  }

  let storage: FirebaseStorage | null = null;
  try {
    storage = getStorage(firebaseApp);
  } catch (e) {
    console.warn('Firebase Storage is not available.');
  }

  return { firebaseApp, auth, firestore, storage };
}
