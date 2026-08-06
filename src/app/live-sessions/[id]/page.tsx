"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  coachName: string;
  date: string | null;
  duration: number;
  price: number;
  maxParticipants: number | null;
  registrationsCount: number;
}

export default function LiveSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public/live-sessions/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.session) setSession(json.session);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/public/live-sessions/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطأ في التسجيل');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleString('ar-SA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const spotsLeft = session?.maxParticipants
    ? session.maxParticipants - (session.registrationsCount || 0)
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isPast = !!session?.date && new Date(session.date).getTime() < Date.now();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir="rtl">
        <p className="text-xl font-semibold text-foreground">الجلسة غير موجودة</p>
        <Link href="/" className="text-primary hover:underline text-sm">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowRight className="h-4 w-4 rotate-180" />
          العودة
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {session.coverImageUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                <img
                  src={session.coverImageUrl}
                  alt={session.title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{session.title}</h1>
              {session.coachName && (
                <p className="text-muted-foreground text-sm">بقيادة: {session.coachName}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {session.date && (
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>{formatDate(session.date)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>{session.duration} دقيقة</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {session.registrationsCount} مسجل
                  {session.maxParticipants ? ` من ${session.maxParticipants}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-primary shrink-0" />
                <span>{session.price > 0 ? `${session.price} د.أ` : 'مجاني'}</span>
              </div>
            </div>
            {session.description && (
              <div className="prose prose-sm max-w-none text-foreground">
                <h2 className="text-base font-semibold mb-2">عن الجلسة</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{session.description}</p>
              </div>
            )}
          </div>

          {/* Registration form */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6 sticky top-24 space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {session.price > 0 ? `${session.price} د.أ` : 'مجاني'}
                </div>
                {isPast ? (
                  <div className="text-xs mt-1 text-destructive">انتهت هذه الجلسة</div>
                ) : spotsLeft !== null && (
                  <div className={`text-xs mt-1 ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isFull ? 'اكتملت الأماكن' : `${spotsLeft} مكان متبقي`}
                  </div>
                )}
              </div>

              {success ? (
                <div className="text-center space-y-2 py-4">
                  <div className="text-4xl">✅</div>
                  <p className="font-semibold text-foreground">تم تسجيلك بنجاح!</p>
                  <p className="text-sm text-muted-foreground">ستصلك تفاصيل الجلسة على بريدك الإلكتروني</p>
                </div>
              ) : isPast ? (
                <div className="text-center space-y-2 py-4">
                  <p className="font-semibold text-foreground">انتهت هذه الجلسة</p>
                  <p className="text-sm text-muted-foreground">لم يعد التسجيل متاحاً لأن موعد الجلسة قد مضى.</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">الاسم *</Label>
                    <Input
                      id="reg-name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="اسمك الكامل"
                      required
                      disabled={isFull}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">البريد الإلكتروني *</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com"
                      required
                      dir="ltr"
                      disabled={isFull}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone">رقم الهاتف</Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+966 5x xxx xxxx"
                      dir="ltr"
                      disabled={isFull}
                    />
                  </div>
                  {error && (
                    <p className="text-destructive text-sm text-center">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={submitting || isFull}>
                    {isFull ? 'اكتملت الأماكن' : submitting ? 'جاري التسجيل...' : 'سجّل الآن'}
                  </Button>
                  {session.price > 0 && !isFull && (
                    <p className="text-xs text-muted-foreground text-center">
                      سيتم التواصل معك لإتمام الدفع بعد التسجيل
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
