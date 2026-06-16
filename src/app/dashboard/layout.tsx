"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  LayoutGrid,
  Search,
  Settings,
  Store,
  Users,
  BarChart3,
  ChevronDown,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useMemo } from "react";
import { useAuth } from "@/firebase/provider";

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
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/dashboard/training", label: "التدريب", icon: BookOpen },
  { href: "/dashboard/mentorship", label: "الإرشاد", icon: Users },
  { href: "/dashboard/my-store", label: "متجري", icon: Store },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/messages", label: "الرسائل", icon: MessageSquare },
  { href: "/dashboard/contact", label: "التواصل مع المنظمة", icon: HelpCircle },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-beneficiary',
    name: 'مستفيد تجريبي',
    email: 'beneficiary@example.com',
    role: 'beneficiary',
    avatarUrl: `https://picsum.photos/seed/demo-beneficiary/40/40`,
  }), []);

  const userProfile = (authUser && realUserProfile) ? realUserProfile : demoUserProfile;

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

  const displayName = userProfile.name || 'مستفيد';
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
          <SidebarMenuButton asChild tooltip="الإعدادات">
             <Link href="/dashboard/settings">
                <Settings />
                <span>الإعدادات</span>
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
              <Link href="/dashboard/messages">
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
                  <DropdownMenuItem className="text-right">الفواتير</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">الإعدادات</DropdownMenuItem>
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
