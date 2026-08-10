"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, BookOpen, Calendar, Users, MessageSquare } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

type Profile = {
  id: string; name?: string; email?: string; progress?: number;
  mentorId?: string; coachId?: string; groupId?: string;
  mentorName?: string; coachName?: string;
};

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary" },
  { bg: "bg-sky-500/10",    icon: "bg-sky-500" },
  { bg: "bg-amber-500/10",  icon: "bg-amber-500" },
  { bg: "bg-purple-500/10", icon: "bg-purple-500" },
];

const progressColor = (v: number) =>
  v >= 70 ? "[&>div]:bg-emerald-500" : v >= 30 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary";

const progressMessage = (p: number, lang: 'ar' | 'en') => lang === 'en'
  ? (p === 0 ? "You haven't started yet — reach out to your mentor to begin." :
     p < 50 ? "You're just getting started, keep going!" :
     p < 100 ? "Great progress, you're halfway there!" :
               "Congratulations! You've completed the program 🎉")
  : (p === 0    ? "لم تبدأ بعد — تواصل مع مرشدك لبدء رحلتك." :
     p < 50     ? "أنت في بداية الطريق، استمر!" :
     p < 100    ? "رائع، أنت في منتصف الطريق!" :
                  "تهانينا! أكملت البرنامج بالكامل 🎉");

export default function BeneficiaryDashboardPage() {
  const { user: authUser, userProfile } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
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
      if (sessionsRes?.ok) {
        const s = await sessionsRes.json();
        const now = new Date().toISOString();
        setUpcomingSessions((s.sessions || []).filter((sess: any) => (sess.date || '') >= now && sess.status === 'scheduled').length);
      }
      if (enrollmentsRes?.ok) {
        const e = await enrollmentsRes.json();
        setEnrolledCourses((e.enrollments || []).length);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const displayName = profile?.name || userProfile?.name || authUser?.displayName || bi('مستفيد', 'Beneficiary');
  const progress = profile?.progress || 0;

  const statItems = [
    { title: bi("تقدمي العام", "My overall progress"), value: `${progress}%`, sub: bi("نسبة الإنجاز", "Completion rate"), icon: <TrendingUp /> },
    { title: bi("الدورات", "Courses"), value: enrolledCourses !== null ? String(enrolledCourses) : "—", sub: bi("دورة مسجلة", "Enrolled"), icon: <BookOpen /> },
    { title: bi("الجلسات", "Sessions"), value: upcomingSessions !== null ? String(upcomingSessions) : "—", sub: bi("جلسة قادمة", "Upcoming"), icon: <Calendar /> },
    { title: bi("المجموعة", "Group"), value: profile?.groupId ? bi("مُنضم", "Joined") : "—", sub: bi("حالة المجموعة", "Group status"), icon: <Users /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi(`أهلاً، ${displayName}`, `Welcome, ${displayName}`)}</h1>
          <p className="page-subtitle">{bi("تابع تقدمك وجلساتك ودوراتك من هنا", "Track your progress, sessions, and courses here")}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit h-fit">{bi('مستفيد', 'Beneficiary')}</Badge>
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
                {loading
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
        {/* Progress card */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>{bi("تقدمي العام", "My overall progress")}</CardTitle>
            <CardDescription className="mt-1">{bi("نسبة إنجازك في البرنامج", "Your completion rate in the program")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-3 w-48" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">{bi("الإنجاز الكلي", "Overall completion")}</span>
                    <span className="text-2xl font-bold tabular-nums">{progress}%</span>
                  </div>
                  <Progress value={progress} className={cn("h-3 rounded-full", progressColor(progress))} />
                </div>
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
                  {progressMessage(progress, lang)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Support team */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle>{bi("فريق الدعم", "Support team")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-center"><Skeleton className="h-9 w-9 rounded-xl" /><Skeleton className="h-4 w-32" /></div>
                  <div className="flex gap-3 items-center"><Skeleton className="h-9 w-9 rounded-xl" /><Skeleton className="h-4 w-32" /></div>
                </div>
              ) : (
                <>
                  {profile?.mentorId ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-primary/15 text-primary text-xs font-bold">م</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{profile.mentorName || bi('المرشد', 'Mentor')}</p>
                        <p className="text-xs text-muted-foreground">{bi("مرشدك", "Your mentor")}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">{bi("لم يُعيَّن لك مرشد بعد", "No mentor assigned yet")}</p>
                  )}
                  {profile?.coachId ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-sky-500/15 text-sky-600 text-xs font-bold">ت</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{profile.coachName || bi('المدرب', 'Coach')}</p>
                        <p className="text-xs text-muted-foreground">{bi("مدربك", "Your coach")}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">{bi("لم يُعيَّن لك مدرب بعد", "No coach assigned yet")}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle>{bi("إجراءات سريعة", "Quick actions")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/beneficiary-dashboard/courses",  icon: <BookOpen className="h-4 w-4" />,    label: bi("الدورات", "Courses"),  color: "text-purple-500 bg-purple-500/10" },
                { href: "/beneficiary-dashboard/sessions", icon: <Calendar className="h-4 w-4" />,    label: bi("الجلسات", "Sessions"),  color: "text-sky-500 bg-sky-500/10" },
                { href: "/beneficiary-dashboard/messages", icon: <MessageSquare className="h-4 w-4" />,label: bi("الرسائل", "Messages"), color: "text-primary bg-primary/10" },
                { href: "/beneficiary-dashboard/progress", icon: <TrendingUp className="h-4 w-4" />,  label: bi("تقدمي", "My progress"),    color: "text-emerald-600 bg-emerald-500/10" },
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
