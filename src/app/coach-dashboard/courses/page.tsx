
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MoreHorizontal, PlusCircle, Edit, Video, Trash2, Check, X,
  Calendar as CalendarIcon, UserPlus, BookOpen, Clock, Users, Star,
  Globe, Lock, TrendingUp, Award, ChevronLeft,
} from "lucide-react";
import Link from 'next/link';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { COURSE_CATEGORIES } from "@/lib/course-category";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/components/language-provider";
import { enUS } from "date-fns/locale";

type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: "منشورة" | "مسودة" | "published" | "draft";
  enrolledCount?: number;
  price?: number;
  duration?: string;
  coverImageUrl?: string;
  level?: string;
  language?: string;
  tags?: string[];
};

type Beneficiary = { id: string; name?: string };

const LEVELS = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
];

const LEVELS_EN = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const LANGUAGES = [
  { value: 'arabic', label: 'العربية' },
  { value: 'english', label: 'الإنجليزية' },
  { value: 'both', label: 'ثنائي اللغة' },
];

const LANGUAGES_EN = [
  { value: 'arabic', label: 'Arabic' },
  { value: 'english', label: 'English' },
  { value: 'both', label: 'Bilingual' },
];

const levelLabel = (v?: string, lang: 'ar' | 'en' = 'ar') => (lang === 'en' ? LEVELS_EN : LEVELS).find(l => l.value === v)?.label || '';
const levelColor = (v?: string) => v === 'beginner' ? 'bg-green-500/10 text-green-700' : v === 'intermediate' ? 'bg-amber-500/10 text-amber-700' : v === 'advanced' ? 'bg-red-500/10 text-red-700' : '';

const addCourseFormSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  duration: z.string().optional(),
  coverImageUrl: z.string().url({ message: "رابط غير صحيح" }).optional().or(z.literal('')),
  level: z.string().optional(),
  language: z.string().optional(),
  tags: z.string().optional(),
});

const addSessionFormSchema = z.object({
  title: z.string().min(3, { message: "عنوان الجلسة مطلوب." }),
  date: z.date({ required_error: "تاريخ الجلسة مطلوب." }),
  duration: z.coerce.number().positive({ message: "المدة يجب أن تكون رقمًا موجبًا." }),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});

