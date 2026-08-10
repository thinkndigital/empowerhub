
"use client"

import { useMemo, useState } from "react"
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
import { useUser } from "@/firebase/auth/use-user"
import { useFirestore, useMemoFirebase } from "@/firebase/provider"
import { useCollection } from "@/firebase/firestore/use-collection"
import { collection, query, where, orderBy } from "firebase/firestore"
import { format, subMonths, startOfMonth } from "date-fns"
import { ar as arLocale, enUS } from "date-fns/locale"
import { useLanguage } from "@/components/language-provider"

const CATEGORY_LABELS: Record<string, string> = {
  handmade: "مصنوعات يدوية", food: "طعام", clothing: "ملابس",
  crafts: "حرف يدوية", services: "خدمات", agriculture: "زراعية",
  home: "منزل", other: "أخرى",
}
const CATEGORY_LABELS_EN: Record<string, string> = {
  handmade: "Handmade", food: "Food", clothing: "Clothing",
  crafts: "Crafts", services: "Services", agriculture: "Agriculture",
  home: "Home", other: "Other",
}
const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

type Order = { id: string; status: string; price?: number; orderDate?: any; productName?: string }
type Session = { id: string; status: string; date: string }
type Product = { id: string; name: string; price: number; category?: string; stock?: number }

