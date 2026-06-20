
"use client"

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Building, Activity, ShoppingCart, Download, BookOpen } from "lucide-react"
import { useFirestore, useMemoFirebase } from "@/firebase/provider"
import { useCollection } from "@/firebase/firestore/use-collection"
import { collection, query } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format, subMonths, startOfMonth } from "date-fns"
import { ar } from "date-fns/locale"

const userChartConfig = {
  users: { label: "المستخدمون", color: "hsl(var(--chart-1))" },
  orgs: { label: "المنظمات", color: "hsl(var(--chart-2))" },
}
const salesChartConfig = { sales: { label: "المبيعات (د.أ)", color: "hsl(var(--chart-1))" } }
const userRolesConfig = {
  beneficiaries: { label: "مستفيدون" }, mentors: { label: "مرشدون" },
  coaches: { label: "مدربون" }, orgs: { label: "مدراء منظمات" }, admins: { label: "مشرفون" },
}
const courseEnrollmentConfig = { enrollments: { label: "المسجلون", color: "hsl(var(--chart-2))" } }
const PIE_FILLS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

type UserDoc = { id: string; role?: string; status?: string; createdAt?: any }
type OrgDoc = { id: string; createdAt?: any }
type OrderDoc = { id: string; status?: string; price?: number; orderDate?: any }
type CourseDoc = { id: string; title?: string; enrolledCount?: number }

