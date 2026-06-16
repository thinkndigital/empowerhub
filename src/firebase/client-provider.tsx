'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebaseSDKs } from '@/firebase/client';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const firebaseServices = useMemo(() => {
    if (!isClient) return null;
    return initializeFirebaseSDKs();
  }, [isClient]);

  if (!firebaseServices) {
    // Server-side or before hydration — render children without Firebase
    // Firebase hooks will return null gracefully
    return (
      <FirebaseProvider firebaseApp={null as any} auth={null as any} firestore={null} storage={null}>
        {children}
      </FirebaseProvider>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
