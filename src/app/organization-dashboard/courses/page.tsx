"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Enrollment {
  userId: string;
  enrolledAt: string;
  progress: number;
}

interface Course {
  id: string;
  title: string;
  category?: string;
  coachName?: string;
  enrolledCount?: number;
  enrollments?: Enrollment[];
  status?: "published" | "draft" | "منشورة" | "مسودة";
  organizationId?: string;
}

export default function OrgCoursesPage() {
  const { user } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      const json = await res.json();
      setCourses(json.courses || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const avgProgress = (course: Course) => {
    const enrollments = course.enrollments ?? [];
    if (enrollments.length === 0) return 0;
    const total = enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0);
    return Math.round(total / enrollments.length);
  };

  const isPublished = (course: Course) =>
    course.status === 'published' || course.status === 'منشورة';

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">الدورات التدريبية</h1>
        <p className="text-muted-foreground">
          جميع الدورات الخاصة بمنظمتك
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : !courses || courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <BookOpen className="h-12 w-12 opacity-50" />
          <p className="text-lg">لا توجد دورات بعد</p>
          <p className="text-sm">ستظهر هنا الدورات المرتبطة بمنظمتك</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">عنوان الدورة</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">المدرب</TableHead>
              <TableHead className="text-right">المسجلون</TableHead>
              <TableHead className="text-right">متوسط التقدم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.category ?? "—"}</TableCell>
                <TableCell>{course.coachName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {course.enrolledCount ?? 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Progress value={avgProgress(course)} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">{avgProgress(course)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={isPublished(course) ? "default" : "secondary"}>
                    {isPublished(course) ? "منشور" : "مسودة"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewCourse(course)}
                    disabled={(course.enrolledCount ?? 0) === 0}
                  >
                    عرض المسجلين
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Enrollments Dialog */}
      <Dialog open={!!viewCourse} onOpenChange={(open) => !open && setViewCourse(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>المسجلون في: {viewCourse?.title}</DialogTitle>
            <DialogDescription>
              قائمة المستفيدين المسجلين في هذه الدورة وتقدمهم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto py-2">
            {(viewCourse?.enrollments ?? []).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا يوجد مسجلون</p>
            ) : (
              (viewCourse?.enrollments ?? []).map((e) => (
                <div key={e.userId} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium truncate">{e.userId}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Progress value={e.progress} className="h-2 w-20" />
                    <span className="text-xs text-muted-foreground w-8">{e.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
