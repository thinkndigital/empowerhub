'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Star, DollarSign, ArrowUpRight, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

type MentorProfile = UserProfile & { wallet?: { balance?: number } };

const StatCard = ({ title, value, sub, icon, trend, color }: {
  title: string, value: string | React.ReactNode, sub: string, icon: React.ReactNode, trend?: string, color: string
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && <span className="text-xs text-primary flex items-center"><ArrowUpRight className="h-3 w-3" />{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

const upcomingSessions = [
  { name: "أحمد الشمري", time: "اليوم - 10:00 ص", topic: "التسعير واستراتيجيات البيع" },
  { name: "فاطمة العلي", time: "غداً - 2:00 م", topic: "بناء هوية العلامة التجارية" },
  { name: "نورة السالم", time: "الخميس - 11:00 ص", topic: "إدارة التدفق النقدي" },
];

const myBeneficiaries = [
  { name: "أحمد الشمري", progress: 78, lastSeen: "اليوم" },
  { name: "فاطمة العلي", progress: 55, lastSeen: "أمس" },
  { name: "نورة السالم", progress: 90, lastSeen: "اليوم" },
  { name: "خالد المطيري", progress: 30, lastSeen: "منذ 3 أيام" },
];

export default function MentorDashboardPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: loading } = useDoc<MentorProfile>(userRef);

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
        <StatCard title="إجمالي المستفيدين" value="4" sub="مستفيد نشط" icon={<Users className="h-5 w-5 text-white" />} trend="+1 هذا الشهر" color="bg-primary" />
        <StatCard title="الجلسات القادمة" value="3" sub="هذا الأسبوع" icon={<Calendar className="h-5 w-5 text-white" />} color="bg-accent" />
        <StatCard title="متوسط التقييم" value="4.8/5" sub="من 23 تقييم" icon={<Star className="h-5 w-5 text-white" />} trend="+0.2" color="bg-amber-500" />
        <StatCard
          title="إجمالي الأرباح"
          value={loading ? <Skeleton className="h-8 w-20" /> : `${(user?.wallet?.balance || 0).toFixed(2)} د.أ`}
          sub="رصيد المحفظة"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-purple-500"
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
            {upcomingSessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">{s.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.topic}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{s.time}</span>
                </div>
              </div>
            ))}
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
              {myBeneficiaries.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{b.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${b.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{b.progress}%</span>
                    </div>
                  </div>
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
