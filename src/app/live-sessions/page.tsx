"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Video, ArrowLeft, DollarSign } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/components/language-provider";

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

function formatDate(d: string | null, locale: string) {
  if (!d) return '';
  return new Date(d).toLocaleString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PublicLiveSessionsPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
  const { symbol: currencySymbol } = useCurrency();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    fetch('/api/public/live-sessions')
      .then(r => r.json())
      .then(json => setSessions(json.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen" dir={dir}>
      <div className="container py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
              <Link href="/" className="hover:text-primary transition-colors">{bi('الرئيسية', 'Home')}</Link>
              <span className="text-border/80 select-none">/</span>
              <span className="text-foreground font-medium">{bi('الجلسات المباشرة', 'Live Sessions')}</span>
            </nav>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">{bi('مباشر ومتاح', 'Live & available')}</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              {bi('الجلسات المباشرة', 'Live Sessions')}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
              {bi('انضم إلى جلسات تدريبية مباشرة مع مدربين متخصصين — تفاعلية، مجدولة، ومناسبة لجميع المستويات.', 'Join live training sessions with specialized coaches — interactive, scheduled, and suitable for all levels.')}
            </p>
          </div>
          {!loading && sessions.length > 0 && (
            <div className="flex items-center gap-0.5 bg-muted/70 rounded-lg p-0.5 border border-border/50 shrink-0 self-start">
              {(['all', 'free', 'paid'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f === 'all' ? bi('الكل', 'All') : f === 'free' ? bi('مجاني', 'Free') : bi('مدفوع', 'Paid')}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Video className="h-14 w-14 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-1">{bi('لا توجد جلسات مباشرة حالياً', 'No live sessions available yet')}</p>
            <p className="text-sm mb-6">{bi('تفقّد لاحقاً — يضيف المدربون جلسات جديدة باستمرار.', 'Check back later — coaches keep adding new sessions.')}</p>
            <Button asChild variant="outline">
              <Link href="/">{bi('العودة للرئيسية', 'Back to home')}</Link>
            </Button>
          </div>
        ) : (() => {
          const filtered = sessions.filter(s => {
            if (filter === 'free') return s.price === 0;
            if (filter === 'paid') return s.price > 0;
            return true;
          });
          return filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Video className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-base font-medium">
                {filter === 'free'
                  ? bi('لا توجد جلسات مجانية حالياً.', 'No free sessions available yet.')
                  : filter === 'paid'
                  ? bi('لا توجد جلسات مدفوعة حالياً.', 'No paid sessions available yet.')
                  : bi('لا توجد جلسات حالياً.', 'No sessions available yet.')}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(session => {
              const isFull = session.maxParticipants !== null && session.registrationsCount >= session.maxParticipants;
              return (
                <div key={session.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col">
                  {session.coverImageUrl ? (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img
                        src={session.coverImageUrl}
                        alt={session.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-sky-500/10 to-primary/10 flex items-center justify-center">
                      <Video className="h-10 w-10 text-sky-500/40" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base text-foreground line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                        {session.title}
                      </h3>
                      {isFull && <Badge variant="destructive" className="shrink-0 text-xs">{bi('اكتملت الأماكن', 'Spots full')}</Badge>}
                    </div>
                    {session.coachName && (
                      <p className="text-xs text-muted-foreground">{bi('المدرب:', 'Coach:')} {session.coachName}</p>
                    )}
                    {session.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{session.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-auto">
                      {session.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(session.date, locale)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{bi(`${session.duration} دقيقة`, `${session.duration} min`)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{session.registrationsCount}
                        {session.maxParticipants ? ` / ${session.maxParticipants}` : ''} {bi('مسجل', 'registered')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-bold text-base text-foreground">
                        {session.price > 0 ? `${session.price} ${currencySymbol}` : bi('مجاني', 'Free')}
                      </span>
                      <Button size="sm" asChild disabled={isFull}>
                        <Link href={`/live-sessions/${session.id}`}>
                          {isFull ? bi('اكتملت', 'Full') : bi('التسجيل', 'Register')}
                          {!isFull && <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>
    </div>
  );
}
