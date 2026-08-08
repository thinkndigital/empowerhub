"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Search, Settings, MessageSquare,
  BookOpen, Calendar, TrendingUp, ShoppingBag, ClipboardList, LogOut, ClipboardCheck, Layers, Users, Boxes,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useState, useEffect, useCallback } from "react";
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger,
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
import { applyPlatformColor } from "@/lib/platform-color";

const allMenuItems = [
  { href: "/beneficiary-dashboard",              label: "لوحة التحكم",    icon: LayoutGrid,    sectionKey: null },
  { href: "/beneficiary-dashboard/progress",     label: "تقدمي",          icon: TrendingUp,    sectionKey: 'progress' },
  { href: "/beneficiary-dashboard/courses",      label: "دوراتي",         icon: BookOpen,      sectionKey: 'courses' },
  { href: "/beneficiary-dashboard/sessions",     label: "جلساتي",         icon: Calendar,      sectionKey: 'sessions' },
  { href: "/beneficiary-dashboard/messages",     label: "الرسائل",        icon: MessageSquare, sectionKey: 'messages' },
  { href: "/beneficiary-dashboard/store",        label: "متجري",          icon: ShoppingBag,   sectionKey: 'store' },
  { href: "/beneficiary-dashboard/inventory",    label: "المخزون",        icon: Boxes,         sectionKey: 'store' },
  { href: "/beneficiary-dashboard/orders",       label: "طلباتي",         icon: ClipboardList, sectionKey: 'orders' },
  { href: "/beneficiary-dashboard/customers",    label: "العملاء",        icon: Users,         sectionKey: 'customers' },
  { href: "/beneficiary-dashboard/assessments",  label: "نماذج التقييم", icon: ClipboardCheck, sectionKey: null },
  { href: "/beneficiary-dashboard/content",      label: "المحتوى",        icon: Layers,        sectionKey: null },
];

export default function BeneficiaryDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile } = useUser();
  const auth = useAuth();

  const displayName = userProfile?.name || authUser?.displayName || 'مستفيد';
  const displayEmail = userProfile?.email || authUser?.email || '';

  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState(allMenuItems);
  const { logoUrl: platformLogo } = usePlatformBrand();

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const [profileRes, platformRes] = await Promise.all([
        fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/public/platform-config'),
      ]);
      const j = await profileRes.json();
      if (j.profile?.avatarUrl) setAvatarUrl(j.profile.avatarUrl);
      const platformData = await platformRes.json();
      if (platformData.config?.dashboardSections?.beneficiary) {
        const sections = platformData.config.dashboardSections.beneficiary;
        setMenuItems(allMenuItems.filter(item => item.sectionKey === null || sections[item.sectionKey] !== false));
      }
      applyPlatformColor();
    } catch { /* silent */ }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === '/beneficiary-dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-sidebar-accent/80">
              {platformLogo
                ? <img src={platformLogo} alt="logo" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-accent-foreground truncate leading-tight">EmpowerHub</span>
              <span className="text-[11px] text-sidebar-foreground/70 leading-tight mt-0.5">لوحة تحكم المستفيد</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                    className="rounded-xl h-10 px-3 gap-3 text-sm font-medium transition-colors hover:bg-sidebar-accent/40"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
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
            isActive={isActive('/beneficiary-dashboard/settings')}
            tooltip="الإعدادات"
            className="rounded-xl h-10 px-3 gap-3 text-sm font-medium transition-colors hover:bg-sidebar-accent/40"
          >
            <Link href="/beneficiary-dashboard/settings">
              <Settings className="h-4 w-4 shrink-0" />
              <span>الإعدادات</span>
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
              title="تسجيل الخروج"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="h-8 w-8 rounded-xl shrink-0" />
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                type="search"
                placeholder="بحث..."
                className="pr-9 h-9 text-sm bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="mr-auto flex items-center gap-1">
            <ThemeToggle />
            <MessageBell href="/beneficiary-dashboard/messages" />
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
                <DropdownMenuItem onSelect={() => router.push('/beneficiary-dashboard/settings')} className="text-right cursor-pointer rounded-lg gap-2">
                  <Settings className="h-4 w-4" />الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-right cursor-pointer rounded-lg gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="h-4 w-4" />تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-background" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
