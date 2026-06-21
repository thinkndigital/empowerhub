'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Users, Calendar, Star, DollarSign, MessageSquare, Clock, PlusCircle, ChevronLeft, Video } from "lucide-react";
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Session = { id: string; title: string; date: string; status: string; attendees: string[]; meetLink?: string };
type Beneficiary = { id: string; name?: string; progress?: number };

function safeDate(d: any): Date {
  if (!d) return new Date(0);
  if (typeof d === 'object' && d._seconds) return new Date(d._seconds * 1000);
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
}

function formatSessionDate(dateStr: string): string {
  const d = safeDate(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  const diffD = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffH <= 0 && diffMs > 0) return 'خلال دقائق';
  if (diffH === 1) return 'خلال ساعة';
  if (diffH < 24 && diffH > 0) return `خلال ${diffH} ساعة`;
  if (diffD === 1) return 'غداً';
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MentorDashboardPage() {
  const { user: authUser } = useUser();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [benefLoading, setBenefLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [sessLoading, setSessLoading] = useState(true);

  const fetchBeneficiaries = useCallback(async () => {
    if (!authUser) return;
    setBenefLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${authUser.uid}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      setBeneficiaries((await res.json()).users || []);
    } catch { setBeneficiaries([]); } finally { setBenefLoading(false); }
  }, [authUser]);

  const fetchSessions = useCallback(async () => {
    if (!authUser) return;
    setSessLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } });
      setAllSessions((await res.json()).sessions || []);
    } catch { setAllSessions([]); } finally { setSessLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const now = useMemo(() => new Date().toISOString(), []);
  const upcomingSessions = useMemo(
    () => allSessions.filter(s => s.status === 'scheduled' && (s.date || '') >= now)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allSessions, now]
  );

  const avgProgress = useMemo(() => {
    if (!beneficiaries || beneficiaries.length === 0) return 0;
    return Math.round(beneficiaries.reduce((s, b) => s + ((b as any).progress || 0), 0) / beneficiaries.length);
  }, [beneficiaries]);

  const nextSession = upcomingSessions[0];

  const metrics = [
    {
      value: beneficiaries?.length ?? 0,
      label: 'المستفيدون',
      sub: 'تحت إشرافك',
      icon: <Users className="h-4 w-4" />,
      color: 'text-primary bg-primary/8',
      loading: benefLoading,
    },
    {
      value: upcomingSessions.length,
      label: 'جلسات قادمة',
      sub: 'مجدولة',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-sky-600 bg-sky-50',
      loading: sessLoading,
    },
    {
      value: `${avgProgress}%`,
      label: 'متوسط التقدم',
      sub: 'للمستفيدين',
      icon: <Star className="h-4 w-4" />,
      color: 'text-amber-600 bg-amber-50',
      loading: benefLoading,
    },
    {
      value: '0.00',
      label: 'الأرباح',
      sub: 'د.أ هذا الشهر',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-emerald-600 bg-emerald-50',
      loading: false,
    },
  ];

  const quickActions = [
    { href: '/mentor-dashboard/sessions', label: 'جدولة جلسة', icon: Calendar, color: 'text-primary bg-primary/8', primary: true },
    { href: '/mentor-dashboard/messages', label: 'الرسائل', icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
    { href: '/mentor-dashboard/my-beneficiaries', label: 'مستفيدوني', icon: Users, color: 'text-violet-600 bg-violet-50' },
    { href: '/mentor-dashboard/analytics', label: 'التحليلات', icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
            لوحة التحكم
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            لوحة المرشد
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            متابعة مستفيديك وجلساتك الإرشادية
          </p>
        </div>
        <Button size="sm" asChild className="gap-1.5 shrink-0">
          <Link href="/mentor-dashboard/sessions">
            <PlusCircle className="h-3.5 w-3.5" />
            جدولة جلسة
          </Link>
        </Button>
      </div>

      {/* ── Next Session Hero ────────────────────────────── */}
      {!sessLoading && nextSession && (
        <div className="next-session-card mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
                الجلسة القادمة
              </p>
              <p className="font-semibold text-foreground truncate">{nextSession.title}</p>
              <p className="text-sm text-muted-foreground">{formatSessionDate(nextSession.date)}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {nextSession.meetLink && (
              <Button size="sm" asChild>
                <a href={nextSession.meetLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-3.5 w-3.5 ml-1.5" />
                  انضم
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href="/mentor-dashboard/sessions">إدارة الجلسات</Link>
            </Button>
          </div>
        </div>
      )}

      {sessLoading && (
        <div className="next-session-card mb-6">
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!sessLoading && upcomingSessions.length === 0 && (
        <div className="rounded-xl border border-dashed border-muted-foreground/25 p-5 mb-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">لا توجد جلسات قادمة</p>
            <p className="text-xs text-muted-foreground mt-0.5">ابدأ بجدولة جلسة مع أحد مستفيديك</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/mentor-dashboard/sessions">
              <PlusCircle className="h-3.5 w-3.5 ml-1.5" />
              جدولة الآن
            </Link>
          </Button>
        </div>
      )}

      {/* ── Metric Strip ────────────────────────────────── */}
      <div className="metric-strip mb-6">
        {metrics.map((m, i) => (
          <div key={i} className="metric-cell">
            {m.loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="metric-number text-foreground">{m.value}</div>
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', m.color)}>
                    {m.icon}
                  </div>
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">{m.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-2 surface p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">الجلسات القادمة</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {upcomingSessions.length > 0 ? `${upcomingSessions.length} جلسة مجدولة` : 'لا توجد جلسات قادمة'}
              </p>
            </div>
            <Link
              href="/mentor-dashboard/sessions"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              إدارة الجلسات
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-1">
            {sessLoading && [...Array(3)].map((_, i) => (
              <div key={i} className="data-row">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}

            {!sessLoading && upcomingSessions.length === 0 && (
              <div className="py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">جدول جلستك الأولى</p>
                <Button size="sm" variant="outline" asChild className="mt-3">
                  <Link href="/mentor-dashboard/sessions">
                    <PlusCircle className="h-3.5 w-3.5 ml-1.5" />
                    جلسة جديدة
                  </Link>
                </Button>
              </div>
            )}

            {!sessLoading && upcomingSessions.slice(0, 5).map(s => (
              <div key={s.id} className="data-row">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{formatSessionDate(s.date)}</p>
                </div>
                {s.meetLink && (
                  <a
                    href={s.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-md px-2.5 py-1 transition-colors"
                  >
                    انضم
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Beneficiaries */}
          <div className="surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">مستفيدوني</h2>
              <Link
                href="/mentor-dashboard/my-beneficiaries"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                عرض الكل
              </Link>
            </div>

            <div className="space-y-3">
              {benefLoading && [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                </div>
              ))}

              {!benefLoading && (beneficiaries || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">لا يوجد مستفيدون بعد.</p>
              )}

              {!benefLoading && (beneficiaries || []).slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold border border-primary/10">
                      {(b.name || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {(b as any).progress || 0}%
                      </span>
                    </div>
                    <Progress value={(b as any).progress || 0} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="surface p-5">
            <h2 className="section-title mb-3">الوصول السريع</h2>
            <div className="space-y-1">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href} className="quick-action-item">
                  <div className={cn('qa-icon', action.color)}>
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{action.label}</span>
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 mr-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
