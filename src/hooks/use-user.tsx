'use client';

// Replaces the old Firebase Auth + Firestore profile subscription combo.
// The token lives in localStorage (same trust level as a client-side Firebase
// ID token before); `user.getIdToken()` is kept so the ~80 call sites that
// built an Authorization header from it don't need to change at all.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const TOKEN_KEY = 'empowerhub_token';

export type UserProfile = {
  id: string;
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  organizationId?: string | null;
  avatarUrl?: string;
  displayName?: string;
  mentorId?: string | null;
  coachId?: string | null;
  groupId?: string | null;
  expertise?: string;
  category?: string;
  progress?: number;
  status?: string;
  [key: string]: any;
};

export type AuthUser = {
  uid: string;
  email: string;
  displayName?: string;
  getIdToken: () => Promise<string>;
};

interface AuthContextState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

function makeAuthUser(token: string, profile: UserProfile): AuthUser {
  return {
    uid: profile.uid,
    email: profile.email || '',
    displayName: profile.displayName || profile.name || '',
    getIdToken: async () => getStoredToken() || token,
  };
}

const AuthContext = createContext<AuthContextState>({
  user: null,
  userProfile: null,
  loading: true,
  setToken: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/me', { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('unauthorized');
      const data = await res.json();
      const profile = data.user as UserProfile;
      setUserProfile(profile);
      setUser(makeAuthUser(token, profile));
    } catch {
      clearToken();
      setUser(null);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    loadProfile(token).finally(() => setLoading(false));
  }, [loadProfile]);

  const setToken = useCallback((token: string) => {
    storeToken(token);
    setLoading(true);
    loadProfile(token).finally(() => setLoading(false));
  }, [loadProfile]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setUserProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    await loadProfile(token);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, setToken, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const { user, userProfile, loading } = useContext(AuthContext);
  return { user, userProfile, loading };
}

// Used by login/register/setup pages to store a fresh token and load the
// profile, and by sign-out buttons to clear the session.
export function useAuthActions() {
  const { setToken, logout, refreshProfile } = useContext(AuthContext);
  return { setToken, logout, refreshProfile };
}
