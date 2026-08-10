"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CourseEnrollDialog } from "@/components/course-enroll-dialog";
import {
  ArrowRight, BookOpen, Users, Clock, CheckCircle, Loader2,
  ShoppingCart, PlayCircle, GraduationCap,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  coverImageUrl: string;
  duration: string;
  createdBy: string;
  coachName: string;
  coachAvatarUrl: string;
  enrollmentCount: number;
  objectives: string[];
  requirements: string[];
  isEnrolled: boolean;
}

export default function CourseDetailPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const { id } = useParams<{ id: string }>();
  const { user: authUser, loading: authLoading } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authUser) {
        const token = await authUser.getIdToken();
        headers.authorization = `Bearer ${token}`;
      }
      const res = await fetch(`/api/public/courses/${id}`, { headers });
      const d = await res.json();
      if (d.course) {
        setCourse(d.course);
        setIsEnrolled(d.course.isEnrolled || false);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, authUser]);

  useEffect(() => {
    if (!authLoading) fetchCourse();
  }, [authLoading, fetchCourse]);

  const handleEnrolled = () => {
    setIsEnrolled(true);
    setEnrollOpen(false);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir={dir}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" dir={dir}>
        <h1 className="text-2xl font-bold">{bi('الدورة غير موجودة', 'Course not found')}</h1>
        <Button asChild variant="outline"><Link href="/">{bi('العودة للرئيسية', 'Back to home')}</Link></Button>
      </div>
    );
  }

  const isFree = course.price === 0 || course.price === null;

  // Determine CTA button
  const renderCTA = () => {
    if (isEnrolled) {
      return (
        <Button className="w-full" size="lg" asChild>
          <Link href={`/dashboard/training/${course.id}`}>
            <PlayCircle className="h-5 w-5 ml-2" />
            {bi('تابع الدورة', 'Continue course')}
          </Link>
        </Button>
      );
    }

    // Both guests and logged-in users → open dialog directly
    return (
      <Button className="w-full" size="lg" onClick={() => setEnrollOpen(true)}>
        {isFree ? (
          <><GraduationCap className="h-5 w-5 ml-2" />{bi('اشترك مجاناً', 'Enroll for free')}</>
        ) : (
          <><ShoppingCart className="h-5 w-5 ml-2" />{bi('اشترك الآن', 'Enroll now')}</>
        )}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              {bi('الرئيسية', 'Home')}
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium truncate">{course.title}</span>

          {/* Enrolled badge in header */}
          {isEnrolled && (
            <Badge className="mr-auto bg-emerald-500 border-0 text-white">
              <CheckCircle className="h-3 w-3 ml-1" />
              {bi('مسجّل', 'Enrolled')}
            </Badge>
          )}
        </div>
      </header>

      <main className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover image */}
            {course.coverImageUrl && (
              <div className="relative h-56 rounded-2xl overflow-hidden bg-muted">
                <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-3">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{course.description}</p>
              )}
            </div>

            {/* Coach */}
            {course.coachName && (
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                    {course.coachAvatarUrl ? (
                      <img src={course.coachAvatarUrl} alt={course.coachName} className="h-full w-full object-cover" />
                    ) : course.coachName[0]}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{bi('المدرب', 'Coach')}</p>
                    <Link href={`/coaches/${course.createdBy}`} className="font-semibold text-sm hover:text-primary transition-colors">
                      {course.coachName}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Objectives */}
            {course.objectives?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3">{bi('ما ستتعلمه', 'What you will learn')}</h2>
                <ul className="space-y-2">
                  {course.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3">{bi('المتطلبات', 'Requirements')}</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile CTA */}
            <div className="lg:hidden">
              {renderCTA()}
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-20 h-fit">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 pb-6 space-y-4">
                {course.coverImageUrl && (
                  <div className="relative h-32 rounded-xl overflow-hidden bg-muted mb-2">
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Price */}
                <div>
                  {isEnrolled ? (
                    <Badge className="text-sm px-3 py-1 bg-emerald-500 text-white border-0">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      {bi('مسجّل في الدورة', 'Enrolled in course')}
                    </Badge>
                  ) : isFree ? (
                    <Badge className="text-lg px-4 py-1 bg-emerald-500 text-white border-0">{bi('مجاني', 'Free')}</Badge>
                  ) : (
                    <p className="text-3xl font-extrabold text-primary">
                      {course.price} <span className="text-sm font-normal text-muted-foreground">{bi('د.أ', 'JOD')}</span>
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </span>
                  )}
                  {course.enrollmentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrollmentCount}
                    </span>
                  )}
                </div>

                {renderCTA()}

                {!isEnrolled && (
                  <p className="text-xs text-muted-foreground text-center">
                    {bi('أدخل بياناتك للتسجيل الفوري في الدورة.', 'Enter your details to enroll in the course instantly.')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <CourseEnrollDialog
        courseId={course.id}
        courseTitle={course.title}
        coursePrice={course.price}
        isOpen={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnrolled={handleEnrolled}
      />
    </div>
  );
}
