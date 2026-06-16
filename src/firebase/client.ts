'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _initialized = false;

export function initializeFirebaseSDKs() {
  // Only run in browser environment — Firebase client SDK requires browser APIs
  if (typeof window === 'undefined') {
    return { firebaseApp: null as any, auth: null as any, firestore: null, storage: null };
  }

  if (_initialized) {
    return { firebaseApp: _app!, auth: _auth!, firestore: _firestore, storage: _storage };
  }

  try {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    _auth = getAuth(_app);

    try {
      _firestore = getFirestore(_app);
    } catch (e) {
      console.error('[Firebase] Firestore init error:', e);
    }

    try {
      _storage = getStorage(_app);
    } catch (e) {
      console.warn('[Firebase] Storage init error:', e);
    }

    _initialized = true;
  } catch (e) {
    console.error('[Firebase] App init error:', e);
  }

  return { firebaseApp: _app!, auth: _auth!, firestore: _firestore, storage: _storage };
}
