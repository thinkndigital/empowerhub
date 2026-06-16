'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // Dynamically import Firebase ONLY after mounting on the client
    // This guarantees Firebase never runs during SSR
    import('./client').then(({ initializeFirebaseSDKs }) => {
      const s = initializeFirebaseSDKs();
      setServices(s);
    }).catch(err => {
      console.error('[Firebase] Failed to load:', err);
    });
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={services?.firebaseApp ?? (null as any)}
      auth={services?.auth ?? (null as any)}
      firestore={services?.firestore ?? null}
      storage={services?.storage ?? null}
    >
      {children}
    </FirebaseProvider>
  );
}
