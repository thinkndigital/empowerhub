"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, BookOpen } from "lucide-react";

export default function CourseDetailPage() {
  const { user: authUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [sliderVal, setSliderVal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!authUser) return;
    const token = await authUser.getIdToken();
    const [cRes, pRes] = await Promise.all([
      fetch(`/api/courses?all=true`, { headers: { authorization: `Bearer ${token}` } }),
      fetch(`/api/courses/${params.courseId}/progress`, { headers: { authorization: `Bearer ${token}` } }),
    ]);
    const cData = await cRes.json();
    const pData = await pRes.json();
    const found = (cData.courses || []).find((c: any) => c.id === params.courseId);
    setCourse(found || null);
    const p = pData.progress ?? 0;
    setProgress(p);
    setSliderVal(p);
    setLoading(false);
  }, [authUser, params.courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const saveProgress = async () => {
    if (!authUser) return;
    setSaving(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/courses/${params.courseId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ progress: sliderVal }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setProgress(sliderVal);
      toast({ title: "تم الحفظ", description: `تقدمك: ${sliderVal}%` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowRight className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{loading ? "جاري التحميل..." : (course?.title || "الدورة")}</h1>
          <p className="text-sm text-muted-foreground">تفاصيل الدورة وتتبع تقدمك</p>
        </div>
      </div>

      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm md:col-span-1">
            <CardHeader><CardTitle className="text-base">معلومات الدورة</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-primary/40" />
              </div>
              {course?.category && <p className="text-sm text-muted-foreground">{course.category}</p>}
              {course?.coachName && <p className="text-sm"><span className="text-muted-foreground">المدرب: </span>{course.coachName}</p>}
              {course?.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader><CardTitle className="text-base">تقدمي في الدورة</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">نسبة الإنجاز الحالية</span>
                  <span className="text-primary font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">تحديث تقدمك</p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[sliderVal]}
                    onValueChange={([v]) => setSliderVal(v)}
                    min={0} max={100} step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold w-10 text-right">{sliderVal}%</span>
                </div>
                <Button onClick={saveProgress} disabled={saving || sliderVal === progress} className="w-full">
                  {saving ? "جاري الحفظ..." : "حفظ التقدم"}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                {progress === 0 ? "لم تبدأ بعد — ابدأ الآن وحدّث تقدمك!" :
                 progress < 50 ? "أنت في البداية، استمر!" :
                 progress < 100 ? "رائع، أنت في منتصف الطريق!" :
                 "🎉 أكملت الدورة، تهانينا!"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
