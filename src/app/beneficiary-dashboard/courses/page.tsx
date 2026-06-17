"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users } from "lucide-react";
import Link from "next/link";

type Enrollment = {
  userId: string;
  enrolledAt: string;
  progress: number;
};

type Course = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  coachName?: string;
  enrolledCount?: number;
  enrollments?: Enrollment[];
  status?: string;
};

export default function BeneficiaryCoursesPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/courses?all=true', {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setCourses(json.courses || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const isEnrolled = (course: Course) =>
    !!course.enrollments?.some((e) => e.userId === authUser?.uid);

  const myProgress = (course: Course) =>
    course.enrollments?.find((e) => e.userId === authUser?.uid)?.progress ?? 0;

  const handleEnroll = async (course: Course) => {
    if (!authUser) return;
    setEnrollingId(course.id);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "تم التسجيل!", description: `تم تسجيلك في دورة "${course.title}" بنجاح.` });
      fetchCourses();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ!", description: e.message || "فشل التسجيل في الدورة." });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">الدورات التدريبية</h1>
        <p className="text-muted-foreground">تصفح الدورات المتاحة وانضم إليها</p>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-32 w-full rounded-md mb-3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <BookOpen className="h-12 w-12 opacity-50" />
          <p className="text-lg">لا توجد دورات منشورة حالياً</p>
          <p className="text-sm">تواصل مع مدربك لمزيد من المعلومات</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const enrolled = isEnrolled(course);
            const progress = myProgress(course);
            return (
              <Card key={course.id} className="border-0 shadow-sm flex flex-col">
                <CardHeader className="pb-3">
                  <div className="h-32 w-full rounded-md bg-primary/10 flex items-center justify-center mb-3">
                    <BookOpen className="h-12 w-12 text-primary/40" />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{course.title}</CardTitle>
                    {enrolled && (
                      <Badge className="shrink-0 bg-green-100 text-green-700 border-green-200">مسجل</Badge>
                    )}
                  </div>
                  {course.category && (
                    <CardDescription>{course.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                  {course.coachName && (
                    <p className="text-sm"><span className="text-muted-foreground">المدرب: </span>{course.coachName}</p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{course.enrolledCount ?? 0} مسجل</span>
                  </div>
                  {enrolled && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>التقدم</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-3">
                  {enrolled ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/beneficiary-dashboard/courses/${course.id}`}>متابعة الدورة</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleEnroll(course)}
                      disabled={enrollingId === course.id}
                    >
                      {enrollingId === course.id ? 'جاري التسجيل...' : 'انضم للدورة'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
