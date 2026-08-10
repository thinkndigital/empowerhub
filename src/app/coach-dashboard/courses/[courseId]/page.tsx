
"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, PlusCircle, ArrowRight, BookCheck, Video, ChevronUp, ChevronDown, Pencil, Link2, FileText, File } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { COURSE_CATEGORIES } from "@/lib/course-category";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/language-provider";

const courseEditSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  duration: z.string().optional(),
  coverImageUrl: z.string().url({ message: "رابط غير صحيح" }).optional().or(z.literal('')),
  objectives: z.array(z.object({ value: z.string() })).optional(),
  requirements: z.array(z.object({ value: z.string() })).optional(),
  videoUrl: z.string().url({ message: "الرجاء إدخال رابط فيديو صحيح." }).optional().or(z.literal('')),
  quiz: z.object({
    question: z.string().optional(),
    options: z.array(z.object({ value: z.string().min(1, { message: "الخيار لا يمكن أن يكون فارغًا." }) })).max(4),
    correctAnswer: z.string().optional(),
  }).optional(),
  preAssessment: z.array(z.object({
    question: z.string().min(1, { message: "السؤال لا يمكن أن يكون فارغًا." }),
    type: z.enum(['rating', 'text']),
  })).optional(),
  postAssessment: z.array(z.object({
    question: z.string().min(1, { message: "السؤال لا يمكن أن يكون فارغًا." }),
    type: z.enum(['rating', 'text']),
  })).optional(),
});

type CourseEditFormValues = z.infer<typeof courseEditSchema>;

