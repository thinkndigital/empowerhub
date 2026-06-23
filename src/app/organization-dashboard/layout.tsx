"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Search, Settings, Users, BarChart3,
  BookOpen, Store, MessageSquare, GraduationCap, ClipboardList, LogOut, Quote, ClipboardCheck,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser } from "@/firebase/auth/use-user";
import { useAuth } from "@/firebase/provider";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";

const allMenuItems = [
  { href: "/organization-dashboard", label: "لوحة التحكم", icon: LayoutGrid, sectionKey: null },
  { href: "/organization-dashboard/beneficiaries", label: "المستفيدون", icon: Users, sectionKey: 'beneficiaries' },
  { href: "/organization-dashboard/team", label: "فريق العمل", icon: Users, sectionKey: 'team' },
  { href: "/organization-dashboard/mentors", label: "المرشدون", icon: Users, sectionKey: 'mentors' },
  { href: "/organization-dashboard/coaches", label: "المدربون", icon: GraduationCap, sectionKey: 'coaches' },
  { href: "/organization-dashboard/courses", label: "الدورات", icon: BookOpen, sectionKey: 'courses' },
  { href: "/organization-dashboard/stores", label: "المتاجر", icon: Store, sectionKey: 'stores' },
  { href: "/organization-dashboard/orders", label: "الطلبات", icon: ClipboardList, sectionKey: 'orders' },
  { href: "/organization-dashboard/reports", label: "التقارير", icon: BarChart3, sectionKey: 'reports' },
  { href: "/organization-dashboard/assessments", label: "نماذج التقييم", icon: ClipboardCheck, sectionKey: null },
  { href: "/organization-dashboard/success-stories", label: "قصص النجاح", icon: Quote, sectionKey: null },
  { href: "/organization-dashboard/messages", label: "الرسائل", icon: MessageSquare, sectionKey: 'messages' },
];

export default function OrganizationDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile } = useUser();
  const auth = useAuth();
  const [orgName, setOrgName] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuItems, setMenuItems] = useState(allMenuItems);
  const [platformLogo, setPlatformLogo] = useState('');

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
      const profileData = await profileRes.json();
      if (profileData.profile?.avatarUrl) setAvatarUrl(profileData.profile.avatarUrl);
      const platformData = await platformRes.json();
      if (platformData.config?.logoUrl) setPlatformLogo(platformData.config.logoUrl);
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

  const displayName = userProfile?.name || authUser?.displayName || 'مدير';
  const displayEmail = userProfile?.email || authUser?.email || '';
  const logoSrc = orgLogo || platformLogo;

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
              <span className="text-sm font-semibold text-sidebar-accent-foreground truncate">{orgName || 'EmpowerHub'}</span>
              <span className="text-xs text-sidebar-foreground">لوحة تحكم المنظمة</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/organization-dashboard' && pathname.startsWith(item.href))}
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
            <Link href="/organization-dashboard/settings"><Settings /><span>الإعدادات</span></Link>
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
            <MessageBell href="/organization-dashboard/messages" />
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
                <DropdownMenuItem className="text-right cursor-pointer" onSelect={() => router.push('/organization-dashboard/settings')}>الإعدادات</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-right cursor-pointer">تسجيل الخروج</DropdownMenuItem>
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
