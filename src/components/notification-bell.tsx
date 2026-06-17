"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy, doc, writeBatch } from 'firebase/firestore';
import { Bell, BellRing } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Notification = {
    id: string;
    title: string;
    description: string;
    link: string;
    isRead: boolean;
    createdAt: any; // Firestore Timestamp
}

export function NotificationBell() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);

    const notificationsQuery = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return query(
            collection(firestore, "notifications"), 
            where("userId", "==", authUser.uid), 
            orderBy("createdAt", "desc")
        );
    }, [authUser, firestore]);

    const { data: notifications } = useCollection<Notification>(notificationsQuery);

    const unreadCount = useMemo(() => {
        return notifications?.filter(n => !n.isRead).length || 0;
    }, [notifications]);

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open || !notifications || unreadCount === 0 || !firestore) return;

        // Mark all as read when dropdown is closed
        const batch = writeBatch(firestore);
        notifications.forEach(n => {
            if (!n.isRead) {
                const notifRef = doc(firestore, 'notifications', n.id);
                batch.update(notifRef, { isRead: true });
            }
        });
        await batch.commit().catch(console.error);
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 relative">
                    {unreadCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    <span className="sr-only">الإشعارات</span>
                    {unreadCount > 0 && (
                         <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">{unreadCount}</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">الإشعارات</p>
                        {unreadCount > 0 && <Badge>{unreadCount} جديد</Badge>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map(n => (
                         <DropdownMenuItem key={n.id} asChild className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <Link href={n.link || '#'}>
                                <div className='flex justify-between w-full'>
                                    <p className="font-medium">{n.title}</p>
                                    {n.createdAt && <p className='text-xs text-muted-foreground'>{formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: ar })}</p>}
                                </div>
                                <p className="text-xs text-muted-foreground w-full">{n.description}</p>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <DropdownMenuItem className="justify-center" disabled>لا توجد إشعارات</DropdownMenuItem>
                )}
                
                {notifications && notifications.length > 5 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="justify-center text-primary cursor-pointer">
                            <Link href="/notifications">عرض كل الإشعارات</Link>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
