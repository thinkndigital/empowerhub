
"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, DollarSign, BookOpenCheck, ShoppingCart, TrendingUp, Star } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/hooks/use-user"
import { format, subMonths, startOfMonth } from "date-fns"
import { ar } from "date-fns/locale"

const revenueConfig = { revenue: { label: "الإيرادات (د.أ)", color: "hsl(var(--chart-1))" } }
const progressConfig = { "التقدم": { label: "التقدم", color: "hsl(var(--chart-2))" } }
const salesByCategoryConfig = { value: { label: "المبيعات", color: "hsl(var(--chart-1))" } }

const CATEGORY_LABELS: Record<string, string> = {
  handmade: "مصنوعات يدوية", food: "طعام", clothing: "ملابس",
  crafts: "حرف يدوية", services: "خدمات", agriculture: "زراعية",
  home: "منزل", other: "أخرى",
}
const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

type Order = { id: string; status: string; totalAmount?: string | number; createdAt?: string; productName?: string }
type Session = { id: string; status: string; date: string }
type Product = { id: string; name: string; price: string | number; category?: string; stock?: number }

export default function ReportsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, revenue: true, progress: true, salesCategory: true });
  const { user: authUser, userProfile } = useUser();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const headers = { authorization: `Bearer ${token}` };
      const [storeRes, sessionsRes] = await Promise.all([
        fetch('/api/beneficiary/store', { headers }),
        fetch('/api/beneficiary/sessions', { headers }),
      ]);
      const [storeData, sessionsData] = await Promise.all([storeRes.json(), sessionsRes.json()]);
      setOrders(storeData.orders || []);
      setProducts(storeData.products || []);
      setSessions(sessionsData.sessions || []);
    } catch {
      setOrders([]); setProducts([]); setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const progress = (userProfile as any)?.progress || 0;
    const topProduct = products?.slice().sort((a, b) => Number(b.price || 0) - Number(a.price || 0))[0];
    return { totalRevenue, completedSessions, progress, topProduct };
  }, [orders, sessions, products, userProfile]);

  const revenueData = useMemo(() => {
    if (!orders) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const start = startOfMonth(d).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
      const revenue = orders
        .filter(o => {
          const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
          return t >= start && t <= end && o.status === 'delivered';
        })
        .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      return { date: format(d, 'MMM', { locale: ar }), revenue };
    });
  }, [orders]);

  const salesByCategoryData = useMemo(() => {
    if (!products || !orders) return [];
    const categoryMap: Record<string, number> = {};
    orders.filter(o => o.status === 'delivered').forEach(order => {
      const product = products.find(p => p.name === order.productName);
      const cat = product?.category || 'other';
      const label = CATEGORY_LABELS[cat] || cat;
      categoryMap[label] = (categoryMap[label] || 0) + Number(order.totalAmount || 0);
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [products, orders]);

  const progressData = useMemo(() => {
    const progress = (userProfile as any)?.progress || 0;
    return [
      { name: "التقدم العام", "التقدم": progress },
      { name: "الجلسات المكتملة", "التقدم": Math.min(100, stats.completedSessions * 10) },
    ];
  }, [userProfile, stats]);

  const handleExport = (fullReport = false) => {
    const selected = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions).filter(([, v]) => v).map(([k]) => k);
    if (!selected.length) { toast({ variant: "destructive", title: "لم يتم تحديد أي أجزاء" }); return; }
    toast({ title: "جاري تصدير التقرير...", description: "سيتم تنزيل التقرير قريباً." });
    setIsExportDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">التقارير والتحليلات</h1>
          <p className="text-muted-foreground">نظرة عميقة على أدائك وتأثيرك.</p>
        </div>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />تصدير التقارير</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تصدير التقارير</DialogTitle>
              <DialogDescription>اختر أجزاء التقرير للتصدير.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {[
                { key: "summary" as const, label: "الملخص الإحصائي" },
                { key: "revenue" as const, label: "إيرادات المتجر" },
                { key: "progress" as const, label: "تقدم المسار" },
                { key: "salesCategory" as const, label: "المبيعات حسب الفئة" },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(p => ({ ...p, [item.key]: !p[item.key] }))} />
                  <Label htmlFor={item.key}>{item.label}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
              <Button onClick={() => handleExport(true)}>تصدير الكل</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي إيرادات المتجر</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><DollarSign className="h-5 w-5 text-white" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} د.أ</div>}
            <p className="text-xs text-muted-foreground mt-1">من الطلبات المكتملة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">جلسات الإرشاد المكتملة</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center"><BookOpenCheck className="h-5 w-5 text-white" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.completedSessions}</div>}
            <p className="text-xs text-muted-foreground mt-1">جلسة إرشادية منجزة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">التقدم العام في البرنامج</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-white" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.progress}%</div>}
            <Progress value={stats.progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Products summary */}
      {!loading && products && products.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> ملخص منتجاتي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-bold text-primary">{products.length}</div><div className="text-xs text-muted-foreground">منتج في المتجر</div></div>
              <div><div className="text-2xl font-bold text-primary">{orders?.length || 0}</div><div className="text-xs text-muted-foreground">طلب إجمالي</div></div>
              <div><div className="text-2xl font-bold text-primary">{orders?.filter(o => o.status === 'delivered').length || 0}</div><div className="text-xs text-muted-foreground">طلب مكتمل</div></div>
              <div><div className="text-2xl font-bold text-primary">{stats.topProduct?.name?.slice(0, 10) || '—'}</div><div className="text-xs text-muted-foreground">أعلى منتج سعراً</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>إيرادات المتجر الشهرية</CardTitle>
            <CardDescription>إجمالي الإيرادات من متجرك على مدار الأشهر الستة الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : revenueData.every(d => d.revenue === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد مبيعات بعد</div>
              ) : (
                <LineChart accessibilityLayer data={revenueData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `${v} د.أ`} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>التقدم في البرنامج</CardTitle>
            <CardDescription>نسبة إنجازك في البرنامج وجلسات الإرشاد.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <BarChart accessibilityLayer data={progressData} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={130} />
                  <XAxis type="number" dataKey="التقدم" orientation="top" tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="التقدم" fill="var(--color-التقدم)" radius={5} />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {salesByCategoryData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>مبيعات المتجر حسب الفئة</CardTitle>
            <CardDescription>توزيع إيرادات متجرك على فئات المنتجات المختلفة.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={salesByCategoryConfig} className="h-[250px] w-full max-w-sm relative">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={salesByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                  {salesByCategoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
