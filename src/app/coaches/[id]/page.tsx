"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SessionBookingDialog } from "@/components/session-booking-dialog";
import {
  ArrowRight, ArrowLeft, BookOpen, Users, Calendar, Loader2,
  MessageSquare, Mail, Linkedin, Instagram,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  coverImageUrl: string;
  duration: string;
  enrollmentCount: number;
}

interface Coach {
  id: string;
  name: string;
  bio: string;
  specializations: string[];
  avatarUrl: string;
  sessionPrice: number | null;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  email: string;
  courses: Course[];
}

export default function CoachProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/coaches/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.coach) setCoach(d.coach);
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

  if (notFound || !coach) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" dir="rtl">
        <h1 className="text-2xl font-bold">المدرب غير موجود</h1>
        <Button asChild variant="outline"><Link href="/">العودة للرئيسية</Link></Button>
      </div>
    );
  }

  const name = coach.name || 'بدون اسم';
  const hasPrice = coach.sessionPrice != null && coach.sessionPrice > 0;

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
          <span className="text-sm font-medium truncate">{name}</span>
        </div>
      </header>

      <main className="container py-10 px-4 md:px-6 max-w-4xl mx-auto">
        {/* Profile card */}
        <Card className="border-0 shadow-md overflow-hidden mb-8">
          <div className="h-28 bg-gradient-to-br from-sky-500/20 via-primary/10 to-purple-500/10" />
          <CardContent className="pt-0 pb-6">
            <div className="-mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="h-24 w-24 rounded-full border-4 border-background bg-sky-500/20 flex items-center justify-center text-sky-600 font-bold text-3xl shadow-lg flex-shrink-0 overflow-hidden">
                {coach.avatarUrl ? (
                  <img src={coach.avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : name[0]}
              </div>
              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-extrabold">{name}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">مدرب</p>
              </div>
              {hasPrice && (
                <Button size="lg" className="gap-2 shrink-0" onClick={() => setBookingOpen(true)}>
                  <Calendar className="h-5 w-5" />
                  احجز جلسة — {coach.sessionPrice} د.أ
                </Button>
              )}
            </div>

            {/* Bio */}
            {coach.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">{coach.bio}</p>
            )}

            {/* Specializations */}
            {Array.isArray(coach.specializations) && coach.specializations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">التخصصات</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.specializations.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact info */}
            {(coach.whatsapp || coach.email || coach.linkedin || coach.instagram) && (
              <div>
                <h3 className="text-sm font-semibold mb-3">وسائل التواصل</h3>
                <div className="flex flex-wrap gap-3">
                  {coach.whatsapp && (
                    <a
                      href={`https://wa.me/${coach.whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      واتساب
                    </a>
                  )}
                  {coach.email && (
                    <a
                      href={`mailto:${coach.email}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {coach.email}
                    </a>
                  )}
                  {coach.linkedin && (
                    <a
                      href={coach.linkedin.startsWith('http') ? coach.linkedin : `https://linkedin.com/in/${coach.linkedin}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] text-sm font-medium hover:bg-[#0A66C2]/20 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {coach.instagram && (
                    <a
                      href={coach.instagram.startsWith('http') ? coach.instagram : `https://instagram.com/${coach.instagram}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 text-pink-600 text-sm font-medium hover:bg-pink-500/20 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses */}
        {coach.courses?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              دورات {name} التدريبية
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {coach.courses.map(course => (
                <Card key={course.id} className="border-0 shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="relative h-40 bg-muted">
                    {course.coverImageUrl ? (
                      <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    {course.price != null && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                        {course.price === 0 ? 'مجاني' : `${course.price} د.أ`}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-4 flex-grow">
                    <h3 className="font-bold text-base line-clamp-2 mb-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
                    )}
                    {(course.duration || course.enrollmentCount > 0) && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {course.duration && <span>⏱ {course.duration}</span>}
                        {course.enrollmentCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.enrollmentCount} مسجّل
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/courses/${course.id}`}>
                        تفاصيل الدورة
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {hasPrice && (
        <SessionBookingDialog
          isOpen={bookingOpen}
          onOpenChange={setBookingOpen}
          hostId={coach.id}
          hostName={name}
          hostRole="coach"
          sessionPrice={coach.sessionPrice!}
        />
      )}
    </div>
  );
}
