"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Video, Users } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/components/language-provider";

interface LiveSession { id: string; title: string; coachName: string; date: string | null; duration: number; price: number; maxParticipants: number | null; registrationsCount: number; }

function formatDate(d: string | null, locale: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminLiveSessionsPage() {
  const { symbol } = useCurrency();
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/live-sessions').then(r => r.json()).then(d => setSessions(d.sessions || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("الجلسات المباشرة", "Live Sessions")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bi("جميع الجلسات المباشرة على المنصة", "All live sessions on the platform")}</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{sessions.length} {bi("جلسة", "sessions")}</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{bi("الجلسة", "Session")}</TableHead>
              <TableHead className="text-right">{bi("المدرب", "Coach")}</TableHead>
              <TableHead className="text-right">{bi("التاريخ", "Date")}</TableHead>
              <TableHead className="text-right">{bi("السعر", "Price")}</TableHead>
              <TableHead className="text-right">{bi("المقاعد", "Seats")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : sessions.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground"><Video className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{bi("لا توجد جلسات بعد.", "No sessions yet.")}</p></TableCell></TableRow>
            ) : sessions.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium max-w-xs">
                  <p className="truncate text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.duration} {bi("دقيقة", "min")}</p>
                </TableCell>
                <TableCell className="text-sm">{s.coachName || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(s.date, locale)}</TableCell>
                <TableCell>
                  {s.price > 0
                    ? <Badge variant="default" className="text-xs">{s.price} {symbol}</Badge>
                    : <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700">{bi("مجاني", "Free")}</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{s.registrationsCount}</span>
                    {s.maxParticipants && <span className="text-muted-foreground">/ {s.maxParticipants}</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
