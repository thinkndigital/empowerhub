
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Download, Edit, Trash2, Check, X } from "lucide-react";
import Link from 'next/link';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";


type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: "published" | "draft";
};

const formSchema = z.object({
    title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
    category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
    description: z.string().optional(),
});


export default function CoursesPage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = useCallback(async () => {
        if (!authUser) return;
        setLoading(true);
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/admin/courses', { headers: { authorization: `Bearer ${token}` } });
            const data = await res.json();
            setCourses(data.courses || []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [authUser]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { title: "", category: "", description: "" },
    });

    async function onAddSubmit(values: z.infer<typeof formSchema>) {
        if (!authUser) return;
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error();
            toast({ title: "تم بنجاح!", description: `تمت إضافة دورة "${values.title}" كمسودة.` });
            form.reset();
            setIsAddDialogOpen(false);
            fetchCourses();
        } catch {
            toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من إضافة الدورة." });
        }
    }

    async function handlePublish(course: Course) {
        if (!authUser) return;
        const newStatus = course.status === "published" ? "draft" : "published";
        try {
            const token = await authUser.getIdToken();
            const res = await fetch(`/api/admin/courses/${course.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            toast({
                title: newStatus === "published" ? "تم النشر!" : "تم الإلغاء!",
                description: `تم تحديث حالة دورة "${course.title}".`,
            });
            fetchCourses();
        } catch {
             toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث."});
        }
    }

    const handleDelete = async () => {
        if (!deleteCourse || !authUser) return;
        try {
            const token = await authUser.getIdToken();
            const res = await fetch(`/api/admin/courses/${deleteCourse.id}`, {
                method: 'DELETE',
                headers: { authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            toast({ variant: "destructive", title: "تم الحذف!", description: `تم حذف دورة "${deleteCourse.title}".` });
            setDeleteCourse(null);
            fetchCourses();
        } catch {
            toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من حذف الدورة." });
            setDeleteCourse(null);
        }
    }

    const handleExport = () => {
        toast({ title: "جاري تصدير قائمة الدورات...", description: "سيتم تنزيل ملف CSV قريبًا." });
    }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الدورات التدريبية</h1>
          <p className="text-sm text-muted-foreground">إدارة جميع الدورات التدريبية المتاحة على المنصة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة دورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة دورة جديدة</DialogTitle>
                <DialogDescription>أدخل تفاصيل الدورة الجديدة هنا. انقر على "حفظ" عند الانتهاء.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input placeholder="مثال: أساسيات البرمجة" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: التكنولوجيا" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>وصف الدورة (اختياري)</FormLabel><FormControl><Textarea placeholder="وصف موجز لمحتوى الدورة..." {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                    <Button type="submit">حفظ الدورة</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">قائمة الدورات</CardTitle>
          <CardDescription>{!loading ? `${courses?.length || 0} دورة` : 'جاري التحميل...'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان الدورة</TableHead>
              <TableHead className="hidden md:table-cell">الفئة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                 <TableCell className="hidden md:table-cell">{course.category || 'غير مصنف'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={course.status === "published" ? "default" : "secondary"}>
                    {course.status === "published" ? "منشورة" : "مسودة"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                         <Link href={`/admin-dashboard/courses/${course.id}`}>
                            <Edit className="ml-2 h-4 w-4" />
                            تحرير المحتوى
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handlePublish(course)}>
                         {course.status === "published" ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                         {course.status === "published" ? 'إلغاء النشر' : 'نشر الدورة'}
                       </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setDeleteCourse(course); }}>
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف الدورة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && (!courses || courses.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">لا توجد دورات لعرضها.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={!!deleteCourse} onOpenChange={(isOpen) => !isOpen && setDeleteCourse(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف دورة "{deleteCourse?.title}" نهائيًا.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}

    
