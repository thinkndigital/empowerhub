"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, Clock, Users, DollarSign, UserPlus, Video } from "lucide-react";

interface LiveSession {
  id: string;
  title: string;
  coachName: string;
  date: string | null;
  duration: number;
  price: number;
  maxParticipants: number | null;
  status: string;
  coverImageUrl: string;
  registrationsCount: number;
}

interface Beneficiary {
  id: string;
  name?: string;
  email?: string;
}

export default function OrgLiveSessionsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignSession, setAssignSession] = useState<LiveSession | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/live-sessions', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setSessions(json.sessions || []);
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل الجلسات المباشرة' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openAssign = async (session: LiveSession) => {
    setAssignSession(session);
    setSelectedIds([]);
    setLoadingBeneficiaries(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/org/users?role=beneficiary&scope=org', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBeneficiaries(json.users || []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  const handleAssign = async () => {
    if (!user || !assignSession || selectedIds.length === 0) return;
    setAssigning(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/live-sessions/assign', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: assignSession.id, beneficiaryIds: selectedIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل التعيين');
      }
      toast({ title: 'تم التعيين بنجاح', description: `تم تسجيل ${selectedIds.length} مستفيد في الجلسة.` });
      setAssignSession(null);
      setSelectedIds([]);
      fetchSessions();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const published = sessions.filter(s => s.status === 'published').length;
  const totalRegs = sessions.reduce((acc, s) => acc + (s.registrationsCount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الجلسات المباشرة</h1>
        <p className="text-sm text-muted-foreground">جميع الجلسات المباشرة من مدربي المنظمة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الجلسات', value: sessions.length, icon: Video },
          { label: 'منشور', value: published, icon: Video },
          { label: 'إجمالي المسجلين', value: totalRegs, icon: Users },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2 shrink-0">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Video className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">لا توجد جلسات مباشرة بعد</p>
          <p className="text-sm mt-1">ستظهر هنا جلسات المدربين المنتسبين للمنظمة</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map(session => (
            <Card key={session.id} className="overflow-hidden">
              {session.coverImageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img src={session.coverImageUrl} alt={session.title} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                    {session.coachName && <p className="text-xs text-muted-foreground">{session.coachName}</p>}
                  </div>
                  <Badge variant={session.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
                    {session.status === 'published' ? 'منشور' : 'مسودة'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {session.date && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(session.date)}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.duration} دقيقة</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{session.registrationsCount} مسجل</span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    <DollarSign className="h-3 w-3" />
                    {session.price > 0 ? `${session.price} ريال` : 'مجاني'}
                  </span>
                </div>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => openAssign(session)}>
                  <UserPlus className="h-3.5 w-3.5 ml-1.5" />
                  تعيين لمستفيد
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={!!assignSession} onOpenChange={(open) => !open && setAssignSession(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> تعيين الجلسة لمستفيد
            </DialogTitle>
            <DialogDescription>اختر المستفيدين لتسجيلهم في: {assignSession?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-72 overflow-y-auto py-2">
            {loadingBeneficiaries ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : beneficiaries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا يوجد مستفيدون بعد</p>
            ) : (
              beneficiaries.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedIds(prev => prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id])}>
                  <Checkbox checked={selectedIds.includes(b.id)} onCheckedChange={() => {}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name || 'مستفيد'}</p>
                    {b.email && <p className="text-xs text-muted-foreground truncate">{b.email}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignSession(null)}>إلغاء</Button>
            <Button onClick={handleAssign} disabled={assigning || selectedIds.length === 0}>
              {assigning ? 'جارٍ التعيين...' : `تعيين (${selectedIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
