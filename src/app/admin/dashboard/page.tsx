"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, GraduationCap, BookOpen, ShoppingBag, TrendingUp, Plus, Globe, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Stats { orgs: number; users: number; mentors: number; coaches: number; courses: number; products: number; }
interface Org { id: string; name: string; plan: string; primaryColor: string; logoUrl?: string; }

const statCards = [
  { key: "orgs", label: "المنظمات", icon: Building2, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", text: "text-blue-400", href: "/admin/dashboard/organizations" },
  { key: "users", label: "المستخدمون", icon: Users, color: "from-purple-500 to-purple-600", bg: "bg-purple-500/10", text: "text-purple-400", href: "/admin/dashboard/users" },
  { key: "mentors", label: "المرشدون", icon: GraduationCap, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", text: "text-emerald-400", href: "/admin/dashboard/mentors" },
  { key: "coaches", label: "المدربون", icon: GraduationCap, color: "from-orange-500 to-orange-600", bg: "bg-orange-500/10", text: "text-orange-400", href: "/admin/dashboard/mentors" },
  { key: "courses", label: "الدورات", icon: BookOpen, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/10", text: "text-cyan-400", href: "#" },
  { key: "products", label: "المنتجات", icon: ShoppingBag, color: "from-pink-500 to-pink-600", bg: "bg-pink-500/10", text: "text-pink-400", href: "#" },
];

const planColors: Record<string, string> = {
  free: "bg-muted-foreground/20 text-foreground/90",
  pro: "bg-blue-500/20 text-blue-300",
  enterprise: "bg-purple-500/20 text-purple-300",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    fetch("/api/admin-panel/stats").then(r => r.json()).then(d => setStats(d));
    fetch("/api/admin-panel/organizations").then(r => r.json()).then(d => setOrgs((d.orgs || []).slice(0, 6)));
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم الرئيسية</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة عامة على منصة EmpowerHub</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Link key={card.key} href={card.href}>
            <Card className="border-0 shadow-sm hover:border-border hover:bg-muted transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground">
                      {stats ? stats[card.key as keyof Stats] : "—"}
                    </p>
                  </div>
                  <div className={`${card.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                    <card.icon className={`h-6 w-6 ${card.text}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/dashboard/organizations">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Building2 className="h-4 w-4" />
            <span>إدارة المنظمات</span>
          </Button>
        </Link>
        <Link href="/admin/dashboard/users">
          <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <Users className="h-4 w-4" />
            <span>إدارة المستخدمين</span>
          </Button>
        </Link>
        <Link href="/admin/dashboard/landing">
          <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Globe className="h-4 w-4" />
            <span>تعديل الصفحة الرئيسية</span>
          </Button>
        </Link>
      </div>

      {/* Organizations List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-foreground text-lg">المنظمات المسجلة</CardTitle>
          <Link href="/admin/dashboard/organizations">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
              <span>عرض الكل</span>
              <ArrowLeft className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد منظمات</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {orgs.map(org => (
                <div key={org.id} className="bg-muted/40 border border-border rounded-xl p-4 flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-foreground font-bold text-sm"
                    style={{ backgroundColor: org.primaryColor || '#6366f1' }}
                  >
                    {org.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium truncate">{org.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[org.plan] || planColors.free}`}>
                      {org.plan || 'free'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
