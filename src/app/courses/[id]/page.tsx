"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OrderDialog } from "@/components/order-dialog";
import {
  ArrowRight, BookOpen, Users, Clock, CheckCircle, Loader2, ShoppingCart,
} from "lucide-react";

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
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/courses/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.course) setCourse(d.course);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" dir="rtl">
        <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
        <Button asChild variant="outline"><Link href="/">العودة للرئيسية</Link></Button>
      </div>
    );
  }

  const isFree = course.price === 0 || course.price === null;

  const orderProduct = {
    id: course.id,
    name: course.title,
    price: course.price ?? 0,
    imageUrl: course.coverImageUrl || '',
    storeId: course.createdBy,
    storeName: course.coachName,
    organizationId: '',
  } as any;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              الرئيسية
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium truncate">{course.title}</span>
        </div>
      </header>

      <main className="container py-10 px-4 md:px-6 max-w-4xl mx-auto">
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
                    <p className="text-xs text-muted-foreground">المدرب</p>
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
                <h2 className="text-lg font-bold mb-3">ما ستتعلمه</h2>
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
                <h2 className="text-lg font-bold mb-3">المتطلبات</h2>
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
          </div>

          {/* Sticky sidebar */}
          <div className="lg:sticky lg:top-20 h-fit">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 pb-6 space-y-4">
                {course.coverImageUrl && (
                  <div className="hidden lg:block relative h-32 rounded-xl overflow-hidden bg-muted mb-2">
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Price */}
                <div>
                  {isFree ? (
                    <Badge className="text-lg px-4 py-1 bg-emerald-500 text-white border-0">مجاني</Badge>
                  ) : (
                    <p className="text-3xl font-extrabold text-primary">{course.price} <span className="text-sm font-normal text-muted-foreground">د.أ</span></p>
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

                {isFree ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href="/register">
                      <BookOpen className="h-5 w-5 ml-2" />
                      سجّل وابدأ مجاناً
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" onClick={() => setOrderOpen(true)}>
                    <ShoppingCart className="h-5 w-5 ml-2" />
                    اشترِ الآن
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">سجّل في المنصة للوصول الكامل للدورة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <OrderDialog product={orderProduct} isOpen={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
}
