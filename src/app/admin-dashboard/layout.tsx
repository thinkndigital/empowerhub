"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Search, Settings, Users, Building,
  Shield, BarChartHorizontal, BookOpen, MessageSquare, LogOut,
  Video, GraduationCap, FileText, Briefcase, Store, Quote, Layout,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useMemo } from "react";
import { useAuth } from "@/firebase/provider";

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
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";
import { ThemeToggle } from "@/components/theme-toggle";

const menuItems = [
  { href: "/admin-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/admin-dashboard/organizations", label: "الجهات المسجلة", icon: Building },
  { href: "/admin-dashboard/users", label: "المستخدمون", icon: Users },
  { href: "/admin-dashboard/mentors", label: "المرشدون", icon: Users },
  { href: "/admin-dashboard/coaches", label: "المدربون", icon: GraduationCap },
  { href: "/admin-dashboard/courses", label: "الدورات", icon: BookOpen },
  { href: "/admin-dashboard/live-sessions", label: "الجلسات المباشرة", icon: Video },
  { href: "/admin-dashboard/articles", label: "المقالات", icon: FileText },
  { href: "/admin-dashboard/projects", label: "المشاريع والفرص", icon: Briefcase },
  { href: "/admin-dashboard/stores", label: "المتاجر والمنتجات", icon: Store },
  { href: "/admin-dashboard/success-stories", label: "قصص النجاح", icon: Quote },
  { href: "/admin-dashboard/analytics", label: "تحليلات المنصة", icon: BarChartHorizontal },
  { href: "/admin-dashboard/messages", label: "الرسائل", icon: MessageSquare },
  { href: "/admin-dashboard/homepage", label: "محرر الموقع", icon: Layout },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();
  const auth = useAuth();
  const { logoUrl: platformLogo } = usePlatformBrand();

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-admin',
    name: 'مشرف تجريبي',
    email: 'admin@example.com',
    role: 'admin',
    avatarUrl: `https://picsum.photos/seed/demo-admin/40/40`,
  }), []);

  const userProfile = (authUser && realUserProfile) ? realUserProfile : demoUserProfile;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-16 w-16 animate-pulse" />
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile.name || 'مستخدم';
  const displayEmail = userProfile.email || '';

  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent overflow-hidden">
              {platformLogo
                ? <img src={platformLogo} alt="شعار" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-6 w-6" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">EmpowerHub</span>
              <span className="text-xs text-sidebar-foreground">لوحة تحكم المشرف</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/admin-dashboard' && pathname.startsWith(item.href))}
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
              <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</span>
              <span className="text-xs text-sidebar-foreground truncate">{displayEmail}</span>
            </div>
            {authUser && (
              <button onClick={handleLogout} className="shrink-0 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors" title="تسجيل الخروج">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          <SidebarMenuButton asChild tooltip="إعدادات النظام">
            <Link href="/admin-dashboard/settings"><Settings /><span>إعدادات النظام</span></Link>
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
            <ThemeToggle />
            <MessageBell href="/admin-dashboard/messages" />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
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
                    <DropdownMenuItem className="text-right cursor-pointer" onSelect={() => router.push('/admin-dashboard/settings')}>إعدادات النظام</DropdownMenuItem>
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
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-background" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
