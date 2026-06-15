"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Search,
  Settings,
  Users,
  Building,
  Shield,
  BarChartHorizontal,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useMemo } from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/admin-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/admin-dashboard/organizations", label: "المنظمات", icon: Building },
  { href: "/admin-dashboard/users", label: "المستخدمون", icon: Users },
  { href: "/admin-dashboard/mentors", label: "المرشدون", icon: Users },
  { href: "/admin-dashboard/courses", label: "الدورات", icon: BookOpen },
  { href: "/admin-dashboard/analytics", label: "تحليلات المنصة", icon: BarChartHorizontal },
  { href: "/admin-dashboard/messages", label: "الرسائل", icon: MessageSquare },
];


export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-admin',
    name: 'مشرف تجريبي',
    email: 'admin@example.com',
    role: 'admin',
    avatarUrl: `https://picsum.photos/seed/demo-admin/40/40`,
  }), []);

  const userProfile = authUser ? realUserProfile : demoUserProfile;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile) { // A safeguard for when real user exists but profile is still loading or in demo mode
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile.name || 'مستخدم';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">EmpowerHub</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2 text-center text-sm bg-primary/10 mx-2 rounded-md border border-primary/20">
             <p className="font-semibold text-primary">لوحة تحكم المشرف</p>
           </div>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
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
          <SidebarMenuButton asChild tooltip="إعدادات النظام">
             <Link href="/admin-dashboard/settings">
                <Settings />
                <span>إعدادات النظام</span>
             </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/admin-dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar>
                   <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal text-right">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               {authUser ? (
                <>
                  <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">إعدادات النظام</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-right">
                    تسجيل الخروج
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">
                    تسجيل الدخول
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
