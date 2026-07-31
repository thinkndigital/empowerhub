"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, BookOpenCheck, DollarSign, TrendingUp, Clock, Target, ChevronLeft, User, Calendar, Video, Star } from "lucide-react";
import { AiRecommender } from "./ai-recommender";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { format, isPast, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Session = { id: string; title: string; date: string; status: string; meetLink?: string };
type Course = { id: string; title: string; progress?: number; category?: string };
type Order = { id: string; status: string; total?: number };

const StatCard = ({
  title, value, sub, icon, trend, color, loading
}: {
  title: string, value: string, sub: string, icon: React.ReactNode, trend?: string, color: string, loading?: boolean
}) => (
  <Card className="bg-card border border-border/70 rounded-xl overflow-hidden" style={{boxShadow:'var(--shadow-xs)'}}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        {trend && (
          <Badge variant="secondary" className="text-xs text-primary bg-primary/10 border-0 px-2 py-0.5 rounded-full">
            <TrendingUp className="h-3 w-3 ml-1" />{trend}
          </Badge>
        )}
      </div>
      {loading ? <Skeleton className="h-7 w-20 mb-1" /> : <div className="text-2xl font-bold tracking-tight">{value}</div>}
      <p className="text-xs font-medium text-muted-foreground mt-1">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { user: authUser, userProfile, loading: authLoading } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const headers = { authorization: `Bearer ${token}` };

      const [sRes, cRes, storeRes, mRes] = await Promise.all([
        fetch('/api/beneficiary/sessions', { headers }),
        fetch('/api/beneficiary/courses', { headers }),
        fetch('/api/beneficiary/store', { headers }),
        fetch('/api/beneficiary/mentor', { headers }),
      ]);

      const [sJson, cJson, storeJson, mJson] = await Promise.all([sRes.json(), cRes.json(), storeRes.json(), mRes.json()]);

      setSessions(sJson.sessions || []);
      setCourses(cJson.courses || []);
      setOrders(storeJson.orders || []);
      setMentor(mJson.mentor || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authUser, userProfile?.mentorId]);

  useEffect(() => {
    if (!authLoading && authUser) fetchData();
  }, [authLoading, authUser, fetchData]);

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'scheduled' && !isPast(parseISO(s.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [sessions]);

  const completedSessions = useMemo(() => sessions.filter(s => s.status === 'completed').length, [sessions]);
  const storeRevenue = useMemo(() => orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0), [orders]);
  const progress = (userProfile as any)?.progress || 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مرحباً {userProfile?.name ? `${userProfile.name.split(' ')[0]}` : ''}! هنا يمكنك متابعة تقدمك والحصول على توصيات مخصصة.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border/70 rounded-lg px-3 py-2 w-fit" style={{boxShadow:'var(--shadow-xs)'}}>
          <Clock className="h-3.5 w-3.5" />
          <span>{format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="التقدم العام"
          value={`${progress}%`}
          sub="نسبة الإنجاز في البرنامج"
          icon={<Activity className="h-5 w-5 text-white" />}
          color="bg-primary"
          loading={loading}
        />
        <StatCard
          title="جلسات الإرشاد"
          value={`${completedSessions}`}
          sub="جلسة مكتملة"
          icon={<BookOpenCheck className="h-5 w-5 text-white" />}
          color="bg-sky-500"
          loading={loading}
        />
        <StatCard
          title="إيرادات المتجر"
          value={`${storeRevenue.toFixed(0)} د.أ`}
          sub="من الطلبات المكتملة"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard
          title="الدورات المتاحة"
          value={`${courses.length}`}
          sub="دورة تدريبية"
          icon={<Target className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <Card className="border border-primary/20 bg-primary/5 rounded-xl mb-0" style={{boxShadow:'var(--shadow-xs)'}}>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">تقدمك في البرنامج</span>
              <span className="text-sm font-bold text-primary tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress >= 100 && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">أحسنت! لقد أتممت البرنامج بنجاح.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: AI Recommender */}
        <div className="lg:col-span-2 space-y-6">
          <AiRecommender />

          {/* Mentor Card */}
          {(loading || mentor) && (
            <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground"><User className="h-4 w-4 text-primary" /> مرشدي</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {loading ? (
                  <div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
                ) : mentor ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/15">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">{mentor.name?.[0] || 'م'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{mentor.name}</p>
                        {mentor.expertise && <p className="text-xs text-muted-foreground mt-0.5">{mentor.expertise}</p>}
                        <div className="flex mt-1.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />)}</div>
                      </div>
                    </div>
                    <Button size="sm" className="h-8 px-4 text-xs rounded-lg" asChild>
                      <Link href="/dashboard/mentorship">تواصل</Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Course Progress */}
          {courses.length > 0 && (
            <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">الدورات التدريبية</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary hover:text-primary px-2">
                    <Link href="/dashboard/training">عرض الكل <ChevronLeft className="h-3 w-3 mr-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3.5">
                {courses.slice(0, 3).map(course => (
                  <div key={course.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium line-clamp-1 text-foreground">{course.title}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0 mr-2">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-1.5" />
                    {course.category && <Badge variant="outline" className="text-xs py-0 border-border/60">{course.category}</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/dashboard/training"><BookOpenCheck className="h-3.5 w-3.5 text-primary" />الدورات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/dashboard/my-store"><DollarSign className="h-3.5 w-3.5 text-amber-500" />المتجر</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/dashboard/mentorship"><Activity className="h-3.5 w-3.5 text-primary" />إرشاد</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/dashboard/reports"><TrendingUp className="h-3.5 w-3.5 text-purple-500" />التقارير</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60 col-span-2">
                <Link href="/dashboard/settings"><Target className="h-3.5 w-3.5 text-muted-foreground" />تحديث ملفي الشخصي</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground"><Calendar className="h-4 w-4 text-primary" /> المواعيد القادمة</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
              ) : upcomingSessions.length > 0 ? (
                <div className="flex flex-col divide-y divide-border/50">
                  {upcomingSessions.map(session => (
                    <div key={session.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                        <span className="text-xs font-bold leading-none">{format(parseISO(session.date), 'd')}</span>
                        <span className="text-xs leading-none text-primary/70">{format(parseISO(session.date), 'MMM', { locale: ar })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs line-clamp-1 text-foreground">{session.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(session.date), 'p', { locale: ar })}</p>
                      </div>
                      {session.meetLink && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-primary" asChild>
                          <a href={session.meetLink} target="_blank" rel="noopener noreferrer"><Video className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد مواعيد قادمة.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
