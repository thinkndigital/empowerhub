'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _initialized = false;

export function initializeFirebaseSDKs() {
  if (_initialized) {
    return { firebaseApp: _app!, auth: _auth!, firestore: _firestore, storage: _storage };
  }

  try {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (e) {
    console.error('[Firebase] initializeApp error:', e);
    return { firebaseApp: null as any, auth: null as any, firestore: null, storage: null };
  }

  try {
    _auth = getAuth(_app);
  } catch (e) {
    console.error('[Firebase] getAuth error:', e);
  }

  try {
    // Try to get existing instance first (in case already initialized)
    _firestore = getFirestore(_app);
  } catch (e) {
    // If not initialized yet, initialize with memoryLocalCache (no IndexedDB needed)
    try {
      _firestore = initializeFirestore(_app, {
        localCache: memoryLocalCache(),
      });
    } catch (e2) {
      console.error('[Firebase] Firestore init error:', e, e2);
    }
  }

  try {
    _storage = getStorage(_app);
  } catch (e) {
    console.warn('[Firebase] Storage init error:', e);
  }

  _initialized = true;
  return { firebaseApp: _app!, auth: _auth!, firestore: _firestore, storage: _storage };
}
