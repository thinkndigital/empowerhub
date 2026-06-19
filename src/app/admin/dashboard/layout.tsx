"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid, Building2, Users, GraduationCap, Globe, Settings,
  LogOut, Menu, X, Shield, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: LayoutGrid, exact: true },
  { href: "/admin/dashboard/organizations", label: "المنظمات", icon: Building2 },
  { href: "/admin/dashboard/users", label: "المستخدمون", icon: Users },
  { href: "/admin/dashboard/mentors", label: "المرشدون والمدربون", icon: GraduationCap },
  { href: "/admin/dashboard/landing", label: "الصفحة الرئيسية", icon: Globe },
  { href: "/admin/dashboard/settings", label: "الإعدادات", icon: Settings },
];

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">جاري التحقق...</div>
      </div>
    );
  }

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">EmpowerHub</p>
            <p className="text-slate-400 text-xs">لوحة الإدارة</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive(item)
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-slate-900 border-l border-white/10 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-900 flex flex-col z-10">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-white/10 flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-slate-300 text-sm hidden sm:block">المشرف العام</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
