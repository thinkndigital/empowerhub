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
import { BookOpen, Users, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

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

interface Beneficiary {
  id: string;
  name?: string;
  email?: string;
}

export default function OrgCoursesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  // Assign dialog state
  const [assignCourse, setAssignCourse] = useState<Course | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

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

  const fetchBeneficiaries = useCallback(async () => {
    if (!user) return;
    setLoadingBeneficiaries(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/users?role=beneficiary&scope=org', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch beneficiaries');
      const json = await res.json();
      setBeneficiaries(json.users || []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setLoadingBeneficiaries(false);
    }
  }, [user]);

  const openAssignDialog = (course: Course) => {
    setAssignCourse(course);
    setSelectedBeneficiaryIds([]);
    fetchBeneficiaries();
  };

  const toggleBeneficiary = (id: string) => {
    setSelectedBeneficiaryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!user || !assignCourse || selectedBeneficiaryIds.length === 0) return;
    setAssigning(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/courses/assign', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: assignCourse.id, beneficiaryIds: selectedBeneficiaryIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل التعيين');
      }
      toast({ title: "تم التعيين بنجاح", description: `تم تسجيل ${selectedBeneficiaryIds.length} مستفيد في الدورة.` });
      setAssignCourse(null);
      setSelectedBeneficiaryIds([]);
      fetchCourses();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

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
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">عنوان الدورة</TableHead>
              <TableHead className="text-right hidden md:table-cell">الفئة</TableHead>
              <TableHead className="text-right hidden md:table-cell">المدرب</TableHead>
              <TableHead className="text-right">المسجلون</TableHead>
              <TableHead className="text-right hidden lg:table-cell">متوسط التقدم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium min-w-[120px]">{course.title}</TableCell>
                <TableCell className="hidden md:table-cell">{course.category ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{course.coachName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {course.enrolledCount ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewCourse(course)}
                      disabled={(course.enrolledCount ?? 0) === 0}
                    >
                      عرض المسجلين
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openAssignDialog(course)}
                    >
                      <UserPlus className="h-3 w-3 ml-1" />
                      تعيين لمستفيد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      {/* Enrollments Dialog */}
      <Dialog open={!!viewCourse} onOpenChange={(open) => !open && setViewCourse(null)}>
        <DialogContent dir="rtl" className="sm:max-w-[90vw] md:max-w-lg">
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

      {/* Assign to Beneficiary Dialog */}
      <Dialog open={!!assignCourse} onOpenChange={(open) => !open && setAssignCourse(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              تعيين الدورة لمستفيد
            </DialogTitle>
            <DialogDescription>
              اختر المستفيدين لتسجيلهم في: {assignCourse?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-72 overflow-y-auto py-2">
            {loadingBeneficiaries ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
              </div>
            ) : beneficiaries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا يوجد مستفيدون في منظمتك</p>
            ) : (
              beneficiaries.map(b => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleBeneficiary(b.id)}
                >
                  <Checkbox
                    checked={selectedBeneficiaryIds.includes(b.id)}
                    onCheckedChange={() => toggleBeneficiary(b.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name || 'مستفيد'}</p>
                    {b.email && <p className="text-xs text-muted-foreground truncate">{b.email}</p>}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignCourse(null)}>إلغاء</Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || selectedBeneficiaryIds.length === 0}
            >
              {assigning ? 'جارٍ التعيين...' : `تعيين (${selectedBeneficiaryIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
