"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, UserCheck, BarChart3, TrendingUp, BookOpen, GraduationCap, PlusCircle, ArrowUpRight, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { cn } from "@/lib/utils";

type Beneficiary = { id: string; name?: string; progress?: number; status?: string };
type StatsData = {
  beneficiariesCount: number;
  mentorsCount: number;
  coachesCount: number;
  avgProgress: number;
  beneficiaries: Beneficiary[];
};

export default function OrganizationDashboardPage() {
  const { user, userProfile } = useUser();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const derived = useMemo(() => {
    const list = data?.beneficiaries ?? [];
    const total = list.length;
    const active = list.filter(b => b.status === 'نشط').length;
    const avgProgress = data?.avgProgress ?? 0;
    const completed = list.filter(b => b.progress === 100).length;
    const topList = [...list].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)).slice(0, 6);
    return { total, active, avgProgress, completed, topList };
  }, [data]);

  const displayName = userProfile?.name || user?.displayName || '';

  const metrics = [
    {
      value: derived.total,
      label: 'إجمالي المستفيدين',
      sub: 'مسجل',
      icon: <Users className="h-4 w-4" />,
      color: 'text-primary bg-primary/8',
    },
    {
      value: derived.active,
      label: 'المستفيدون النشطون',
      sub: derived.total > 0 ? `${Math.round((derived.active / derived.total) * 100)}% من الإجمالي` : 'من الإجمالي',
      icon: <UserCheck className="h-4 w-4" />,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      value: `${derived.avgProgress}%`,
      label: 'متوسط التقدم',
      sub: 'عبر كل الدورات',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      value: derived.completed,
      label: 'أكملوا البرنامج',
      sub: 'مستفيد',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  const quickActions = [
    { href: '/organization-dashboard/beneficiaries', label: 'المستفيدون', icon: Users, color: 'bg-primary/8 text-primary' },
    { href: '/organization-dashboard/mentors', label: 'المرشدون', icon: GraduationCap, color: 'bg-violet-50 text-violet-600' },
    { href: '/organization-dashboard/coaches', label: 'المدربون', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
    { href: '/organization-dashboard/reports', label: 'التقارير', icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
  ];

  const summaryItems = [
    { label: 'المستفيدون', value: data?.beneficiariesCount ?? 0, icon: <Users className="h-3.5 w-3.5 text-primary" /> },
    { label: 'المرشدون', value: data?.mentorsCount ?? 0, icon: <GraduationCap className="h-3.5 w-3.5 text-violet-500" /> },
    { label: 'المدربون', value: data?.coachesCount ?? 0, icon: <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> },
    { label: 'معدل الإكمال', value: `${derived.avgProgress}%`, icon: <TrendingUp className="h-3.5 w-3.5 text-amber-500" /> },
  ];

  return (
    <div className="w-full animate-fade-in-up">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
            لوحة التحكم
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            {displayName ? `مرحباً، ${displayName.split(' ')[0]}` : 'نظرة عامة'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            متابعة أداء المستفيدين وموارد المنظمة
          </p>
        </div>
        <Button size="sm" asChild className="gap-1.5 shrink-0">
          <Link href="/organization-dashboard/beneficiaries">
            <PlusCircle className="h-3.5 w-3.5" />
            إضافة مستفيد
          </Link>
        </Button>
      </div>

      {/* ── Metric Strip ────────────────────────────────── */}
      <div className="metric-strip mb-6">
        {metrics.map((m, i) => (
          <div key={i} className="metric-cell">
            {loading ? (
              <>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3.5 w-24" />
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="metric-number text-foreground">{m.value}</div>
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', m.color)}>
                    {m.icon}
                  </div>
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">{m.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Beneficiary Progress List */}
        <div className="lg:col-span-2 surface p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">تقدم المستفيدين</h2>
              <p className="text-xs text-muted-foreground mt-0.5">أعلى المستفيدين نشاطاً</p>
            </div>
            <Link
              href="/organization-dashboard/beneficiaries"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              عرض الكل
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-1">
            {loading && [...Array(5)].map((_, i) => (
              <div key={i} className="data-row">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
                <Skeleton className="h-5 w-10 shrink-0" />
              </div>
            ))}

            {!loading && derived.topList.length === 0 && (
              <div className="py-10 text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">لا يوجد مستفيدون بعد.</p>
                <Button size="sm" variant="outline" asChild className="mt-3">
                  <Link href="/organization-dashboard/beneficiaries">إضافة أول مستفيد</Link>
                </Button>
              </div>
            )}

            {!loading && derived.topList.map((b, idx) => {
              const progress = b.progress ?? 0;
              const isCompleted = progress === 100;
              const initial = (b.name || 'م')[0];
              return (
                <div key={b.id} className="data-row group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 border border-primary/10">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <p className="text-sm font-medium truncate">{b.name || 'مستفيد'}</p>
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1" />
                    </div>
                  </div>
                  {isCompleted && (
                    <span className="shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 mr-2">
                      مكتمل
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Org Summary */}
          <div className="surface p-5">
            <h2 className="section-title mb-4">ملخص المنظمة</h2>
            <div className="space-y-3">
              {summaryItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {loading
                    ? <Skeleton className="h-4 w-8" />
                    : <span className="text-sm font-bold tabular-nums">{item.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="surface p-5">
            <h2 className="section-title mb-3">الوصول السريع</h2>
            <div className="space-y-1">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href} className="quick-action-item">
                  <div className={cn('qa-icon', action.color)}>
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{action.label}</span>
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 mr-auto" />
                </Link>
              ))}
            </div>
          </div>

          {/* Insight teaser */}
          {!loading && derived.total > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">نظرة سريعة</span>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed">
                {derived.active} من {derived.total} مستفيد نشط حالياً
                {derived.avgProgress > 0 && ` بمتوسط تقدم ${derived.avgProgress}%`}.
              </p>
              <Link
                href="/organization-dashboard/reports"
                className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all"
              >
                عرض التقارير الكاملة <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
