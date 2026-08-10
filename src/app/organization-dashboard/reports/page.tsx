
"use client"

import { useMemo, useState, useEffect, useCallback } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, Users, Activity, BarChart3, TrendingUp, Target, Award, CheckCircle, BookUser, Star } from "lucide-react"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/firebase/auth/use-user"
import { format, subMonths, startOfMonth } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import Link from "next/link"
import { Lock } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

type Session = { id: string; date: string; status: string; hostId: string; attendees: string[] };
type Beneficiary = { id: string; name?: string; progress?: number; createdAt?: string };

type MentoringBeneficiary = { id: string; mentorId?: string; coachId?: string };

type ReportsData = {
  beneficiaries: Beneficiary[];
  mentorsCount: number;
  sessions: Session[];
};

export default function OrgReportsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const engagementConfig = useMemo(() => ({ active: { label: bi("المستفيدون النشطون", "Active beneficiaries"), color: "hsl(var(--chart-1))" } }), [lang]);
  const completionConfig = useMemo(() => ({ completionRate: { label: bi("معدل الإكمال", "Completion rate"), color: "hsl(var(--chart-2))" } }), [lang]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, progress: true, engagement: true });
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockedMessage, setLockedMessage] = useState('');
  const [mentoringBeneficiaries, setMentoringBeneficiaries] = useState<MentoringBeneficiary[]>([]);
  const [mentoringSessionsData, setMentoringSessionsData] = useState<Session[]>([]);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const [reportsRes, sessionsRes, beneficiariesRes] = await Promise.all([
        fetch('/api/org/reports', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sessions?scope=all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/org/users?role=beneficiary', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (reportsRes.status === 403) {
        const err = await reportsRes.json().catch(() => ({}));
        setLockedMessage(err.error || bi('هذه الميزة غير متاحة بخطتك الحالية.', 'This feature is not available on your current plan.'));
      } else if (reportsRes.ok) {
        setData(await reportsRes.json());
      }
      if (sessionsRes.ok) {
        const s = await sessionsRes.json();
        setMentoringSessionsData(s.sessions || []);
      }
      if (beneficiariesRes.ok) {
        const b = await beneficiariesRes.json();
        setMentoringBeneficiaries(b.users || b.beneficiaries || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const beneficiaries = data?.beneficiaries ?? [];
  const sessions = data?.sessions ?? [];

  const stats = useMemo(() => {
    const total = beneficiaries.length;
    const active = beneficiaries.filter(b => (b.progress ?? 0) > 0).length;
    const avgProgress = total > 0
      ? Math.round(beneficiaries.reduce((s, b) => s + (b.progress || 0), 0) / total)
      : 0;
    const completed = beneficiaries.filter(b => (b.progress ?? 0) >= 100).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalSessions = sessions.filter(s => s.status === 'completed').length;
    return { total, active, avgProgress, completed, completionRate, totalSessions };
  }, [beneficiaries, sessions]);

  const engagementData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
      const activeInMonth = beneficiaries.filter(b => {
        const created = new Date(b.createdAt || '').getTime();
        return created <= end && (b.progress ?? 0) > 0;
      }).length;
      return { month: format(d, 'MMM', { locale: lang === 'en' ? enUS : ar }), active: activeInMonth };
    });
  }, [beneficiaries, lang]);

  const progressDistribution = useMemo(() => {
    const ranges = [
      { name: "0-25%", min: 0, max: 25 },
      { name: "26-50%", min: 26, max: 50 },
      { name: "51-75%", min: 51, max: 75 },
      { name: "76-100%", min: 76, max: 100 },
    ];
    return ranges.map(r => ({
      name: r.name,
      completionRate: beneficiaries.filter(b => {
        const p = b.progress || 0;
        return p >= r.min && p <= r.max;
      }).length,
    }));
  }, [beneficiaries]);

  const handleExport = () => {
    const headers = lang === 'en'
      ? ['Name', 'Progress %', 'Status', 'Registration date']
      : ['الاسم', 'نسبة التقدم %', 'الحالة', 'تاريخ التسجيل'];
    const rows = beneficiaries.map(b => [
      b.name || '',
      b.progress ?? 0,
      (b.progress ?? 0) >= 100 ? bi('أكمل', 'Completed') : (b.progress ?? 0) > 0 ? bi('نشط', 'Active') : bi('جديد', 'New'),
      b.createdAt ? new Date(b.createdAt).toLocaleDateString(locale) : '',
    ]);
    const summary = {
      [bi('إجمالي المستفيدين', 'Total beneficiaries')]: String(stats.total),
      [bi('النشطون', 'Active')]: String(stats.active),
      [bi('متوسط التقدم', 'Average progress')]: `${stats.avgProgress}%`,
      [bi('نسبة الإكمال', 'Completion rate')]: `${stats.completionRate}%`,
      [bi('جلسات منجزة', 'Completed sessions')]: String(stats.totalSessions),
    };
    if (exportOptions.summary || exportOptions.progress) {
      exportToExcel(bi('تقرير_الأثر', 'Impact_Report'), headers, rows, { sheetName: bi('تقرير التقدم', 'Progress Report') });
      exportToPDF(bi('تقارير الأثر والتحليلات', 'Impact & Analytics Reports'), headers, rows, { summary });
    }
    toast({ title: bi("تم التصدير بنجاح", "Exported successfully") });
    setIsExportDialogOpen(false);
  };

  if (!loading && lockedMessage) {
    return (
      <div className="flex items-center justify-center py-24" dir={dir}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-1">{bi("التقارير غير متاحة حالياً", "Reports are not available right now")}</h2>
              <p className="text-sm text-muted-foreground">{lockedMessage}</p>
            </div>
            <Button asChild>
              <Link href="/organization-dashboard/settings">{bi("الذهاب لصفحة الاشتراك", "Go to subscription page")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("تقارير الأثر والتحليلات", "Impact & analytics reports")}</h1>
          <p className="page-subtitle">{bi("قياس أثر برامج التمكين في منظمتك", "Measure the impact of empowerment programs in your organization")}</p>
        </div>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="ml-2 h-4 w-4" />
              {bi("تصدير التقارير", "Export reports")}
            </Button>
          </DialogTrigger>
          <DialogContent dir={dir}>
            <DialogHeader>
              <DialogTitle>{bi("تصدير التقارير", "Export reports")}</DialogTitle>
              <DialogDescription>{bi("اختر أجزاء التقرير للتصدير.", "Choose which report sections to export.")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {[
                { key: "summary" as const, label: bi("الملخص الإحصائي", "Statistical summary") },
                { key: "progress" as const, label: bi("توزيع التقدم", "Progress distribution") },
                { key: "engagement" as const, label: bi("مشاركة المستفيدين", "Beneficiary engagement") },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(p => ({ ...p, [item.key]: !p[item.key] }))} />
                  <Label htmlFor={item.key}>{item.label}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
              <Button onClick={handleExport}>{bi("تصدير", "Export")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: bi("إجمالي المستفيدين", "Total beneficiaries"),  value: String(stats.total),            sub: bi("مستفيد مسجل", "registered"),           icon: <Users />,    bg: "bg-primary/10",    ic: "bg-primary" },
          { label: bi("المستفيدون النشطون", "Active beneficiaries"), value: String(stats.active),           sub: bi(`من أصل ${stats.total}`, `out of ${stats.total}`), icon: <Activity />, bg: "bg-emerald-500/10",ic: "bg-emerald-500" },
          { label: bi("متوسط التقدم", "Average progress"),       value: `${stats.avgProgress}%`,        sub: bi("نسبة الإنجاز الكلية", "overall completion rate"),  icon: <BarChart3 />,bg: "bg-amber-500/10",  ic: "bg-amber-500" },
          { label: bi("نسبة الإكمال", "Completion rate"),       value: `${stats.completionRate}%`,     sub: bi(`${stats.completed} أتموا البرنامج`, `${stats.completed} finished the program`), icon: <Award />, bg: "bg-purple-500/10", ic: "bg-purple-500" },
        ].map((s, i) => (
          <Card key={i} className={`stat-card border-0 overflow-hidden ${s.bg}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white [&>svg]:h-5 [&>svg]:w-5 ${s.ic}`}>{s.icon}</div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-3xl font-bold tracking-tight">{s.value}</div>}
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Impact Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><Target className="h-5 w-5" /> {bi("ملخص الأثر الاجتماعي", "Social impact summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : (
              <>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground mt-1">{bi("مستفيد تمكّن", "beneficiaries empowered")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-primary">{data?.mentorsCount || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">{bi("مرشد متطوع", "volunteer mentors")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-primary">{stats.totalSessions}</div>
                  <div className="text-sm text-muted-foreground mt-1">{bi("جلسة إرشادية", "mentoring sessions")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-primary">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground mt-1">{bi("أتموا البرنامج", "completed the program")}</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Progress List */}
      {!loading && beneficiaries.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> {bi("تقدم المستفيدين", "Beneficiary progress")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {[...beneficiaries].sort((a, b) => (b.progress || 0) - (a.progress || 0)).map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{b.name}</span>
                  <div className="flex items-center gap-2">
                    {(b.progress ?? 0) >= 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="text-muted-foreground">{b.progress || 0}%</span>
                  </div>
                </div>
                <Progress value={b.progress || 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mentoring Overview */}
      {(() => {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const sessionsThisMonth = mentoringSessionsData.filter(s => s.date >= thisMonthStart);
        const completedThisMonth = sessionsThisMonth.filter(s => s.status === 'completed').length;
        const completionRate = sessionsThisMonth.length > 0 ? Math.round((completedThisMonth / sessionsThisMonth.length) * 100) : 0;

        // Top mentors by session count
        const mentorCounts: Record<string, number> = {};
        mentoringSessionsData.forEach(s => {
          if (s.hostId) mentorCounts[s.hostId] = (mentorCounts[s.hostId] || 0) + 1;
        });
        const topMentors = Object.entries(mentorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const totalBeneficiaries = mentoringBeneficiaries.length;
        const withMentor = mentoringBeneficiaries.filter(b => b.mentorId).length;
        const withCoach = mentoringBeneficiaries.filter(b => b.coachId).length;
        const mentorCoverage = totalBeneficiaries > 0 ? Math.round((withMentor / totalBeneficiaries) * 100) : 0;
        const coachCoverage = totalBeneficiaries > 0 ? Math.round((withCoach / totalBeneficiaries) * 100) : 0;

        return (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookUser className="h-5 w-5" /> {bi("متابعة الإرشاد", "Mentoring overview")}</CardTitle>
              <CardDescription>{bi("نظرة عامة على جلسات الإرشاد وتغطية المرشدين والمدربين.", "Overview of mentoring sessions and mentor/coach coverage.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? <Skeleton className="h-32 w-full" /> : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="text-3xl font-bold text-primary">{sessionsThisMonth.length}</div>
                      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("جلسات هذا الشهر", "Sessions this month")}</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <div className="text-3xl font-bold text-emerald-600">{completionRate}%</div>
                      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("معدل الإكمال", "Completion rate")}</div>
                    </div>
                    <div className="text-center p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 col-span-2 md:col-span-1">
                      <div className="text-3xl font-bold text-amber-600">{topMentors.length}</div>
                      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("مرشدون نشطون", "Active mentors")}</div>
                    </div>
                  </div>

                  {topMentors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> {bi("أكثر المرشدين نشاطاً", "Most active mentors")}</p>
                      <div className="space-y-2">
                        {topMentors.map(([hostId, count]) => (
                          <div key={hostId} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-mono text-xs">{hostId.slice(0, 8)}…</span>
                            <Badge variant="secondary">{count} {bi("جلسة", "sessions")}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-3">{bi("تغطية الإرشاد", "Mentoring coverage")}</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{bi("لديهم مرشد", "Have a mentor")}</span>
                          <span>{withMentor} / {totalBeneficiaries} ({mentorCoverage}%)</span>
                        </div>
                        <Progress value={mentorCoverage} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{bi("لديهم مدرب", "Have a coach")}</span>
                          <span>{withCoach} / {totalBeneficiaries} ({coachCoverage}%)</span>
                        </div>
                        <Progress value={coachCoverage} className="h-2" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>{bi("مشاركة المستفيدين", "Beneficiary engagement")}</CardTitle>
            <CardDescription className="mt-1">{bi("المستفيدون النشطون على مدار 6 أشهر.", "Active beneficiaries over the last 6 months.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={engagementConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <LineChart accessibilityLayer data={engagementData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Line dataKey="active" type="monotone" stroke="var(--color-active)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>{bi("توزيع التقدم", "Progress distribution")}</CardTitle>
            <CardDescription className="mt-1">{bi("توزيع المستفيدين حسب نسبة إنجازهم.", "Distribution of beneficiaries by their completion rate.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={completionConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : progressDistribution.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد بيانات", "No data")}</div>
              ) : (
                <BarChart accessibilityLayer data={progressDistribution} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} />
                  <Tooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="completionRate" fill="hsl(var(--chart-2))" radius={6} />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
