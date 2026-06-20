'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase/auth/use-user';

interface MessageBellProps {
  href: string;
}

export function MessageBell({ href }: MessageBellProps) {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const total = (data.conversations || []).reduce(
          (sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadCount(total);
      }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <div className="relative">
      <Button asChild variant="outline" size="icon" className="h-8 w-8">
        <Link href={href}>
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">الرسائل</span>
        </Link>
      </Button>
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs pointer-events-none z-10"
          variant="destructive"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}
