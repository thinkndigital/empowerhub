
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
import { ar, enUS } from "date-fns/locale"
import { useLanguage } from "@/components/language-provider"

const PIE_FILLS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

type UserDoc = { id: string; role?: string; status?: string; createdAt?: any }
type OrgDoc = { id: string; createdAt?: any }
type OrderDoc = { id: string; status?: string; price?: number; orderDate?: any }
type CourseDoc = { id: string; title?: string; enrolledCount?: number }

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const dateLocale = lang === 'en' ? enUS : ar;
  const firestore = useFirestore();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ summary: true, userGrowth: true, salesGrowth: true, roleDistribution: true, courseEnrollment: true });

  const userChartConfig = useMemo(() => ({
    users: { label: bi("المستخدمون", "Users"), color: "hsl(var(--chart-1))" },
    orgs: { label: bi("المنظمات", "Organizations"), color: "hsl(var(--chart-2))" },
  }), [lang]);
  const salesChartConfig = useMemo(() => ({ sales: { label: bi("المبيعات (د.أ)", "Sales (JOD)"), color: "hsl(var(--chart-1))" } }), [lang]);
  const userRolesConfig = useMemo(() => ({
    beneficiaries: { label: bi("مستفيدون", "Beneficiaries") }, mentors: { label: bi("مرشدون", "Mentors") },
    coaches: { label: bi("مدربون", "Coaches") }, orgs: { label: bi("مدراء منظمات", "Org managers") }, admins: { label: bi("مشرفون", "Admins") },
  }), [lang]);
  const courseEnrollmentConfig = useMemo(() => ({ enrollments: { label: bi("المسجلون", "Enrollments"), color: "hsl(var(--chart-2))" } }), [lang]);

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
    return { label: format(d, 'MMM', { locale: dateLocale }), start: startOfMonth(d).getTime(), end: new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime() };
  }), [dateLocale]);

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
    const ROLE_LABELS: Record<string, string> = { beneficiary: bi("مستفيدون", "Beneficiaries"), mentor: bi("مرشدون", "Mentors"), coach: bi("مدربون", "Coaches"), organization: bi("مدراء منظمات", "Org managers"), admin: bi("مشرفون", "Admins") };
    return Object.entries(roleCounts).map(([role, value], i) => ({ name: ROLE_LABELS[role] || role, value, fill: PIE_FILLS[i % PIE_FILLS.length] }));
  }, [allUsers, lang]);

  const courseEnrollmentData = useMemo(() => {
    if (!allCourses) return [];
    return [...allCourses]
      .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
      .slice(0, 5)
      .map(c => ({ name: (c.title || '').slice(0, 18), enrollments: c.enrolledCount || 0 }));
  }, [allCourses]);

  const handleExport = (fullReport = false) => {
    const selected = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions).filter(([, v]) => v).map(([k]) => k);
    if (!selected.length) { toast({ variant: "destructive", title: bi("لم يتم تحديد أي أجزاء", "No sections selected") }); return; }
    toast({ title: bi("جاري تصدير التقرير...", "Exporting report..."), description: bi("سيتم تنزيل التقرير قريبًا.", "The report will download shortly.") });
    setIsExportDialogOpen(false);
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{bi("تحليلات المنصة", "Platform Analytics")}</h1>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Download className="ml-2 h-4 w-4" />{bi("تصدير التقارير", "Export reports")}</Button>
          </DialogTrigger>
          <DialogContent dir={dir}>
            <DialogHeader>
              <DialogTitle>{bi("تصدير التقارير والتحليلات", "Export reports & analytics")}</DialogTitle>
              <DialogDescription>{bi("اختر أجزاء التقرير للتصدير.", "Choose the report sections to export.")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "summary" as const, label: bi("الملخص الإحصائي", "Statistics summary") },
                  { key: "userGrowth" as const, label: bi("نمو المستخدمين", "User growth") },
                  { key: "salesGrowth" as const, label: bi("نمو المبيعات", "Sales growth") },
                  { key: "roleDistribution" as const, label: bi("توزيع الأدوار", "Role distribution") },
                  { key: "courseEnrollment" as const, label: bi("الدورات الأكثر تسجيلاً", "Top enrolled courses") },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox id={item.key} checked={exportOptions[item.key]} onCheckedChange={() => setExportOptions(p => ({ ...p, [item.key]: !p[item.key] }))} />
                    <Label htmlFor={item.key}>{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
              <Button variant="outline" onClick={() => handleExport(false)}>{bi("تصدير المحدد", "Export selected")}</Button>
              <Button onClick={() => handleExport(true)}>{bi("تصدير الكل", "Export all")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label: bi("إجمالي المستخدمين", "Total users"), value: stats.totalUsers.toLocaleString(), sub: bi("مستخدم مسجل", "registered users"), icon: <Users className="h-5 w-5 text-white" />, color: "bg-primary", loading: usersLoading },
          { label: bi("إجمالي المنظمات", "Total organizations"), value: stats.totalOrgs, sub: bi("منظمة مسجلة", "registered organizations"), icon: <Building className="h-5 w-5 text-white" />, color: "bg-purple-500", loading: orgsLoading },
          { label: bi("المستخدمون النشطون", "Active users"), value: stats.activeUsers, sub: `${stats.totalUsers > 0 ? Math.round(stats.activeUsers / stats.totalUsers * 100) : 0}% ${bi("من الإجمالي", "of total")}`, icon: <Activity className="h-5 w-5 text-white" />, color: "bg-emerald-500", loading: usersLoading },
          { label: bi("إجمالي المنتجات", "Total products"), value: stats.totalProducts, sub: bi("منتج في المتجر", "products in store"), icon: <ShoppingCart className="h-5 w-5 text-white" />, color: "bg-amber-500", loading: false },
          { label: bi("إجمالي الدورات", "Total courses"), value: stats.totalCourses, sub: bi("دورة منشورة", "published courses"), icon: <BookOpen className="h-5 w-5 text-white" />, color: "bg-rose-500", loading: coursesLoading },
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
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("نمو المستخدمين والمنظمات", "User & organization growth")}</CardTitle>
            <CardDescription>{bi("المستخدمون والمنظمات الجدد على مدار 6 أشهر.", "New users and organizations over the last 6 months.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userChartConfig} className="min-h-[250px] w-full relative">
              {loading ? <Skeleton className="h-[250px] w-full" /> : userGrowthData.every(d => d.users === 0 && d.orgs === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد بيانات كافية", "Not enough data")}</div>
              ) : (
                <BarChart accessibilityLayer data={userGrowthData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Bar dataKey="users" fill="var(--color-users)" radius={4} name={bi("المستخدمون", "Users")} />
                  <Bar dataKey="orgs" fill="var(--color-orgs)" radius={4} name={bi("المنظمات", "Organizations")} />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("توزيع أدوار المستخدمين", "User role distribution")}</CardTitle>
            <CardDescription>{bi("توزيع المستخدمين حسب الدور.", "Users distributed by role.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userRolesConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : userRolesData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد بيانات", "No data")}</div>
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
            <CardTitle>{bi("نمو المبيعات الشهرية", "Monthly sales growth")}</CardTitle>
            <CardDescription>{bi("إجمالي مبيعات المتاجر على مدار 6 أشهر.", "Total store sales over the last 6 months.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-[250px] w-full relative">
              {loading ? <Skeleton className="h-full w-full" /> : salesData.every(d => d.sales === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد مبيعات بعد", "No sales yet")}</div>
              ) : (
                <LineChart accessibilityLayer data={salesData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `${v} ${bi("د.أ", "JOD")}`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{bi("الدورات الأكثر تسجيلاً", "Most enrolled courses")}</CardTitle>
            <CardDescription>{bi("ترتيب الدورات حسب عدد المسجلين.", "Courses ranked by number of enrollments.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={courseEnrollmentConfig} className="h-[250px] w-full relative">
              {coursesLoading ? <Skeleton className="h-full w-full" /> : courseEnrollmentData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{bi("لا توجد دورات بعد", "No courses yet")}</div>
              ) : (
                <BarChart accessibilityLayer data={courseEnrollmentData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                  <XAxis type="number" dataKey="enrollments" />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={4} name={bi("المسجلون", "Enrollments")} />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