export default function AnalyticsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, userGrowth: true, salesGrowth: true, roleDistribution: true, courseEnrollment: true });

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "users")) : null, [firestore]);
  const { data: allUsers, isLoading: usersLoading } = useCollection<UserDoc>(usersQuery);

  const orgsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "organizations")) : null, [firestore]);
  const { data: allOrgs, isLoading: orgsLoading } = useCollection<OrgDoc>(orgsQuery);

  const coursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "courses")) : null, [firestore]);
  const { data: allCourses, isLoading: coursesLoading } = useCollection<CourseDoc>(coursesQuery);

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "products")) : null, [firestore]);
  const { data: allProducts } = useCollection(productsQuery);

  const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "orders")) : null, [firestore]);
  const { data: allOrders } = useCollection<OrderDoc>(ordersQuery);

  const loading = usersLoading || orgsLoading || coursesLoading;

  const stats = useMemo(() => ({
    totalUsers: allUsers?.length || 0,
    totalOrgs: allOrgs?.length || 0,
    totalCourses: allCourses?.length || 0,
    totalProducts: allProducts?.length || 0,
    activeUsers: allUsers?.filter(u => u.status === 'نشط').length || 0,
  }), [allUsers, allOrgs, allCourses, allProducts]);

  const months6 = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { label: format(d, 'MMM', { locale: ar }), start: startOfMonth(d).getTime(), end: new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime() };
  }), []);

  const userGrowthData = useMemo(() => {
    if (!allUsers || !allOrgs) return [];
    return months6.map(m => ({
      month: m.label,
      users: allUsers.filter(u => { const t = u.createdAt?.toDate?.()?.getTime() || 0; return t >= m.start && t <= m.end; }).length,
      orgs: allOrgs.filter(o => { const t = o.createdAt?.toDate?.()?.getTime() || 0; return t >= m.start && t <= m.end; }).length,
    }));
  }, [allUsers, allOrgs, months6]);

  const salesData = useMemo(() => {
    if (!allOrders) return [];
    return months6.map(m => ({
      month: m.label,
      sales: allOrders.filter(o => {
        const t = o.orderDate?.toDate?.()?.getTime() || 0;
        return t >= m.start && t <= m.end && o.status === 'delivered';
      }).reduce((sum, o) => sum + (o.price || 0), 0),
    }));
  }, [allOrders, months6]);

  const userRolesData = useMemo(() => {
    if (!allUsers) return [];
    const roleCounts: Record<string, number> = {};
    allUsers.forEach(u => { const r = u.role || 'other'; roleCounts[r] = (roleCounts[r] || 0) + 1; });
    const ROLE_LABELS: Record<string, string> = { beneficiary: "مستفيدون", mentor: "مرشدون", coach: "مدربون", organization: "مدراء منظمات", admin: "مشرفون" };
    return Object.entries(roleCounts).map(([role, value], i) => ({ name: ROLE_LABELS[role] || role, value, fill: PIE_FILLS[i % PIE_FILLS.length] }));
  }, [allUsers]);

  const courseEnrollmentData = useMemo(() => {
    if (!allCourses) return [];
    return [...allCourses]
      .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
      .slice(0, 5)
      .map(c => ({ name: (c.title || '').slice(0, 18), enrollments: c.enrolledCount || 0 }));
  }, [allCourses]);

  const handleExport = (fullReport = false) => {
    const selected = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions).filter(([, v]) => v).map(([k]) => k);
    if (!selected.length) { toast({ variant: "destructive", title: "لم يتم تحديد أي أجزاء" }); return; }
    toast({ title: "جاري تصدير التقرير...", description: "سيتم تنزيل التقرير قريبًا." });
    setIsExportDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">تحليلات المنصة</h1>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />تصدير التقارير</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
              <DialogDescription>اختر أجزاء التقرير للتصدير.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "summary" as const, label: "الملخص الإحصائي" },
                  { key: "userGrowth" as const, label: "نمو المستخدمين" },
                  { key: "salesGrowth" as const, label: "نمو المبيعات" },
                  { key: "roleDistribution" as const, label: "توزيع الأدوار" },
                  { key: "courseEnrollment" as const, label: "الدورات الأكثر تسجيلاً" },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(p => ({ ...p, [item.key]: !p[item.key] }))} />
                    <Label htmlFor={item.key}>{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
              <Button onClick={() => handleExport(true)}>تصدير الكل</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "إجمالي المستخدمين", value: stats.totalUsers.toLocaleString(), sub: "مستخدم مسجل", icon: <Users className="h-5 w-5 text-white" />, color: "bg-primary", loading: usersLoading },
          { label: "إجمالي المنظمات", value: stats.totalOrgs, sub: "منظمة مسجلة", icon: <Building className="h-5 w-5 text-white" />, color: "bg-purple-500", loading: orgsLoading },
          { label: "المستخدمون النشطون", value: stats.activeUsers, sub: `${stats.totalUsers > 0 ? Math.round(stats.activeUsers / stats.totalUsers * 100) : 0}% من الإجمالي`, icon: <Activity className="h-5 w-5 text-white" />, color: "bg-emerald-500", loading: usersLoading },
          { label: "إجمالي المنتجات", value: stats.totalProducts, sub: "منتج في المتجر", icon: <ShoppingCart className="h-5 w-5 text-white" />, color: "bg-amber-500", loading: false },
          { label: "إجمالي الدورات", value: stats.totalCourses, sub: "دورة منشورة", icon: <BookOpen className="h-5 w-5 text-white" />, color: "bg-rose-500", loading: coursesLoading },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${s.color} flex items-center justify-center`}>{s.icon}</div>
            </CardHeader>
            <CardContent>
              {s.loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{s.value}</div>}
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>نمو المستخدمين والمنظمات</CardTitle>
            <CardDescription>المستخدمون والمنظمات الجدد على مدار 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userChartConfig} className="min-h-[250px] w-full relative">
              {loading ? <Skeleton className="h-[250px] w-full" /> : userGrowthData.every(d => d.users === 0 && d.orgs === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات كافية</div>
              ) : (
                <BarChart accessibilityLayer data={userGrowthData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Bar dataKey="users" fill="var(--color-users)" radius={4} name="المستخدمون" />
                  <Bar dataKey="orgs" fill="var(--color-orgs)" radius={4} name="المنظمات" />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>توزيع أدوار المستخدمين</CardTitle>
            <CardDescription>توزيع المستخدمين حسب الدور.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userRolesConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : userRolesData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={userRolesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const r = innerRadius + (outerRadius - innerRadius) * 1.2;
                        const x = cx + r * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + r * Math.sin(-midAngle * (Math.PI / 180));
                        return <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">{`${(percent * 100).toFixed(0)}%`}</text>;
                      }}>
                      {userRolesData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Legend iconSize={10} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>نمو المبيعات الشهرية</CardTitle>
            <CardDescription>إجمالي مبيعات المتاجر على مدار 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : salesData.every(d => d.sales === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد مبيعات بعد</div>
              ) : (
                <LineChart accessibilityLayer data={salesData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `${v} د.أ`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>الدورات الأكثر تسجيلاً</CardTitle>
            <CardDescription>ترتيب الدورات حسب عدد المسجلين.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={courseEnrollmentConfig} className="h-[250px] w-full relative">
              {coursesLoading ? <Skeleton className="h-full w-full" /> : courseEnrollmentData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد دورات بعد</div>
              ) : (
                <BarChart accessibilityLayer data={courseEnrollmentData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                  <XAxis type="number" dataKey="enrollments" />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={4} name="المسجلون" />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
