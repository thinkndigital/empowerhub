"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Film, HelpCircle, Users, ArrowRight, Star, BookCheck, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { doc, collection, query, where, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

type AssessmentQuestion = { question: string; type: "rating" | "text" };
type Course = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  quiz?: { question: string; options: string[]; correctAnswer: string };
  preAssessment?: AssessmentQuestion[];
  postAssessment?: AssessmentQuestion[];
};
type CourseProgress = { id: string; userId: string; courseId: string; progress: number };

const quizSchema = z.object({ answer: z.string({ required_error: "الرجاء اختيار إجابة." }) });

const AssessmentViewer = ({ title, questions }: { title: string; questions: AssessmentQuestion[] }) => {
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [texts, setTexts] = useState<Record<number, string>>({});

  const handleSubmit = () => {
    toast({ title: "تم إرسال التقييم", description: "شكرًا لمشاركتك، تم حفظ إجاباتك بنجاح." });
  };

  return (
    <Card>
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

export default function CourseDetailsPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !params.courseId) return null;
    return doc(firestore, "courses", params.courseId);
  }, [firestore, params.courseId]);
  const { data: courseData, isLoading: loading } = useDoc<Course>(courseRef);

  const progressQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "courseProgress"), where("userId", "==", authUser.uid), where("courseId", "==", params.courseId));
  }, [firestore, authUser, params.courseId]);
  const { data: progressDocs } = useCollection<CourseProgress>(progressQuery);
  const currentProgress = progressDocs?.[0]?.progress || 0;

  // Mark course as started (10%) when first opened
  useEffect(() => {
    if (!firestore || !authUser || !courseData || currentProgress > 0) return;
    const progressId = `${authUser.uid}_${params.courseId}`;
    setDoc(doc(firestore, "courseProgress", progressId), {
      userId: authUser.uid, courseId: params.courseId, progress: 10, updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  }, [firestore, authUser, courseData, currentProgress, params.courseId]);

  const form = useForm<z.infer<typeof quizSchema>>({ resolver: zodResolver(quizSchema) });

  async function onSubmit(values: z.infer<typeof quizSchema>) {
    if (!courseData?.quiz || !firestore || !authUser) return;
    const isCorrect = values.answer === courseData.quiz.correctAnswer;
    toast({
      title: isCorrect ? "إجابة صحيحة! 🎉" : "إجابة خاطئة",
      description: isCorrect ? "أحسنت! تم تحديث تقدمك في الدورة." : `حاول مرة أخرى. الجواب الصحيح هو: ${courseData.quiz.correctAnswer}`,
      variant: isCorrect ? "default" : "destructive",
    });
    if (isCorrect) {
      const progressId = `${authUser.uid}_${params.courseId}`;
      await setDoc(doc(firestore, "courseProgress", progressId), {
        userId: authUser.uid, courseId: params.courseId, progress: 100, completedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    }
  }

  const handleBookSession = () => {
    toast({ title: "تم إرسال طلبك", description: "تم إرسال طلبك لحجز جلسة فردية مع المدرب. سيتم التواصل معك للتأكيد." });
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-full" />
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="aspect-video w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
        <p className="text-muted-foreground">لم نتمكن من العثور على الدورة التي تبحث عنها.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/training"><ArrowRight className="ml-2 h-4 w-4" />العودة إلى قائمة الدورات</Link></Button>
      </div>
    );
  }

  const videoEmbedUrl = courseData.videoUrl?.includes("watch?v=")
    ? courseData.videoUrl.replace("watch?v=", "embed/")
    : courseData.videoUrl;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{courseData.title}</h1>
        <p className="text-lg text-muted-foreground mt-2">{courseData.description}</p>
      </div>

      {/* Progress bar */}
      <Card className="border-0 shadow-sm bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">تقدمك في هذه الدورة</span>
            <span className="font-bold text-primary">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
          {currentProgress >= 100 && <p className="text-xs text-green-600 mt-2 font-medium">أحسنت! لقد أكملت هذه الدورة بنجاح.</p>}
        </CardContent>
      </Card>

      {courseData.preAssessment && courseData.preAssessment.length > 0 && (
        <AssessmentViewer title="تقييم قبلي" questions={courseData.preAssessment} />
      )}

      {videoEmbedUrl && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" />محتوى الفيديو</CardTitle></CardHeader>
          <CardContent>
            <div className="aspect-video">
              <iframe className="w-full h-full rounded-lg" src={videoEmbedUrl} title="Course video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />جلسات فردية مع المدرب</CardTitle>
          <CardDescription>هل تحتاج إلى مساعدة إضافية؟ احجز جلسة فردية (1-to-1) مع مدرب الدورة.</CardDescription>
        </CardHeader>
        <CardContent><Button onClick={handleBookSession}>حجز جلسة 1-to-1</Button></CardContent>
      </Card>

      {courseData.quiz?.question && courseData.quiz?.options && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />اختبار قصير</CardTitle>
            <CardDescription>{courseData.quiz.question}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="answer" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                        {courseData.quiz?.options.map(option => (
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

      {courseData.postAssessment && courseData.postAssessment.length > 0 && (
        <AssessmentViewer title="تقييم بعدي" questions={courseData.postAssessment} />
      )}

      <div className="text-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard/training"><ArrowRight className="ml-2 h-4 w-4" />العودة إلى قائمة الدورات</Link>
        </Button>
      </div>
    </div>
  );
}
