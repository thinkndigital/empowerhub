'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/firebase/auth/use-user';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link: string;
}

export function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>الإشعارات</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-6">
              تحديد الكل كمقروء
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
              onClick={() => {
                if (notification.link) window.location.href = notification.link;
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{notification.title}</span>
                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2">{notification.body}</span>
              <span className="text-xs text-muted-foreground">
                {(() => {
                  try {
                    const d = new Date(notification.createdAt);
                    if (isNaN(d.getTime())) return '';
                    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
                  } catch { return ''; }
                })()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
