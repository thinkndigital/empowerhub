'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useAuth, useFirestore, useFirebaseState } from '../provider';

export type UserProfile = DocumentData & {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  avatarUrl?: string;
  mentorId?: string;
  coachId?: string;
  expertise?: string;
  progress?: number;
  status?: "نشط" | "غير نشط" | "مكتمل" | "جديد";
  category?: string;
};

function profileFromClaims(user: User, claims: Record<string, any>): UserProfile {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || '',
    email: user.email || '',
    role: claims.role as string | undefined,
    organizationId: claims.organizationId as string | undefined,
  };
}

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { isUserLoading: contextUserLoading } = useFirebaseState();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Subscribe to auth state — immediately read token claims for profile
  useEffect(() => {
    if (!auth) {
      if (!contextUserLoading) {
        setUser(null);
        setAuthChecked(true);
      }
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      setAuthChecked(true);

      if (!authUser) {
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }

      // Immediately build profile from token claims (no Firestore needed)
      setProfileLoading(true);
      try {
        const tokenResult = await authUser.getIdTokenResult();
        const claims = tokenResult.claims;
        if (claims.role) {
          setUserProfile(profileFromClaims(authUser, claims));
        }
      } catch {
        // token read failed — will try Firestore below
      }
      setProfileLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth, contextUserLoading]);

  // Also subscribe to Firestore for richer profile data (name, avatarUrl, etc.)
  useEffect(() => {
    if (!authChecked || !user || !firestore) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Merge with token claims for organizationId if missing in doc
          if (!data.organizationId) {
            try {
              const tokenResult = await user.getIdTokenResult();
              if (tokenResult.claims.organizationId) {
                data.organizationId = tokenResult.claims.organizationId as string;
              }
            } catch {}
          }
          setUserProfile({ id: snapshot.id, ...data } as UserProfile);
        }
        // If doc doesn't exist, keep the claims-based profile already set
      },
      () => {
        // Firestore error — keep claims-based profile, don't clear it
      }
    );

    return () => unsubscribeProfile();
  }, [user, firestore, authChecked]);

  const loading = contextUserLoading || !authChecked || profileLoading;

  return { user, userProfile, loading };
}
