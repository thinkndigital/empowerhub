"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Search, Settings, Users, BarChart3,
  BookOpen, Store, MessageSquare, GraduationCap, ClipboardList, LogOut, Briefcase, Video, Quote, ClipboardCheck, Inbox,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarFooter, SidebarInset, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { usePlatformBrand } from "@/components/platform-brand-provider";
import { useUser } from "@/firebase/auth/use-user";
import { useAuth } from "@/firebase/provider";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { applyOrgColor } from "@/lib/apply-org-color";
import { applyPlatformColor } from "@/lib/platform-color";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const allMenuItems: { href: string; label: string; labelKey: TranslationKey; icon: any; sectionKey: string | null }[] = [
  { href: "/organization-dashboard",                 label: "لوحة التحكم",        labelKey: "dashboard.navDashboard",          icon: LayoutGrid,    sectionKey: null },
  { href: "/organization-dashboard/beneficiaries",   label: "المستفيدون",         labelKey: "dashboard.navBeneficiaries",      icon: Users,         sectionKey: 'beneficiaries' },
  { href: "/organization-dashboard/team",            label: "فريق العمل",         labelKey: "dashboard.navTeam",               icon: Users,         sectionKey: 'team' },
  { href: "/organization-dashboard/mentors",         label: "المرشدون",           labelKey: "dashboard.navMentors",            icon: Users,         sectionKey: 'mentors' },
  { href: "/organization-dashboard/coaches",         label: "المدربون",           labelKey: "dashboard.navCoaches",            icon: GraduationCap, sectionKey: 'coaches' },
  { href: "/organization-dashboard/courses",         label: "الدورات",            labelKey: "dashboard.navCourses",            icon: BookOpen,      sectionKey: 'courses' },
  { href: "/organization-dashboard/live-sessions",   label: "الجلسات المباشرة",   labelKey: "dashboard.navLiveSessions",       icon: Video,         sectionKey: null },
  { href: "/organization-dashboard/projects",        label: "المشاريع",           labelKey: "dashboard.navProjects",           icon: Briefcase,     sectionKey: 'projects' },
  { href: "/organization-dashboard/stores",          label: "المتاجر",            labelKey: "dashboard.navStores",             icon: Store,         sectionKey: 'stores' },
  { href: "/organization-dashboard/orders",          label: "الطلبات",            labelKey: "dashboard.navOrders",             icon: ClipboardList, sectionKey: 'orders' },
  { href: "/organization-dashboard/reports",         label: "التقارير",           labelKey: "dashboard.navReports",            icon: BarChart3,     sectionKey: 'reports' },
  { href: "/organization-dashboard/assessments",     label: "نماذج التقييم",     labelKey: "dashboard.navAssessments",        icon: ClipboardCheck, sectionKey: null },
  { href: "/organization-dashboard/success-stories", label: "قصص النجاح",        labelKey: "dashboard.navSuccessStories",     icon: Quote,         sectionKey: null },
  { href: "/organization-dashboard/beneficiary-requests", label: "طلبات المستفيدين", labelKey: "dashboard.navBeneficiaryRequests", icon: Inbox,   sectionKey: null },
  { href: "/organization-dashboard/messages",        label: "الرسائل",            labelKey: "dashboard.navMessages",           icon: MessageSquare, sectionKey: 'messages' },
];

export default function OrganizationDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile } = useUser();
  const auth = useAuth();
  const { lang, dir, t } = useLanguage();
  const [orgName, setOrgName] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState(allMenuItems);
  const { logoUrl: platformLogo } = usePlatformBrand();

  const fetchOrg = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const [orgRes, profileRes, platformRes] = await Promise.all([
        fetch('/api/org/settings', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/public/platform-config'),
      ]);
      const orgData = await orgRes.json();
      if (orgData.org?.name) setOrgName(orgData.org.name);
      if (orgData.org?.logoUrl) setOrgLogo(orgData.org.logoUrl);
      if (orgData.org?.primaryColor) applyOrgColor(orgData.org.primaryColor);
      else applyPlatformColor();
      const profileData = await profileRes.json();
      if (profileData.profile?.avatarUrl) setAvatarUrl(profileData.profile.avatarUrl);
      const platformData = await platformRes.json();
      if (platformData.config?.dashboardSections?.organization) {
        const sections = platformData.config.dashboardSections.organization;
        setMenuItems(allMenuItems.filter(item => item.sectionKey === null || sections[item.sectionKey] !== false));
      }
    } catch { /* silent */ }
  }, [authUser]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  useEffect(() => {
    window.addEventListener('org-settings-change', fetchOrg);
    return () => window.removeEventListener('org-settings-change', fetchOrg);
  }, [fetchOrg]);

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

  const displayName = userProfile?.name || authUser?.displayName || t('dashboard.roleManager');
  const displayEmail = userProfile?.email || authUser?.email || '';
  const logoSrc = orgLogo || platformLogo;

  const isActive = (href: string) =>
    href === '/organization-dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <SidebarProvider dir={dir}>
      <Sidebar side={lang === 'ar' ? 'right' : 'left'}>
        {/* ── Sidebar Header ── */}
        <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-sidebar-accent/80">
              {logoSrc
                ? <img src={logoSrc} alt="logo" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-accent-foreground truncate leading-tight">{orgName || 'EmpowerHub'}</span>
              <span className="text-[11px] text-sidebar-foreground/70 leading-tight mt-0.5">{t('dashboard.subtitleOrganization')}</span>
            </div>
          </div>
        </SidebarHeader>

        {/* ── Nav ── */}
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

        {/* ── Footer ── */}
        <SidebarFooter className="border-t border-sidebar-border/60 p-3 space-y-1">
          <SidebarMenuButton
            asChild
            isActive={isActive('/organization-dashboard/settings')}
            tooltip={t('dashboard.settings')}
            className="rounded-xl h-10 px-3 gap-3 text-sm font-medium transition-colors hover:bg-sidebar-accent/40"
          >
            <Link href="/organization-dashboard/settings">
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
        {/* ── Top Header ── */}
        <header className="flex h-16 items-center gap-3 border-b border-border/70 bg-card px-4 lg:px-6 sticky top-0 z-30">
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
            <MessageBell href="/organization-dashboard/messages" />
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
                <DropdownMenuItem className="text-right cursor-pointer rounded-lg gap-2" onSelect={() => router.push('/organization-dashboard/settings')}>
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
