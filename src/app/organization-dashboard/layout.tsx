"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Settings, Users, BarChart3,
  BookOpen, Store, MessageSquare, GraduationCap, ClipboardList, LogOut, ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
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
import { useAuth } from "@/firebase/provider";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";
import { applyOrgColor } from "@/lib/apply-org-color";

const allMenuItems = [
  { href: "/organization-dashboard", label: "الرئيسية", icon: LayoutGrid, sectionKey: null },
  { href: "/organization-dashboard/beneficiaries", label: "المستفيدون", icon: Users, sectionKey: 'beneficiaries' },
  { href: "/organization-dashboard/team", label: "فريق العمل", icon: Users, sectionKey: 'team' },
  { href: "/organization-dashboard/mentors", label: "المرشدون", icon: GraduationCap, sectionKey: 'mentors' },
  { href: "/organization-dashboard/coaches", label: "المدربون", icon: BookOpen, sectionKey: 'coaches' },
  { href: "/organization-dashboard/courses", label: "الدورات", icon: BookOpen, sectionKey: 'courses' },
  { href: "/organization-dashboard/stores", label: "المتاجر", icon: Store, sectionKey: 'stores' },
  { href: "/organization-dashboard/orders", label: "الطلبات", icon: ClipboardList, sectionKey: 'orders' },
  { href: "/organization-dashboard/reports", label: "التقارير", icon: BarChart3, sectionKey: 'reports' },
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
      if (orgData.org?.primaryColor) applyOrgColor(orgData.org.primaryColor);
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

  const currentPage = menuItems.find(item =>
    item.href === pathname || (item.href !== '/organization-dashboard' && pathname.startsWith(item.href))
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
                {orgName || 'EmpowerHub'}
              </span>
              <span className="text-[10px] text-sidebar-foreground leading-tight opacity-60">لوحة التحكم</span>
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
                  isActive={pathname === item.href || (item.href !== '/organization-dashboard' && pathname.startsWith(item.href))}
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
            <Link href="/organization-dashboard/settings">
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
              <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/organization-dashboard/settings')}>
                <Settings className="h-4 w-4 ml-2" />الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 ml-2" />تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar – minimal chrome */}
        <header className="flex h-12 items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-4 lg:px-5 sticky top-0 z-30">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
            <span className="hidden sm:block text-xs text-muted-foreground/50">لوحة التحكم</span>
            {currentPage && currentPage.href !== '/organization-dashboard' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 opacity-30 hidden sm:block" />
                <span className="text-xs font-medium text-foreground truncate">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <MessageBell href="/organization-dashboard/messages" />
            <NotificationBell />
            <Button
              variant="ghost"
              className="h-8 w-8 rounded-full p-0 ml-1"
              onClick={() => router.push('/organization-dashboard/settings')}
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
