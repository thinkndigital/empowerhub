"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Users, Calendar, BookOpen, CheckCircle, Clock, XCircle, Building2, Wallet } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

type Enrollment = { userId: string; name: string; progress: number; enrolledAt?: any };
type CreatedCourse = { id: string; title: string; status?: string; enrollments: Enrollment[] };
type Session = { id: string; title?: string; date?: any; status?: string };
type OrgHistoryEntry = { id: string; organizationId: string; organizationName: string; joinedAt: string | null; leftAt: string | null };
type Earnings = { hourlyRate: number; orgCommissionPercent: number; billableSessions: number; totalHours: number; gross: number; orgCut: number; net: number };
type CoachProfile = {
  id: string; name?: string; email?: string; bio?: string; specializations?: string;
  sessions?: Session[];
  createdCourses?: CreatedCourse[];
  organizationHistory?: OrgHistoryEntry[];
  earnings?: Earnings | null;
};

function formatDate(dateVal?: any, locale: string = 'ar-EG'): string {
  if (!dateVal) return "—";
  try {
    // Firestore Timestamp object
    if (typeof dateVal === 'object' && dateVal._seconds) {
      return new Date(dateVal._seconds * 1000).toLocaleDateString(locale);
    }
    if (typeof dateVal === 'object' && dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString(locale);
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return String(dateVal); }
}

function SessionBadge({ status, bi }: { status?: string; bi: (ar: string, en: string) => string }) {
  if (status === 'completed') return <Badge className="gap-1 bg-green-600 text-white"><CheckCircle className="h-3 w-3" />{bi('مكتملة', 'Completed')}</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{bi('ملغاة', 'Cancelled')}</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{bi('مجدولة', 'Scheduled')}</Badge>;
}

export default function CoachProfilePage() {
  const { user: authUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    const token = await authUser.getIdToken();
    const res = await fetch(`/api/org/user-profile?userId=${params.id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProfile(data.profile);
    setLoading(false);
  }, [authUser, params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sessions = profile?.sessions ?? [];
  const courses = profile?.createdCourses ?? [];

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowRight className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile?.name || bi("مدرب", "Coach")}</h1>
          <p className="text-muted-foreground text-sm">{bi("ملف المدرب", "Coach profile")}</p>
        </div>
      </div>

      {loading ? <Skeleton className="h-64 w-full" /> : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{bi("المعلومات", "Information")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col items-center gap-2 pb-3 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">{(profile?.name || 'م').charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{profile?.name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <Badge>{bi("مدرب", "Coach")}</Badge>
              </div>
              {profile?.specializations && <div><p className="text-xs text-muted-foreground">{bi("التخصصات", "Specializations")}</p><p className="text-sm">{profile.specializations}</p></div>}
              {profile?.bio && <div><p className="text-xs text-muted-foreground">{bi("نبذة", "Bio")}</p><p className="text-sm">{profile.bio}</p></div>}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">{bi("الدورات", "Courses")}</span><span className="font-bold">{courses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{bi("الجلسات", "Sessions")}</span><span className="font-bold">{sessions.length}</span>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            {profile?.earnings && (
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" />{bi("المحاسبة", "Earnings")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-primary">{profile.earnings.net.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{bi("صافي المستحقات (د.أ)", "Net earnings (JOD)")}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{profile.earnings.gross.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{bi("الإجمالي قبل الخصم (د.أ)", "Gross before deduction (JOD)")}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{profile.earnings.billableSessions}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{bi("جلسات محتسبة", "Billable sessions")}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{profile.earnings.totalHours}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{bi("إجمالي الساعات", "Total hours")}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center border-t pt-3">
                    {bi(
                      `سعر الساعة ${profile.earnings.hourlyRate.toLocaleString()} د.أ، ونسبة المنظمة ${profile.earnings.orgCommissionPercent}%`,
                      `Hourly rate ${profile.earnings.hourlyRate.toLocaleString()} JOD, org commission ${profile.earnings.orgCommissionPercent}%`
                    )}
                    {profile.earnings.orgCut > 0 && <> {bi(`(خُصم ${profile.earnings.orgCut.toLocaleString()} د.أ)`, `(deducted ${profile.earnings.orgCut.toLocaleString()} JOD)`)}</>}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />{bi("الدورات", "Courses")} ({courses.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? <p className="text-muted-foreground text-sm">{bi("لا توجد دورات.", "No courses.")}</p> : courses.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{c.title}</span>
                      <Badge variant={(c.status === 'published' || c.status === 'منشورة') ? 'default' : 'secondary'}>
                        {(c.status === 'published' || c.status === 'منشورة') ? bi('منشورة', 'Published') : bi('مسودة', 'Draft')}
                      </Badge>
                    </div>
                    {c.enrollments.length === 0 ? (
                      <p className="text-xs text-muted-foreground pr-1">{bi("لا يوجد مسجلون", "No enrollees")}</p>
                    ) : (
                      <div className="space-y-1.5">
                        {c.enrollments.map(e => (
                          <div key={e.userId} className="flex items-center justify-between gap-3 bg-muted/50 rounded p-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium truncate">{e.name}</span>
                              {e.enrolledAt && <span className="text-xs text-muted-foreground shrink-0">— {formatDate(e.enrolledAt, locale)}</span>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Progress value={e.progress} className="h-1.5 w-16" />
                              <span className="text-xs w-8">{e.progress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />{bi("الجلسات", "Sessions")} ({sessions.length})</CardTitle></CardHeader>
              <CardContent>
                {sessions.length === 0 ? <p className="text-muted-foreground text-sm">{bi("لا توجد جلسات.", "No sessions.")}</p> : (
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{s.title || bi("جلسة", "Session")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.date, locale)}</p>
                        </div>
                        <SessionBadge status={s.status} bi={bi} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />{bi("سجل الانتساب للمنظمات", "Organization membership history")}</CardTitle></CardHeader>
              <CardContent>
                {(profile?.organizationHistory ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">{bi("لا يوجد سجل انتساب.", "No membership history.")}</p>
                ) : (
                  <div className="space-y-2">
                    {profile!.organizationHistory!.map(h => (
                      <div key={h.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{h.organizationName || bi("منظمة", "Organization")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(h.joinedAt, locale)}{h.leftAt ? ` — ${formatDate(h.leftAt, locale)}` : ""}
                          </p>
                        </div>
                        <Badge variant={h.leftAt ? "secondary" : "default"} className="text-xs">{h.leftAt ? bi("سابقة", "Past") : bi("حالية", "Current")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
