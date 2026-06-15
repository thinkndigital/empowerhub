
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
                toast({ title: "تم بنجاح!", description: `تمت إضافة دورة "${values.title}" كمسودة.` });
                form.reset();
                setIsAddDialogOpen(false);
            })
            .catch((serverError) => {
                toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من إضافة الدورة." });
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
                title: newStatus === "منشورة" ? "تم النشر!" : "تم الإلغاء!",
                description: `تم تحديث حالة دورة "${course.title}".`,
            });
        }).catch((err) => {
             toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث."});
             const permissionError = new FirestorePermissionError({ path: courseRef.path, operation: 'update', requestResourceData: { status: newStatus } });
             errorEmitter.emit('permission-error', permissionError);
        });
    }
    
    const handleDelete = async () => {
        if (!deleteCourse || !firestore) return;
        const courseRef = doc(firestore, 'courses', deleteCourse.id);
        deleteDoc(courseRef)
            .then(() => {
                toast({ variant: "destructive", title: "تم الحذف!", description: `تم حذف دورة "${deleteCourse.title}".` });
                setDeleteCourse(null);
            })
            .catch((serverError) => {
                toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من حذف الدورة." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: courseRef.path, operation: 'delete' }));
                setDeleteCourse(null);
            });
    }

    const handleExport = () => {
        toast({ title: "جاري تصدير قائمة الدورات...", description: "سيتم تنزيل ملف CSV قريبًا." });
    }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>الدورات التدريبية</CardTitle>
                <CardDescription>
                إدارة جميع الدورات التدريبية المتاحة على المنصة.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                      <DialogDescription>
                        أدخل تفاصيل الدورة الجديدة هنا. انقر على "حفظ" عند الانتهاء.
                      </DialogDescription>
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
      </CardHeader>
      <CardContent>
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
                  <Badge variant={course.status === "منشورة" ? "default" : "secondary"}>
                    {course.status || 'مسودة'}
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
                         {course.status === "منشورة" ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                         {course.status === "منشورة" ? 'إلغاء النشر' : 'نشر الدورة'}
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
    </>
  );
}

    