interface CourseDataFromDB {
  title: string;
  category: string;
  description?: string;
  price?: number;
  duration?: string;
  coverImageUrl?: string;
  objectives?: string[];
  requirements?: string[];
  videoUrl?: string;
  materials?: Material[];
  quiz?: { question: string; options: string[]; correctAnswer: string; };
  preAssessment?: any[];
  postAssessment?: any[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  order: number;
}

interface Material {
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'doc';
}

const AssessmentBuilder = ({ control, name, title }: { control: any, name: "preAssessment" | "postAssessment", title: string }) => {
  const { fields, append, remove } = useFieldArray({ control, name });
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  return (
    <div className="space-y-4">
      <h3 className="font-medium">{title}</h3>
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
          <div className="flex-grow space-y-2">
            <FormField control={control} name={`${name}.${index}.question`} render={({ field }) => (
              <FormItem>
                <FormLabel>{bi('السؤال', 'Question')} {index + 1}</FormLabel>
                <FormControl><Textarea placeholder={bi('نص السؤال...', 'Question text...')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={control} name={`${name}.${index}.type`} render={({ field }) => (
              <FormItem>
                <FormLabel>{bi('نوع السؤال', 'Question type')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={bi('اختر نوع السؤال', 'Choose question type')} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rating">{bi('تقييم (1-5)', 'Rating (1-5)')}</SelectItem>
                    <SelectItem value="text">{bi('نص مفتوح', 'Open text')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", type: "rating" })}>
        <PlusCircle className="ml-2 h-4 w-4" />
        {bi('إضافة سؤال', 'Add question')}
      </Button>
    </div>
  );
};

const materialTypeIcon = (type: string) => {
  if (type === 'pdf') return <File className="h-4 w-4" />;
  if (type === 'doc') return <FileText className="h-4 w-4" />;
  return <Link2 className="h-4 w-4" />;
};

const materialTypeLabel = (type: string, bi: (ar: string, en: string) => string) => {
  if (type === 'pdf') return 'PDF';
  if (type === 'doc') return bi('مستند', 'Document');
  return bi('رابط', 'Link');
};

export default function CourseEditPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [course, setCourse] = useState<CourseDataFromDB | null>(null);
  const [loading, setLoading] = useState(true);

  // Lessons state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: '', description: '', videoUrl: '' });
  const [lessonSaving, setLessonSaving] = useState(false);

  // Materials state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Material>({ title: '', url: '', type: 'link' });

  const fetchCourse = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/courses/${params.courseId}`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setCourse(json.course);
      setMaterials(json.course?.materials || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser, params.courseId]);

  const fetchLessons = useCallback(async () => {
    if (!authUser) return;
    setLessonsLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/courses/${params.courseId}/lessons`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setLessons(json.lessons || []);
    } catch { /* silent */ } finally { setLessonsLoading(false); }
  }, [authUser, params.courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);
  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const form = useForm<CourseEditFormValues>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      title: "", category: "", description: "", videoUrl: "",
      price: undefined, duration: "", coverImageUrl: "",
      objectives: [], requirements: [],
      quiz: { question: "", options: [{ value: "" }, { value: "" }], correctAnswer: "" },
      preAssessment: [], postAssessment: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "quiz.options" });
  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({ control: form.control, name: "objectives" });
  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({ control: form.control, name: "requirements" });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title, category: course.category,
        description: course.description || "", videoUrl: course.videoUrl || "",
        price: course.price ?? undefined,
        duration: course.duration || "",
        coverImageUrl: course.coverImageUrl || "",
        objectives: (course.objectives || []).map(v => ({ value: v })),
        requirements: (course.requirements || []).map(v => ({ value: v })),
        quiz: {
          question: course.quiz?.question || "",
          options: course.quiz?.options?.map(opt => ({ value: opt })) || [{ value: "" }, { value: "" }],
          correctAnswer: course.quiz?.correctAnswer || "",
        },
        preAssessment: course.preAssessment || [],
        postAssessment: course.postAssessment || [],
      });
    }
  }, [course, form]);

  async function onSubmit(values: CourseEditFormValues) {
    if (!authUser) return;
    const dataToUpdate = {
      ...values,
      objectives: (values.objectives || []).map(o => o.value).filter(Boolean),
      requirements: (values.requirements || []).map(r => r.value).filter(Boolean),
      materials,
      quiz: values.quiz ? {
        ...values.quiz,
        options: values.quiz.options.map(o => o.value).filter(Boolean)
      } : null,
    };
    if ((dataToUpdate.quiz as any)?.options?.length === 0) {
      dataToUpdate.quiz = null;
    }
    try {
      const token = await authUser!.getIdToken();
      await fetch(`/api/courses/${params.courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToUpdate),
      });
      toast({ title: bi("تم الحفظ بنجاح", "Saved successfully"), description: bi(`تم تحديث تفاصيل دورة "${values.title}".`, `Course "${values.title}" details were updated.`) });
    } catch {
      toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: bi("لم نتمكن من حفظ التغييرات.", "We couldn't save the changes.") });
    }
  }

  async function addLesson() {
    if (!authUser || !newLesson.title.trim()) return;
    setLessonSaving(true);
    try {
      const token = await authUser.getIdToken();
      const order = lessons.length;
      const res = await fetch(`/api/courses/${params.courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newLesson, order }),
      });
      const json = await res.json();
      setLessons(prev => [...prev, { id: json.id, ...newLesson, order }]);
      setNewLesson({ title: '', description: '', videoUrl: '' });
      setShowAddLesson(false);
      toast({ title: bi('تم إضافة الدرس', 'Lesson added') });
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: bi('فشل إضافة الدرس.', 'Failed to add the lesson.') });
    } finally { setLessonSaving(false); }
  }

  async function saveEditLesson() {
    if (!authUser || !editingLesson) return;
    setLessonSaving(true);
    try {
      const token = await authUser.getIdToken();
      await fetch(`/api/courses/${params.courseId}/lessons`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(editingLesson),
      });
      setLessons(prev => prev.map(l => l.id === editingLesson.id ? editingLesson : l));
      setEditingLesson(null);
      toast({ title: bi('تم تحديث الدرس', 'Lesson updated') });
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: bi('فشل تحديث الدرس.', 'Failed to update the lesson.') });
    } finally { setLessonSaving(false); }
  }

  async function deleteLesson(id: string) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch(`/api/courses/${params.courseId}/lessons?id=${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      const updated = lessons.filter(l => l.id !== id).map((l, i) => ({ ...l, order: i }));
      setLessons(updated);
      toast({ title: bi('تم حذف الدرس', 'Lesson deleted') });
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: bi('فشل حذف الدرس.', 'Failed to delete the lesson.') });
    }
  }

  async function moveLesson(index: number, direction: 'up' | 'down') {
    if (!authUser) return;
    const newArr = [...lessons];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newArr.length) return;
    [newArr[index], newArr[swapIndex]] = [newArr[swapIndex], newArr[index]];
    const reordered = newArr.map((l, i) => ({ ...l, order: i }));
    setLessons(reordered);
    // Persist order for both
    try {
      const token = await authUser.getIdToken();
      await Promise.all([
        fetch(`/api/courses/${params.courseId}/lessons`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: reordered[index].id, order: reordered[index].order }),
        }),
        fetch(`/api/courses/${params.courseId}/lessons`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: reordered[swapIndex].id, order: reordered[swapIndex].order }),
        }),
      ]);
    } catch { /* silent */ }
  }

  function addMaterial() {
    if (!newMaterial.title.trim() || !newMaterial.url.trim()) return;
    setMaterials(prev => [...prev, { ...newMaterial }]);
    setNewMaterial({ title: '', url: '', type: 'link' });
    setShowAddMaterial(false);
  }

  function deleteMaterial(index: number) {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
        <Card className="border-0 shadow-sm"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center" dir={dir}>
        <h1 className="text-2xl font-bold">{bi('الدورة غير موجودة', 'Course not found')}</h1>
        <p className="text-muted-foreground">{bi('لم نتمكن من العثور على الدورة التي تبحث عنها.', "We couldn't find the course you're looking for.")}</p>
        <Button asChild className="mt-4">
          <Link href="/coach-dashboard/courses">{bi('العودة إلى الدورات', 'Back to courses')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{bi('تحرير محتوى الدورة', 'Edit Course Content')}</h1>
            <p className="text-muted-foreground">{bi('أنت تقوم بتعديل دورة:', 'You are editing course:')} <span className="font-bold text-primary">{course.title}</span></p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/coach-dashboard/courses">
                <ArrowRight className="ml-2 h-4 w-4" />
                {bi('العودة', 'Back')}
              </Link>
            </Button>
            <Button type="submit">
              <Save className="ml-2 h-4 w-4" />
              {bi('حفظ التغييرات', 'Save changes')}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{bi('المعلومات الأساسية', 'Basic Information')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>{bi('عنوان الدورة', 'Course title')} <span className="text-red-500">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi('الفئة', 'Category')} <span className="text-red-500">*</span></FormLabel>
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
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>{bi('الوصف', 'Description')}</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi('السعر (د.أ)', 'Price (JOD)')}</FormLabel>
                  <FormControl><Input type="number" min={0} placeholder={bi('0 = مجاني', '0 = free')} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi('المدة الإجمالية', 'Total duration')}</FormLabel>
                  <FormControl><Input placeholder={bi('مثال: 10 ساعات', 'e.g. 10 hours')} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coverImageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi('رابط صورة الغلاف', 'Cover image URL')}</FormLabel>
                  <FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="videoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>{bi('رابط الفيديو التعريفي (اختياري)', 'Intro video URL (optional)')}</FormLabel>
                <FormDescription>{bi('فيديو تعريفي يظهر في صفحة الدورة العامة.', 'An intro video that appears on the public course page.')}</FormDescription>
                <FormControl><Input dir="ltr" placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Objectives */}
            <div className="space-y-2">
              <FormLabel>{bi('أهداف الدورة (ما سيتعلمه المشارك)', 'Course objectives (what the participant will learn)')}</FormLabel>
              {objectiveFields.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <FormField control={form.control} name={`objectives.${index}.value`} render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder={bi(`هدف ${index + 1}`, `Objective ${index + 1}`)} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeObjective(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendObjective({ value: '' })}>
                <PlusCircle className="ml-2 h-4 w-4" /> {bi('إضافة هدف', 'Add objective')}
              </Button>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <FormLabel>{bi('المتطلبات الأساسية', 'Prerequisites')}</FormLabel>
              {reqFields.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <FormField control={form.control} name={`requirements.${index}.value`} render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder={bi(`متطلب ${index + 1}`, `Requirement ${index + 1}`)} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeReq(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendReq({ value: '' })}>
                <PlusCircle className="ml-2 h-4 w-4" /> {bi('إضافة متطلب', 'Add requirement')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> {bi('الدروس والمحتوى', 'Lessons & Content')}</CardTitle>
            <CardDescription>{bi('أضف دروس الدورة وقم بترتيبها. كل درس يمكن أن يحتوي على فيديو ووصف.', 'Add and order the course lessons. Each lesson can have a video and description.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessonsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : lessons.length === 0 && !showAddLesson ? (
              <p className="text-sm text-muted-foreground text-center py-4">{bi('لا توجد دروس بعد. أضف درسًا للبدء.', 'No lessons yet. Add a lesson to get started.')}</p>
            ) : (
              lessons.map((lesson, index) => (
                <div key={lesson.id} className="border rounded-md overflow-hidden">
                  <div className="flex items-center gap-2 p-3 bg-muted/30">
                    <div className="flex flex-col gap-0.5">
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveLesson(index, 'up')} disabled={index === 0}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveLesson(index, 'down')} disabled={index === lessons.length - 1}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium flex-1">{index + 1}. {lesson.title}</span>
                    {lesson.videoUrl && <Badge variant="secondary" className="text-xs"><Video className="h-3 w-3 ml-1" />{bi('فيديو', 'Video')}</Badge>}
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditingLesson(editingLesson?.id === lesson.id ? null : lesson)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => deleteLesson(lesson.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {editingLesson?.id === lesson.id && (
                    <div className="p-3 space-y-3 border-t">
                      <div>
                        <label className="text-sm font-medium">{bi('عنوان الدرس', 'Lesson title')}</label>
                        <Input
                          value={editingLesson.title}
                          onChange={e => setEditingLesson(prev => prev ? { ...prev, title: e.target.value } : prev)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{bi('الوصف (اختياري)', 'Description (optional)')}</label>
                        <Textarea
                          value={editingLesson.description || ''}
                          onChange={e => setEditingLesson(prev => prev ? { ...prev, description: e.target.value } : prev)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{bi('رابط الفيديو (اختياري)', 'Video URL (optional)')}</label>
                        <Input
                          dir="ltr"
                          value={editingLesson.videoUrl || ''}
                          onChange={e => setEditingLesson(prev => prev ? { ...prev, videoUrl: e.target.value } : prev)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={saveEditLesson} disabled={lessonSaving}>
                          <Save className="ml-2 h-4 w-4" />
                          {bi('حفظ', 'Save')}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingLesson(null)}>{bi('إلغاء', 'Cancel')}</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {showAddLesson && (
              <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                <p className="text-sm font-medium">{bi('درس جديد', 'New lesson')}</p>
                <div>
                  <label className="text-sm font-medium">{bi('عنوان الدرس *', 'Lesson title *')}</label>
                  <Input
                    value={newLesson.title}
                    onChange={e => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={bi('عنوان الدرس...', 'Lesson title...')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{bi('الوصف (اختياري)', 'Description (optional)')}</label>
                  <Textarea
                    value={newLesson.description}
                    onChange={e => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{bi('رابط الفيديو (اختياري)', 'Video URL (optional)')}</label>
                  <Input
                    dir="ltr"
                    value={newLesson.videoUrl}
                    onChange={e => setNewLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addLesson} disabled={lessonSaving || !newLesson.title.trim()}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    {bi('إضافة', 'Add')}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddLesson(false); setNewLesson({ title: '', description: '', videoUrl: '' }); }}>{bi('إلغاء', 'Cancel')}</Button>
                </div>
              </div>
            )}

            {!showAddLesson && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLesson(true)}>
                <PlusCircle className="ml-2 h-4 w-4" />
                {bi('إضافة درس', 'Add lesson')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {bi('المواد التعليمية', 'Learning Materials')}</CardTitle>
            <CardDescription>{bi('أضف روابط ومستندات ومواد تعليمية مرتبطة بالدورة.', 'Add links, documents, and learning materials related to the course.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {materials.length === 0 && !showAddMaterial ? (
              <p className="text-sm text-muted-foreground text-center py-4">{bi('لا توجد مواد تعليمية بعد.', 'No learning materials yet.')}</p>
            ) : (
              materials.map((mat, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                  <span className="text-muted-foreground">{materialTypeIcon(mat.type)}</span>
                  <span className="flex-1 text-sm font-medium">{mat.title}</span>
                  <Badge variant="outline" className="text-xs">{materialTypeLabel(mat.type, bi)}</Badge>
                  <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline max-w-[120px] truncate">{mat.url}</a>
                  <Button type="button" variant="ghost" size="icon" onClick={() => deleteMaterial(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}

            {showAddMaterial && (
              <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                <p className="text-sm font-medium">{bi('مادة جديدة', 'New material')}</p>
                <div>
                  <label className="text-sm font-medium">{bi('عنوان المادة *', 'Material title *')}</label>
                  <Input
                    value={newMaterial.title}
                    onChange={e => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={bi('اسم المادة التعليمية...', 'Learning material name...')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{bi('الرابط *', 'Link *')}</label>
                  <Input
                    dir="ltr"
                    value={newMaterial.url}
                    onChange={e => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{bi('النوع', 'Type')}</label>
                  <Select value={newMaterial.type} onValueChange={(v) => setNewMaterial(prev => ({ ...prev, type: v as Material['type'] }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">{bi('رابط', 'Link')}</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">{bi('مستند', 'Document')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addMaterial} disabled={!newMaterial.title.trim() || !newMaterial.url.trim()}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    {bi('إضافة', 'Add')}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddMaterial(false); setNewMaterial({ title: '', url: '', type: 'link' }); }}>{bi('إلغاء', 'Cancel')}</Button>
                </div>
              </div>
            )}

            {!showAddMaterial && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddMaterial(true)}>
                <PlusCircle className="ml-2 h-4 w-4" />
                {bi('إضافة مادة', 'Add material')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi('الاختبار القصير', 'Short Quiz')}</CardTitle>
            <CardDescription>{bi('أنشئ اختبارًا قصيرًا للتحقق من فهم المستفيدين. اتركه فارغًا إذا لم تكن هناك حاجة لاختبار.', "Create a short quiz to check beneficiaries' understanding. Leave it empty if a quiz isn't needed.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="quiz.question" render={({ field }) => (
              <FormItem>
                <FormLabel>{bi('السؤال', 'Question')}</FormLabel>
                <FormControl><Textarea placeholder={bi('ما هو أهم عنصر في...؟', 'What is the most important element in...?')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="quiz.correctAnswer" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{bi('الخيارات (اختر الإجابة الصحيحة)', 'Options (choose the correct answer)')}</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                    {fields.map((item, index) => (
                      <FormField key={item.id} control={form.control} name={`quiz.options.${index}.value`} render={({ field: optionField }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl><RadioGroupItem value={optionField.value} /></FormControl>
                          <Input {...optionField} placeholder={bi(`الخيار ${index + 1}`, `Option ${index + 1}`)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </FormItem>
                      )} />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })} disabled={fields.length >= 4}>
                <PlusCircle className="ml-2 h-4 w-4" />
                {bi('إضافة خيار', 'Add option')}
              </Button>
              <FormDescription>{bi('يمكنك إضافة ما يصل إلى 4 خيارات.', 'You can add up to 4 options.')}</FormDescription>
            </div>
          </CardContent>
        </Card>

        {/* Assessments */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" />{bi('التقييمات', 'Assessments')}</CardTitle>
            <CardDescription>{bi('أنشئ تقييمًا قبليًا وبعديًا لقياس مدى تقدم المستفيدين. هذه التقييمات اختيارية.', 'Create a pre- and post-assessment to measure beneficiary progress. These assessments are optional.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pre-assessment">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pre-assessment">{bi('التقييم القبلي', 'Pre-assessment')}</TabsTrigger>
                <TabsTrigger value="post-assessment">{bi('التقييم البعدي', 'Post-assessment')}</TabsTrigger>
              </TabsList>
              <TabsContent value="pre-assessment" className="pt-4">
                <AssessmentBuilder control={form.control} name="preAssessment" title={bi('أسئلة التقييم القبلي', 'Pre-assessment questions')} />
              </TabsContent>
              <TabsContent value="post-assessment" className="pt-4">
                <AssessmentBuilder control={form.control} name="postAssessment" title={bi('أسئلة التقييم البعدي', 'Post-assessment questions')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </form>
    </Form>
  );
}
