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
import { ArrowRight, BookOpen, Calendar, UserCheck, TrendingUp } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ar } from "date-fns/locale";

type Profile = {
  id: string; name?: string; email?: string; progress?: number; status?: string;
  mentorId?: string; mentorName?: string; coachId?: string; coachName?: string;
  groupId?: string; phone?: string;
  sessions?: { id: string; title?: string; date?: string; status: string }[];
  enrolledCourses?: { id: string; title: string; progress: number; enrolledAt?: string }[];
};

function safeFormat(dateStr?: string) {
  if (!dateStr) return null;
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, "d MMM yyyy", { locale: ar }) : null; }
  catch { return null; }
}

export default function BeneficiaryProfilePage() {
  const { user: authUser } = useUser();
  const params = useParams();
  const router = useRouter();
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
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{loading ? "جاري التحميل..." : (profile?.name || "مستفيد")}</h1>
          <p className="text-muted-foreground text-sm">ملف المستفيد</p>
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
              { label: "التقدم العام", value: `${progress}%`, icon: <TrendingUp className="h-5 w-5 text-white" />, color: "bg-primary" },
              { label: "الدورات", value: profile?.enrolledCourses?.length ?? 0, icon: <BookOpen className="h-5 w-5 text-white" />, color: "bg-accent" },
              { label: "الجلسات", value: profile?.sessions?.length ?? 0, icon: <Calendar className="h-5 w-5 text-white" />, color: "bg-amber-500" },
              { label: "الحالة", value: progress >= 100 ? "مكتمل" : progress > 0 ? "نشط" : "جديد", icon: <UserCheck className="h-5 w-5 text-white" />, color: "bg-purple-500" },
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
            <Card className="md:col-span-1">
              <CardHeader><CardTitle className="text-base">المعلومات الشخصية</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-3 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">{(profile?.name || 'م').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-semibold">{profile?.name || "بلا اسم"}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {profile?.mentorName && <div className="flex justify-between"><span className="text-muted-foreground">المرشد</span><span className="font-medium">{profile.mentorName}</span></div>}
                  {profile?.coachName && <div className="flex justify-between"><span className="text-muted-foreground">المدرب</span><span className="font-medium">{profile.coachName}</span></div>}
                  {!profile?.mentorName && <p className="text-muted-foreground text-xs">لم يُعيَّن مرشد بعد</p>}
                  {!profile?.coachName && <p className="text-muted-foreground text-xs">لم يُعيَّن مدرب بعد</p>}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">التقدم العام</span><span>{progress}%</span></div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="md:col-span-2 space-y-4">
              {/* Enrolled Courses */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />الدورات المسجل فيها ({profile?.enrolledCourses?.length ?? 0})</CardTitle></CardHeader>
                <CardContent>
                  {(profile?.enrolledCourses ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">لم يسجل في أي دورة بعد.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile!.enrolledCourses!.map(c => (
                        <div key={c.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            {c.enrolledAt && <p className="text-xs text-muted-foreground mt-0.5">تسجيل: {safeFormat(c.enrolledAt)}</p>}
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
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />الجلسات ({profile?.sessions?.length ?? 0})</CardTitle></CardHeader>
                <CardContent>
                  {(profile?.sessions ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">لا توجد جلسات.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile!.sessions!.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2.5 rounded border">
                          <div>
                            <p className="text-sm font-medium">{s.title || "جلسة"}</p>
                            {s.date && <p className="text-xs text-muted-foreground mt-0.5">{safeFormat(s.date)}</p>}
                          </div>
                          <Badge variant={s.status === 'completed' ? 'default' : s.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs gap-1">
                            {s.status === 'completed' ? 'مكتملة' : s.status === 'cancelled' ? 'ملغاة' : 'مجدولة'}
                          </Badge>
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
