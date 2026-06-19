"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";

type CourseEnrollment = {
  courseId: string;
  title?: string;
  progress: number;
  enrolledAt?: string;
};

type SessionInfo = {
  id: string;
  title?: string;
  date?: string;
  status?: string;
};

export default function BeneficiaryProgressPage() {
  const { user: authUser, userProfile } = useUser();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const [enrollRes, sessRes] = await Promise.all([
        fetch('/api/beneficiary/enrollments', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/beneficiary/sessions', { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const enrollData = await enrollRes.json();
      const sessData = await sessRes.json();
      if (Array.isArray(enrollData.enrollments)) setEnrollments(enrollData.enrollments);
      if (Array.isArray(sessData.sessions)) setSessions(sessData.sessions);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const completedCourses = enrollments.filter(e => e.progress >= 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const completedSessions = sessions.filter(s => s.status === 'مكتملة' || s.status === 'completed').length;
  const overallProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">تقدمي</h1>
        <p className="text-muted-foreground">تتبع مسيرتك التعليمية وإنجازاتك على المنصة.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "التقدم الإجمالي", value: loading ? null : `${overallProgress}%`, icon: TrendingUp, color: "bg-primary" },
          { label: "دورات منتهية", value: loading ? null : String(completedCourses), icon: CheckCircle2, color: "bg-green-500" },
          { label: "دورات جارية", value: loading ? null : String(inProgressCourses), icon: BookOpen, color: "bg-amber-500" },
          { label: "جلسات مكتملة", value: loading ? null : String(completedSessions), icon: Calendar, color: "bg-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            تقدم الدورات
          </CardTitle>
          <CardDescription>نسبة إتمامك لكل دورة مسجل بها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && [...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
          {!loading && enrollments.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">لم تسجل في أي دورة بعد.</p>
          )}
          {!loading && enrollments.map((e) => (
            <div key={e.courseId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate max-w-[70%]">{e.title || `دورة ${e.courseId.slice(0, 8)}`}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{e.progress}%</span>
                  {e.progress >= 100 && <Badge className="text-xs bg-green-500">مكتملة</Badge>}
                  {e.progress > 0 && e.progress < 100 && <Badge variant="secondary" className="text-xs">جارية</Badge>}
                  {e.progress === 0 && <Badge variant="outline" className="text-xs">لم تبدأ</Badge>}
                </div>
              </div>
              <Progress value={e.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sessions History */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            سجل الجلسات
          </CardTitle>
          <CardDescription>قائمة بجلسات الإرشاد والتدريب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          {!loading && sessions.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">لا توجد جلسات مسجلة بعد.</p>
          )}
          {!loading && sessions.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{s.title || 'جلسة'}</p>
                {s.date && <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('ar-EG')}</p>}
              </div>
              <Badge
                variant={
                  s.status === 'مكتملة' || s.status === 'completed' ? 'default'
                  : s.status === 'scheduled' || s.status === 'مجدولة' ? 'secondary'
                  : 'outline'
                }
              >
                {s.status || 'غير محدد'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
