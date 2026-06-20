"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Building, BookOpen, ShoppingCart, TrendingUp, ArrowUpRight, UserCheck, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({
  title, value, sub, icon, color, loading
}: {
  title: string, value: string, sub: string, icon: React.ReactNode, color: string, loading?: boolean
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-8 w-20 mb-2" /> : <div className="text-2xl font-bold">{value}</div>}
      <p className="text-xs text-muted-foreground">{sub}</p>
    </CardContent>
  </Card>
);

const QuickLink = ({ href, label, desc, icon }: { href: string, label: string, desc: string, icon: React.ReactNode }) => (
  <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-start gap-1 card-hover border-border">
    <Link href={href}>
      <div className="flex items-center gap-2 text-primary">{icon}<span className="font-semibold">{label}</span></div>
      <p className="text-xs text-muted-foreground text-right">{desc}</p>
    </Link>
  </Button>
);

export default function AdminDashboardPage() {
  const firestore = useFirestore();

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
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
          <p className="text-muted-foreground">نظرة عامة وشاملة على أداء المنصة بالكامل.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مشرف النظام</Badge>
      </div>

      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي المستخدمين" value={String(users?.length ?? 0)} sub="مستخدم مسجل" icon={<Users className="h-5 w-5 text-white" />} color="bg-primary" loading={usersLoading} />
        <StatCard title="إجمالي الجهات" value={String(orgs?.length ?? 0)} sub="جهة مسجلة" icon={<Building className="h-5 w-5 text-white" />} color="bg-emerald-500" loading={orgsLoading} />
        <StatCard title="إجمالي المستفيدين" value={String(beneficiaries.length)} sub="مستفيد في المنصة" icon={<Activity className="h-5 w-5 text-white" />} color="bg-purple-500" loading={usersLoading} />
        <StatCard title="إجمالي الدورات" value={String(courses?.length ?? 0)} sub="دورة منشورة" icon={<BookOpen className="h-5 w-5 text-white" />} color="bg-rose-500" loading={coursesLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            <CardDescription>الوصول السريع لأهم أقسام الإدارة</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <QuickLink href="/admin-dashboard/users" label="إدارة المستخدمين" desc="عرض وإدارة جميع المستخدمين" icon={<Users className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/organizations" label="الجهات" desc="إدارة الجهات المسجلة" icon={<Building className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/courses" label="الدورات" desc="إدارة المحتوى التعليمي" icon={<BookOpen className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/mentors" label="المرشدون" desc="إدارة فريق الإرشاد" icon={<UserCheck className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/analytics" label="التحليلات" desc="تقارير وإحصائيات المنصة" icon={<TrendingUp className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/messages" label="الرسائل" desc="الرسائل والإشعارات" icon={<GraduationCap className="h-4 w-4" />} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">آخر المسجلين</CardTitle>
            <CardDescription>أحدث المستخدمين المنضمين للمنصة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersLoading && [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
            {!usersLoading && recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {user.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || 'مستخدم'}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user.role] || user.role}</p>
                </div>
              </div>
            ))}
            {!usersLoading && (!recentUsers || recentUsers.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مستخدمون بعد.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
