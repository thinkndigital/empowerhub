"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, LayoutGrid, Search, Settings, BookOpen,
  MessageSquare, BarChartHorizontal, CalendarDays, LogOut, ShoppingBag, FileText, Video, ClipboardCheck,
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
import { usePlatformBrand } from "@/components/platform-brand-provider";
import { useUser } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { applyPlatformColor } from "@/lib/platform-color";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const allCoachMenuItems: { href: string; label: string; labelKey: TranslationKey; icon: any; sectionKey: string | null }[] = [
  { href: "/coach-dashboard",              label: "لوحة التحكم",        labelKey: "dashboard.navDashboard",   icon: LayoutGrid,        sectionKey: null },
  { href: "/coach-dashboard/courses",      label: "دوراتي",             labelKey: "dashboard.navMyCourses",   icon: BookOpen,          sectionKey: 'courses' },
  { href: "/coach-dashboard/orders",       label: "الطلبات",            labelKey: "dashboard.navOrders",      icon: ShoppingBag,       sectionKey: 'orders' },
  { href: "/coach-dashboard/sessions",     label: "الجلسات",            labelKey: "dashboard.navSessions",    icon: CalendarDays,      sectionKey: 'sessions' },
  { href: "/coach-dashboard/live-sessions",label: "الجلسات المباشرة",   labelKey: "dashboard.navLiveSessions",icon: Video,             sectionKey: null },
  { href: "/coach-dashboard/articles",     label: "المقالات",           labelKey: "dashboard.navArticles",    icon: FileText,          sectionKey: null },
  { href: "/coach-dashboard/analytics",    label: "التحليلات",          labelKey: "dashboard.navAnalytics",   icon: BarChartHorizontal,sectionKey: 'analytics' },
  { href: "/coach-dashboard/messages",     label: "الرسائل",            labelKey: "dashboard.navMessages",    icon: MessageSquare,     sectionKey: 'messages' },
  { href: "/coach-dashboard/invitations",  label: "الدعوات",            labelKey: "dashboard.navInvitations", icon: Bell,              sectionKey: 'invitations' },
  { href: "/coach-dashboard/assessments",  label: "نماذج التقييم",     labelKey: "dashboard.navAssessments", icon: ClipboardCheck,    sectionKey: null },
];

export default function CoachDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();
  const auth = useAuth();
  const { lang, dir, t } = useLanguage();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState(allCoachMenuItems);
  const { logoUrl: platformLogo } = usePlatformBrand();

  useEffect(() => {
    if (!authUser) return;
    authUser.getIdToken().then(token =>
      Promise.all([
        fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/public/platform-config').then(r => r.json()),
      ]).then(([j, platformData]) => {
        if (j.profile?.avatarUrl) setAvatarUrl(j.profile.avatarUrl);
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

  useEffect(() => { applyPlatformColor(); }, []);

  if (loading || (authUser && !userProfile && !profileTimedOut)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {(platformLogo || organization?.logoUrl)
            ? <img src={platformLogo || organization?.logoUrl} alt="شعار" className="h-16 w-16 object-contain animate-pulse" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Logo className="h-16 w-16 animate-pulse" />}
          <p className="text-muted-foreground text-sm">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || authUser?.displayName || t('dashboard.roleCoach');
  const displayEmail = userProfile?.email || authUser?.email || '';
  const logoSrc = platformLogo || organization?.logoUrl;

  const isActive = (href: string) =>
    href === '/coach-dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <SidebarProvider dir={dir}>
      <Sidebar side={lang === 'ar' ? 'right' : 'left'}>
        <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-sidebar-accent/80">
              {logoSrc
                ? <img src={logoSrc} alt="logo" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-accent-foreground truncate leading-tight">{organization?.name || 'EmpowerHub'}</span>
              <span className="text-[11px] text-sidebar-foreground/70 leading-tight mt-0.5">{t('dashboard.subtitleCoach')}</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              const label = t(item.labelKey);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={label}
                    className="rounded-xl h-10 px-3 gap-3 text-sm font-medium transition-colors hover:bg-sidebar-accent/40"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/60 p-3 space-y-1">
          <SidebarMenuButton
            asChild
            isActive={isActive('/coach-dashboard/settings')}
            tooltip={t('dashboard.settings')}
            className="rounded-xl h-10 px-3 gap-3 text-sm font-medium transition-colors hover:bg-sidebar-accent/40"
          >
            <Link href="/coach-dashboard/settings">
              <Settings className="h-4 w-4 shrink-0" />
              <span>{t('dashboard.settings')}</span>
            </Link>
          </SidebarMenuButton>
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent/60 transition-colors cursor-default mt-1">
            <Avatar className="h-7 w-7 shrink-0 ring-1 ring-sidebar-border">
              <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
              <AvatarFallback className="text-[11px] bg-sidebar-accent text-sidebar-accent-foreground font-semibold">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-sidebar-accent-foreground truncate leading-tight">{displayName}</span>
              <span className="text-[11px] text-sidebar-foreground/70 truncate leading-tight">{displayEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title={t('dashboard.logout')}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center gap-3 border-b border-border/70 bg-card px-4 lg:px-6 sticky top-0 z-30" dir="ltr">
          <SidebarTrigger className="h-8 w-8 rounded-xl shrink-0" />
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                type="search"
                placeholder={t('dashboard.search')}
                className="pr-9 h-9 text-sm bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="mr-auto flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <MessageBell href="/coach-dashboard/messages" />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 hover:bg-muted/60 ml-1">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="text-xs font-semibold">{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal text-right py-2.5 px-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">{displayEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-right cursor-pointer rounded-lg gap-2" onSelect={() => router.push('/coach-dashboard/settings')}>
                  <Settings className="h-4 w-4" />{t('dashboard.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-right cursor-pointer rounded-lg gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="h-4 w-4" />{t('dashboard.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-background" dir={dir}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
