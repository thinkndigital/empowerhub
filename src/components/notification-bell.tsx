'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellRing, CheckCheck, MessageSquare, Calendar, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const TYPE_ICON: Record<string, React.ReactNode> = {
  message: <MessageSquare className="h-4 w-4 text-blue-500" />,
  session: <Calendar className="h-4 w-4 text-green-500" />,
  course: <BookOpen className="h-4 w-4 text-amber-500" />,
  default: <Star className="h-4 w-4 text-primary" />,
};

function timeAgo(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
  } catch { return ''; }
}

export function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const prevUnread = useRef(0);
  const [shake, setShake] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list: Notification[] = data.notifications || [];
        const newUnread = list.filter(n => !n.read).length;
        if (newUnread > prevUnread.current && prevUnread.current >= 0) {
          setShake(true);
          setTimeout(() => setShake(false), 600);
        }
        prevUnread.current = newUnread;
        setNotifications(list);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      const token = await user.getIdToken();
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch { /* silent */ }
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    prevUnread.current = 0;
    try {
      const token = await user.getIdToken();
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch { /* silent */ }
  }, [user]);

  // Opening the panel counts as "seen" — clear the unread badge shortly
  // after, rather than requiring every item to be clicked individually.
  useEffect(() => {
    if (!open) return;
    fetchNotifications();
    const t = setTimeout(markAllRead, 1500);
    return () => clearTimeout(t);
  }, [open, fetchNotifications, markAllRead]);

  const handleClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.link) window.location.href = notification.link;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative transition-transform ${shake ? 'animate-bounce' : ''}`}
        >
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs pointer-events-none"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b" dir="rtl">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="secondary" className="mr-2 text-xs">{unreadCount} جديد</Badge>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              تحديد الكل
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[420px]">
          {loading ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 border-b animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Bell className="h-8 w-8 opacity-20" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.slice(0, 20).map(notification => (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b hover:bg-accent/50 transition-colors text-right ${!notification.read ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}`}
              >
                <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notification.read ? 'bg-primary/10' : 'bg-muted'}`}>
                  {TYPE_ICON[notification.type] || TYPE_ICON.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  {notification.body && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notification.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-4 py-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => { setOpen(false); window.location.href = '/messages'; }}
              >
                عرض كل الرسائل
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
