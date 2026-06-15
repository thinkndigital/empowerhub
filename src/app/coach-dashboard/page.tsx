'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Activity, CheckCircle, DollarSign, ArrowUpRight, BookOpen, PlayCircle, PlusCircle, BarChart3 } from "lucide-react";
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

type CoachProfile = UserProfile & { wallet?: { balance?: number } };

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

const myCourses = [
  { title: "أساسيات التسويق الرقمي", enrolled: 48, completion: 72, status: "منشورة" },
  { title: "مقدمة في ريادة الأعمال", enrolled: 32, completion: 88, status: "منشورة" },
  { title: "استراتيجيات التفاوض", enrolled: 19, completion: 45, status: "منشورة" },
  { title: "إدارة المشاريع الصغيرة", enrolled: 0, completion: 0, status: "مسودة" },
];

export default function CoachDashboardPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: loading } = useDoc<CoachProfile>(userRef);

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
        <StatCard title="إجمالي المسجلين" value="99" sub="في جميع دوراتك" icon={<Users className="h-5 w-5 text-white" />} trend="+12 هذا الشهر" color="bg-primary" />
        <StatCard title="الطلاب النشطون" value="74" sub="هذا الشهر" icon={<Activity className="h-5 w-5 text-white" />} trend="+8%" color="bg-accent" />
        <StatCard title="متوسط معدل الإكمال" value="68%" sub="لكل الدورات" icon={<CheckCircle className="h-5 w-5 text-white" />} trend="+5%" color="bg-purple-500" />
        <StatCard
          title="إجمالي الأرباح"
          value={loading ? <Skeleton className="h-8 w-20" /> : `${(user?.wallet?.balance || 0).toFixed(2)} د.أ`}
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
                  <PlusCircle className="h-4 w-4 mr-1" />
                  دورة جديدة
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCourses.map((course, i) => (
              <div key={i} className="p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-medium text-sm">{course.title}</p>
                  </div>
                  <Badge variant={course.status === "منشورة" ? "default" : "secondary"} className="text-xs shrink-0">
                    {course.status}
                  </Badge>
                </div>
                <div className="space-y-1 pr-10">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{course.enrolled} مسجل</span>
                    <span>{course.completion}% إكمال</span>
                  </div>
                  <Progress value={course.completion} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ملخص الأداء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "إجمالي الدورات", value: "4", icon: <BookOpen className="h-4 w-4 text-primary" /> },
                { label: "دورات منشورة", value: "3", icon: <PlayCircle className="h-4 w-4 text-accent" /> },
                { label: "متوسط التقييم", value: "4.6 ★", icon: <CheckCircle className="h-4 w-4 text-amber-500" /> },
                { label: "نسبة الرضا", value: "94%", icon: <BarChart3 className="h-4 w-4 text-purple-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    {item.icon}
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-bold text-sm">{item.value}</span>
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
                <Link href="/coach-dashboard/analytics"><BarChart3 className="h-3 w-3" />التحليلات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="col-span-2 justify-start gap-1">
                <Link href="/coach-dashboard/messages"><Users className="h-3 w-3" />التواصل مع الطلاب</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
