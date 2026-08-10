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
import { ArrowRight, BookOpen, Calendar, UserCheck, TrendingUp, Building2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

type OrgHistoryEntry = { id: string; organizationId: string; organizationName: string; joinedAt: string | null; leftAt: string | null };
type Profile = {
  id: string; name?: string; email?: string; progress?: number; status?: string;
  mentorId?: string; mentorName?: string; coachId?: string; coachName?: string;
  groupId?: string; phone?: string;
  sessions?: { id: string; title?: string; date?: any; status: string }[];
  enrolledCourses?: { id: string; title: string; progress: number; enrolledAt?: any }[];
  organizationHistory?: OrgHistoryEntry[];
};

function safeFormat(dateVal?: any, locale: string = 'ar-EG'): string | null {
  if (!dateVal) return null;
  try {
    if (typeof dateVal === 'object' && dateVal._seconds) return new Date(dateVal._seconds * 1000).toLocaleDateString(locale);
    if (typeof dateVal === 'object' && dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString(locale);
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return null; }
}

export default function BeneficiaryProfilePage() {
  const { user: authUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!authUser) return;
    const token = await authUser.getIdToken();
    const res = await fetch(`/api/org/user-profile?userId=${params.id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProfile(data.profile);
    setLoading(false);
  }, [authUser, params.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const progress = profile?.progress ?? 0;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{loading ? bi("جاري التحميل...", "Loading...") : (profile?.name || bi("مستفيد", "Beneficiary"))}</h1>
          <p className="text-muted-foreground text-sm">{bi("ملف المستفيد", "Beneficiary profile")}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: bi("التقدم العام", "Overall progress"), value: `${progress}%`, icon: <TrendingUp className="h-5 w-5 text-white" />, color: "bg-primary" },
              { label: bi("الدورات", "Courses"), value: profile?.enrolledCourses?.length ?? 0, icon: <BookOpen className="h-5 w-5 text-white" />, color: "bg-sky-500" },
              { label: bi("الجلسات", "Sessions"), value: profile?.sessions?.length ?? 0, icon: <Calendar className="h-5 w-5 text-white" />, color: "bg-amber-500" },
              { label: bi("الحالة", "Status"), value: progress >= 100 ? bi("مكتمل", "Completed") : progress > 0 ? bi("نشط", "Active") : bi("جديد", "New"), icon: <UserCheck className="h-5 w-5 text-white" />, color: "bg-purple-500" },
            ].map((s, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className={`h-8 w-8 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                </CardHeader>
                <CardContent><div className="text-xl font-bold">{s.value}</div></CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Profile Info */}
            <Card className="md:col-span-1 border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">{bi("المعلومات الشخصية", "Personal information")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-3 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">{(profile?.name || 'م').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-semibold">{profile?.name || bi("بلا اسم", "No name")}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {profile?.mentorName && <div className="flex justify-between"><span className="text-muted-foreground">{bi("المرشد", "Mentor")}</span><span className="font-medium">{profile.mentorName}</span></div>}
                  {profile?.coachName && <div className="flex justify-between"><span className="text-muted-foreground">{bi("المدرب", "Coach")}</span><span className="font-medium">{profile.coachName}</span></div>}
                  {!profile?.mentorName && <p className="text-muted-foreground text-xs">{bi("لم يُعيَّن مرشد بعد", "No mentor assigned yet")}</p>}
                  {!profile?.coachName && <p className="text-muted-foreground text-xs">{bi("لم يُعيَّن مدرب بعد", "No coach assigned yet")}</p>}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{bi("التقدم العام", "Overall progress")}</span><span>{progress}%</span></div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="md:col-span-2 space-y-4">
              {/* Enrolled Courses */}
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />{bi("الدورات المسجل فيها", "Enrolled courses")} ({profile?.enrolledCourses?.length ?? 0})</CardTitle></CardHeader>
                <CardContent>
                  {(profile?.enrolledCourses ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">{bi("لم يسجل في أي دورة بعد.", "Not enrolled in any course yet.")}</p>
                  ) : (
                    <div className="space-y-3">
                      {profile!.enrolledCourses!.map(c => (
                        <div key={c.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            {c.enrolledAt && <p className="text-xs text-muted-foreground mt-0.5">{bi("تسجيل:", "Enrolled:")} {safeFormat(c.enrolledAt, locale)}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Progress value={c.progress} className="h-1.5 w-20" />
                            <span className="text-xs text-muted-foreground">{c.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />{bi("الجلسات", "Sessions")} ({profile?.sessions?.length ?? 0})</CardTitle></CardHeader>
                <CardContent>
                  {(profile?.sessions ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">{bi("لا توجد جلسات.", "No sessions.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {profile!.sessions!.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2.5 rounded border">
                          <div>
                            <p className="text-sm font-medium">{s.title || bi("جلسة", "Session")}</p>
                            {s.date && <p className="text-xs text-muted-foreground mt-0.5">{safeFormat(s.date, locale)}</p>}
                          </div>
                          <Badge variant={s.status === 'completed' ? 'default' : s.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs gap-1">
                            {s.status === 'completed' ? bi('مكتملة', 'Completed') : s.status === 'cancelled' ? bi('ملغاة', 'Cancelled') : bi('مجدولة', 'Scheduled')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Organization History */}
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />{bi("سجل الانتساب للمنظمات", "Organization membership history")}</CardTitle></CardHeader>
                <CardContent>
                  {(profile?.organizationHistory ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">{bi("لا يوجد سجل انتساب.", "No membership history.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {profile!.organizationHistory!.map(h => (
                        <div key={h.id} className="flex items-center justify-between p-2.5 rounded border">
                          <div>
                            <p className="text-sm font-medium">{h.organizationName || bi("منظمة", "Organization")}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {safeFormat(h.joinedAt, locale) || "—"}{h.leftAt ? ` — ${safeFormat(h.leftAt, locale)}` : ""}
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
        </>
      )}
    </div>
  );
}
