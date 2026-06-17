"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Video } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { format, parseISO, isPast } from "date-fns";
import { ar } from "date-fns/locale";

type Session = {
  id: string; title: string; date: string; status: string; meetLink?: string; duration?: number;
};

export default function BeneficiarySessionsPage() {
  const { user: authUser } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/beneficiary/sessions`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setSessions(json.sessions || []);
    } catch { setSessions([]); } finally { setLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const upcoming = sessions.filter(s => s.status === 'scheduled' && !isPast(parseISO(s.date)));
  const past = sessions.filter(s => s.status !== 'scheduled' || isPast(parseISO(s.date)));

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">جلساتي</h1>
        <p className="text-muted-foreground text-sm mt-1">جلسات الإرشاد والتدريب المجدولة لك</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">الجلسات القادمة ({loading ? "..." : upcoming.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          {!loading && upcoming.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">لا توجد جلسات قادمة.</p>}
          {!loading && upcoming.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{s.title}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(s.date), "d MMMM yyyy", { locale: ar })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(parseISO(s.date), "p", { locale: ar })}</span>
                </div>
              </div>
              {s.meetLink && (
                <Button size="sm" asChild>
                  <a href={s.meetLink} target="_blank" rel="noopener noreferrer"><Video className="ml-1 h-4 w-4" />انضم</a>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">الجلسات السابقة</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {past.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.date ? format(parseISO(s.date), "d MMMM yyyy", { locale: ar }) : ""}</p>
                </div>
                <Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status === 'completed' ? 'مكتملة' : 'ملغاة'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
