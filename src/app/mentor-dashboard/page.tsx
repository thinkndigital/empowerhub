'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Star, DollarSign, MessageSquare, CheckCircle2, Clock, PlusCircle, Video } from "lucide-react";
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

type Session = { id: string; title: string; date: string; status: string; attendees: string[]; meetLink?: string };
type Beneficiary = { id: string; name?: string; progress?: number };

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary" },
  { bg: "bg-sky-500/10",    icon: "bg-sky-500" },
  { bg: "bg-amber-500/10",  icon: "bg-amber-500" },
  { bg: "bg-purple-500/10", icon: "bg-purple-500" },
];

const progressColor = (v: number) =>
  v >= 70 ? "[&>div]:bg-emerald-500" : v >= 30 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary";

function safeDate(d: any): Date {
  if (!d) return new Date(0);
  if (typeof d === 'object' && d._seconds) return new Date(d._seconds * 1000);
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
}

function formatSessionDate(dateStr: string, bi: (ar: string, en: string) => string, locale: string): string {
  const d = safeDate(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  const diffD = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffH <= 0 && diffMs > 0) return bi('خلال دقائق', 'in minutes');
  if (diffH === 1) return bi('خلال ساعة', 'in an hour');
  if (diffH < 24 && diffH > 0) return bi(`خلال ${diffH} ساعة`, `in ${diffH} hours`);
  if (diffD === 1) return bi('غداً', 'tomorrow');
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MentorDashboardPage() {
  const { user: authUser } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [benefLoading, setBenefLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [sessLoading, setSessLoading] = useState(true);

  const fetchBeneficiaries = useCallback(async () => {
    if (!authUser) return;
    setBenefLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${authUser.uid}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      setBeneficiaries((await res.json()).users || []);
    } catch { setBeneficiaries([]); } finally { setBenefLoading(false); }
  }, [authUser]);

  const fetchSessions = useCallback(async () => {
    if (!authUser) return;
    setSessLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } });
      setAllSessions((await res.json()).sessions || []);
    } catch { setAllSessions([]); } finally { setSessLoading(false); }
  }, [authUser]);

  const [earnings, setEarnings] = useState<{ remaining: number; totalNet: number } | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/mentor/financial', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEarnings(data.summary || null);
    } catch { setEarnings(null); } finally { setEarningsLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const now = useMemo(() => new Date().toISOString(), []);
  const upcomingSessions = useMemo(
    () => allSessions.filter(s => s.status === 'scheduled' && (s.date || '') >= now)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allSessions, now]
  );

  const avgProgress = useMemo(() => {
    if (!beneficiaries || beneficiaries.length === 0) return 0;
    return Math.round(beneficiaries.reduce((s, b) => s + ((b as any).progress || 0), 0) / beneficiaries.length);
  }, [beneficiaries]);

  const nextSession = upcomingSessions[0];

  const statItems = [
    { title: bi("إجمالي المستفيدين", "Total beneficiaries"), value: String(beneficiaries?.length || 0), sub: bi("مستفيد نشط", "active"),             icon: <Users />,       loading: benefLoading },
    { title: bi("الجلسات القادمة", "Upcoming sessions"),   value: String(upcomingSessions.length),     sub: bi("جلسة مجدولة", "scheduled"),            icon: <Calendar />,    loading: sessLoading },
    { title: bi("متوسط التقدم", "Average progress"),      value: `${avgProgress}%`,                   sub: bi("نسبة إنجاز المستفيدين", "beneficiary completion rate"), icon: <Star />,        loading: benefLoading },
    { title: bi("إجمالي الأرباح", "Total earnings"),   value: `${(earnings?.remaining ?? 0).toFixed(2)} ${bi("د.أ", "JOD")}`, sub: bi("الرصيد المتاح", "available balance"), icon: <DollarSign />,  loading: earningsLoading },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("لوحة تحكم المرشد", "Mentor dashboard")}</h1>
          <p className="page-subtitle">{bi("أدواتك لمتابعة المستفيدين، جدولة الجلسات، وقياس تأثيرك", "Your tools to track beneficiaries, schedule sessions, and measure your impact")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary border-primary/20 w-fit h-fit">{bi("مرشد معتمد", "Certified mentor")}</Badge>
          <Button size="sm" asChild className="gap-1.5 h-fit">
            <Link href="/mentor-dashboard/sessions">
              <PlusCircle className="h-3.5 w-3.5" />
              {bi("جدولة جلسة", "Schedule a session")}
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Next Session Hero ── */}
      {!sessLoading && nextSession && (
        <div className="next-session-card flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">{bi("الجلسة القادمة", "Next session")}</p>
              <p className="font-semibold text-foreground truncate">{nextSession.title}</p>
              <p className="text-sm text-muted-foreground">{formatSessionDate(nextSession.date, bi, locale)}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {nextSession.meetLink && (
              <Button size="sm" asChild>
                <a href={nextSession.meetLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-3.5 w-3.5 ml-1.5" />
                  {bi("انضم", "Join")}
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href="/mentor-dashboard/sessions">{bi("إدارة الجلسات", "Manage sessions")}</Link>
            </Button>
          </div>
        </div>
      )}

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
                <CardTitle>{bi("الجلسات القادمة", "Upcoming sessions")}</CardTitle>
                <CardDescription className="mt-1">{bi("جلسات الإرشاد المجدولة", "Scheduled mentoring sessions")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/mentor-dashboard/sessions">{bi("إدارة الجلسات", "Manage sessions")}</Link>
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
                <p className="empty-state-title">{bi("لا توجد جلسات قادمة", "No upcoming sessions")}</p>
                <p className="empty-state-desc">{bi("جدولة جلسات إرشاد مع مستفيديك", "Schedule mentoring sessions with your beneficiaries")}</p>
                <Button size="sm" asChild className="mt-2">
                  <Link href="/mentor-dashboard/sessions">{bi("جدولة جلسة", "Schedule a session")}</Link>
                </Button>
              </div>
            )}
            {!sessLoading && upcomingSessions.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-sky-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatSessionDate(s.date, bi, locale)}</p>
                </div>
                {s.meetLink && (
                  <a
                    href={s.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-md px-2.5 py-1 transition-colors"
                  >
                    {bi("انضم", "Join")}
                  </a>
                )}
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
                <CardTitle>{bi("مستفيدوني", "My beneficiaries")}</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary h-7 px-2">
                  <Link href="/mentor-dashboard/my-beneficiaries">{bi("عرض الكل", "View all")}</Link>
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
                  <p className="empty-state-title text-sm">{bi("لا يوجد مستفيدون", "No beneficiaries")}</p>
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
                    <p className="text-sm font-medium truncate">{b.name || bi('بلا اسم', 'No name')}</p>
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
            <CardHeader className="pb-3"><CardTitle>{bi("إجراءات سريعة", "Quick actions")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/mentor-dashboard/sessions",          icon: <Calendar className="h-4 w-4" />,      label: bi("الجلسات", "Sessions"),    color: "text-sky-500 bg-sky-500/10" },
                { href: "/mentor-dashboard/messages",          icon: <MessageSquare className="h-4 w-4" />, label: bi("الرسائل", "Messages"),    color: "text-primary bg-primary/10" },
                { href: "/mentor-dashboard/my-beneficiaries", icon: <Users className="h-4 w-4" />,          label: bi("المستفيدون", "Beneficiaries"), color: "text-emerald-600 bg-emerald-500/10" },
                { href: "/mentor-dashboard/analytics",         icon: <CheckCircle2 className="h-4 w-4" />,  label: bi("التحليلات", "Analytics"),  color: "text-purple-500 bg-purple-500/10" },
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
