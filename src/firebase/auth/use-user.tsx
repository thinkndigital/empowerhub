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

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { isUserLoading: contextUserLoading } = useFirebaseState();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Subscribe to auth state changes
  useEffect(() => {
    if (!auth) {
      // Auth not ready yet — wait for it (contextUserLoading tracks this)
      if (!contextUserLoading) {
        // Firebase finished initializing but no auth available
        setUser(null);
        setAuthChecked(true);
      }
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setAuthChecked(true);
      if (!authUser) {
        setUserProfile(null);
        setProfileLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth, contextUserLoading]);

  // Subscribe to Firestore profile once auth is confirmed
  useEffect(() => {
    if (!authChecked) return;

    if (!user || !firestore) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // If Firestore doc is missing organizationId, pull from token claims
          if (!data.organizationId) {
            try {
              const tokenResult = await user.getIdTokenResult();
              if (tokenResult.claims.organizationId) {
                data.organizationId = tokenResult.claims.organizationId as string;
              }
            } catch {}
          }
          setUserProfile({ id: snapshot.id, ...data } as UserProfile);
        } else {
          // Doc doesn't exist — build minimal profile from token claims
          try {
            const tokenResult = await user.getIdTokenResult();
            const claims = tokenResult.claims;
            if (claims.role) {
              setUserProfile({
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || '',
                email: user.email || '',
                role: claims.role as string,
                organizationId: claims.organizationId as string | undefined,
              } as UserProfile);
            } else {
              setUserProfile(null);
            }
          } catch {
            setUserProfile(null);
          }
        }
        setProfileLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
        setProfileLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user, firestore, authChecked]);

  // Overall loading: true only while we haven't yet determined auth state,
  // OR while we're loading the Firestore profile for a logged-in user.
  const loading = contextUserLoading || !authChecked || profileLoading;

  return { user, userProfile, loading };
}
