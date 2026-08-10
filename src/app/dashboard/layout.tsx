"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, LayoutGrid, Search, Settings, Store,
  Users, BarChart3, MessageSquare, HelpCircle, LogOut, Layers, Contact, Boxes,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth, useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from "@/firebase/firestore/use-doc";
import Image from "next/image";

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
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const menuItems: { href: string; label: string; labelKey: TranslationKey; icon: any }[] = [
  { href: "/dashboard", label: "لوحة التحكم", labelKey: "dashboard.navDashboard", icon: LayoutGrid },
  { href: "/dashboard/training", label: "التدريب", labelKey: "dashboard.navTraining", icon: BookOpen },
  { href: "/dashboard/mentorship", label: "الإرشاد", labelKey: "dashboard.navMentorship", icon: Users },
  { href: "/dashboard/my-store", label: "متجري", labelKey: "dashboard.navMyStore", icon: Store },
  { href: "/dashboard/inventory", label: "المخزون", labelKey: "dashboard.navInventory", icon: Boxes },
  { href: "/dashboard/customers", label: "العملاء", labelKey: "dashboard.navCustomers", icon: Contact },
  { href: "/dashboard/reports", label: "التقارير", labelKey: "dashboard.navReports", icon: BarChart3 },
  { href: "/dashboard/messages", label: "الرسائل", labelKey: "dashboard.navMessages", icon: MessageSquare },
  { href: "/dashboard/contact", label: "التواصل مع المنظمة", labelKey: "dashboard.navContactOrg", icon: HelpCircle },
  { href: "/dashboard/content", label: "محتوى السوشال ميديا", labelKey: "dashboard.navSocialContent", icon: Layers },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();
  const auth = useAuth();
  const { lang, dir, t } = useLanguage();

  const [avatarUrl, setAvatarUrl] = useState('');
  const { logoUrl: platformLogo } = usePlatformBrand();

  useEffect(() => {
    if (!authUser) return;
    authUser.getIdToken().then(token =>
      fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(j => { if (j.profile?.avatarUrl) setAvatarUrl(j.profile.avatarUrl); })
        .catch(() => {})
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
          {(organization?.logoUrl || platformLogo)
            ? <img src={organization?.logoUrl || platformLogo} alt="شعار" className="h-16 w-16 object-contain animate-pulse" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Logo className="h-16 w-16 animate-pulse" />}
          <p className="text-muted-foreground text-sm">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || authUser?.displayName || t('dashboard.roleBeneficiary');
  const displayEmail = userProfile?.email || authUser?.email || '';

  return (
    <SidebarProvider dir={dir}>
      <Sidebar side={lang === 'ar' ? 'right' : 'left'}>
        <SidebarHeader className="border-b border-sidebar-border/70">
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-primary/10">
              {(organization?.logoUrl || platformLogo)
                ? <Image src={organization?.logoUrl || platformLogo} alt="شعار" width={32} height={32} className="h-full w-full object-contain" />
                : <Logo className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{organization?.name || 'EmpowerHub'}</span>
              <span className="text-xs text-muted-foreground">{t('dashboard.subtitleBeneficiary')}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => {
              const label = t(item.labelKey);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={label}
                    className="h-9 rounded-lg text-sidebar-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/70 p-3 gap-1">
          <SidebarMenuButton asChild tooltip={t('dashboard.settings')} className="h-9 rounded-lg text-sidebar-foreground">
            <Link href="/dashboard/settings"><Settings /><span>{t('dashboard.settings')}</span></Link>
          </SidebarMenuButton>
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition-colors cursor-pointer">
            <Avatar className="h-7 w-7 shrink-0 ring-2 ring-sidebar-border">
              <AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{displayEmail}</span>
            </div>
            <button onClick={handleLogout} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" title={t('dashboard.logout')}>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-3 border-b border-border/70 bg-card px-4 lg:px-6 sticky top-0 z-30" style={{boxShadow:'var(--shadow-xs)'}}>
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="flex-1">
            <div className="relative max-w-xs">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder={t('dashboard.search')} className="pr-9 bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 h-9 w-full rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <MessageBell href="/dashboard/messages" />
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
                    <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')} className="text-right cursor-pointer">{t('dashboard.profile')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout} className="text-right cursor-pointer">{t('dashboard.logout')}</DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">{t('dashboard.login')}</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-background min-h-0" dir={dir}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
