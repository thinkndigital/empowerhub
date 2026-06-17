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
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

interface Course {
  id: string;
  title: string;
  category?: string;
  coachName?: string;
  enrolledCount?: number;
  status?: "published" | "draft";
  organizationId?: string;
}

export default function OrgCoursesPage() {
  const { user } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.category ?? "—"}</TableCell>
                <TableCell>{course.coachName ?? "—"}</TableCell>
                <TableCell>{course.enrolledCount ?? 0}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      course.status === "published" ? "default" : "secondary"
                    }
                  >
                    {course.status === "published" ? "منشور" : "مسودة"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
