"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Building, BookOpen, TrendingUp, UserCheck, GraduationCap, DatabaseZap, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary" },
  { bg: "bg-emerald-500/10",icon: "bg-emerald-500" },
  { bg: "bg-purple-500/10", icon: "bg-purple-500" },
  { bg: "bg-rose-500/10",   icon: "bg-rose-500" },
];

const StatCard = ({
  title, value, sub, icon, colorIdx = 0, loading
}: {
  title: string, value: string, sub: string, icon: React.ReactNode, colorIdx?: number, loading?: boolean
}) => {
  const c = statColors[colorIdx];
  return (
    <Card className={cn("stat-card border-0 overflow-hidden", c.bg)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white [&>svg]:h-5 [&>svg]:w-5", c.icon)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? <Skeleton className="h-8 w-20 mb-1" /> : <div className="text-3xl font-bold tracking-tight">{value}</div>}
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const firestore = useFirestore();

  async function seedDemo() {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin-panel/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل');
      const counts = Object.entries(data.seeded).map(([k, v]) => `${k}: ${v}`).join('، ');
      toast({ title: 'تم إضافة البيانات التجريبية', description: counts });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setSeeding(false);
    }
  }

  async function clearDemo() {
    if (!confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin-panel/seed-demo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل');
      toast({ title: 'تم مسح البيانات', description: 'تم حذف جميع البيانات التجريبية.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setSeeding(false);
    }
  }

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "users")) : null, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const orgsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "organizations")) : null, [firestore]);
  const { data: orgs, isLoading: orgsLoading } = useCollection(orgsQuery);

  const coursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "courses")) : null, [firestore]);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

  const recentUsersQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, "users"), orderBy("createdAt", "desc"), limit(5)) : null,
    [firestore]
  );
  const { data: recentUsers } = useCollection<{ id: string; name: string; role: string; createdAt: string }>(recentUsersQuery);

  const activeUsers = users?.filter((u: any) => u.status === 'نشط' || u.status === 'نشطة') || [];
  const beneficiaries = users?.filter((u: any) => u.role === 'beneficiary') || [];

  const roleLabels: Record<string, string> = {
    admin: 'مشرف',
    organization: 'مدير جهة',
    coach: 'مدرب',
    mentor: 'مرشد',
    beneficiary: 'مستفيد',
  };

  return (
    <div className="space-y-6 animate-fade-in-up" dir="rtl">
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة التحكم الرئيسية</h1>
          <p className="page-subtitle">نظرة عامة وشاملة على أداء المنصة بالكامل.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary border-primary/20 w-fit h-fit">مشرف النظام</Badge>
          <Button size="sm" variant="outline" onClick={seedDemo} disabled={seeding} className="h-8 text-xs gap-1.5">
            <DatabaseZap className="h-3.5 w-3.5" />
            {seeding ? 'جاري التنفيذ...' : 'إضافة بيانات تجريبية'}
          </Button>
          <Button size="sm" variant="ghost" onClick={clearDemo} disabled={seeding} className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            مسح البيانات
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي المستخدمين" value={String(users?.length ?? 0)} sub="مستخدم مسجل" icon={<Users />} colorIdx={0} loading={usersLoading} />
        <StatCard title="إجمالي الجهات" value={String(orgs?.length ?? 0)} sub="جهة مسجلة" icon={<Building />} colorIdx={1} loading={orgsLoading} />
        <StatCard title="إجمالي المستفيدين" value={String(beneficiaries.length)} sub="مستفيد في المنصة" icon={<Activity />} colorIdx={2} loading={usersLoading} />
        <StatCard title="إجمالي الدورات" value={String(courses?.length ?? 0)} sub="دورة منشورة" icon={<BookOpen />} colorIdx={3} loading={coursesLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription className="mt-1">الوصول السريع لأهم أقسام الإدارة</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { href: "/admin-dashboard/users",         icon: <Users className="h-4 w-4" />,      label: "المستخدمون", color: "text-primary bg-primary/10" },
              { href: "/admin-dashboard/organizations", icon: <Building className="h-4 w-4" />,   label: "الجهات",     color: "text-emerald-600 bg-emerald-500/10" },
              { href: "/admin-dashboard/courses",       icon: <BookOpen className="h-4 w-4" />,   label: "الدورات",    color: "text-purple-500 bg-purple-500/10" },
              { href: "/admin-dashboard/mentors",       icon: <UserCheck className="h-4 w-4" />,  label: "المرشدون",   color: "text-sky-500 bg-sky-500/10" },
              { href: "/admin-dashboard/analytics",     icon: <TrendingUp className="h-4 w-4" />, label: "التحليلات",  color: "text-amber-500 bg-amber-500/10" },
              { href: "/admin-dashboard/messages",      icon: <GraduationCap className="h-4 w-4" />, label: "الرسائل", color: "text-rose-500 bg-rose-500/10" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="quick-action-card">
                <span className={cn("h-9 w-9 rounded-xl flex items-center justify-center", item.color)}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>آخر المسجلين</CardTitle>
            <CardDescription className="mt-1">أحدث المستخدمين المنضمين للمنصة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersLoading && [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
            {!usersLoading && recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {user.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || 'مستخدم'}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user.role] || user.role}</p>
                </div>
              </div>
            ))}
            {!usersLoading && (!recentUsers || recentUsers.length === 0) && (
              <div className="empty-state py-8">
                <div className="empty-state-icon h-10 w-10"><Users className="h-5 w-5" /></div>
                <p className="empty-state-title text-sm">لا يوجد مستخدمون بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
