"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, LayoutGrid, Search, Settings, BookOpen,
  MessageSquare, BarChartHorizontal, CalendarDays, LogOut, ShoppingBag, FileText,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useAuth, useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from "@/firebase/firestore/use-doc";

import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarFooter, SidebarInset, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";
import { applyOrgColor } from "@/lib/apply-org-color";

const allCoachMenuItems = [
  { href: "/coach-dashboard", label: "لوحة التحكم", icon: LayoutGrid, sectionKey: null },
  { href: "/coach-dashboard/courses", label: "دوراتي", icon: BookOpen, sectionKey: 'courses' },
  { href: "/coach-dashboard/orders", label: "الطلبات", icon: ShoppingBag, sectionKey: 'orders' },
  { href: "/coach-dashboard/sessions", label: "الجلسات", icon: CalendarDays, sectionKey: 'sessions' },
  { href: "/coach-dashboard/articles", label: "المقالات", icon: FileText, sectionKey: null },
  { href: "/coach-dashboard/analytics", label: "التحليلات", icon: BarChartHorizontal, sectionKey: 'analytics' },
  { href: "/coach-dashboard/messages", label: "الرسائل", icon: MessageSquare, sectionKey: 'messages' },
  { href: "/coach-dashboard/invitations", label: "الدعوات", icon: Bell, sectionKey: 'invitations' },
];

export default function CoachDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();
  const auth = useAuth();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState(allCoachMenuItems);
  const [platformLogo, setPlatformLogo] = useState('');

  useEffect(() => {
    if (!authUser) return;
    authUser.getIdToken().then(token =>
      Promise.all([
        fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/public/platform-config').then(r => r.json()),
      ]).then(([j, platformData]) => {
        if (j.profile?.avatarUrl) setAvatarUrl(j.profile.avatarUrl);
        if (platformData.config?.logoUrl) setPlatformLogo(platformData.config.logoUrl);
        if (platformData.config?.dashboardSections?.coach) {
          const sections = platformData.config.dashboardSections.coach;
          setMenuItems(allCoachMenuItems.filter(item => item.sectionKey === null || sections[item.sectionKey] !== false));
        }
      }).catch(() => {})
    );
  }, [authUser]);

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

  const userProfile = realUserProfile ?? null;
  const firestore = useFirestore();

  const [profileTimedOut, setProfileTimedOut] = useState(false);
  useEffect(() => {
    if (!authUser || userProfile) { setProfileTimedOut(false); return; }
    const t = setTimeout(() => setProfileTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [authUser, userProfile]);

  const orgRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organizationId) return null;
    return doc(firestore, 'organizations', userProfile.organizationId);
  }, [firestore, userProfile?.organizationId]);
  const { data: organization } = useDoc<any>(orgRef);

  useEffect(() => {
    if (!organization?.primaryColor) return;
    applyOrgColor(organization.primaryColor);
  }, [organization?.primaryColor]);

  if (loading || (authUser && !userProfile && !profileTimedOut)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-16 w-16 animate-pulse" />
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || authUser?.displayName || 'مدرب';
  const displayEmail = userProfile?.email || authUser?.email || '';
  const logoSrc = platformLogo || organization?.logoUrl;

  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-sidebar-accent">
              {logoSrc
                ? <img src={logoSrc} alt="logo" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-6 w-6" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-accent-foreground truncate">{organization?.name || 'EmpowerHub'}</span>
              <span className="text-xs text-sidebar-foreground">لوحة تحكم المدرب</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/coach-dashboard' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</span>
              <span className="text-xs text-sidebar-foreground truncate">{displayEmail}</span>
            </div>
            <button onClick={handleLogout} className="shrink-0 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors" title="تسجيل الخروج">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <SidebarMenuButton asChild tooltip="الإعدادات">
            <Link href="/coach-dashboard/settings"><Settings /><span>الإعدادات</span></Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
          <SidebarTrigger />
          <div className="flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="بحث..." className="pr-8 bg-muted/50 border-0 focus-visible:ring-1 h-9 w-full" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <MessageBell href="/coach-dashboard/messages" />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal text-right">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {authUser ? (
                  <>
                    <DropdownMenuItem onSelect={() => router.push('/coach-dashboard/settings')} className="text-right cursor-pointer">الإعدادات</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout} className="text-right cursor-pointer">تسجيل الخروج</DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">تسجيل الدخول</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
