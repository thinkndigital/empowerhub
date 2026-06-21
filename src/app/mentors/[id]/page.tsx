"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SessionBookingDialog } from "@/components/session-booking-dialog";
import {
  ArrowRight, Phone, Mail, Linkedin, Instagram, MessageSquare,
  Calendar, Star, CheckCircle, Loader2,
} from "lucide-react";

interface Mentor {
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
}

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/mentors/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.mentor) setMentor(d.mentor);
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

  if (notFound || !mentor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" dir="rtl">
        <h1 className="text-2xl font-bold">المرشد غير موجود</h1>
        <Button asChild variant="outline"><Link href="/">العودة للرئيسية</Link></Button>
      </div>
    );
  }

  const name = mentor.name || 'بدون اسم';
  const hasPrice = mentor.sessionPrice != null && mentor.sessionPrice > 0;

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

      <main className="container py-10 px-4 md:px-6 max-w-3xl mx-auto">
        {/* Profile card */}
        <Card className="border-0 shadow-md overflow-hidden mb-8">
          <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10" />
          <CardContent className="pt-0 pb-6">
            <div className="-mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="h-24 w-24 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl shadow-lg flex-shrink-0">
                {mentor.avatarUrl ? (
                  <img src={mentor.avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
                ) : name[0]}
              </div>
              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-extrabold">{name}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">مرشد</p>
              </div>
            </div>

            {/* Bio */}
            {mentor.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">{mentor.bio}</p>
            )}

            {/* Specializations */}
            {mentor.specializations?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">التخصصات</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.specializations.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Session price + book button */}
            {hasPrice && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">سعر الجلسة</p>
                  <p className="text-2xl font-extrabold text-primary">{mentor.sessionPrice} <span className="text-sm font-normal">د.أ</span></p>
                </div>
                <Button size="lg" className="gap-2" onClick={() => setBookingOpen(true)}>
                  <Calendar className="h-5 w-5" />
                  احجز جلسة
                </Button>
              </div>
            )}

            {!hasPrice && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border mb-6">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">تواصل مع المرشد لمعرفة سعر الجلسة</p>
              </div>
            )}

            {/* Contact info */}
            {(mentor.whatsapp || mentor.email || mentor.linkedin || mentor.instagram) && (
              <div>
                <h3 className="text-sm font-semibold mb-3">وسائل التواصل</h3>
                <div className="flex flex-wrap gap-3">
                  {mentor.whatsapp && (
                    <a
                      href={`https://wa.me/${mentor.whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      واتساب
                    </a>
                  )}
                  {mentor.email && (
                    <a
                      href={`mailto:${mentor.email}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {mentor.email}
                    </a>
                  )}
                  {mentor.linkedin && (
                    <a
                      href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://linkedin.com/in/${mentor.linkedin}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] text-sm font-medium hover:bg-[#0A66C2]/20 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {mentor.instagram && (
                    <a
                      href={mentor.instagram.startsWith('http') ? mentor.instagram : `https://instagram.com/${mentor.instagram}`}
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

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-4">هل تريد التسجيل في المنصة؟</p>
          <Button asChild variant="outline">
            <Link href="/register">إنشاء حساب مجاناً</Link>
          </Button>
        </div>
      </main>

      {hasPrice && (
        <SessionBookingDialog
          isOpen={bookingOpen}
          onOpenChange={setBookingOpen}
          hostId={mentor.id}
          hostName={name}
          hostRole="mentor"
          sessionPrice={mentor.sessionPrice!}
        />
      )}
    </div>
  );
}
