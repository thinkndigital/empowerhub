
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
import { ar } from "date-fns/locale"

const progressConfig = { progress: { label: "التقدم", color: "hsl(var(--chart-1))" } }
const sessionFrequencyConfig = { sessions: { label: "عدد الجلسات", color: "hsl(var(--chart-2))" } }

type Beneficiary = { id: string; name?: string; progress?: number };
type Session = { id: string; date: string; status: string; attendees: string[]; duration?: number };

export default function MentorAnalyticsPage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, progress: true, frequency: true });
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchData(); }, [fetchData]);

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
      month: format(d, 'MMM', { locale: ar }),
      sessions: sessions.filter(s => { const t = new Date(s.date).getTime(); return t >= start && t <= end && s.status === 'completed'; }).length,
    };
  }), [sessions]);

  const handleExport = (fullReport: boolean = false) => {
    const selected = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0) { toast({ variant: "destructive", title: "لم يتم تحديد أي أجزاء" }); return; }
    toast({ title: "جاري تصدير التقرير...", description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.` });
    setIsExportDialogOpen(false);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">تحليلات الإرشاد</h1>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />تصدير التقارير</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>تصدير التقارير</DialogTitle><DialogDescription>اختر أجزاء التقرير.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {([{ key: "summary" as const, label: "الملخص الإحصائي" }, { key: "progress" as const, label: "تقدم المستفيدين" }, { key: "frequency" as const, label: "تكرار الجلسات" }]).map(item => (
                  <div key={item.key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                    <Label htmlFor={item.key}>{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "إجمالي المستفيدين", value: stats.totalBeneficiaries, sub: "مستفيدين نشطين", icon: <Users className="h-5 w-5 text-white" />, color: "bg-primary" },
          { label: "متوسط تقدم المستفيدين", value: `${stats.avgProgress}%`, sub: "نسبة الإنجاز الكلية", icon: <BarChart3 className="h-5 w-5 text-white" />, color: "bg-emerald-500" },
          { label: "جلسات هذا الشهر", value: stats.sessionsThisMonth, sub: `بإجمالي ${stats.totalHours} ساعة`, icon: <Clock className="h-5 w-5 text-white" />, color: "bg-amber-500" },
          { label: "أرباح هذا الشهر", value: "—", sub: "راجع قسم المحفظة", icon: <DollarSign className="h-5 w-5 text-white" />, color: "bg-purple-500" },
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
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />تقدم المستفيدين</CardTitle><CardDescription>نسبة إنجاز كل مستفيد.</CardDescription></CardHeader>
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
          <CardHeader><CardTitle>تقدم المستفيدين</CardTitle><CardDescription>التقدم الحالي للمستفيدين الذين تشرف عليهم.</CardDescription></CardHeader>
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
          <CardHeader><CardTitle>تكرار الجلسات الشهرية</CardTitle><CardDescription>عدد الجلسات المنجزة على مدار 6 أشهر.</CardDescription></CardHeader>
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
    </>
  );
}
