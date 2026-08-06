
"use client"

import { useMemo, useState, useEffect, useCallback } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
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
import { ar } from "date-fns/locale"

const progressConfig = { progress: { label: "التقدم", color: "hsl(var(--chart-1))" } }
const sessionFrequencyConfig = { sessions: { label: "عدد الجلسات", color: "hsl(var(--chart-2))" } }

type Beneficiary = { id: string; name?: string; progress?: number };
type Session = { id: string; date: string; status: string; attendees: string[]; duration?: number };

export default function CoachAnalyticsPage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
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
        fetch(`/api/org/users?role=beneficiary&scope=all&coachId=${authUser.uid}`, { headers: { authorization: `Bearer ${token}` } }),
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
      const res = await fetch('/api/coach/financial', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEarnings(data.summary || null);
    } catch { setEarnings(null); } finally { setEarningsLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const stats = useMemo(() => {
    const totalBeneficiaries = beneficiaries?.length || 0;
    const avgProgress = beneficiaries && beneficiaries.length > 0
      ? Math.round(beneficiaries.reduce((s, b) => s + ((b as any).progress || 0), 0) / beneficiaries.length)
      : 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
    const currentMonth = new Date().getMonth();
    const sessionsThisMonth = completedSessions.filter(s => new Date(s.date).getMonth() === currentMonth).length;
    const totalHours = Math.round(completedSessions.reduce((sum, s) => sum + ((s.duration || 60) / 60), 0));
    return { totalBeneficiaries, avgProgress, sessionsThisMonth, totalHours };
  }, [beneficiaries, sessions]);

  const progressData = useMemo(() => {
    if (!beneficiaries) return [];
    return beneficiaries.map(b => ({
      name: (b.name || '').split(' ').slice(0, 2).join(' '),
      progress: (b as any).progress || 0,
    }));
  }, [beneficiaries]);

  const sessionFrequencyData = useMemo(() => {
    if (!sessions) return [];
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, 'MMM', { locale: ar }), start: startOfMonth(d).getTime(), end: new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime() };
    });
    return months.map(m => ({
      month: m.month,
      sessions: sessions.filter(s => {
        const t = new Date(s.date).getTime();
        return t >= m.start && t <= m.end && s.status === 'completed';
      }).length,
    }));
  }, [sessions]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">تحليلات التدريب</h1>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />تصدير التقارير</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تصدير التقارير</DialogTitle>
              <DialogDescription>اختر أجزاء التقرير للتصدير.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {[
                { key: "summary" as const, label: "الملخص الإحصائي" },
                { key: "progress" as const, label: "تقدم المتدربين" },
                { key: "frequency" as const, label: "تكرار الجلسات" },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(p => ({ ...p, [item.key]: !p[item.key] }))} />
                  <Label htmlFor={item.key}>{item.label}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button onClick={() => { toast({ title: "جاري التصدير..." }); setIsExportDialogOpen(false); }}>تصدير</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "إجمالي المتدربين", value: stats.totalBeneficiaries, sub: "متدرب نشط", icon: <Users className="h-5 w-5 text-white" />, color: "bg-primary" },
          { label: "متوسط تقدم المتدربين", value: `${stats.avgProgress}%`, sub: "نسبة الإنجاز الكلية", icon: <BarChart3 className="h-5 w-5 text-white" />, color: "bg-emerald-500" },
          { label: "جلسات هذا الشهر", value: stats.sessionsThisMonth, sub: `بإجمالي ${stats.totalHours} ساعة`, icon: <Clock className="h-5 w-5 text-white" />, color: "bg-amber-500" },
          { label: "إجمالي الأرباح", value: earningsLoading ? "—" : `${(earnings?.remaining ?? 0).toFixed(2)} د.أ`, sub: "الرصيد المتاح", icon: <DollarSign className="h-5 w-5 text-white" />, color: "bg-purple-500" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${s.color} flex items-center justify-center`}>{s.icon}</div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{s.value}</div>}
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && beneficiaries && beneficiaries.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> تقدم المتدربين</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {beneficiaries.map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground">{(b as any).progress || 0}%</span>
                </div>
                <Progress value={(b as any).progress || 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>تقدم المتدربين</CardTitle>
            <CardDescription>التقدم الحالي للمتدربين الذين تشرف عليهم.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : progressData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
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
          <CardHeader>
            <CardTitle>تكرار الجلسات الشهرية</CardTitle>
            <CardDescription>عدد الجلسات المنجزة على مدار 6 أشهر.</CardDescription>
          </CardHeader>
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
