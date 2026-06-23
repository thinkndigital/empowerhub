'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Star, DollarSign, MessageSquare, CheckCircle2, CalendarDays } from "lucide-react";
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Session = { id: string; title: string; date: string; status: string; attendees: string[] };
type Beneficiary = { id: string; name?: string; progress?: number };

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary" },
  { bg: "bg-sky-500/10",    icon: "bg-sky-500" },
  { bg: "bg-amber-500/10",  icon: "bg-amber-500" },
  { bg: "bg-purple-500/10", icon: "bg-purple-500" },
];

const progressColor = (v: number) =>
  v >= 70 ? "[&>div]:bg-emerald-500" : v >= 30 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary";

export default function MentorDashboardPage() {
  const { user: authUser } = useUser();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [benefLoading, setBenefLoading] = useState(true);

  const fetchBeneficiaries = useCallback(async () => {
    if (!authUser) return;
    setBenefLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${authUser.uid}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBeneficiaries(json.users || []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setBenefLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);

  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [sessLoading, setSessLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!authUser) return;
    setSessLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setAllSessions(json.sessions || []);
    } catch {
      setAllSessions([]);
    } finally {
      setSessLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const now = new Date().toISOString();
  const upcomingSessions = allSessions.filter(s => s.status === 'scheduled' && (s.date || '') >= now);

  const avgProgress = useMemo(() => {
    if (!beneficiaries || beneficiaries.length === 0) return 0;
    return Math.round(beneficiaries.reduce((s, b) => s + ((b as any).progress || 0), 0) / beneficiaries.length);
  }, [beneficiaries]);

  const statItems = [
    { title: "إجمالي المستفيدين", value: String(beneficiaries?.length || 0), sub: "مستفيد نشط",             icon: <Users />,       loading: benefLoading },
    { title: "الجلسات القادمة",   value: String(upcomingSessions.length),     sub: "جلسة مجدولة",            icon: <Calendar />,    loading: sessLoading },
    { title: "متوسط التقدم",      value: `${avgProgress}%`,                   sub: "نسبة إنجاز المستفيدين", icon: <Star />,        loading: benefLoading },
    { title: "إجمالي الأرباح",   value: "0.00 د.أ",                           sub: "رصيد المحفظة",           icon: <DollarSign />,  loading: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up" dir="rtl">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة تحكم المرشد</h1>
          <p className="page-subtitle">أدواتك لمتابعة المستفيدين، جدولة الجلسات، وقياس تأثيرك</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit h-fit">مرشد معتمد</Badge>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statItems.map((s, i) => {
          const c = statColors[i];
          return (
            <Card key={i} className={cn("stat-card border-0 overflow-hidden", c.bg)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white [&>svg]:h-5 [&>svg]:w-5", c.icon)}>
                  {s.icon}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {s.loading
                  ? <Skeleton className="h-8 w-20 mb-1" />
                  : <div className="text-3xl font-bold tracking-tight">{s.value}</div>
                }
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.title}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming sessions */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>الجلسات القادمة</CardTitle>
                <CardDescription className="mt-1">جلسات الإرشاد المجدولة</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/mentor-dashboard/sessions">إدارة الجلسات</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessLoading && [...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 items-center p-4 rounded-xl border border-border/50">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
            {!sessLoading && upcomingSessions.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar className="h-6 w-6" /></div>
                <p className="empty-state-title">لا توجد جلسات قادمة</p>
                <p className="empty-state-desc">جدولة جلسات إرشاد مع مستفيديك</p>
                <Button size="sm" asChild className="mt-2">
                  <Link href="/mentor-dashboard/sessions">جدولة جلسة</Link>
                </Button>
              </div>
            )}
            {!sessLoading && upcomingSessions.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.date ? new Date(s.date).toLocaleDateString('ar-SA', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Beneficiaries */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>مستفيدوني</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary h-7 px-2">
                  <Link href="/mentor-dashboard/my-beneficiaries">عرض الكل</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefLoading && [...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              ))}
              {!benefLoading && (!beneficiaries || beneficiaries.length === 0) && (
                <div className="empty-state py-8">
                  <div className="empty-state-icon h-10 w-10"><Users className="h-5 w-5" /></div>
                  <p className="empty-state-title text-sm">لا يوجد مستفيدون</p>
                </div>
              )}
              {!benefLoading && (beneficiaries || []).slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 rounded-xl shrink-0">
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">
                      {(b.name || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name || 'بلا اسم'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={(b as any).progress || 0} className={cn("h-1.5 flex-1", progressColor((b as any).progress || 0))} />
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{(b as any).progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle>إجراءات سريعة</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/mentor-dashboard/sessions",          icon: <Calendar className="h-4 w-4" />,      label: "الجلسات",    color: "text-sky-500 bg-sky-500/10" },
                { href: "/mentor-dashboard/messages",          icon: <MessageSquare className="h-4 w-4" />, label: "الرسائل",    color: "text-primary bg-primary/10" },
                { href: "/mentor-dashboard/my-beneficiaries", icon: <Users className="h-4 w-4" />,          label: "المستفيدون", color: "text-emerald-600 bg-emerald-500/10" },
                { href: "/mentor-dashboard/analytics",         icon: <CheckCircle2 className="h-4 w-4" />,  label: "التحليلات",  color: "text-purple-500 bg-purple-500/10" },
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
        </div>
      </div>
    </div>
  );
}
