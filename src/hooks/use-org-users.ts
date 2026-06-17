'use client';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';

export type OrgUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  avatarUrl?: string;
  expertise?: string;
  status?: string;
  progress?: number;
  groupId?: string;
};

export function useOrgUsers(role: 'beneficiary' | 'mentor' | 'coach', scope: 'org' | 'all') {
  const { user } = useUser();
  const [data, setData] = useState<OrgUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/org/users?role=${role}&scope=${scope}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.users);
    } catch (e: any) {
      setError(e.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, scope]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, isLoading, error, refetch: fetch_ };
}
