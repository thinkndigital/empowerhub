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
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
        } else {
          setUserProfile(null);
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
