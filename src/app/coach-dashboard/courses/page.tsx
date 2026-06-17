
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Download, Edit, Video, Trash2, Check, X, Calendar as CalendarIcon } from "lucide-react";
import Link from 'next/link';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: "منشورة" | "مسودة";
};


const addCourseFormSchema = z.object({
    title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
    category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
    description: z.string().optional(),
});

const addSessionFormSchema = z.object({
  title: z.string().min(3, { message: "عنوان الجلسة مطلوب." }),
  date: z.date({ required_error: "تاريخ الجلسة مطلوب." }),
  duration: z.coerce.number().positive({ message: "المدة يجب أن تكون رقمًا موجبًا."}),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});


export default function CoachCoursesPage() {
    const { toast } = useToast();
    const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
    const [sessionCourse, setSessionCourse] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const { user: authUser } = useUser();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = useCallback(async () => {
        if (!authUser) return;
        setLoading(true);
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/courses', { headers: { authorization: `Bearer ${token}` } });
            setCourses((await res.json()).courses || []);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [authUser]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const addCourseForm = useForm<z.infer<typeof addCourseFormSchema>>({
        resolver: zodResolver(addCourseFormSchema),
        defaultValues: { title: "", category: "", description: "" },
    });
    
    const addSessionForm = useForm<z.infer<typeof addSessionFormSchema>>({
        resolver: zodResolver(addSessionFormSchema),
        defaultValues: {
            meetLink: "",
        },
    });

    async function onAddCourseSubmit(values: z.infer<typeof addCourseFormSchema>) {
        if (!authUser) return;
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(values) });
            if (!res.ok) throw new Error((await res.json()).error);
            toast({ title: "تم بنجاح!", description: `تمت إضافة دورة "${values.title}" كمسودة.` });
            addCourseForm.reset();
            setIsAddCourseDialogOpen(false);
            fetchCourses();
        } catch { toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من إضافة الدورة." }); }
    }

    async function onAddSessionSubmit(values: z.infer<typeof addSessionFormSchema>) {
        if (!authUser || !sessionCourse) return;
        try {
            const token = await authUser.getIdToken();
            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...values, date: values.date.toISOString(), attendees: [], status: 'scheduled', courseId: sessionCourse.id, meetLink: values.meetLink || '' }),
            });
            toast({ title: "تمت الجدولة!", description: `تمت جدولة جلسة "${values.title}".` });
            addSessionForm.reset();
            setSessionCourse(null);
        } catch { toast({ variant: "destructive", title: "خطأ!", description: "فشل جدولة الجلسة." }); }
    }

    const handleExport = () => {
        toast({ title: "جاري تصدير قائمة الدورات...", description: "سيتم تنزيل ملف CSV قريبًا." });
    }

    async function handlePublish(course: Course) {
        if (!authUser) return;
        const newStatus = course.status === "منشورة" ? "مسودة" : "منشورة";
        try {
            const token = await authUser.getIdToken();
            await fetch('/api/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id: course.id, status: newStatus }) });
            toast({ title: newStatus === "منشورة" ? "تم النشر!" : "تم الإلغاء!", description: `تم تحديث حالة دورة "${course.title}".` });
            fetchCourses();
        } catch { toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث." }); }
    }

    async function handleDelete() {
        if (!authUser || !courseToDelete) return;
        try {
            const token = await authUser.getIdToken();
            await fetch(`/api/courses?id=${courseToDelete.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
            toast({ title: "تم الحذف!", description: `تم حذف دورة "${courseToDelete.title}".` });
            setCourseToDelete(null);
            fetchCourses();
        } catch { toast({ variant: "destructive", title: "خطأ!", description: "فشل حذف الدورة." }); }
    }



  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>دوراتي التدريبية</CardTitle>
                <CardDescription>
                إدارة جميع الدورات التدريبية التي قمت بإنشائها.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير
                </Button>
                <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إنشاء دورة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إنشاء دورة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل الدورة الجديدة هنا. انقر على "حفظ" عند الانتهاء.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...addCourseForm}>
                        <form onSubmit={addCourseForm.handleSubmit(onAddCourseSubmit)} className="space-y-4 pt-4">
                            <FormField control={addCourseForm.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input placeholder="مثال: أساسيات البرمجة" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addCourseForm.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: التكنولوجيا" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addCourseForm.control} name="description" render={({ field }) => (
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
                         <Link href={`/coach-dashboard/courses/${course.id}`}>
                            <Edit className="ml-2 h-4 w-4" />
                            تحرير المحتوى
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handlePublish(course)}>
                         {course.status === "منشورة" ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                         {course.status === "منشورة" ? 'إلغاء النشر' : 'نشر الدورة'}
                       </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => setSessionCourse(course)}>
                            <Video className="ml-2 h-4 w-4" />
                            إضافة جلسة مباشرة
                       </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setCourseToDelete(course); }}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف الدورة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!sessionCourse} onOpenChange={(isOpen) => !isOpen && setSessionCourse(null)}>
      <DialogContent dir="rtl" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) { e.preventDefault(); } }}>
        <DialogHeader>
          <DialogTitle>جدولة جلسة مباشرة</DialogTitle>
          <DialogDescription>إضافة جلسة مباشرة تابعة لدورة "{sessionCourse?.title}".</DialogDescription>
        </DialogHeader>
        <Form {...addSessionForm}>
          <form onSubmit={addSessionForm.handleSubmit(onAddSessionSubmit)} className="space-y-4 pt-4">
            <FormField control={addSessionForm.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>عنوان الجلسة</FormLabel><FormControl><Input placeholder="مثال: أسئلة وأجوبة مباشرة" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={addSessionForm.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخًا</span>}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                  </PopoverContent>
                  </Popover>
                <FormMessage /></FormItem>
              )}/>
              <FormField control={addSessionForm.control} name="duration" render={({ field }) => (
                <FormItem><FormLabel>المدة (بالدقائق)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
             <FormField
                control={addSessionForm.control}
                name="meetLink"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>رابط Google Meet (اختياري)</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input dir="ltr" placeholder="https://meet.google.com/..." {...field} />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>
                                إنشاء رابط
                            </Button>
                        </div>
                        <FormDescription>يمكنك لصق رابط أو إنشاء واحد جديد.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button type="submit">جدولة الجلسة</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!courseToDelete} onOpenChange={(isOpen) => !isOpen && setCourseToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف دورة "{courseToDelete?.title}" نهائيًا من قاعدة البيانات.
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

    
