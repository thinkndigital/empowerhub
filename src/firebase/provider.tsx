'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  /** True while the client-side Firebase SDK is still being imported */
  isInitializing?: boolean;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Default context value used before any FirebaseProvider mounts (e.g. during SSR
// or before the dynamic import resolves on the client).
const defaultContextValue: FirebaseContextState = {
  firebaseApp: null,
  firestore: null,
  auth: null,
  storage: null,
  user: null,
  isUserLoading: true,
  userError: null,
};

// React Context — defaults to the no-op state so hooks never throw
// even when used before the provider mounts.
export const FirebaseContext =
  createContext<FirebaseContextState>(defaultContextValue);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
  isInitializing = false,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // always start as loading until auth is confirmed
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      if (!isInitializing) {
        // Firebase is done loading but no auth service — treat as logged out
        setUserAuthState({ user: null, isUserLoading: false, userError: null });
      }
      // If still initializing, keep isUserLoading=true and wait
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null });

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({
          user: firebaseUser,
          isUserLoading: false,
          userError: null,
        });
      },
      (error) => {
        console.error('FirebaseProvider: onAuthStateChanged error:', error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // Safety: if onAuthStateChanged hasn't fired within 4 seconds, unblock UI
    const timeout = setTimeout(() => {
      setUserAuthState((prev) => {
        if (!prev.isUserLoading) return prev;
        console.warn('[FB] onAuthStateChanged timed out — unblocking UI');
        return { user: null, isUserLoading: false, userError: null };
      });
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [auth, isInitializing]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      storage,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

function useFirebaseContext() {
  return useContext(FirebaseContext);
}

/** Hook to access Firebase Auth instance. Returns null if not ready yet. */
export const useAuth = (): Auth | null => {
    const { auth } = useFirebaseContext();
    return auth || null;
};

/** Hook to access Firestore instance. It may be null if the service is unavailable. */
export const useFirestore = (): Firestore | null => useFirebaseContext().firestore;

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp | null => {
    const { firebaseApp } = useFirebaseContext();
    return firebaseApp || null;
};

/** Hook to access Firebase Storage instance. It may be null if the service is unavailable. */
export const useStorage = (): FirebaseStorage | null => useFirebaseContext().storage;

/** Hook to read the full Firebase context including loading state. */
export const useFirebaseState = (): FirebaseContextState => useFirebaseContext();

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(
  factory: () => T,
  deps: DependencyList
): T | MemoFirebase<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}
