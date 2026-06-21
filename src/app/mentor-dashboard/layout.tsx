"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, LayoutGrid, Settings, Users,
  MessageSquare, Calendar, BarChart3, LogOut, ShoppingBag, ChevronRight,
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";

const allMentorMenuItems = [
  { href: "/mentor-dashboard", label: "الرئيسية", icon: LayoutGrid, sectionKey: null },
  { href: "/mentor-dashboard/my-beneficiaries", label: "المستفيدون", icon: Users, sectionKey: 'my_beneficiaries' },
  { href: "/mentor-dashboard/sessions", label: "الجلسات", icon: Calendar, sectionKey: 'sessions' },
  { href: "/mentor-dashboard/orders", label: "الطلبات", icon: ShoppingBag, sectionKey: 'orders' },
  { href: "/mentor-dashboard/analytics", label: "التحليلات", icon: BarChart3, sectionKey: 'analytics' },
  { href: "/mentor-dashboard/messages", label: "الرسائل", icon: MessageSquare, sectionKey: 'messages' },
  { href: "/mentor-dashboard/invitations", label: "الدعوات", icon: Bell, sectionKey: 'invitations' },
];

export default function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();
  const auth = useAuth();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState(allMentorMenuItems);
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
        if (platformData.config?.dashboardSections?.mentor) {
          const sections = platformData.config.dashboardSections.mentor;
          setMenuItems(allMentorMenuItems.filter(item => item.sectionKey === null || sections[item.sectionKey] !== false));
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
    const hex = organization.primaryColor.replace(/^#/, '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
    l = (cmax + cmin) / 2;
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - cmax - cmin) : delta / (cmax + cmin);
      if (cmax === r) h = (g - b) / delta + (g < b ? 6 : 0);
      else if (cmax === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h = Math.round(h * 60);
    }
    if (h < 0) h += 360;
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`);
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

  const displayName = userProfile?.name || authUser?.displayName || 'مرشد';
  const displayEmail = userProfile?.email || authUser?.email || '';
  const logoSrc = platformLogo || organization?.logoUrl;

  const currentPage = menuItems.find(item =>
    item.href === pathname || (item.href !== '/mentor-dashboard' && pathname.startsWith(item.href))
  );

  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        {/* Workspace Header */}
        <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-sidebar-accent">
              {logoSrc
                ? <img src={logoSrc} alt="logo" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-accent-foreground truncate leading-tight">
                {organization?.name || 'EmpowerHub'}
              </span>
              <span className="text-[10px] text-sidebar-foreground leading-tight opacity-60">لوحة المرشد</span>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-1.5 py-2">
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/mentor-dashboard' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className="h-9 text-sm font-medium rounded-md"
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
          <SidebarMenuButton asChild tooltip="الإعدادات" className="h-9 text-sm font-medium rounded-md">
            <Link href="/mentor-dashboard/settings">
              <Settings className="h-4 w-4" />
              <span>الإعدادات</span>
            </Link>
          </SidebarMenuButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground font-bold">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0 text-right">
                  <span className="text-xs font-semibold text-sidebar-accent-foreground truncate leading-tight">{displayName}</span>
                  <span className="text-[10px] text-sidebar-foreground truncate leading-tight opacity-60">{displayEmail}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground opacity-40 shrink-0 group-hover:opacity-80 transition-opacity" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" side="top" align="end">
              <div className="px-2 py-2">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/mentor-dashboard/settings')}>
                <Settings className="h-4 w-4 ml-2" />الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {authUser ? (
                <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 ml-2" />تسجيل الخروج
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')} className="cursor-pointer">تسجيل الدخول</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-12 items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-4 lg:px-5 sticky top-0 z-30">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="hidden sm:block text-xs text-muted-foreground/50">المرشد</span>
            {currentPage && currentPage.href !== '/mentor-dashboard' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 opacity-30 hidden sm:block" />
                <span className="text-xs font-medium text-foreground truncate">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <MessageBell href="/mentor-dashboard/messages" />
            <NotificationBell />
            <Button
              variant="ghost"
              className="h-8 w-8 rounded-full p-0 ml-1"
              onClick={() => router.push('/mentor-dashboard/settings')}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
                <AvatarFallback className="text-xs font-bold">{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-5 lg:p-7 bg-background" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
