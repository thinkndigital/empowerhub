"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendingUp, BookOpen, Calendar, Users, ArrowUpRight } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import Link from "next/link";

type Profile = {
  id: string; name?: string; email?: string; progress?: number;
  mentorId?: string; coachId?: string; groupId?: string;
  mentorName?: string; coachName?: string;
};

export default function BeneficiaryDashboardPage() {
  const { user: authUser, userProfile } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<number | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const [profileRes, sessionsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/beneficiary/sessions', { headers: { authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/beneficiary/enrollments', { headers: { authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      const json = await profileRes.json();
      setProfile(json.profile);

      if (sessionsRes && sessionsRes.ok) {
        const s = await sessionsRes.json();
        const now = new Date().toISOString();
        const upcoming = (s.sessions || []).filter((sess: any) => (sess.date || '') >= now && sess.status === 'scheduled').length;
        setUpcomingSessions(upcoming);
      }
      if (enrollmentsRes && enrollmentsRes.ok) {
        const e = await enrollmentsRes.json();
        setEnrolledCourses((e.enrollments || []).length);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const displayName = profile?.name || userProfile?.name || authUser?.displayName || 'مستفيد';
  const progress = profile?.progress || 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">أهلاً، {displayName}</h1>
          <p className="text-muted-foreground">تابع تقدمك وجلساتك ودوراتك من هنا.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مستفيد</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { title: "تقدمي العام", value: loading ? "..." : `${progress}%`, sub: "نسبة الإنجاز", icon: <TrendingUp className="h-5 w-5 text-white" />, color: "bg-primary" },
          { title: "الدورات", value: loading ? "..." : (enrolledCourses !== null ? String(enrolledCourses) : "—"), sub: "دورة مسجلة", icon: <BookOpen className="h-5 w-5 text-white" />, color: "bg-sky-500" },
          { title: "الجلسات", value: loading ? "..." : (upcomingSessions !== null ? String(upcomingSessions) : "—"), sub: "جلسة قادمة", icon: <Calendar className="h-5 w-5 text-white" />, color: "bg-amber-500" },
          { title: "المجموعة", value: loading ? "..." : (profile?.groupId ? "مُنضم" : "—"), sub: "حالة المجموعة", icon: <Users className="h-5 w-5 text-white" />, color: "bg-purple-500" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{s.value}</div>}
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress Card */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">تقدمي العام</CardTitle>
            <CardDescription>نسبة إنجازك في البرنامج</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <Skeleton className="h-4 w-full" /> : (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">الإنجاز الكلي</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {progress === 0 ? "لم تبدأ بعد — تواصل مع مرشدك لبدء رحلتك." :
                   progress < 50 ? "أنت في بداية الطريق، استمر!" :
                   progress < 100 ? "رائع، أنت في منتصف الطريق!" : "أكملت البرنامج، تهانينا!"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Support team */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">فريق الدعم</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  {profile?.mentorId ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/20 text-primary text-xs">م</AvatarFallback></Avatar>
                      <div><p className="text-sm font-medium">{profile.mentorName || 'المرشد'}</p><p className="text-xs text-muted-foreground">مرشدك</p></div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">لم يُعيَّن لك مرشد بعد.</p>}
                  {profile?.coachId ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-accent/20 text-accent-foreground text-xs">ت</AvatarFallback></Avatar>
                      <div><p className="text-sm font-medium">{profile.coachName || 'المدرب'}</p><p className="text-xs text-muted-foreground">مدربك</p></div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">لم يُعيَّن لك مدرب بعد.</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">إجراءات سريعة</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/beneficiary-dashboard/courses"><BookOpen className="h-3 w-3" />الدورات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/beneficiary-dashboard/sessions"><Calendar className="h-3 w-3" />الجلسات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/beneficiary-dashboard/messages"><Users className="h-3 w-3" />الرسائل</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/beneficiary-dashboard/progress"><TrendingUp className="h-3 w-3" />تقدمي</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