function CourseCard({
  course,
  currencySymbol,
  onPublish,
  onDelete,
  onSession,
  onEnroll,
}: {
  course: Course;
  currencySymbol: string;
  onPublish: (c: Course) => void;
  onDelete: (c: Course) => void;
  onSession: (c: Course) => void;
  onEnroll: (c: Course) => void;
}) {
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const isPublished = course.status === "منشورة" || course.status === "published";
  const count = course.enrolledCount ?? 0;

  return (
    <Card className="group overflow-hidden border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Cover Image */}
      <div className="relative h-44 bg-muted overflow-hidden shrink-0">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/5 to-primary/10">
            <BookOpen className="h-10 w-10 text-primary/20" />
          </div>
        )}
        {/* Status badge */}
        <div className={cn(
          "absolute top-3 right-3 text-[11px] font-semibold rounded-full px-2.5 py-0.5 border",
          isPublished
            ? "bg-green-500/90 text-white border-green-600/20"
            : "bg-background/90 text-muted-foreground border-border/50 backdrop-blur-sm"
        )}>
          {isPublished ? bi('منشورة', 'Published') : bi('مسودة', 'Draft')}
        </div>
        {/* Price badge */}
        {course.price != null && (
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-[11px] font-bold rounded-full px-2.5 py-0.5 border border-border/50">
            {course.price === 0 ? bi('مجاني', 'Free') : `${course.price} ${currencySymbol}`}
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col gap-3 flex-grow">
        {/* Category + Level */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {course.category && (
            <span className="text-[10px] font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5">
              {course.category}
            </span>
          )}
          {course.level && (
            <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5", levelColor(course.level))}>
              {levelLabel(course.level, lang)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {bi(`${count} مسجّل`, `${count} enrolled`)}
          </span>
          {course.language && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {(lang === 'en' ? LANGUAGES_EN : LANGUAGES).find(l => l.value === course.language)?.label || course.language}
            </span>
          )}
        </div>

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{tag}</span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
            <Link href={`/coach-dashboard/courses/${course.id}`}>
              <Edit className="h-3 w-3 ml-1" />
              {bi('تحرير', 'Edit')}
            </Link>
          </Button>
          {isPublished && (
            <Button size="sm" variant="ghost" className="h-8 text-xs px-2.5" asChild>
              <Link href={`/courses/${course.id}`} target="_blank">
                <Globe className="h-3 w-3 ml-1" />
                {bi('عرض', 'View')}
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{bi('الإجراءات', 'Actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onPublish(course)}>
                {isPublished ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                {isPublished ? bi('إلغاء النشر', 'Unpublish') : bi('نشر الدورة', 'Publish course')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEnroll(course)}>
                <UserPlus className="ml-2 h-4 w-4" />
                {bi('تسجيل مستفيد', 'Enroll beneficiary')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSession(course)}>
                <Video className="ml-2 h-4 w-4" />
                {bi('إضافة جلسة مباشرة', 'Add live session')}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={() => onDelete(course)}>
                <Trash2 className="ml-2 h-4 w-4" />
                {bi('حذف الدورة', 'Delete course')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoachCoursesPage() {
  const { toast } = useToast();
  const { symbol: currencySymbol } = useCurrency();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [sessionCourse, setSessionCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);
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

  useEffect(() => {
    if (!enrollCourse || !authUser) return;
    (async () => {
      try {
        const token = await authUser.getIdToken();
        const res = await fetch(`/api/org/users?role=beneficiary&coachId=${authUser.uid}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        setBeneficiaries((await res.json()).users || []);
      } catch { /* silent */ }
    })();
  }, [enrollCourse, authUser]);

  const addCourseForm = useForm<z.infer<typeof addCourseFormSchema>>({
    resolver: zodResolver(addCourseFormSchema),
    defaultValues: { title: "", category: "", description: "", price: undefined, duration: "", coverImageUrl: "", level: "", language: "", tags: "" },
  });

  const addSessionForm = useForm<z.infer<typeof addSessionFormSchema>>({
    resolver: zodResolver(addSessionFormSchema),
    defaultValues: { meetLink: "" },
  });

  async function onAddCourseSubmit(values: z.infer<typeof addCourseFormSchema>) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const payload = { ...values, tags: tagsArray };
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: bi("تم بنجاح!", "Success!"), description: bi(`تمت إضافة دورة "${values.title}" كمسودة.`, `Course "${values.title}" was added as a draft.`) });
      addCourseForm.reset();
      setIsAddCourseDialogOpen(false);
      fetchCourses();
    } catch { toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: bi("لم نتمكن من إضافة الدورة.", "We couldn't add the course.") }); }
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
      toast({ title: bi("تمت الجدولة!", "Scheduled!"), description: bi(`تمت جدولة جلسة "${values.title}".`, `Session "${values.title}" was scheduled.`) });
      addSessionForm.reset();
      setSessionCourse(null);
    } catch { toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل جدولة الجلسة.", "Failed to schedule the session.") }); }
  }

  async function handlePublish(course: Course) {
    if (!authUser) return;
    const newStatus = (course.status === "منشورة" || course.status === "published") ? "مسودة" : "منشورة";
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: course.id, status: newStatus }),
      });
      toast({ title: newStatus === "منشورة" ? bi("تم النشر!", "Published!") : bi("تم الإلغاء!", "Unpublished!") });
      fetchCourses();
    } catch { toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشلت عملية التحديث.", "The update failed.") }); }
  }

  async function handleDelete() {
    if (!authUser || !courseToDelete) return;
    try {
      const token = await authUser.getIdToken();
      await fetch(`/api/courses?id=${courseToDelete.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      toast({ title: bi("تم الحذف!", "Deleted!"), description: bi(`تم حذف دورة "${courseToDelete.title}".`, `Course "${courseToDelete.title}" was deleted.`) });
      setCourseToDelete(null);
      fetchCourses();
    } catch { toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل حذف الدورة.", "Failed to delete the course.") }); }
  }

  async function handleSeedDemo() {
    if (!authUser) return;
    setSeedingDemo(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/seed-demo-course', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({
        title: json.alreadyExists ? bi('الدورة التجريبية موجودة بالفعل!', 'The demo course already exists!') : bi('تم إنشاء الدورة التجريبية!', 'Demo course created!'),
        description: bi('يمكنك الآن تعديل محتواها من زر "تحرير".', 'You can now edit its content from the "Edit" button.'),
      });
      fetchCourses();
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
    } finally {
      setSeedingDemo(false);
    }
  }

  async function handleEnrollBeneficiary() {
    if (!authUser || !enrollCourse || !selectedBeneficiaryId) return;
    setEnrolling(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/courses/${enrollCourse.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ beneficiaryId: selectedBeneficiaryId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: bi("تم التسجيل!", "Enrolled!"), description: bi("تم تسجيل المستفيد في الدورة بنجاح.", "The beneficiary was enrolled in the course successfully.") });
      setEnrollCourse(null);
      setSelectedBeneficiaryId('');
      fetchCourses();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: e.message || bi("فشل تسجيل المستفيد.", "Failed to enroll the beneficiary.") });
    } finally {
      setEnrolling(false);
    }
  }

  const published = courses.filter(c => c.status === "منشورة" || c.status === "published");
  const drafts = courses.filter(c => c.status !== "منشورة" && c.status !== "published");

  return (
    <div dir={dir} className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi('دوراتي التدريبية', 'My Courses')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? bi('جاري التحميل...', 'Loading...') : bi(`${courses.length} دورة · ${published.length} منشورة · ${drafts.length} مسودة`, `${courses.length} courses · ${published.length} published · ${drafts.length} draft`)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDemo} disabled={seedingDemo} className="gap-2">
            <Star className="h-4 w-4" />
            {seedingDemo ? bi('جاري الإنشاء...', 'Creating...') : bi('دورة تجريبية', 'Demo course')}
          </Button>
        <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {bi('إنشاء دورة جديدة', 'Create new course')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl" dir={dir}>
            <DialogHeader>
              <DialogTitle>{bi('إنشاء دورة تدريبية جديدة', 'Create a new course')}</DialogTitle>
              <DialogDescription>{bi('أدخل تفاصيل الدورة. يمكنك تعديل المحتوى والدروس لاحقاً من صفحة التحرير.', 'Enter the course details. You can edit the content and lessons later from the edit page.')}</DialogDescription>
            </DialogHeader>
            <Form {...addCourseForm}>
              <form onSubmit={addCourseForm.handleSubmit(onAddCourseSubmit)} id="add-course-form" className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto px-1">

                {/* Title */}
                <FormField control={addCourseForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi('عنوان الدورة', 'Course title')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder={bi('مثال: أساسيات التسويق الرقمي للمبتدئين', 'e.g. Digital Marketing Basics for Beginners')} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Category + Level */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={addCourseForm.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi('التخصص / الفئة', 'Specialty / Category')} <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={bi('اختر الفئة', 'Choose category')} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          {field.value && !COURSE_CATEGORIES.includes(field.value) && (
                            <SelectItem value={field.value}>{field.value}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={addCourseForm.control} name="level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi('المستوى', 'Level')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={bi('اختر المستوى', 'Choose level')} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(lang === 'en' ? LEVELS_EN : LEVELS).map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Description */}
                <FormField control={addCourseForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi('وصف الدورة', 'Course description')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={bi('اشرح باختصار ما سيتعلمه المشارك، ومن هي الفئة المستهدفة...', 'Briefly explain what the participant will learn and who the target audience is...')} rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Price + Duration + Language */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={addCourseForm.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi('السعر', 'Price')} ({currencySymbol})</FormLabel>
                      <FormControl><Input type="number" min={0} placeholder={bi('0 = مجاني', '0 = free')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={addCourseForm.control} name="duration" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi('المدة الإجمالية', 'Total duration')}</FormLabel>
                      <FormControl><Input placeholder={bi('مثال: 8 ساعات', 'e.g. 8 hours')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={addCourseForm.control} name="language" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi('لغة الدورة', 'Course language')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={bi('اختر اللغة', 'Choose language')} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(lang === 'en' ? LANGUAGES_EN : LANGUAGES).map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Tags */}
                <FormField control={addCourseForm.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi('الوسوم', 'Tags')} (Tags)</FormLabel>
                    <FormControl><Input placeholder={bi('مثال: تسويق، سوشيال ميديا، مبيعات (مفصولة بفاصلة)', 'e.g. marketing, social media, sales (comma-separated)')} {...field} /></FormControl>
                    <FormDescription>{bi('اكتب الوسوم مفصولة بفاصلة لتسهيل البحث.', 'Write tags separated by commas to make search easier.')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Cover Image URL */}
                <FormField control={addCourseForm.control} name="coverImageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi('رابط صورة الغلاف', 'Cover image URL')}</FormLabel>
                    <FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl>
                    <FormDescription>{bi('يفضّل صورة بنسبة عرض 16:9 (مثلاً 1280×720 بكسل).', 'A 16:9 aspect ratio image is preferred (e.g. 1280×720 px).')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

              </form>
            </Form>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{bi('إلغاء', 'Cancel')}</Button></DialogClose>
              <Button type="submit" form="add-course-form">{bi('حفظ الدورة كمسودة', 'Save course as draft')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: bi('إجمالي الدورات', 'Total courses'), value: courses.length, icon: BookOpen, color: 'text-primary' },
            { label: bi('منشورة', 'Published'), value: published.length, icon: Globe, color: 'text-green-600' },
            { label: bi('مسودة', 'Draft'), value: drafts.length, icon: Lock, color: 'text-amber-600' },
            { label: bi('إجمالي المسجّلين', 'Total enrolled'), value: courses.reduce((s, c) => s + (c.enrolledCount ?? 0), 0), icon: Users, color: 'text-sky-600' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Course Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-muted/20">
          <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
            <BookOpen className="h-7 w-7 text-primary/30" />
          </div>
          <h3 className="text-base font-semibold mb-1">{bi('لا توجد دورات بعد', 'No courses yet')}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{bi('ابدأ بإنشاء دورتك التدريبية الأولى، أو جرّب دورة تجريبية جاهزة للتعديل.', 'Start by creating your first course, or try a ready-made demo course you can edit.')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setIsAddCourseDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 ml-2" />
              {bi('إنشاء دورة جديدة', 'Create new course')}
            </Button>
            <Button variant="outline" onClick={handleSeedDemo} disabled={seedingDemo}>
              <Star className="h-4 w-4 ml-2" />
              {seedingDemo ? bi('جاري الإنشاء...', 'Creating...') : bi('إنشاء دورة تجريبية', 'Create demo course')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              currencySymbol={currencySymbol}
              onPublish={handlePublish}
              onDelete={setCourseToDelete}
              onSession={setSessionCourse}
              onEnroll={(c) => { setEnrollCourse(c); setSelectedBeneficiaryId(''); }}
            />
          ))}
        </div>
      )}

      {/* ── Enroll Beneficiary Dialog ── */}
      <Dialog open={!!enrollCourse} onOpenChange={(open) => !open && setEnrollCourse(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi('تسجيل مستفيد في الدورة', 'Enroll beneficiary in course')}</DialogTitle>
            <DialogDescription>{bi(`اختر مستفيداً لتسجيله في دورة "${enrollCourse?.title}".`, `Choose a beneficiary to enroll in "${enrollCourse?.title}".`)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedBeneficiaryId} onValueChange={setSelectedBeneficiaryId}>
              <SelectTrigger>
                <SelectValue placeholder={bi('اختر مستفيداً', 'Choose a beneficiary')} />
              </SelectTrigger>
              <SelectContent>
                {beneficiaries.length === 0
                  ? <SelectItem value="none" disabled>{bi('لا يوجد مستفيدون', 'No beneficiaries')}</SelectItem>
                  : beneficiaries.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name || b.id}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">{bi('إلغاء', 'Cancel')}</Button></DialogClose>
            <Button onClick={handleEnrollBeneficiary} disabled={!selectedBeneficiaryId || enrolling}>
              {enrolling ? bi('جاري التسجيل...', 'Enrolling...') : bi('تأكيد التسجيل', 'Confirm enrollment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Live Session Dialog ── */}
      <Dialog open={!!sessionCourse} onOpenChange={(isOpen) => !isOpen && setSessionCourse(null)}>
        <DialogContent dir={dir} onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) { e.preventDefault(); } }}>
          <DialogHeader>
            <DialogTitle>{bi('جدولة جلسة مباشرة', 'Schedule live session')}</DialogTitle>
            <DialogDescription>{bi(`إضافة جلسة مباشرة تابعة لدورة "${sessionCourse?.title}".`, `Add a live session for course "${sessionCourse?.title}".`)}</DialogDescription>
          </DialogHeader>
          <Form {...addSessionForm}>
            <form onSubmit={addSessionForm.handleSubmit(onAddSessionSubmit)} className="space-y-4 pt-4">
              <FormField control={addSessionForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi('عنوان الجلسة', 'Session title')}</FormLabel>
                  <FormControl><Input placeholder={bi('مثال: أسئلة وأجوبة مباشرة', 'e.g. Live Q&A')} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={addSessionForm.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{bi('التاريخ', 'Date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pr-3 text-right font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: lang === 'en' ? enUS : ar }) : <span>{bi('اختر تاريخًا', 'Choose a date')}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={addSessionForm.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi('المدة (دقيقة)', 'Duration (minutes)')}</FormLabel>
                    <FormControl><Input type="number" placeholder="60" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={addSessionForm.control} name="meetLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi('رابط Google Meet (اختياري)', 'Google Meet link (optional)')}</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input dir="ltr" placeholder="https://meet.google.com/..." {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>
                      {bi('إنشاء رابط', 'Generate link')}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">{bi('إلغاء', 'Cancel')}</Button></DialogClose>
                <Button type="submit">{bi('جدولة الجلسة', 'Schedule session')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(isOpen) => !isOpen && setCourseToDelete(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi('هل أنت متأكد تمامًا؟', 'Are you absolutely sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {bi(`هذا الإجراء لا يمكن التراجع عنه. سيؤدي إلى حذف دورة "${courseToDelete?.title}" نهائيًا.`, `This action cannot be undone. It will permanently delete the course "${courseToDelete?.title}".`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{bi('نعم، قم بالحذف', 'Yes, delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
