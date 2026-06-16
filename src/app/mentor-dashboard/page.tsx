'use client';

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Star, DollarSign, ArrowUpRight, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { format, isPast, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

type MentorProfile = UserProfile & { wallet?: { balance?: number } };
type Session = { id: string; title: string; date: string; status: string; attendees: string[] };
type Beneficiary = UserProfile & { progress?: number };

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

export default function MentorDashboardPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);
  const { data: user, isLoading: userLoading } = useDoc<MentorProfile>(userRef);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "users"), where("mentorId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: beneficiaries, isLoading: benefLoading } = useCollection<Beneficiary>(beneficiariesQuery);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "sessions"), where("hostId", "==", authUser.uid), orderBy("date", "asc"));
  }, [firestore, authUser]);
  const { data: sessions, isLoading: sessLoading } = useCollection<Session>(sessionsQuery);

  const upcomingSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(s => s.status === 'scheduled' && !isPast(parseISO(s.date))).slice(0, 3);
  }, [sessions]);

  const loading = userLoading || benefLoading || sessLoading;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المرشد</h1>
          <p className="text-muted-foreground">أدواتك لمتابعة المستفيدين، جدولة الجلسات، وقياس تأثيرك.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مرشد معتمد</Badge>
      </div>

      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المستفيدين"
          value={beneficiaries?.length || 0}
          sub="مستفيد نشط"
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-primary"
          loading={benefLoading}
        />
        <StatCard
          title="الجلسات القادمة"
          value={upcomingSessions.length}
          sub="جلسة مجدولة"
          icon={<Calendar className="h-5 w-5 text-white" />}
          color="bg-accent"
          loading={sessLoading}
        />
        <StatCard
          title="متوسط التقدم"
          value={beneficiaries && beneficiaries.length > 0
            ? `${Math.round(beneficiaries.reduce((s, b) => s + ((b as any).progress || 0), 0) / beneficiaries.length)}%`
            : '0%'}
          sub="نسبة إنجاز المستفيدين"
          icon={<Star className="h-5 w-5 text-white" />}
          color="bg-amber-500"
          loading={benefLoading}
        />
        <StatCard
          title="إجمالي الأرباح"
          value={`${((user as any)?.wallet?.balance || 0).toFixed(2)} د.أ`}
          sub="رصيد المحفظة"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          loading={userLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* Upcoming sessions */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">الجلسات القادمة</CardTitle>
                <CardDescription>جلسات الإرشاد المجدولة</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/mentor-dashboard/sessions">إدارة الجلسات</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessLoading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            {!sessLoading && upcomingSessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary leading-none">{format(parseISO(s.date), 'd')}</span>
                  <span className="text-xs text-muted-foreground leading-none">{format(parseISO(s.date), 'MMM', { locale: ar })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{format(parseISO(s.date), 'p', { locale: ar })}</span>
                  </div>
                </div>
              </div>
            ))}
            {!sessLoading && upcomingSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد جلسات قادمة. <Link href="/mentor-dashboard/sessions" className="text-primary underline">جدولة جلسة</Link></p>
            )}
          </CardContent>
        </Card>

        {/* Beneficiaries sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">مستفيدوني</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                  <Link href="/mentor-dashboard/my-beneficiaries">عرض الكل</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              {!benefLoading && (beneficiaries || []).slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{(b.name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={(b as any).progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{(b as any).progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {!benefLoading && (!beneficiaries || beneficiaries.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد مستفيدون بعد.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/sessions"><Calendar className="h-3 w-3" />الجلسات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/messages"><MessageSquare className="h-3 w-3" />الرسائل</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/my-beneficiaries"><Users className="h-3 w-3" />المستفيدون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/analytics"><CheckCircle2 className="h-3 w-3" />التحليلات</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
