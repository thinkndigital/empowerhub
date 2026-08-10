
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
import { useState } from "react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLanguage } from "@/components/language-provider";


type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: "منشورة" | "مسودة";
};

const formSchema = z.object({
    title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
    category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
    description: z.string().optional(),
});


export default function CoursesPage() {
    const { toast } = useToast();
    const { lang, dir } = useLanguage();
    const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
    const firestore = useFirestore();

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"));
    }, [firestore]);

    const { data: courses, isLoading: loading } = useCollection<Course>(coursesQuery);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { title: "", category: "", description: "" },
    });

    async function onAddSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore) return;
        const newCourseData = { ...values, status: "مسودة" as const };
        const coursesCollection = collection(firestore, "courses");
        
        addDoc(coursesCollection, newCourseData)
            .then(() => {
                toast({ title: bi("تم بنجاح!", "Success!"), description: bi(`تمت إضافة دورة "${values.title}" كمسودة.`, `Course "${values.title}" was added as a draft.`) });
                form.reset();
                setIsAddDialogOpen(false);
            })
            .catch((serverError) => {
                toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: bi("لم نتمكن من إضافة الدورة.", "We couldn't add the course.") });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: coursesCollection.path, operation: 'create', requestResourceData: newCourseData }));
            });
    }

    async function handlePublish(course: Course) {
        if (!firestore) return;
        const courseRef = doc(firestore, "courses", course.id);
        const newStatus = course.status === "منشورة" ? "مسودة" : "منشورة";

        updateDoc(courseRef, { status: newStatus })
        .then(() => {
            toast({
                title: newStatus === "منشورة" ? bi("تم النشر!", "Published!") : bi("تم الإلغاء!", "Unpublished!"),
                description: bi(`تم تحديث حالة دورة "${course.title}".`, `The status of course "${course.title}" was updated.`),
            });
        }).catch((err) => {
             toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشلت عملية التحديث.", "The update failed.")});
             const permissionError = new FirestorePermissionError({ path: courseRef.path, operation: 'update', requestResourceData: { status: newStatus } });
             errorEmitter.emit('permission-error', permissionError);
        });
    }

    const handleDelete = async () => {
        if (!deleteCourse || !firestore) return;
        const courseRef = doc(firestore, 'courses', deleteCourse.id);
        deleteDoc(courseRef)
            .then(() => {
                toast({ variant: "destructive", title: bi("تم الحذف!", "Deleted!"), description: bi(`تم حذف دورة "${deleteCourse.title}".`, `Course "${deleteCourse.title}" was deleted.`) });
                setDeleteCourse(null);
            })
            .catch((serverError) => {
                toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: bi("لم نتمكن من حذف الدورة.", "We couldn't delete the course.") });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: courseRef.path, operation: 'delete' }));
                setDeleteCourse(null);
            });
    }

    const handleExport = () => {
        toast({ title: bi("جاري تصدير قائمة الدورات...", "Exporting courses list..."), description: bi("سيتم تنزيل ملف CSV قريبًا.", "The CSV file will download shortly.") });
    }

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("الدورات التدريبية", "Training Courses")}</h1>
          <p className="text-sm text-muted-foreground">{bi("إدارة جميع الدورات التدريبية المتاحة على المنصة.", "Manage all training courses available on the platform.")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            {bi("تصدير", "Export")}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                {bi("إضافة دورة جديدة", "Add new course")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir={dir}>
              <DialogHeader>
                <DialogTitle>{bi("إضافة دورة جديدة", "Add new course")}</DialogTitle>
                <DialogDescription>{bi('أدخل تفاصيل الدورة الجديدة هنا. انقر على "حفظ" عند الانتهاء.', 'Enter the new course details here. Click "Save" when done.')}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>{bi("عنوان الدورة", "Course title")}</FormLabel><FormControl><Input placeholder={bi("مثال: أساسيات البرمجة", "e.g. Programming basics")} {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>{bi("الفئة", "Category")}</FormLabel><FormControl><Input placeholder={bi("مثال: التكنولوجيا", "e.g. Technology")} {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>{bi("وصف الدورة (اختياري)", "Course description (optional)")}</FormLabel><FormControl><Textarea placeholder={bi("وصف موجز لمحتوى الدورة...", "A brief description of the course content...")} {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
                    <Button type="submit">{bi("حفظ الدورة", "Save course")}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{bi("قائمة الدورات", "Courses list")}</CardTitle>
          <CardDescription>{!loading ? `${courses?.length || 0} ${bi("دورة", "courses")}` : bi('جاري التحميل...', 'Loading...')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{bi("عنوان الدورة", "Course title")}</TableHead>
              <TableHead className="hidden md:table-cell">{bi("الفئة", "Category")}</TableHead>
              <TableHead className="text-center">{bi("الحالة", "Status")}</TableHead>
              <TableHead>
                <span className="sr-only">{bi("الإجراءات", "Actions")}</span>
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
                 <TableCell className="hidden md:table-cell">{course.category || bi('غير مصنف', 'Uncategorized')}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={course.status === "منشورة" ? "default" : "secondary"}>
                    {course.status || bi('مسودة', 'Draft')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{bi("قائمة", "Menu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{bi("الإجراءات", "Actions")}</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                         <Link href={`/admin-dashboard/courses/${course.id}`}>
                            <Edit className="ml-2 h-4 w-4" />
                            {bi("تحرير المحتوى", "Edit content")}
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handlePublish(course)}>
                         {course.status === "منشورة" ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                         {course.status === "منشورة" ? bi('إلغاء النشر', 'Unpublish') : bi('نشر الدورة', 'Publish course')}
                       </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setDeleteCourse(course); }}>
                          <Trash2 className="ml-2 h-4 w-4" />
                          {bi("حذف الدورة", "Delete course")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && (!courses || courses.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">{bi("لا توجد دورات لعرضها.", "No courses to display.")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={!!deleteCourse} onOpenChange={(isOpen) => !isOpen && setDeleteCourse(null)}>
        <AlertDialogContent dir={dir}>
            <AlertDialogHeader>
                <AlertDialogTitle>{bi("هل أنت متأكد تمامًا؟", "Are you absolutely sure?")}</AlertDialogTitle>
                <AlertDialogDescription>
                    {bi(`هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف دورة "${deleteCourse?.title}" نهائيًا.`, `This action cannot be undone. This will permanently delete the course "${deleteCourse?.title}".`)}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{bi("إلغاء", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{bi("نعم، قم بالحذف", "Yes, delete it")}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}

    
