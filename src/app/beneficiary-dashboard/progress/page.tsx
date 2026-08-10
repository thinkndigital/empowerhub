"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { useLanguage } from "@/components/language-provider";

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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
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
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("تقدمي", "My progress")}</h1>
        <p className="text-sm text-muted-foreground">{bi("تتبع مسيرتك التعليمية وإنجازاتك على المنصة.", "Track your learning journey and achievements on the platform.")}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: bi("التقدم الإجمالي", "Overall progress"), value: loading ? null : `${overallProgress}%`, icon: TrendingUp, color: "bg-primary" },
          { label: bi("دورات منتهية", "Completed courses"), value: loading ? null : String(completedCourses), icon: CheckCircle2, color: "bg-green-500" },
          { label: bi("دورات جارية", "In-progress courses"), value: loading ? null : String(inProgressCourses), icon: BookOpen, color: "bg-amber-500" },
          { label: bi("جلسات مكتملة", "Completed sessions"), value: loading ? null : String(completedSessions), icon: Calendar, color: "bg-purple-500" },
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
            {bi("تقدم الدورات", "Course progress")}
          </CardTitle>
          <CardDescription>{bi("نسبة إتمامك لكل دورة مسجل بها", "Your completion rate for each enrolled course")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && [...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
          {!loading && enrollments.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">{bi("لم تسجل في أي دورة بعد.", "You haven't enrolled in any course yet.")}</p>
          )}
          {!loading && enrollments.map((e) => (
            <div key={e.courseId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate max-w-[70%]">{e.title || bi(`دورة ${e.courseId.slice(0, 8)}`, `Course ${e.courseId.slice(0, 8)}`)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{e.progress}%</span>
                  {e.progress >= 100 && <Badge className="text-xs bg-green-500">{bi("مكتملة", "Completed")}</Badge>}
                  {e.progress > 0 && e.progress < 100 && <Badge variant="secondary" className="text-xs">{bi("جارية", "In progress")}</Badge>}
                  {e.progress === 0 && <Badge variant="outline" className="text-xs">{bi("لم تبدأ", "Not started")}</Badge>}
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
            {bi("سجل الجلسات", "Session history")}
          </CardTitle>
          <CardDescription>{bi("قائمة بجلسات الإرشاد والتدريب", "A list of your mentoring and coaching sessions")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          {!loading && sessions.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">{bi("لا توجد جلسات مسجلة بعد.", "No sessions recorded yet.")}</p>
          )}
          {!loading && sessions.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{s.title || bi('جلسة', 'Session')}</p>
                {s.date && <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG')}</p>}
              </div>
              <Badge
                variant={
                  s.status === 'مكتملة' || s.status === 'completed' ? 'default'
                  : s.status === 'scheduled' || s.status === 'مجدولة' ? 'secondary'
                  : 'outline'
                }
              >
                {s.status || bi('غير محدد', 'Unspecified')}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
