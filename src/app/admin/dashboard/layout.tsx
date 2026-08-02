"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid, Building2, Users, GraduationCap, Settings,
  LogOut, Menu, X, Shield, CreditCard, Star, PenSquare, Store, Wallet, Sliders, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navGroups = [
  {
    label: 'الإدارة',
    items: [
      { href: "/admin/dashboard", label: "الرئيسية", icon: LayoutGrid, exact: true },
      { href: "/admin/dashboard/organizations", label: "المنظمات", icon: Building2 },
      { href: "/admin/dashboard/users", label: "المستخدمون", icon: Users },
      { href: "/admin/dashboard/mentors", label: "المرشدون والمدربون", icon: GraduationCap },
    ],
  },
  {
    label: 'الاشتراكات',
    items: [
      { href: "/admin/dashboard/plans", label: "خطط التسعير", icon: Star },
      { href: "/admin/dashboard/subscriptions", label: "الاشتراكات", icon: CreditCard },
    ],
  },
  {
    label: 'المحتوى',
    items: [
      { href: "/admin/dashboard/content", label: "إدارة المحتوى", icon: FileText },
      { href: "/admin/dashboard/stores", label: "المتاجر والمنتجات", icon: Store },
      { href: "/admin/dashboard/payment", label: "بوابة الدفع", icon: Wallet },
    ],
  },
  {
    label: 'الموقع',
    items: [
      { href: "/admin/dashboard/site", label: "تعديل الموقع", icon: PenSquare },
      { href: "/admin/dashboard/platform", label: "تخصيص المنصة", icon: Sliders },
      { href: "/admin/dashboard/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin-panel/stats").then(r => {
      if (r.status === 401) router.replace("/admin");
      else setChecking(false);
    }).catch(() => router.replace("/admin"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.push("/admin");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg animate-pulse">جاري التحقق...</div>
      </div>
    );
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 ring-1 ring-primary/25 p-2 rounded-xl flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sidebar-accent-foreground font-bold text-sm tracking-tight">EmpowerHub</p>
              <p className="text-sidebar-foreground/70 text-xs">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-5">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-sidebar-foreground/60 text-[11px] font-semibold uppercase tracking-widest px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      isActive(item)
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/40"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:text-red-500 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary) / 0.12), transparent)' }}
      dir="rtl"
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-sidebar/80 backdrop-blur-xl border-l border-sidebar-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-sidebar flex flex-col z-10">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground hover:text-sidebar-accent-foreground">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-background/70 backdrop-blur-xl border-b border-border flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/15 ring-1 ring-primary/25 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-foreground text-sm hidden sm:block">المشرف العام</span>
          </div>
          <div className="flex-1" />
          <ThemeToggle />
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
