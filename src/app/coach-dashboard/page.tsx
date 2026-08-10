'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, CheckCircle, DollarSign, BookOpen, PlayCircle, BarChart3, CalendarDays, PlusCircle, Activity, MessageSquare } from "lucide-react";
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

type Course = { id: string; title?: string; enrolledCount?: number; completionRate?: number; status?: string };
type Beneficiary = { id: string; name?: string; progress?: number };

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary" },
  { bg: "bg-sky-500/10",    icon: "bg-sky-500" },
  { bg: "bg-purple-500/10", icon: "bg-purple-500" },
  { bg: "bg-amber-500/10",  icon: "bg-amber-500" },
];

const progressColor = (v: number) =>
  v >= 70 ? "[&>div]:bg-emerald-500" : v >= 30 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary";

export default function CoachDashboardPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const { user: authUser } = useUser();
  const [myBeneficiaries, setMyBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [benefLoading, setBenefLoading] = useState(true);

  const fetchBeneficiaries = useCallback(async () => {
    if (!authUser) return;
    setBenefLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/users?role=beneficiary&scope=all&coachId=${authUser.uid}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setMyBeneficiaries(json.users || []);
    } catch {
      setMyBeneficiaries([]);
    } finally {
      setBenefLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [sessions, setSessions] = useState<{ id: string; status: string; date: string }[]>([]);
  const [sessLoading, setSessLoading] = useState(true);

  const fetchCoachData = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const [cRes, sRes] = await Promise.all([
        fetch('/api/courses', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setCourses(cData.courses || []);
      setSessions(sData.sessions || []);
    } catch {}
    setCoursesLoading(false);
    setSessLoading(false);
  }, [authUser]);

  const [earnings, setEarnings] = useState<{ remaining: number; totalNet: number } | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/coach/financial', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEarnings(data.summary || null);
    } catch { setEarnings(null); } finally { setEarningsLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchCoachData(); }, [fetchCoachData]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const stats = useMemo(() => {
    const totalEnrolled = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
    const publishedCourses = courses.filter(c => c.status === 'published' || c.status === 'منشورة').length;
    const avgCompletion = courses.length > 0
      ? Math.round(courses.reduce((s, c) => s + (c.completionRate || 0), 0) / courses.length)
      : 0;
    const now = new Date().toISOString();
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && (s.date || '') >= now).length;
    return { totalEnrolled, publishedCourses, avgCompletion, upcomingSessions };
  }, [courses, sessions]);

  const statItems = [
    { title: bi("إجمالي المسجلين", "Total Enrolled"),     value: String(stats.totalEnrolled),    sub: bi("في جميع دوراتك", "across all your courses"),    icon: <Users />,       loading: coursesLoading },
    { title: bi("الجلسات القادمة", "Upcoming Sessions"),     value: String(stats.upcomingSessions), sub: bi("جلسة مجدولة", "scheduled session"),        icon: <CalendarDays />, loading: sessLoading },
    { title: bi("متوسط معدل الإكمال", "Avg. Completion Rate"), value: `${stats.avgCompletion}%`,       sub: bi("لكل الدورات", "across all courses"),        icon: <CheckCircle />, loading: coursesLoading },
    { title: bi("إجمالي الأرباح", "Total Earnings"),     value: `${(earnings?.remaining ?? 0).toFixed(2)} ${bi("د.أ", "JOD")}`, sub: bi("الرصيد المتاح", "available balance"),  icon: <DollarSign />,  loading: earningsLoading },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("لوحة تحكم المدرب", "Coach Dashboard")}</h1>
          <p className="page-subtitle">{bi("أدواتك لإنشاء محتوى تعليمي مؤثر ومتابعة أداء الطلاب", "Your tools for creating impactful learning content and tracking student performance")}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit h-fit">{bi("مدرب معتمد", "Certified Coach")}</Badge>
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
        {/* My Courses */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{bi("دوراتي التدريبية", "My Courses")}</CardTitle>
                <CardDescription className="mt-1">{bi("أداء كل دورة ومعدل الإكمال", "Performance and completion rate for each course")}</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/coach-dashboard/courses">
                  <PlusCircle className="h-4 w-4 ml-1.5" />{bi("دورة جديدة", "New Course")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {coursesLoading && [...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
            {!coursesLoading && courses.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen className="h-6 w-6" /></div>
                <p className="empty-state-title">{bi("لا توجد دورات بعد", "No courses yet")}</p>
                <p className="empty-state-desc">{bi("أنشئ دورتك الأولى وابدأ في تعليم المستفيدين", "Create your first course and start teaching beneficiaries")}</p>
                <Button size="sm" asChild className="mt-2">
                  <Link href="/coach-dashboard/courses">{bi("إضافة دورة", "Add Course")}</Link>
                </Button>
              </div>
            )}
            {!coursesLoading && courses.slice(0, 4).map(course => (
              <div key={course.id} className="p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-medium text-sm truncate">{course.title || bi('دورة بدون عنوان', 'Untitled course')}</p>
                  </div>
                  <StatusBadge status={course.status || 'draft'} />
                </div>
                <div className="space-y-1.5 pr-12">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{course.enrolledCount || 0} {bi("مسجل", "enrolled")}</span>
                    <span className="font-semibold">{course.completionRate || 0}% {bi("إكمال", "complete")}</span>
                  </div>
                  <Progress value={course.completionRate || 0} className={cn("h-2 rounded-full", progressColor(course.completionRate || 0))} />
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
              <CardTitle>{bi("مستفيدوني", "My Beneficiaries")}</CardTitle>
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
              {!benefLoading && (!myBeneficiaries || myBeneficiaries.length === 0) && (
                <div className="empty-state py-8">
                  <div className="empty-state-icon h-10 w-10"><Users className="h-5 w-5" /></div>
                  <p className="empty-state-title text-sm">{bi("لا يوجد مستفيدون", "No beneficiaries")}</p>
                </div>
              )}
              {!benefLoading && (myBeneficiaries || []).slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(b.name || '?')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name || bi('بلا اسم', 'Unnamed')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={b.progress || 0} className={cn("h-1.5 flex-1", progressColor(b.progress || 0))} />
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{b.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle>{bi("ملخص الأداء", "Performance Summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-0.5">
              {[
                { label: bi("إجمالي الدورات", "Total Courses"),   value: courses.length,                                         icon: <BookOpen className="h-4 w-4 text-primary" />,      loading: coursesLoading },
                { label: bi("دورات منشورة", "Published Courses"),     value: stats.publishedCourses,                                 icon: <PlayCircle className="h-4 w-4 text-sky-500" />,    loading: coursesLoading },
                { label: bi("إجمالي الجلسات", "Total Sessions"),  value: sessions.length,                                        icon: <CalendarDays className="h-4 w-4 text-amber-500" />, loading: sessLoading },
                { label: bi("الجلسات المكتملة", "Completed Sessions"), value: sessions.filter(s => s.status === 'completed').length, icon: <Activity className="h-4 w-4 text-purple-500" />,   loading: sessLoading },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2.5 text-sm">
                    {item.icon}
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  {item.loading ? <Skeleton className="h-4 w-8" /> : <span className="font-bold text-sm">{item.value}</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle>{bi("إجراءات سريعة", "Quick Actions")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/coach-dashboard/courses",   icon: <BookOpen className="h-4 w-4" />,     label: bi("الدورات", "Courses"),   color: "text-primary bg-primary/10" },
                { href: "/coach-dashboard/sessions",  icon: <CalendarDays className="h-4 w-4" />, label: bi("الجلسات", "Sessions"),  color: "text-sky-500 bg-sky-500/10" },
                { href: "/coach-dashboard/analytics", icon: <BarChart3 className="h-4 w-4" />,    label: bi("التحليلات", "Analytics"), color: "text-purple-500 bg-purple-500/10" },
                { href: "/coach-dashboard/messages",  icon: <MessageSquare className="h-4 w-4" />,label: bi("الرسائل", "Messages"),  color: "text-amber-500 bg-amber-500/10" },
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
