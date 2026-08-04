"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Film, HelpCircle, ArrowRight, Star, BookCheck, ThumbsUp, BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type AssessmentQuestion = { question: string; type: "rating" | "text" };

type Lesson = {
  id: string;
  title: string;
  order: number;
  videoUrl?: string;
  content?: string;
};

type Course = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  quiz?: { question: string; options: string[]; correctAnswer: string };
  preAssessment?: AssessmentQuestion[];
  postAssessment?: AssessmentQuestion[];
};

const quizSchema = z.object({ answer: z.string({ required_error: "الرجاء اختيار إجابة." }) });

const AssessmentViewer = ({ title, questions }: { title: string; questions: AssessmentQuestion[] }) => {
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [texts, setTexts] = useState<Record<number, string>>({});

  const handleSubmit = () => {
    toast({ title: "تم إرسال التقييم", description: "شكرًا لمشاركتك، تم حفظ إجاباتك بنجاح." });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" />{title}</CardTitle>
        <CardDescription>الرجاء الإجابة على الأسئلة التالية بصدق لمساعدتنا على فهم احتياجاتك وقياس تقدمك.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="font-medium mb-2">{i + 1}. {q.question}</p>
            {q.type === "rating" && (
              <div className="flex gap-1" dir="ltr">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-7 w-7 cursor-pointer transition-colors ${(ratings[i] || 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    onClick={() => setRatings(r => ({ ...r, [i]: star }))} />
                ))}
              </div>
            )}
            {q.type === "text" && (
              <Textarea placeholder="اكتب إجابتك هنا..." value={texts[i] || ""} onChange={e => setTexts(t => ({ ...t, [i]: e.target.value }))} />
            )}
          </div>
        ))}
        <Button onClick={handleSubmit}><ThumbsUp className="ml-2 h-4 w-4" />إرسال التقييم</Button>
      </CardContent>
    </Card>
  );
};

function getVideoEmbedUrl(url?: string): string | null {
  if (!url) return null;
  if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/");
  if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/");
  return url;
}

export default function CourseDetailsPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const { user: authUser } = useUser();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [markedStarted, setMarkedStarted] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/beneficiary/course/${params.courseId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'فشل تحميل الدورة');
        return;
      }
      const json = await res.json();
      setCourse(json.course);
      setProgress(json.progress || 0);
      setLessons(json.lessons || []);
      if (json.lessons?.length > 0) {
        setSelectedLesson(json.lessons[0]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authUser, params.courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Mark as started (10%) on first open
  useEffect(() => {
    if (!authUser || !course || progress > 0 || markedStarted) return;
    setMarkedStarted(true);
    authUser.getIdToken().then(token => {
      fetch(`/api/beneficiary/course/${params.courseId}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: 10 }),
      }).then(() => setProgress(10)).catch(() => {});
    });
  }, [authUser, course, progress, markedStarted, params.courseId]);

  const form = useForm<z.infer<typeof quizSchema>>({ resolver: zodResolver(quizSchema) });

  async function onSubmit(values: z.infer<typeof quizSchema>) {
    if (!course?.quiz || !authUser) return;
    const isCorrect = values.answer === course.quiz.correctAnswer;
    toast({
      title: isCorrect ? "إجابة صحيحة! 🎉" : "إجابة خاطئة",
      description: isCorrect
        ? "أحسنت! تم تحديث تقدمك في الدورة."
        : `حاول مرة أخرى. الجواب الصحيح هو: ${course.quiz.correctAnswer}`,
      variant: isCorrect ? "default" : "destructive",
    });
    if (isCorrect) {
      const token = await authUser.getIdToken();
      await fetch(`/api/beneficiary/course/${params.courseId}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: 100 }),
      }).catch(() => {});
      setProgress(100);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8" dir="rtl">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Card className="border-0 shadow-sm"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="aspect-video w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center" dir="rtl">
        <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
        <p className="text-muted-foreground">{error || 'لم نتمكن من العثور على الدورة التي تبحث عنها.'}</p>
        <Button asChild className="mt-4"><Link href="/dashboard/training"><ArrowRight className="ml-2 h-4 w-4" />العودة إلى قائمة الدورات</Link></Button>
      </div>
    );
  }

  const hasLessons = lessons.length > 0;
  const singleVideoUrl = getVideoEmbedUrl(course.videoUrl);
  const selectedLessonVideoUrl = getVideoEmbedUrl(selectedLesson?.videoUrl);

  return (
    <div dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          {course.description && (
            <p className="text-lg text-muted-foreground mt-2">{course.description}</p>
          )}
        </div>

        {/* Progress */}
        <Card className="border-0 shadow-sm bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">تقدمك في هذه الدورة</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress >= 100 && <p className="text-xs text-green-600 mt-2 font-medium">أحسنت! لقد أكملت هذه الدورة بنجاح.</p>}
          </CardContent>
        </Card>

        {/* Pre-assessment */}
        {course.preAssessment && course.preAssessment.length > 0 && (
          <AssessmentViewer title="تقييم قبلي" questions={course.preAssessment} />
        )}

        {/* Lessons sidebar + content OR single video */}
        {hasLessons ? (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Sidebar */}
            <div className="w-full md:w-64 md:shrink-0">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> الدروس
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {lessons.map((lesson, idx) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                          selectedLesson?.id === lesson.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="shrink-0 text-xs opacity-70">{idx + 1}.</span>
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lesson content */}
            <div className="flex-1 space-y-4">
              {selectedLesson && (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        {selectedLesson.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedLessonVideoUrl && (
                        <div className="aspect-video">
                          <iframe
                            className="w-full h-full rounded-lg"
                            src={selectedLessonVideoUrl}
                            title={selectedLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {selectedLesson.content && (
                        <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedLesson.content}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        ) : singleVideoUrl ? (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" />محتوى الفيديو</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={singleVideoUrl}
                  title="Course video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Quiz */}
        {course.quiz?.question && course.quiz?.options && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />اختبار قصير</CardTitle>
              <CardDescription>{course.quiz.question}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="answer" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                          {course.quiz?.options.map(option => (
                            <FormItem key={option} className="flex items-center space-x-3 space-x-reverse">
                              <FormControl><RadioGroupItem value={option} /></FormControl>
                              <FormLabel className="font-normal">{option}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit"><CheckCircle className="ml-2 h-4 w-4" />تحقق من الإجابة</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Post-assessment */}
        {course.postAssessment && course.postAssessment.length > 0 && (
          <AssessmentViewer title="تقييم بعدي" questions={course.postAssessment} />
        )}

        <div className="text-center pb-8">
          <Button variant="outline" asChild>
            <Link href="/dashboard/training"><ArrowRight className="ml-2 h-4 w-4" />العودة إلى قائمة الدورات</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
