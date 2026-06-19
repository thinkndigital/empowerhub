"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Activity, BookOpenCheck, DollarSign, TrendingUp, Clock, Target, ChevronRight, User, Calendar, Video, Star } from "lucide-react";
import { AiRecommender } from "./ai-recommender";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { format, isPast, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Session = { id: string; title: string; date: string; status: string; meetLink?: string };
type Course = { id: string; title: string; progress?: number; category?: string };
type Order = { id: string; status: string; price?: number };

const StatCard = ({
  title, value, sub, icon, trend, color, loading
}: {
  title: string, value: string, sub: string, icon: React.ReactNode, trend?: string, color: string, loading?: boolean
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-8 w-20 mb-2" /> : <div className="text-2xl font-bold">{value}</div>}
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && (
          <Badge variant="secondary" className="text-xs text-primary bg-primary/10 px-1.5 py-0">
            <TrendingUp className="h-3 w-3 mr-0.5" />{trend}
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user: authUser, userProfile } = useUser();

  // Fetch mentor info
  const mentorRef = useMemoFirebase(() => {
    if (!firestore || !(userProfile as any)?.mentorId) return null;
    return doc(firestore, "users", (userProfile as any).mentorId);
  }, [firestore, (userProfile as any)?.mentorId]);
  const { data: mentor, isLoading: mentorLoading } = useDoc<UserProfile>(mentorRef);

  // Fetch upcoming sessions
  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "sessions"), where("beneficiaryId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: sessions, isLoading: sessionsLoading } = useCollection<Session>(sessionsQuery);

  // Fetch courses
  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || !(userProfile as any)?.organizationId) return null;
    return query(collection(firestore, "courses"), where("organizationId", "==", (userProfile as any).organizationId));
  }, [firestore, (userProfile as any)?.organizationId]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // Fetch orders for store revenue
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "orders"), where("beneficiaryId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: orders } = useCollection<Order>(ordersQuery);

  const upcomingSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter(s => s.status === 'scheduled' && !isPast(parseISO(s.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [sessions]);

  const completedSessions = useMemo(() => sessions?.filter(s => s.status === 'completed').length || 0, [sessions]);

  const storeRevenue = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + ((o as any).total || 0), 0);
  }, [orders]);

  const progress = (userProfile as any)?.progress || 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground">
            مرحباً {userProfile?.name ? `، ${userProfile.name.split(' ')[0]}` : ''}! هنا يمكنك متابعة تقدمك والحصول على توصيات مخصصة.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="التقدم العام"
          value={`${progress}%`}
          sub="نسبة الإنجاز في البرنامج"
          icon={<Activity className="h-5 w-5 text-white" />}
          color="bg-primary"
          loading={false}
        />
        <StatCard
          title="جلسات الإرشاد"
          value={`${completedSessions}`}
          sub="جلسة مكتملة"
          icon={<BookOpenCheck className="h-5 w-5 text-white" />}
          color="bg-accent"
          loading={sessionsLoading}
        />
        <StatCard
          title="إيرادات المتجر"
          value={`${storeRevenue.toFixed(0)} د.أ`}
          sub="من الطلبات المكتملة"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-amber-500"
        />
        <StatCard
          title="الدورات المتاحة"
          value={`${courses?.length || 0}`}
          sub="دورة تدريبية"
          icon={<Target className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          loading={coursesLoading}
        />
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <Card className="border-0 shadow-sm mb-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">تقدمك في البرنامج</span>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            {progress >= 100 && (
              <p className="text-xs text-green-600 mt-2 font-medium">🎉 أحسنت! لقد أتممت البرنامج بنجاح.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: AI Recommender */}
        <div className="lg:col-span-2 space-y-6">
          <AiRecommender />

          {/* Mentor Card */}
          {(mentorLoading || mentor) && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> مرشدي</CardTitle>
              </CardHeader>
              <CardContent>
                {mentorLoading ? (
                  <div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
                ) : mentor ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{mentor.name?.[0] || 'م'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{mentor.name}</p>
                        {(mentor as any).specializations && (
                          <p className="text-xs text-muted-foreground">{(mentor as any).specializations.split(',')[0]}</p>
                        )}
                        <div className="flex mt-1">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />)}</div>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/mentorship">تواصل</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لم يتم تعيين مرشد بعد. تواصل مع المنظمة لتعيين مرشد لك.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Course Progress */}
          {courses && courses.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">الدورات التدريبية</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                    <Link href="/dashboard/training">عرض الكل <ChevronRight className="h-3 w-3 mr-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.slice(0, 3).map(course => (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium line-clamp-1">{course.title}</span>
                      <span className="text-muted-foreground text-xs">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-1.5" />
                    {course.category && <Badge variant="outline" className="text-xs">{course.category}</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/training"><BookOpenCheck className="h-4 w-4 text-primary" />الدورات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/my-store"><DollarSign className="h-4 w-4 text-amber-500" />المتجر</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/mentorship"><Activity className="h-4 w-4 text-accent" />إرشاد</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/reports"><TrendingUp className="h-4 w-4 text-purple-500" />التقارير</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs col-span-2">
                <Link href="/dashboard/settings"><Target className="h-4 w-4 text-muted-foreground" />تحديث ملفي الشخصي</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> المواعيد القادمة</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : upcomingSessions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {upcomingSessions.map(session => (
                    <div key={session.id} className="flex items-start gap-3 text-sm">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                        <span className="text-xs font-bold leading-none">{format(parseISO(session.date), 'd')}</span>
                        <span className="text-xs leading-none text-muted-foreground">{format(parseISO(session.date), 'MMM', { locale: ar })}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{session.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(session.date), 'p', { locale: ar })}</p>
                      </div>
                      {session.meetLink && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" asChild>
                          <a href={session.meetLink} target="_blank" rel="noopener noreferrer"><Video className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد مواعيد قادمة.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
