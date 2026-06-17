'use client';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';

export type OrgGroup = {
  id: string;
  name: string;
  orgId: string;
  memberIds: string[];
};

export function useOrgGroups() {
  const { user, userProfile } = useUser();
  const [data, setData] = useState<OrgGroup[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/org/groups`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json.groups || []);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile?.organizationId]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, isLoading, refetch: fetch_ };
}
