"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Search, Settings, Store,
  Users, BarChart3, MessageSquare, LogOut, Layers, Boxes, ClipboardList, ShieldCheck,
} from "lucide-react";
import type { MerchantPermission } from "@/lib/merchant-permissions";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
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

const menuItems: { href: string; label: string; icon: any; permission?: MerchantPermission }[] = [
  { href: "/merchant-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/merchant-dashboard/store", label: "متجري", icon: Store, permission: "store" },
  { href: "/merchant-dashboard/inventory", label: "المخزون", icon: Boxes, permission: "inventory" },
  { href: "/merchant-dashboard/orders", label: "الطلبات", icon: ClipboardList, permission: "orders" },
  { href: "/merchant-dashboard/customers", label: "العملاء", icon: Users, permission: "customers" },
  { href: "/merchant-dashboard/reports", label: "التقارير", icon: BarChart3, permission: "reports" },
  { href: "/merchant-dashboard/messages", label: "الرسائل", icon: MessageSquare },
  { href: "/merchant-dashboard/content", label: "محتوى السوشال ميديا", icon: Layers, permission: "content" },
];

export default function MerchantDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile, loading } = useUser();
  const auth = useAuth();

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

  const [profileTimedOut, setProfileTimedOut] = useState(false);
  useEffect(() => {
    if (!authUser || userProfile) { setProfileTimedOut(false); return; }
    const t = setTimeout(() => setProfileTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [authUser, userProfile]);

  if (loading || (authUser && !userProfile && !profileTimedOut)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {platformLogo
            ? <img src={platformLogo} alt="شعار" className="h-16 w-16 object-contain animate-pulse" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Logo className="h-16 w-16 animate-pulse" />}
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || authUser?.displayName || 'تاجر';
  const displayEmail = userProfile?.email || authUser?.email || '';

  const isStaff = (userProfile as any)?.role === 'merchant_staff';
  const isStaffAdmin = isStaff && (userProfile as any)?.merchantRole === 'admin';
  const staffPermissions: string[] = isStaff ? ((userProfile as any)?.permissions || []) : [];
  const visibleMenuItems = menuItems.filter(item => {
    if (!isStaff || isStaffAdmin) return true;
    if (!item.permission) return true;
    return staffPermissions.includes(item.permission);
  });

  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        <SidebarHeader className="border-b border-sidebar-border/70">
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-primary/10">
              {platformLogo
                ? <Image src={platformLogo} alt="شعار" width={32} height={32} className="h-full w-full object-contain" />
                : <Logo className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">EmpowerHub</span>
              <span className="text-xs text-muted-foreground">لوحة التاجر</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          <SidebarMenu className="gap-0.5">
            {visibleMenuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/merchant-dashboard' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className="h-9 rounded-lg text-sidebar-foreground"
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
        <SidebarFooter className="border-t border-sidebar-border/70 p-3 gap-1">
          {!isStaff && (
            <SidebarMenuButton asChild tooltip="الفريق والصلاحيات" className="h-9 rounded-lg text-sidebar-foreground">
              <Link href="/merchant-dashboard/team"><ShieldCheck /><span>الفريق والصلاحيات</span></Link>
            </SidebarMenuButton>
          )}
          <SidebarMenuButton asChild tooltip="الإعدادات" className="h-9 rounded-lg text-sidebar-foreground">
            <Link href="/merchant-dashboard/settings"><Settings /><span>الإعدادات</span></Link>
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
            <button onClick={handleLogout} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" title="تسجيل الخروج">
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
              <Input type="search" placeholder="بحث..." className="pr-9 bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 h-9 w-full rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MessageBell href="/merchant-dashboard/messages" />
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
                    <DropdownMenuItem onSelect={() => router.push('/merchant-dashboard/settings')} className="text-right cursor-pointer">الملف الشخصي</DropdownMenuItem>
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
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-background min-h-0" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
