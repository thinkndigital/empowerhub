"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Video, ArrowLeft, DollarSign } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

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

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PublicLiveSessionsPage() {
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
    <div className="bg-background text-foreground min-h-screen" dir="rtl">
      <div className="container py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
              <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <span className="text-border/80 select-none">/</span>
              <span className="text-foreground font-medium">الجلسات المباشرة</span>
            </nav>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">مباشر ومتاح</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              الجلسات المباشرة
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
              انضم إلى جلسات تدريبية مباشرة مع مدربين متخصصين — تفاعلية، مجدولة، ومناسبة لجميع المستويات.
            </p>
          </div>
          {!loading && sessions.length > 0 && (
            <div className="flex items-center gap-0.5 bg-muted/70 rounded-lg p-0.5 border border-border/50 shrink-0 self-start">
              {(['all', 'free', 'paid'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f === 'all' ? 'الكل' : f === 'free' ? 'مجاني' : 'مدفوع'}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Video className="h-14 w-14 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-1">لا توجد جلسات مباشرة حالياً</p>
            <p className="text-sm mb-6">تفقّد لاحقاً — يضيف المدربون جلسات جديدة باستمرار.</p>
            <Button asChild variant="outline">
              <Link href="/">العودة للرئيسية</Link>
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
              <p className="text-base font-medium">لا توجد جلسات {filter === 'free' ? 'مجانية' : 'مدفوعة'} حالياً.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                      {isFull && <Badge variant="destructive" className="shrink-0 text-xs">اكتملت الأماكن</Badge>}
                    </div>
                    {session.coachName && (
                      <p className="text-xs text-muted-foreground">المدرب: {session.coachName}</p>
                    )}
                    {session.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{session.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-auto">
                      {session.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(session.date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{session.duration} دقيقة
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{session.registrationsCount}
                        {session.maxParticipants ? ` / ${session.maxParticipants}` : ''} مسجل
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-bold text-base text-foreground">
                        {session.price > 0 ? `${session.price} ${currencySymbol}` : 'مجاني'}
                      </span>
                      <Button size="sm" asChild disabled={isFull}>
                        <Link href={`/live-sessions/${session.id}`}>
                          {isFull ? 'اكتملت' : 'التسجيل'}
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