export default function ReportsPage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? enUS : arLocale;
  const tCategoryLabels = lang === 'en' ? CATEGORY_LABELS_EN : CATEGORY_LABELS;

  const revenueConfig = useMemo(() => ({
    revenue: { label: bi("الإيرادات (د.أ)", "Revenue (JOD)"), color: "hsl(var(--chart-1))" },
  }), [lang]);
  const progressConfig = useMemo(() => ({
    progress: { label: bi("التقدم", "Progress"), color: "hsl(var(--chart-2))" },
  }), [lang]);
  const salesByCategoryConfig = useMemo(() => ({
    value: { label: bi("المبيعات", "Sales"), color: "hsl(var(--chart-1))" },
  }), [lang]);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, revenue: true, progress: true, salesCategory: true });
  const { user: authUser, userProfile } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "orders"), where("beneficiaryId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "sessions"), where("attendees", "array-contains", authUser.uid));
  }, [firestore, authUser]);
  const { data: sessions, isLoading: sessionsLoading } = useCollection<Session>(sessionsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "products"), where("beneficiaryId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const loading = ordersLoading || sessionsLoading || productsLoading;

  const stats = useMemo(() => {
    const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const progress = (userProfile as any)?.progress || 0;
    const topProduct = products?.sort((a, b) => (b.price || 0) - (a.price || 0))[0];
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
          const t = o.orderDate?.toDate?.()?.getTime() || 0;
          return t >= start && t <= end && o.status === 'delivered';
        })
        .reduce((sum, o) => sum + (o.price || 0), 0);
      return { date: format(d, 'MMM', { locale }), revenue };
    });
  }, [orders, locale]);

  const salesByCategoryData = useMemo(() => {
    if (!products || !orders) return [];
    const categoryMap: Record<string, number> = {};
    orders.filter(o => o.status === 'delivered').forEach(order => {
      const product = products.find(p => p.name === order.productName);
      const cat = product?.category || 'other';
      const label = tCategoryLabels[cat] || cat;
      categoryMap[label] = (categoryMap[label] || 0) + (order.price || 0);
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [products, orders, tCategoryLabels]);

  const progressData = useMemo(() => {
    const progress = (userProfile as any)?.progress || 0;
    return [
      { name: bi("التقدم العام", "Overall progress"), progress },
      { name: bi("الجلسات المكتملة", "Completed sessions"), progress: Math.min(100, stats.completedSessions * 10) },
    ];
  }, [userProfile, stats, lang]);

  const handleExport = (fullReport = false) => {
    const selected = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions).filter(([, v]) => v).map(([k]) => k);
    if (!selected.length) { toast({ variant: "destructive", title: bi("لم يتم تحديد أي أجزاء", "No sections selected") }); return; }
    toast({ title: bi("جاري تصدير التقرير...", "Exporting the report..."), description: bi("سيتم تنزيل التقرير قريباً.", "The report will download shortly.") });
    setIsExportDialogOpen(false);
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("التقارير والتحليلات", "Reports & analytics")}</h1>
          <p className="text-muted-foreground">{bi("نظرة عميقة على أدائك وتأثيرك.", "An in-depth look at your performance and impact.")}</p>
        </div>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />{bi("تصدير التقارير", "Export reports")}</Button>
          </DialogTrigger>
          <DialogContent dir={dir}>
            <DialogHeader>
              <DialogTitle>{bi("تصدير التقارير", "Export reports")}</DialogTitle>
              <DialogDescription>{bi("اختر أجزاء التقرير للتصدير.", "Choose which report sections to export.")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {[
                { key: "summary" as const, label: bi("الملخص الإحصائي", "Statistical summary") },
                { key: "revenue" as const, label: bi("إيرادات المتجر", "Store revenue") },
                { key: "progress" as const, label: bi("تقدم المسار", "Track progress") },
                { key: "salesCategory" as const, label: bi("المبيعات حسب الفئة", "Sales by category") },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(p => ({ ...p, [item.key]: !p[item.key] }))} />
                  <Label htmlFor={item.key}>{item.label}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
              <Button variant="outline" onClick={() => handleExport(false)}>{bi("تصدير المحدد", "Export selected")}</Button>
              <Button onClick={() => handleExport(true)}>{bi("تصدير الكل", "Export all")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{bi("إجمالي إيرادات المتجر", "Total store revenue")}</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><DollarSign className="h-5 w-5 text-white" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} {bi('د.أ', 'JOD')}</div>}
            <p className="text-xs text-muted-foreground mt-1">{bi("من الطلبات المكتملة", "From completed orders")}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{bi("جلسات الإرشاد المكتملة", "Completed mentoring sessions")}</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center"><BookOpenCheck className="h-5 w-5 text-white" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.completedSessions}</div>}
            <p className="text-xs text-muted-foreground mt-1">{bi("جلسة إرشادية منجزة", "Mentoring sessions completed")}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{bi("التقدم العام في البرنامج", "Overall program progress")}</CardTitle>
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
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> {bi("ملخص منتجاتي", "My products summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-bold text-primary">{products.length}</div><div className="text-xs text-muted-foreground">{bi("منتج في المتجر", "Products in store")}</div></div>
              <div><div className="text-2xl font-bold text-primary">{orders?.length || 0}</div><div className="text-xs text-muted-foreground">{bi("طلب إجمالي", "Total orders")}</div></div>
              <div><div className="text-2xl font-bold text-primary">{orders?.filter(o => o.status === 'delivered').length || 0}</div><div className="text-xs text-muted-foreground">{bi("طلب مكتمل", "Completed orders")}</div></div>
              <div><div className="text-2xl font-bold text-primary">{stats.topProduct?.name?.slice(0, 10) || '—'}</div><div className="text-xs text-muted-foreground">{bi("أعلى منتج سعراً", "Highest-priced product")}</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("إيرادات المتجر الشهرية", "Monthly store revenue")}</CardTitle>
            <CardDescription>{bi("إجمالي الإيرادات من متجرك على مدار الأشهر الستة الماضية.", "Total revenue from your store over the last six months.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : revenueData.every(d => d.revenue === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد مبيعات بعد", "No sales yet")}</div>
              ) : (
                <LineChart accessibilityLayer data={revenueData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => bi(`${v} د.أ`, `${v} JOD`)} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("التقدم في البرنامج", "Program progress")}</CardTitle>
            <CardDescription>{bi("نسبة إنجازك في البرنامج وجلسات الإرشاد.", "Your completion rate in the program and mentoring sessions.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <BarChart accessibilityLayer data={progressData} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={130} />
                  <XAxis type="number" dataKey="progress" orientation="top" tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="progress" fill="var(--color-progress)" radius={5} />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {salesByCategoryData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("مبيعات المتجر حسب الفئة", "Store sales by category")}</CardTitle>
            <CardDescription>{bi("توزيع إيرادات متجرك على فئات المنتجات المختلفة.", "Distribution of your store's revenue across product categories.")}</CardDescription>
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
