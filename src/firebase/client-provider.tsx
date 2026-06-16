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
        { getFirestore },
        { getStorage },
        { firebaseConfig },
      ]) => {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        const auth = getAuth(app);

        let firestore: Firestore | null = null;
        try { firestore = getFirestore(app); } catch (e) { console.error('[FB] Firestore:', e); }

        let storage: FirebaseStorage | null = null;
        try { storage = getStorage(app); } catch (e) { console.warn('[FB] Storage:', e); }

        setServices({ app, auth, firestore, storage });
      }
    ).catch((e) => console.error('[FB] Init error:', e));
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={services?.app ?? (null as any)}
      auth={services?.auth ?? (null as any)}
      firestore={services?.firestore ?? null}
      storage={services?.storage ?? null}
    >
      {children}
    </FirebaseProvider>
  );
}
