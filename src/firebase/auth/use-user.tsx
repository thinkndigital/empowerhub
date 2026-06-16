'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user || !firestore) {
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user, firestore]);

  return { user, userProfile, loading };
}
