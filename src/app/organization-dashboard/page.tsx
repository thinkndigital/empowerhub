"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, BarChart3, DollarSign, TrendingUp, BookOpen, ArrowUpRight, GraduationCap, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";

type Beneficiary = { id: string; name?: string; progress?: number; status?: string };
type StatsData = {
  beneficiariesCount: number;
  mentorsCount: number;
  coachesCount: number;
  avgProgress: number;
  beneficiaries: Beneficiary[];
};

const StatCard = ({
  title, value, sub, icon, trend, color, loading
}: {
  title: string, value: string, sub: string, icon: React.ReactNode, trend?: string, color: string, loading?: boolean
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
      <div className="flex items-center gap-1 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && !loading && (
          <span className="text-xs flex items-center font-medium text-primary">
            <ArrowUpRight className="h-3 w-3" />{trend}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function OrganizationDashboardPage() {
  const { user, userProfile } = useUser();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const stats = useMemo(() => {
    const beneficiaries = data?.beneficiaries ?? [];
    const total = beneficiaries.length;
    const active = beneficiaries.filter(b => b.status === 'نشط').length;
    const avgProgress = data?.avgProgress ?? 0;
    const completed = beneficiaries.filter(b => b.progress === 100).length;
    return { total, active, avgProgress, completed };
  }, [data]);

  const topBeneficiaries = useMemo(() =>
    [...(data?.beneficiaries ?? [])].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)).slice(0, 5),
    [data]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المنظمة</h1>
          <p className="text-muted-foreground">نظرة عامة على أداء المستفيدين في منظمتك.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مدير المنظمة</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-4">
        <StatCard loading={loading} title="إجمالي المستفيدين" value={String(stats.total)} sub="مستفيد مسجل" icon={<Users className="h-5 w-5 text-white" />} color="bg-primary" />
        <StatCard loading={loading} title="المستفيدون النشطون" value={String(stats.active)} sub={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% من الإجمالي`} icon={<UserCheck className="h-5 w-5 text-white" />} color="bg-accent" />
        <StatCard loading={loading} title="متوسط التقدم" value={`${stats.avgProgress}%`} sub="في جميع الدورات" icon={<BarChart3 className="h-5 w-5 text-white" />} color="bg-purple-500" />
        <StatCard loading={loading} title="المستفيدون المكتملون" value={String(stats.completed)} sub="أكملوا برنامجهم" icon={<TrendingUp className="h-5 w-5 text-white" />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* Beneficiaries Progress */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">تقدم المستفيدين</CardTitle>
                <CardDescription>أعلى المستفيدين تقدماً</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/organization-dashboard/beneficiaries">عرض الكل</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && [...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
            {!loading && topBeneficiaries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا يوجد مستفيدون بعد.{' '}
                <Link href="/organization-dashboard/beneficiaries" className="text-primary underline">أضف مستفيداً</Link>
              </div>
            )}
            {!loading && topBeneficiaries.map((b) => {
              const statusLabel = b.progress === 100 ? 'مكتمل' : (b.progress ?? 0) > 0 ? 'نشط' : 'جديد';
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {(b.name || 'م')[0]}
                      </div>
                      <span className="text-sm font-medium">{b.name || 'مستفيد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusLabel === 'مكتمل' ? "default" : statusLabel === 'جديد' ? "secondary" : "outline"} className="text-xs">
                        {statusLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground w-8 text-left">{b.progress ?? 0}%</span>
                    </div>
                  </div>
                  <Progress value={b.progress ?? 0} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick actions + Summary */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ملخص المنظمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "المستفيدون", value: loading ? '...' : String(data?.beneficiariesCount ?? 0), icon: <Users className="h-4 w-4 text-primary" /> },
                { label: "المرشدون", value: loading ? '...' : String(data?.mentorsCount ?? 0), icon: <GraduationCap className="h-4 w-4 text-accent" /> },
                { label: "المدربون", value: loading ? '...' : String(data?.coachesCount ?? 0), icon: <BookOpen className="h-4 w-4 text-purple-500" /> },
                { label: "معدل الإكمال", value: loading ? '...' : `${stats.avgProgress}%`, icon: <TrendingUp className="h-4 w-4 text-amber-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    {item.icon}
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-bold text-sm">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/beneficiaries"><Users className="h-3 w-3" />المستفيدون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/coaches"><BookOpen className="h-3 w-3" />المدربون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/mentors"><GraduationCap className="h-3 w-3" />المرشدون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/reports"><BarChart3 className="h-3 w-3" />التقارير</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
