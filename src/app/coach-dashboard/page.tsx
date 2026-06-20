'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Activity, CheckCircle, DollarSign, ArrowUpRight, BookOpen, PlayCircle, PlusCircle, BarChart3, CalendarDays } from "lucide-react";
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

type Course = { id: string; title?: string; enrolledCount?: number; completionRate?: number; status?: string };
type Beneficiary = { id: string; name?: string; progress?: number };

const StatCard = ({ title, value, sub, icon, trend, color, loading }: {
  title: string, value: string | React.ReactNode, sub: string, icon: React.ReactNode, trend?: string, color: string, loading?: boolean
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>{icon}</div>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-8 w-20 mb-1" /> : <div className="text-2xl font-bold">{value}</div>}
      <div className="flex items-center gap-1 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && <span className="text-xs text-primary flex items-center"><ArrowUpRight className="h-3 w-3" />{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

export default function CoachDashboardPage() {
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
    const token = await authUser.getIdToken();
    const [cRes, sRes] = await Promise.all([
      fetch('/api/courses', { headers: { authorization: `Bearer ${token}` } }),
      fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } }),
    ]);
    const cData = await cRes.json();
    const sData = await sRes.json();
    setCourses(cData.courses || []);
    setCoursesLoading(false);
    setSessions(sData.sessions || []);
    setSessLoading(false);
  }, [authUser]);

  useEffect(() => { fetchCoachData(); }, [fetchCoachData]);

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

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المدرب</h1>
          <p className="text-muted-foreground">أدواتك لإنشاء محتوى تعليمي مؤثر ومتابعة أداء الطلاب.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مدرب معتمد</Badge>
      </div>

      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المسجلين"
          value={stats.totalEnrolled}
          sub="في جميع دوراتك"
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-primary"
          loading={coursesLoading}
        />
        <StatCard
          title="الجلسات القادمة"
          value={stats.upcomingSessions}
          sub="جلسة مجدولة"
          icon={<CalendarDays className="h-5 w-5 text-white" />}
          color="bg-sky-500"
          loading={sessLoading}
        />
        <StatCard
          title="متوسط معدل الإكمال"
          value={`${stats.avgCompletion}%`}
          sub="لكل الدورات"
          icon={<CheckCircle className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          loading={coursesLoading}
        />
        <StatCard
          title="إجمالي الأرباح"
          value="0.00 د.أ"
          sub="رصيد المحفظة"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* My Courses */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">دوراتي التدريبية</CardTitle>
                <CardDescription>أداء كل دورة ومعدل الإكمال</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/coach-dashboard/courses">
                  <PlusCircle className="h-4 w-4 mr-1" />دورة جديدة
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {coursesLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            {!coursesLoading && (courses || []).slice(0, 4).map(course => (
              <div key={course.id} className="p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-medium text-sm">{course.title || 'دورة بدون عنوان'}</p>
                  </div>
                  <Badge variant={course.status === 'published' || course.status === 'منشورة' ? "default" : "secondary"} className="text-xs shrink-0">
                    {course.status === 'published' ? 'منشورة' : course.status || 'مسودة'}
                  </Badge>
                </div>
                <div className="space-y-1 pr-10">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{course.enrolledCount || 0} مسجل</span>
                    <span>{course.completionRate || 0}% إكمال</span>
                  </div>
                  <Progress value={course.completionRate || 0} className="h-1.5" />
                </div>
              </div>
            ))}
            {!coursesLoading && (!courses || courses.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد دورات بعد. <Link href="/coach-dashboard/courses" className="text-primary underline">أضف أول دورة</Link></p>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">مستفيدوني</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              {!benefLoading && (myBeneficiaries || []).slice(0, 4).map((b: any) => (
                <div key={b.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(b.name || '?')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name || 'بلا اسم'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={b.progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{b.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {!benefLoading && (!myBeneficiaries || myBeneficiaries.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد مستفيدون بعد.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ملخص الأداء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "إجمالي الدورات", value: courses?.length || 0, icon: <BookOpen className="h-4 w-4 text-primary" />, loading: coursesLoading },
                { label: "دورات منشورة", value: stats.publishedCourses, icon: <PlayCircle className="h-4 w-4 text-accent" />, loading: coursesLoading },
                { label: "إجمالي الجلسات", value: sessions?.length || 0, icon: <CalendarDays className="h-4 w-4 text-amber-500" />, loading: sessLoading },
                { label: "الجلسات المكتملة", value: sessions?.filter(s => s.status === 'completed').length || 0, icon: <Activity className="h-4 w-4 text-purple-500" />, loading: sessLoading },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    {item.icon}
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  {item.loading ? <Skeleton className="h-5 w-8" /> : <span className="font-bold text-sm">{item.value}</span>}
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
                <Link href="/coach-dashboard/courses"><BookOpen className="h-3 w-3" />الدورات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/coach-dashboard/sessions"><CalendarDays className="h-3 w-3" />الجلسات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/coach-dashboard/analytics"><BarChart3 className="h-3 w-3" />التحليلات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/coach-dashboard/messages"><Users className="h-3 w-3" />الرسائل</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
