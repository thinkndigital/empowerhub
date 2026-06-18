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
import { ArrowRight, Users, Calendar, BookOpen, CheckCircle, Clock, XCircle } from "lucide-react";

type Enrollment = { userId: string; name: string; progress: number; enrolledAt?: any };
type CreatedCourse = { id: string; title: string; status?: string; enrollments: Enrollment[] };
type Session = { id: string; title?: string; date?: any; status?: string };
type CoachProfile = {
  id: string; name?: string; email?: string; bio?: string; specializations?: string;
  sessions?: Session[];
  createdCourses?: CreatedCourse[];
};

function formatDate(dateVal?: any): string {
  if (!dateVal) return "—";
  try {
    // Firestore Timestamp object
    if (typeof dateVal === 'object' && dateVal._seconds) {
      return new Date(dateVal._seconds * 1000).toLocaleDateString('ar-SA');
    }
    if (typeof dateVal === 'object' && dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString('ar-SA');
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return String(dateVal); }
}

function SessionBadge({ status }: { status?: string }) {
  if (status === 'completed') return <Badge className="gap-1 bg-green-600 text-white"><CheckCircle className="h-3 w-3" />مكتملة</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />ملغاة</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />مجدولة</Badge>;
}

export default function CoachProfilePage() {
  const { user: authUser } = useUser();
  const params = useParams();
  const router = useRouter();
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
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowRight className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{profile?.name || "مدرب"}</h1>
          <p className="text-muted-foreground text-sm">ملف المدرب</p>
        </div>
      </div>

      {loading ? <Skeleton className="h-64 w-full" /> : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-base">المعلومات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col items-center gap-2 pb-3 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">{(profile?.name || 'م').charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{profile?.name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <Badge>مدرب</Badge>
              </div>
              {profile?.specializations && <div><p className="text-xs text-muted-foreground">التخصصات</p><p className="text-sm">{profile.specializations}</p></div>}
              {profile?.bio && <div><p className="text-xs text-muted-foreground">نبذة</p><p className="text-sm">{profile.bio}</p></div>}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">الدورات</span><span className="font-bold">{courses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الجلسات</span><span className="font-bold">{sessions.length}</span>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />الدورات ({courses.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? <p className="text-muted-foreground text-sm">لا توجد دورات.</p> : courses.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{c.title}</span>
                      <Badge variant={(c.status === 'published' || c.status === 'منشورة') ? 'default' : 'secondary'}>
                        {(c.status === 'published' || c.status === 'منشورة') ? 'منشورة' : 'مسودة'}
                      </Badge>
                    </div>
                    {c.enrollments.length === 0 ? (
                      <p className="text-xs text-muted-foreground pr-1">لا يوجد مسجلون</p>
                    ) : (
                      <div className="space-y-1.5">
                        {c.enrollments.map(e => (
                          <div key={e.userId} className="flex items-center justify-between gap-3 bg-muted/50 rounded p-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium truncate">{e.name}</span>
                              {e.enrolledAt && <span className="text-xs text-muted-foreground shrink-0">— {formatDate(e.enrolledAt)}</span>}
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

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />الجلسات ({sessions.length})</CardTitle></CardHeader>
              <CardContent>
                {sessions.length === 0 ? <p className="text-muted-foreground text-sm">لا توجد جلسات.</p> : (
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{s.title || "جلسة"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.date)}</p>
                        </div>
                        <SessionBadge status={s.status} />
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
