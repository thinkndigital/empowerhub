'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize at module level so it's ready before any React component mounts
let _app: FirebaseApp;
let _auth: Auth;
let _firestore: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureInitialized() {
  if (_app) return;

  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _auth = getAuth(_app);

  try {
    _firestore = getFirestore(_app);
  } catch (e) {
    console.warn('[Firebase] Firestore init failed:', e);
  }

  try {
    _storage = getStorage(_app);
  } catch (e) {
    console.warn('[Firebase] Storage init failed:', e);
  }
}

export function initializeFirebaseSDKs() {
  ensureInitialized();
  return {
    firebaseApp: _app,
    auth: _auth,
    firestore: _firestore,
    storage: _storage,
  };
}
