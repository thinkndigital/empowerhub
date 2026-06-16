'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { FirebaseProvider } from '@/firebase/provider';

// This module is ONLY loaded on the client (wrapped in next/dynamic ssr:false).
// Static imports here are safe — they never run on the server.

interface Services {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Services | null>(null);
  const [isSDKLoading, setIsSDKLoading] = useState(true);

  useEffect(() => {
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);

      let firestore: Firestore | null = null;
      try {
        firestore = getFirestore(app);
      } catch (e) {
        console.error('[FB] Firestore init failed:', e);
      }

      let storage: FirebaseStorage | null = null;
      try {
        storage = getStorage(app);
      } catch (e) {
        console.warn('[FB] Storage init failed:', e);
      }

      setServices({ app, auth, firestore, storage });
    } catch (e) {
      console.error('[FB] Firebase init failed:', e);
    } finally {
      setIsSDKLoading(false);
    }
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={services?.app ?? null}
      auth={services?.auth ?? null}
      firestore={services?.firestore ?? null}
      storage={services?.storage ?? null}
      isInitializing={isSDKLoading}
    >
      {children}
    </FirebaseProvider>
  );
}
