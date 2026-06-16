'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

// Static imports — these register Firebase services as side effects
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

interface Services {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

let _services: Services | null = null;

function getServices(): Services {
  if (_services) return _services;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  let firestore: Firestore | null = null;
  try { firestore = getFirestore(app); } catch (e) { console.error('[FB] Firestore:', e); }

  let storage: FirebaseStorage | null = null;
  try { storage = getStorage(app); } catch (e) { console.warn('[FB] Storage:', e); }

  _services = { app, auth, firestore, storage };
  return _services;
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize only on client after mount
    getServices();
    setReady(true);
  }, []);

  const s = ready ? getServices() : null;

  return (
    <FirebaseProvider
      firebaseApp={s?.app ?? (null as any)}
      auth={s?.auth ?? (null as any)}
      firestore={s?.firestore ?? null}
      storage={s?.storage ?? null}
    >
      {children}
    </FirebaseProvider>
  );
}
