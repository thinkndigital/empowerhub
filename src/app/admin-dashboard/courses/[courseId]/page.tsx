
"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, PlusCircle, ArrowRight, BookCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";

const courseEditSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
  description: z.string().optional(),
  videoUrl: z.string().url({ message: "الرجاء إدخال رابط فيديو صحيح (مثل يوتيوب أو فيميو)." }).optional().or(z.literal('')),
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

// Represents the data shape in Firestore
interface CourseDataFromDB {
  title: string;
  category: string;
  description?: string;
  videoUrl?: string;
  quiz?: {
    question: string;
    options: string[]; // Note: this is an array of strings
    correctAnswer: string;
  };
  preAssessment?: any[];
  postAssessment?: any[];
}


const AssessmentBuilder = ({ control, name, title }: { control: any, name: "preAssessment" | "postAssessment", title: string }) => {
    const { lang } = useLanguage();
    const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
    const { fields, append, remove } = useFieldArray({
        control,
        name
    });

    return (
        <div className="space-y-4">
            <h3 className="font-medium">{title}</h3>
            {fields.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
                    <div className="flex-grow space-y-2">
                        <FormField
                            control={control}
                            name={`${name}.${index}.question`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{bi("السؤال", "Question")} {index + 1}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={bi("نص السؤال...", "Question text...")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name={`${name}.${index}.type`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{bi("نوع السؤال", "Question type")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={bi("اختر نوع السؤال", "Select question type")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="rating">{bi("تقييم (1-5)", "Rating (1-5)")}</SelectItem>
                                            <SelectItem value="text">{bi("نص مفتوح", "Open text")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", type: "rating" })}>
                <PlusCircle className="ml-2 h-4 w-4" />
                {bi("إضافة سؤال", "Add question")}
            </Button>
        </div>
    );
};


export default function AdminCourseEditPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !params.courseId) return null;
    return doc(firestore, "courses", params.courseId);
  }, [firestore, params.courseId]);

  const { data: course, isLoading: loading } = useDoc<CourseDataFromDB>(courseRef);

  const form = useForm<CourseEditFormValues>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      videoUrl: "",
      quiz: {
        question: "",
        options: [{ value: "" }, { value: "" }],
        correctAnswer: "",
      },
      preAssessment: [],
      postAssessment: [],
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        category: course.category,
        description: course.description || "",
        videoUrl: course.videoUrl || "",
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

  const { fields: quizOptions, append: appendQuizOption, remove: removeQuizOption } = useFieldArray({
    control: form.control,
    name: "quiz.options",
  });

  async function onSubmit(values: CourseEditFormValues) {
    if (!courseRef) return;
    
    const dataToUpdate = {
        ...values,
        quiz: values.quiz ? {
            ...values.quiz,
            options: values.quiz.options.map(o => o.value).filter(Boolean)
        } : null,
    };
    
    if (dataToUpdate.quiz?.options.length === 0) {
        dataToUpdate.quiz = null;
    }


    updateDoc(courseRef, dataToUpdate)
    .then(() => {
        toast({
            title: bi("تم الحفظ بنجاح", "Saved successfully"),
            description: bi(`تم تحديث تفاصيل دورة "${values.title}".`, `The details of course "${values.title}" were updated.`),
        });
    })
    .catch((serverError) => {
        toast({
            variant: "destructive",
            title: bi("حدث خطأ!", "An error occurred!"),
            description: bi("لم نتمكن من حفظ التغييرات. الرجاء المحاولة مرة أخرى.", "We couldn't save the changes. Please try again."),
        });
        const permissionError = new FirestorePermissionError({
            path: courseRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
            <Card className="border-0 shadow-sm">
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!course) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{bi("الدورة غير موجودة", "Course not found")}</h1>
            <p className="text-muted-foreground">{bi("لم نتمكن من العثور على الدورة التي تبحث عنها.", "We couldn't find the course you're looking for.")}</p>
            <Button asChild className="mt-4">
                <Link href="/admin-dashboard/courses">{bi("العودة إلى الدورات", "Back to courses")}</Link>
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <h1 className="text-2xl font-bold tracking-tight">{bi("تحرير محتوى الدورة (المشرف)", "Edit course content (Admin)")}</h1>
                 <p className="text-sm text-muted-foreground">{bi("أنت تقوم بتعديل دورة:", "You're editing course:")} <span className="font-bold text-primary">{course.title}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                    <Link href="/admin-dashboard/courses">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        {bi("العودة", "Back")}
                    </Link>
                </Button>
                <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    {bi("حفظ التغييرات", "Save changes")}
                </Button>
            </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("المعلومات الأساسية", "Basic information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>{bi("عنوان الدورة", "Course title")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>{bi("الفئة", "Category")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{bi("الوصف", "Description")}</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>{bi("محتوى الفيديو", "Video content")}</CardTitle>
                <CardDescription>{bi("أضف رابط الفيديو الرئيسي للدورة. يمكنك استخدام روابط من يوتيوب أو فيميو.", "Add the course's main video link. You can use YouTube or Vimeo links.")}</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="videoUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{bi("رابط الفيديو", "Video link")}</FormLabel>
                        <FormControl><Input dir="ltr" placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>{bi("الاختبار القصير", "Short quiz")}</CardTitle>
                <CardDescription>{bi("أنشئ اختبارًا قصيرًا للتحقق من فهم المستفيدين. اتركه فارغًا إذا لم تكن هناك حاجة لاختبار.", "Create a short quiz to check beneficiaries' understanding. Leave it empty if no quiz is needed.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="quiz.question" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{bi("السؤال", "Question")}</FormLabel>
                        <FormControl><Textarea placeholder={bi("ما هو أهم عنصر في...؟", "What is the most important element in...?")} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField
                    control={form.control}
                    name="quiz.correctAnswer"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>{bi("الخيارات (اختر الإجابة الصحيحة)", "Options (select the correct answer)")}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-2"
                            >
                                {quizOptions.map((item, index) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name={`quiz.options.${index}.value`}
                                        render={({ field: optionField }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={optionField.value} />
                                                </FormControl>
                                                <Input {...optionField} placeholder={`${bi("الخيار", "Option")} ${index + 1}`} />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeQuizOption(index)} disabled={quizOptions.length <= 2}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => appendQuizOption({ value: "" })} disabled={quizOptions.length >= 4}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        {bi("إضافة خيار", "Add option")}
                    </Button>
                    <FormDescription>{bi("يمكنك إضافة ما يصل إلى 4 خيارات.", "You can add up to 4 options.")}</FormDescription>
                </div>
            </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" />{bi("التقييمات", "Assessments")}</CardTitle>
                <CardDescription>
                    {bi("أنشئ تقييمًا قبليًا وبعديًا لقياس مدى تقدم المستفيدين. هذه التقييمات اختيارية.", "Create a pre- and post-assessment to measure beneficiaries' progress. These assessments are optional.")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pre-assessment">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pre-assessment">{bi("التقييم القبلي", "Pre-assessment")}</TabsTrigger>
                        <TabsTrigger value="post-assessment">{bi("التقييم البعدي", "Post-assessment")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pre-assessment" className="pt-4">
                        <AssessmentBuilder
                            control={form.control}
                            name="preAssessment"
                            title={bi("أسئلة التقييم القبلي", "Pre-assessment questions")}
                        />
                    </TabsContent>
                    <TabsContent value="post-assessment" className="pt-4">
                       <AssessmentBuilder
                            control={form.control}
                            name="postAssessment"
                            title={bi("أسئلة التقييم البعدي", "Post-assessment questions")}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}


    
