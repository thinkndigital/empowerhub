"use client";

import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
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
  const { userProfile } = useUser();
  const firestore = useFirestore();

  const orgId = userProfile?.organizationId ?? "";

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "courses"),
      where("organizationId", "==", orgId)
    );
  }, [firestore, orgId]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

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
