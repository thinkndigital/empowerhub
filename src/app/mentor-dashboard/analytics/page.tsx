
"use client"

import { useMemo, useState, useEffect, useCallback } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, BarChart3, Clock, DollarSign, Download, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useUser } from "@/firebase/auth/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { format, subMonths, startOfMonth } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useLanguage } from "@/components/language-provider"

type Beneficiary = { id: string; name?: string; progress?: number };
type Session = { id: string; date: string; status: string; attendees: string[]; duration?: number };

export default function MentorAnalyticsPage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const progressConfig = useMemo(() => ({ progress: { label: bi("التقدم", "Progress"), color: "hsl(var(--chart-1))" } }), [lang]);
  const sessionFrequencyConfig = useMemo(() => ({ sessions: { label: bi("عدد الجلسات", "Number of sessions"), color: "hsl(var(--chart-2))" } }), [lang]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, progress: true, frequency: true });
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<{ remaining: number; totalNet: number } | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const [bRes, sRes] = await Promise.all([
        fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${authUser.uid}`, { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } }),
      ]);
      setBeneficiaries((await bRes.json()).users || []);
      setSessions((await sRes.json()).sessions || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser]);

  const fetchEarnings = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/mentor/financial', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEarnings(data.summary || null);
    } catch { setEarnings(null); } finally { setEarningsLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const stats = useMemo(() => {
    const totalBeneficiaries = beneficiaries.length;
    const avgProgress = beneficiaries.length > 0
      ? Math.round(beneficiaries.reduce((s, b) => s + (b.progress || 0), 0) / beneficiaries.length) : 0;
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const currentMonth = new Date().getMonth();
    const sessionsThisMonth = completedSessions.filter(s => new Date(s.date).getMonth() === currentMonth).length;
    const totalHours = Math.round(completedSessions.reduce((sum, s) => sum + ((s.duration || 60) / 60), 0));
    return { totalBeneficiaries, avgProgress, sessionsThisMonth, totalHours };
  }, [beneficiaries, sessions]);

  const progressData = useMemo(() => beneficiaries.map(b => ({
    name: (b.name || '').split(' ').slice(0, 2).join(' '),
    progress: b.progress || 0,
  })), [beneficiaries]);

  const sessionFrequencyData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d).getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
    return {
      month: format(d, 'MMM', { locale: lang === 'en' ? enUS : ar }),
      sessions: sessions.filter(s => { const t = new Date(s.date).getTime(); return t >= start && t <= end && s.status === 'completed'; }).length,
    };
  }), [sessions, lang]);

  const handleExport = (fullReport: boolean = false) => {
    const selected = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0) { toast({ variant: "destructive", title: bi("لم يتم تحديد أي أجزاء", "No sections selected") }); return; }
    toast({ title: bi("جاري تصدير التقرير...", "Exporting the report..."), description: bi(`سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`, `${fullReport ? "The full report" : "The selected sections"} will download shortly.`) });
    setIsExportDialogOpen(false);
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{bi("تحليلات الإرشاد", "Mentoring analytics")}</h1>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />{bi("تصدير التقارير", "Export reports")}</Button>
          </DialogTrigger>
          <DialogContent dir={dir}>
            <DialogHeader><DialogTitle>{bi("تصدير التقارير", "Export reports")}</DialogTitle><DialogDescription>{bi("اختر أجزاء التقرير.", "Choose the report sections.")}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {([{ key: "summary" as const, label: bi("الملخص الإحصائي", "Statistical summary") }, { key: "progress" as const, label: bi("تقدم المستفيدين", "Beneficiary progress") }, { key: "frequency" as const, label: bi("تكرار الجلسات", "Session frequency") }]).map(item => (
                  <div key={item.key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                    <Label htmlFor={item.key}>{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
              <Button onClick={() => handleExport(true)}>{bi("تصدير التقرير الكامل", "Export full report")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: bi("إجمالي المستفيدين", "Total beneficiaries"), value: stats.totalBeneficiaries, sub: bi("مستفيدين نشطين", "active beneficiaries"), icon: <Users className="h-5 w-5 text-white" />, color: "bg-primary" },
          { label: bi("متوسط تقدم المستفيدين", "Average beneficiary progress"), value: `${stats.avgProgress}%`, sub: bi("نسبة الإنجاز الكلية", "overall completion rate"), icon: <BarChart3 className="h-5 w-5 text-white" />, color: "bg-emerald-500" },
          { label: bi("جلسات هذا الشهر", "Sessions this month"), value: stats.sessionsThisMonth, sub: bi(`بإجمالي ${stats.totalHours} ساعة`, `${stats.totalHours} total hours`), icon: <Clock className="h-5 w-5 text-white" />, color: "bg-amber-500" },
          { label: bi("إجمالي الأرباح", "Total earnings"), value: earningsLoading ? "—" : `${(earnings?.remaining ?? 0).toFixed(2)} ${bi("د.أ", "JOD")}`, sub: bi("الرصيد المتاح", "Available balance"), icon: <DollarSign className="h-5 w-5 text-white" />, color: "bg-purple-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${stat.color} flex items-center justify-center`}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && beneficiaries.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />{bi("تقدم المستفيدين", "Beneficiary progress")}</CardTitle><CardDescription>{bi("نسبة إنجاز كل مستفيد.", "Each beneficiary's completion rate.")}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {beneficiaries.map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{b.name}</span><span className="text-muted-foreground">{b.progress || 0}%</span></div>
                <Progress value={b.progress || 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{bi("تقدم المستفيدين", "Beneficiary progress")}</CardTitle><CardDescription>{bi("التقدم الحالي للمستفيدين الذين تشرف عليهم.", "The current progress of the beneficiaries you supervise.")}</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : progressData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد بيانات", "No data")}</div>
              ) : (
                <BarChart accessibilityLayer data={progressData} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(v) => `${v}%`} />
                  <Tooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{bi("تكرار الجلسات الشهرية", "Monthly session frequency")}</CardTitle><CardDescription>{bi("عدد الجلسات المنجزة على مدار 6 أشهر.", "Number of completed sessions over the last 6 months.")}</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={sessionFrequencyConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <LineChart accessibilityLayer data={sessionFrequencyData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Line dataKey="sessions" type="monotone" stroke="var(--color-sessions)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
