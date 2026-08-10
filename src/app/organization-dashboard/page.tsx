"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, BarChart3, TrendingUp, BookOpen, ArrowUpRight, GraduationCap, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

type Beneficiary = { id: string; name?: string; progress?: number; status?: string };
type StatsData = {
  beneficiariesCount: number;
  mentorsCount: number;
  coachesCount: number;
  avgProgress: number;
  beneficiaries: Beneficiary[];
};

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary",      text: "text-primary" },
  { bg: "bg-emerald-500/10",icon: "bg-emerald-500",  text: "text-emerald-600" },
  { bg: "bg-purple-500/10", icon: "bg-purple-500",   text: "text-purple-600" },
  { bg: "bg-amber-500/10",  icon: "bg-amber-500",    text: "text-amber-600" },
];

const StatCard = ({
  title, value, sub, icon, trend, colorIdx = 0, loading
}: {
  title: string; value: string; sub: string; icon: React.ReactNode;
  trend?: string; colorIdx?: number; loading?: boolean;
}) => {
  const c = statColors[colorIdx];
  return (
    <Card className={cn("stat-card border-0 overflow-hidden relative", c.bg)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", c.icon)}>
          <span className="text-white [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
        {trend && !loading && (
          <span className={cn("text-xs flex items-center font-semibold gap-0.5 mt-0.5", c.text)}>
            <ArrowUpRight className="h-3 w-3" />{trend}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading
          ? <Skeleton className="h-8 w-20 mb-1" />
          : <div className="text-3xl font-bold tracking-tight">{value}</div>
        }
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
};

const progressColor = (v: number) =>
  v >= 70 ? "bg-emerald-500" : v >= 30 ? "bg-amber-500" : "bg-red-400";

export default function OrganizationDashboardPage() {
  const { user } = useUser();
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = useMemo(() => {
    const beneficiaries = data?.beneficiaries ?? [];
    const total = beneficiaries.length;
    const active = beneficiaries.filter(b => b.status === 'نشط').length;
    const avgProgress = data?.avgProgress ?? 0;
    const completed = beneficiaries.filter(b => b.progress === 100).length;
    return { total, active, avgProgress, completed };
  }, [data]);

  const topBeneficiaries = useMemo(() =>
    [...(data?.beneficiaries ?? [])].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)).slice(0, 6),
    [data]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("لوحة تحكم المنظمة", "Organization dashboard")}</h1>
          <p className="page-subtitle">{bi("نظرة عامة على أداء المستفيدين في منظمتك", "An overview of your organization's beneficiary performance")}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit h-fit">{bi("مدير المنظمة", "Organization admin")}</Badge>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard loading={loading} colorIdx={0} title={bi("إجمالي المستفيدين", "Total beneficiaries")} value={String(stats.total)} sub={bi("مستفيد مسجل", "registered")} icon={<Users />} />
        <StatCard loading={loading} colorIdx={1} title={bi("المستفيدون النشطون", "Active beneficiaries")} value={String(stats.active)}
          sub={bi(`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% من الإجمالي`, `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`)} icon={<UserCheck />} />
        <StatCard loading={loading} colorIdx={2} title={bi("متوسط التقدم", "Average progress")} value={`${stats.avgProgress}%`} sub={bi("في جميع الدورات", "across all courses")} icon={<BarChart3 />} />
        <StatCard loading={loading} colorIdx={3} title={bi("المستفيدون المكتملون", "Completed beneficiaries")} value={String(stats.completed)} sub={bi("أكملوا برنامجهم", "finished their program")} icon={<TrendingUp />} />
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Beneficiaries progress */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{bi("تقدم المستفيدين", "Beneficiary progress")}</CardTitle>
                <CardDescription className="mt-1">{bi("أعلى المستفيدين تقدماً", "Top-progressing beneficiaries")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/organization-dashboard/beneficiaries">{bi("عرض الكل", "View all")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && [...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
            {!loading && topBeneficiaries.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Users className="h-6 w-6" /></div>
                <p className="empty-state-title">{bi("لا يوجد مستفيدون بعد", "No beneficiaries yet")}</p>
                <p className="empty-state-desc">{bi("ابدأ بإضافة مستفيدين لمتابعة تقدمهم", "Start adding beneficiaries to track their progress")}</p>
                <Button size="sm" asChild className="mt-2">
                  <Link href="/organization-dashboard/beneficiaries">{bi("إضافة مستفيد", "Add beneficiary")}</Link>
                </Button>
              </div>
            )}
            {!loading && topBeneficiaries.map((b) => {
              const progress = b.progress ?? 0;
              const statusKey = progress === 100 ? 'completed' : progress > 0 ? 'active' : 'new';
              return (
                <div key={b.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {(b.name || 'م')[0]}
                      </div>
                      <span className="text-sm font-medium truncate">{b.name || bi('مستفيد', 'Beneficiary')}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={statusKey} />
                      <span className="text-xs font-semibold text-muted-foreground w-8 text-center">{progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", progressColor(progress))}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>{bi("ملخص المنظمة", "Organization summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {[
                { label: bi("المستفيدون", "Beneficiaries"),   value: data?.beneficiariesCount ?? 0, icon: <Users className="h-4 w-4 text-primary" /> },
                { label: bi("المرشدون", "Mentors"),     value: data?.mentorsCount ?? 0,       icon: <GraduationCap className="h-4 w-4 text-sky-500" /> },
                { label: bi("المدربون", "Coaches"),     value: data?.coachesCount ?? 0,       icon: <BookOpen className="h-4 w-4 text-purple-500" /> },
                { label: bi("معدل الإكمال", "Completion rate"), value: `${stats.avgProgress}%`,       icon: <TrendingUp className="h-4 w-4 text-amber-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2.5 text-sm">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {loading
                    ? <Skeleton className="h-4 w-8" />
                    : <span className="font-bold text-sm">{item.value}</span>
                  }
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>{bi("إجراءات سريعة", "Quick actions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/organization-dashboard/beneficiaries", icon: <Users className="h-4 w-4" />,         label: bi("المستفيدون", "Beneficiaries") },
                { href: "/organization-dashboard/coaches",       icon: <BookOpen className="h-4 w-4" />,      label: bi("المدربون", "Coaches") },
                { href: "/organization-dashboard/mentors",       icon: <GraduationCap className="h-4 w-4" />, label: bi("المرشدون", "Mentors") },
                { href: "/organization-dashboard/reports",       icon: <BarChart3 className="h-4 w-4" />,     label: bi("التقارير", "Reports") },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="quick-action-card"
                >
                  <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Insight teaser */}
          {!loading && stats.total > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">{bi("نظرة سريعة", "Quick insight")}</span>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed">
                {bi(
                  `${stats.active} من ${stats.total} مستفيد نشط حالياً${stats.avgProgress > 0 ? ` بمتوسط تقدم ${stats.avgProgress}%` : ''}.`,
                  `${stats.active} of ${stats.total} beneficiaries are currently active${stats.avgProgress > 0 ? ` with an average progress of ${stats.avgProgress}%` : ''}.`
                )}
              </p>
              <Link
                href="/organization-dashboard/reports"
                className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all"
              >
                {bi("عرض التقارير الكاملة", "View full reports")} <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
