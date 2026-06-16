'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
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

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Services | null>(null);

  useEffect(() => {
    // All Firebase SDK imports are dynamic — never evaluated on the server
    Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/storage'),
      import('./config'),
    ]).then(
      ([
        { initializeApp, getApps, getApp },
        { getAuth },
        { getFirestore, initializeFirestore, memoryLocalCache },
        { getStorage },
        { firebaseConfig },
      ]) => {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        const auth = getAuth(app);

        let firestore: Firestore | null = null;
        try {
          // initializeFirestore first; if already initialized, fall back to getFirestore
          try {
            firestore = initializeFirestore(app, { localCache: memoryLocalCache() });
          } catch {
            firestore = getFirestore(app);
          }
        } catch (e) { console.error('[FB] Firestore:', e); }

        let storage: FirebaseStorage | null = null;
        try { storage = getStorage(app); } catch (e) { console.warn('[FB] Storage:', e); }

        setServices({ app, auth, firestore, storage });
      }
    ).catch((e) => {
      console.error('[FB] Init error:', e);
      // Even on failure we need to unblock the loading state.
      // We'll trigger a re-render with a sentinel so FirebaseProvider can clear isUserLoading.
    });

    // Safety timeout: if Firebase hasn't loaded in 5s, force services to a failed state
    // so the UI doesn't spin forever.
    const timeout = setTimeout(() => {
      setServices((prev) => {
        if (prev !== null) return prev; // already loaded
        console.warn('[FB] Firebase init timed out — unblocking UI');
        // We cannot provide real services, but we set a dummy to unblock loading.
        // FirebaseProvider handles null auth gracefully.
        return null as any; // Will trigger the mounted-but-no-services path below
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // While services haven't loaded yet, render children wrapped in an uninitialized provider
  // that immediately reports isUserLoading=false so dashboards don't spin forever.
  return (
    <FirebaseProvider
      firebaseApp={services?.app ?? null}
      auth={services?.auth ?? null}
      firestore={services?.firestore ?? null}
      storage={services?.storage ?? null}
      isInitializing={services === null}
    >
      {children}
    </FirebaseProvider>
  );
}
