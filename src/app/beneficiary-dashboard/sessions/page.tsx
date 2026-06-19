"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Video, CheckCircle } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";

type Session = {
  id: string; title: string; date: string; status: string; meetLink?: string; duration?: number;
};

function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}
function fmtTime(d?: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ""; }
}

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

  const now = new Date().toISOString();
  const upcoming = sessions.filter(s => s.status === 'scheduled' && (s.date || '') >= now);
  const past = sessions.filter(s => s.status !== 'scheduled' || (s.date || '') < now);

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
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(s.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(s.date)}</span>
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

      <Card>
        <CardHeader><CardTitle className="text-base">الجلسات السابقة ({loading ? "..." : past.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          {!loading && past.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">لا توجد جلسات سابقة.</p>}
          {!loading && past.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(s.date)} {fmtTime(s.date)}</p>
              </div>
              <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="gap-1">
                {s.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                {s.status === 'completed' ? 'مكتملة' : 'ملغاة'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
