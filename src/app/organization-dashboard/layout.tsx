"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Search,
  Settings,
  Users,
  BarChart3,
  BookOpen,
  Store,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { useMemo } from "react";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { doc } from 'firebase/firestore';

import { useEffect } from "react";
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
import { useAuth, useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from "@/firebase/firestore/use-doc";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/organization-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/organization-dashboard/beneficiaries", label: "المستفيدون", icon: Users },
  { href: "/organization-dashboard/team", label: "فريق العمل", icon: Users },
  { href: "/organization-dashboard/mentors", label: "المرشدون", icon: Users },
  { href: "/organization-dashboard/coaches", label: "المدربون", icon: GraduationCap },
  { href: "/organization-dashboard/courses", label: "الدورات", icon: BookOpen },
  { href: "/organization-dashboard/stores", label: "المتاجر", icon: Store },
  { href: "/organization-dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/organization-dashboard/messages", label: "الرسائل", icon: MessageSquare },
];


export default function OrganizationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-org',
    name: 'مدير منظمة تجريبي',
    email: 'org@example.com',
    role: 'organization',
    organizationId: 'org-hope', // Mock ID
    avatarUrl: `https://picsum.photos/seed/demo-org/40/40`,
  }), []);

  const userProfile = (authUser && realUserProfile) ? realUserProfile : demoUserProfile;

  const orgRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organizationId) return null;
    return doc(firestore, 'organizations', userProfile.organizationId);
  }, [firestore, userProfile?.organizationId]);

  const { data: organization, isLoading: orgLoading } = useDoc<any>(orgRef);
  const loading = userLoading || Boolean(authUser && orgLoading);

  const orgName = authUser ? (organization?.name || "منظمتي") : "منظمة تجريبية";
  const logoUrl = authUser ? organization?.logoUrl : null;

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
  
  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push("/login");
  };

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
  
  const displayName = userProfile.name || 'مدير';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex flex-col items-center text-center gap-2 p-2">
            {logoUrl ? <Image src={logoUrl} alt="شعار المنظمة" width={80} height={80} className="h-20 w-20 object-contain" /> : <Logo className="h-16 w-16" />}
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
             <Link href="/organization-dashboard/settings">
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
              <Link href="/organization-dashboard/messages">
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
                  <AvatarFallback>{(displayName || 'O').charAt(0)}</AvatarFallback>
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
