
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
import { Separator } from "@/components/ui/separator";

const courseEditSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
  description: z.string().optional(),
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
  return (
    <div className="space-y-4">
      <h3 className="font-medium">{title}</h3>
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
          <div className="flex-grow space-y-2">
            <FormField control={control} name={`${name}.${index}.question`} render={({ field }) => (
              <FormItem>
                <FormLabel>السؤال {index + 1}</FormLabel>
                <FormControl><Textarea placeholder="نص السؤال..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={control} name={`${name}.${index}.type`} render={({ field }) => (
              <FormItem>
                <FormLabel>نوع السؤال</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="اختر نوع السؤال" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rating">تقييم (1-5)</SelectItem>
                    <SelectItem value="text">نص مفتوح</SelectItem>
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
        إضافة سؤال
      </Button>
    </div>
  );
};

const materialTypeIcon = (type: string) => {
  if (type === 'pdf') return <File className="h-4 w-4" />;
  if (type === 'doc') return <FileText className="h-4 w-4" />;
  return <Link2 className="h-4 w-4" />;
};

const materialTypeLabel = (type: string) => {
  if (type === 'pdf') return 'PDF';
  if (type === 'doc') return 'مستند';
  return 'رابط';
};

export default function CourseEditPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const { user: authUser } = useUser();
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
      quiz: { question: "", options: [{ value: "" }, { value: "" }], correctAnswer: "" },
      preAssessment: [], postAssessment: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "quiz.options" });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title, category: course.category,
        description: course.description || "", videoUrl: course.videoUrl || "",
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
      toast({ title: "تم الحفظ بنجاح", description: `تم تحديث تفاصيل دورة "${values.title}".` });
    } catch {
      toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من حفظ التغييرات." });
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
      toast({ title: 'تم إضافة الدرس' });
    } catch {
      toast({ variant: 'destructive', title: 'خطأ!', description: 'فشل إضافة الدرس.' });
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
      toast({ title: 'تم تحديث الدرس' });
    } catch {
      toast({ variant: 'destructive', title: 'خطأ!', description: 'فشل تحديث الدرس.' });
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
      toast({ title: 'تم حذف الدرس' });
    } catch {
      toast({ variant: 'destructive', title: 'خطأ!', description: 'فشل حذف الدرس.' });
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
      <div className="text-center">
        <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
        <p className="text-muted-foreground">لم نتمكن من العثور على الدورة التي تبحث عنها.</p>
        <Button asChild className="mt-4">
          <Link href="/coach-dashboard/courses">العودة إلى الدورات</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">تحرير محتوى الدورة</h1>
            <p className="text-muted-foreground">أنت تقوم بتعديل دورة: <span className="font-bold text-primary">{course.title}</span></p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/coach-dashboard/courses">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة
              </Link>
            </Button>
            <Button type="submit">
              <Save className="ml-2 h-4 w-4" />
              حفظ التغييرات
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="videoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>رابط الفيديو الرئيسي (اختياري)</FormLabel>
                <FormDescription>إذا لم تضف دروسًا، سيُستخدم هذا الرابط كمحتوى الدورة.</FormDescription>
                <FormControl><Input dir="ltr" placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> الدروس والمحتوى</CardTitle>
            <CardDescription>أضف دروس الدورة وقم بترتيبها. كل درس يمكن أن يحتوي على فيديو ووصف.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessonsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : lessons.length === 0 && !showAddLesson ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد دروس بعد. أضف درسًا للبدء.</p>
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
                    {lesson.videoUrl && <Badge variant="secondary" className="text-xs"><Video className="h-3 w-3 ml-1" />فيديو</Badge>}
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
                        <label className="text-sm font-medium">عنوان الدرس</label>
                        <Input
                          value={editingLesson.title}
                          onChange={e => setEditingLesson(prev => prev ? { ...prev, title: e.target.value } : prev)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={editingLesson.description || ''}
                          onChange={e => setEditingLesson(prev => prev ? { ...prev, description: e.target.value } : prev)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">رابط الفيديو (اختياري)</label>
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
                          حفظ
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingLesson(null)}>إلغاء</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {showAddLesson && (
              <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                <p className="text-sm font-medium">درس جديد</p>
                <div>
                  <label className="text-sm font-medium">عنوان الدرس *</label>
                  <Input
                    value={newLesson.title}
                    onChange={e => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان الدرس..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الوصف (اختياري)</label>
                  <Textarea
                    value={newLesson.description}
                    onChange={e => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">رابط الفيديو (اختياري)</label>
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
                    إضافة
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddLesson(false); setNewLesson({ title: '', description: '', videoUrl: '' }); }}>إلغاء</Button>
                </div>
              </div>
            )}

            {!showAddLesson && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLesson(true)}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة درس
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> المواد التعليمية</CardTitle>
            <CardDescription>أضف روابط ومستندات ومواد تعليمية مرتبطة بالدورة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {materials.length === 0 && !showAddMaterial ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواد تعليمية بعد.</p>
            ) : (
              materials.map((mat, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                  <span className="text-muted-foreground">{materialTypeIcon(mat.type)}</span>
                  <span className="flex-1 text-sm font-medium">{mat.title}</span>
                  <Badge variant="outline" className="text-xs">{materialTypeLabel(mat.type)}</Badge>
                  <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline max-w-[120px] truncate">{mat.url}</a>
                  <Button type="button" variant="ghost" size="icon" onClick={() => deleteMaterial(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}

            {showAddMaterial && (
              <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                <p className="text-sm font-medium">مادة جديدة</p>
                <div>
                  <label className="text-sm font-medium">عنوان المادة *</label>
                  <Input
                    value={newMaterial.title}
                    onChange={e => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="اسم المادة التعليمية..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الرابط *</label>
                  <Input
                    dir="ltr"
                    value={newMaterial.url}
                    onChange={e => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">النوع</label>
                  <Select value={newMaterial.type} onValueChange={(v) => setNewMaterial(prev => ({ ...prev, type: v as Material['type'] }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">رابط</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">مستند</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addMaterial} disabled={!newMaterial.title.trim() || !newMaterial.url.trim()}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddMaterial(false); setNewMaterial({ title: '', url: '', type: 'link' }); }}>إلغاء</Button>
                </div>
              </div>
            )}

            {!showAddMaterial && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddMaterial(true)}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة مادة
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>الاختبار القصير</CardTitle>
            <CardDescription>أنشئ اختبارًا قصيرًا للتحقق من فهم المستفيدين. اتركه فارغًا إذا لم تكن هناك حاجة لاختبار.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="quiz.question" render={({ field }) => (
              <FormItem>
                <FormLabel>السؤال</FormLabel>
                <FormControl><Textarea placeholder="ما هو أهم عنصر في...؟" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="quiz.correctAnswer" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>الخيارات (اختر الإجابة الصحيحة)</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                    {fields.map((item, index) => (
                      <FormField key={item.id} control={form.control} name={`quiz.options.${index}.value`} render={({ field: optionField }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl><RadioGroupItem value={optionField.value} /></FormControl>
                          <Input {...optionField} placeholder={`الخيار ${index + 1}`} />
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
                إضافة خيار
              </Button>
              <FormDescription>يمكنك إضافة ما يصل إلى 4 خيارات.</FormDescription>
            </div>
          </CardContent>
        </Card>

        {/* Assessments */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" />التقييمات</CardTitle>
            <CardDescription>أنشئ تقييمًا قبليًا وبعديًا لقياس مدى تقدم المستفيدين. هذه التقييمات اختيارية.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pre-assessment">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pre-assessment">التقييم القبلي</TabsTrigger>
                <TabsTrigger value="post-assessment">التقييم البعدي</TabsTrigger>
              </TabsList>
              <TabsContent value="pre-assessment" className="pt-4">
                <AssessmentBuilder control={form.control} name="preAssessment" title="أسئلة التقييم القبلي" />
              </TabsContent>
              <TabsContent value="post-assessment" className="pt-4">
                <AssessmentBuilder control={form.control} name="postAssessment" title="أسئلة التقييم البعدي" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </form>
    </Form>
  );
}
