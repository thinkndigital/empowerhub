"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Search, Settings, Users, BarChart3,
  BookOpen, Store, MessageSquare, GraduationCap, ClipboardList,
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
  { href: "/organization-dashboard/messages", label: "الرسائل", icon: MessageSquare, sectionKey: 'messages' },
];

export default function OrganizationDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile } = useUser();
  const auth = useAuth();
  const [orgName, setOrgName] = useState("منظمتي");
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
      if (orgData.settings?.name) setOrgName(orgData.settings.name);
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

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

  const displayName = userProfile?.name || authUser?.displayName || 'مدير';
  const displayEmail = userProfile?.email || authUser?.email || '';

  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex flex-col items-center text-center gap-2 p-2">
            {platformLogo ? (
              <img src={platformLogo} alt="logo" className="h-16 w-16 object-contain rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : <Logo className="h-16 w-16" />}
            <span className="text-lg font-semibold">{orgName}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2 text-center text-sm bg-primary/10 mx-2 rounded-md border border-primary/20">
            <p className="font-semibold text-primary">لوحة تحكم المنظمة</p>
          </div>
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
        <SidebarFooter>
          <SidebarMenuButton asChild tooltip="الإعدادات">
            <Link href="/organization-dashboard/settings"><Settings /><span>الإعدادات</span></Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger />
          <div className="w-full flex-1">
            <form><div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="بحث..." className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3" />
            </div></form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/organization-dashboard/messages"><MessageSquare className="h-4 w-4" /><span className="sr-only">الرسائل</span></Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar><AvatarImage src={avatarUrl || userProfile?.avatarUrl} alt={displayName} /><AvatarFallback>{displayName.charAt(0)}</AvatarFallback></Avatar>
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
              <DropdownMenuItem onSelect={handleLogout} className="text-right">تسجيل الخروج</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
