
"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Building, Activity, ShoppingCart, Download, BookOpen, UserCheck } from "lucide-react"
import { useFirestore, useMemoFirebase } from "@/firebase/provider"
import { useCollection } from "@/firebase/firestore/use-collection"
import { collection, query } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface UserGrowthData {
  month: string;
  users: number;
  orgs: number;
}

interface SalesData {
  month: string;
  sales: number;
}

interface PieChartData {
  name: string;
  value: number;
  fill: string;
}

interface CourseEnrollmentData {
  name: string;
  enrollments: number;
}


const userChartConfig = {
  users: { label: "المستخدمون", color: "hsl(var(--chart-1))" },
  orgs: { label: "المنظمات", color: "hsl(var(--chart-2))" },
}
const salesChartConfig = {
    sales: { label: "المبيعات", color: "hsl(var(--chart-1))" },
}
const userRolesConfig = {
    beneficiaries: { label: "مستفيدون" },
    mentors: { label: "مرشدون" },
    coaches: { label: "مدربون" },
    orgs: { label: "مدراء منظمات" },
    admins: { label: "مشرفون" },
}
const courseEnrollmentConfig = {
    enrollments: { label: "عدد المسجلين", color: "hsl(var(--chart-2))" },
}


export default function AnalyticsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "users")) : null, [firestore]);
  const { data: allUsers, isLoading: usersLoading } = useCollection(usersQuery);

  const orgsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "organizations")) : null, [firestore]);
  const { data: allOrgs, isLoading: orgsLoading } = useCollection(orgsQuery);

  const coursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "courses")) : null, [firestore]);
  const { data: allCourses, isLoading: coursesLoading } = useCollection(coursesQuery);

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "products")) : null, [firestore]);
  const { data: allProducts } = useCollection(productsQuery);

  const realStats = {
    totalUsers: allUsers?.length || 0,
    totalOrgs: allOrgs?.length || 0,
    totalCourses: allCourses?.length || 0,
    totalProducts: allProducts?.length || 0,
    activeUsers: allUsers?.filter((u: any) => u.status === 'نشط').length || 0,
  };
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    userGrowth: true,
    salesGrowth: true,
    roleDistribution: true,
    courseEnrollment: true,
  });

  const [userChartData] = useState<UserGrowthData[]>([
    { month: "يناير", users: 180, orgs: 4 },
    { month: "فبراير", users: 310, orgs: 6 },
    { month: "مارس", users: 520, orgs: 9 },
    { month: "أبريل", users: 780, orgs: 14 },
    { month: "مايو", users: 1200, orgs: 22 },
    { month: "يونيو", users: 1850, orgs: 31 },
  ]);
  const [salesChartData] = useState<SalesData[]>([
    { month: "يناير", sales: 3200 },
    { month: "فبراير", sales: 7800 },
    { month: "مارس", sales: 12500 },
    { month: "أبريل", sales: 18000 },
    { month: "مايو", sales: 29000 },
    { month: "يونيو", sales: 48320 },
  ]);
  const [userRolesData] = useState<PieChartData[]>([
    { name: "مستفيدون", value: 2100, fill: "hsl(var(--chart-1))" },
    { name: "مرشدون", value: 80, fill: "hsl(var(--chart-2))" },
    { name: "مدربون", value: 54, fill: "hsl(var(--chart-3))" },
    { name: "مدراء منظمات", value: 38, fill: "hsl(var(--chart-4))" },
    { name: "مشرفون", value: 5, fill: "hsl(var(--chart-5))" },
  ]);
  const [courseEnrollmentData] = useState<CourseEnrollmentData[]>([
    { name: "أساسيات التسويق", enrollments: 148 },
    { name: "ريادة الأعمال", enrollments: 122 },
    { name: "التجارة الإلكترونية", enrollments: 98 },
    { name: "إدارة المشاريع", enrollments: 74 },
    { name: "التصوير للمنتجات", enrollments: 61 },
  ]);

  const handleExport = (fullReport: boolean = false) => {
    const selectedReports = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions)
        .filter(([, isSelected]) => isSelected)
        .map(([reportName]) => reportName);

    if (selectedReports.length === 0) {
        toast({
            variant: "destructive",
            title: "لم يتم تحديد أي أجزاء",
            description: "الرجاء تحديد جزء واحد على الأقل من التقرير لتصديره.",
        });
        return;
    }

    toast({
      title: "جاري تصدير التقرير...",
      description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`,
    });
    setIsExportDialogOpen(false);
  }

  const handleCheckboxChange = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({...prev, [key]: !prev[key]}));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تحليلات المنصة</h1>
         <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4" />
                    تصدير التقارير
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
                    <DialogDescription>اختر أجزاء التقرير التي ترغب في تصديرها.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="font-medium">أجزاء التقرير</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="summary" checked={exportOptions.summary} onCheckedChange={() => handleCheckboxChange("summary")} />
                            <Label htmlFor="summary">الملخص الإحصائي</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="userGrowth" checked={exportOptions.userGrowth} onCheckedChange={() => handleCheckboxChange("userGrowth")} />
                            <Label htmlFor="userGrowth">نمو المستخدمين والمنظمات</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="salesGrowth" checked={exportOptions.salesGrowth} onCheckedChange={() => handleCheckboxChange("salesGrowth")} />
                            <Label htmlFor="salesGrowth">نمو المبيعات</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="roleDistribution" checked={exportOptions.roleDistribution} onCheckedChange={() => handleCheckboxChange("roleDistribution")} />
                            <Label htmlFor="roleDistribution">توزيع أدوار المستخدمين</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="courseEnrollment" checked={exportOptions.courseEnrollment} onCheckedChange={() => handleCheckboxChange("courseEnrollment")} />
                            <Label htmlFor="courseEnrollment">الدورات الأكثر تسجيلاً</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                    <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
                    <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستخدمين</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{realStats.totalUsers.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground mt-1">مستخدم مسجل</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المنظمات</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {orgsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{realStats.totalOrgs}</div>}
            <p className="text-xs text-muted-foreground mt-1">منظمة مسجلة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المستخدمون النشطون</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{realStats.activeUsers}</div>}
            <p className="text-xs text-muted-foreground mt-1">{realStats.totalUsers > 0 ? Math.round((realStats.activeUsers / realStats.totalUsers) * 100) : 0}% من الإجمالي</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المنتجات</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">منتج في المتجر</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الدورات</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {coursesLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{realStats.totalCourses}</div>}
            <p className="text-xs text-muted-foreground mt-1">دورة منشورة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>نمو المستخدمين والمنظمات</CardTitle>
            <CardDescription>نمو عدد المستخدمين والمنظمات الجدد على مدار الـ 6 أشهر الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userChartConfig} className="min-h-[250px] w-full relative">
              {userChartData.length === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
              ) : (
                <BarChart accessibilityLayer data={userChartData}>
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
            <CardDescription>توزيع المستخدمين على مستوى المنصة حسب الدور.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={userRolesConfig} className="h-[250px] w-full relative">
                {userRolesData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                        <Pie data={userRolesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return (
                            <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                            );
                        }}>
                            {userRolesData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
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
         <Card>
          <CardHeader>
            <CardTitle>نمو المبيعات</CardTitle>
            <CardDescription>إجمالي المبيعات من متاجر المستفيدين على مدار الـ 6 أشهر الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={salesChartConfig} className="h-[250px] w-full relative">
                {salesChartData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <LineChart accessibilityLayer data={salesChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value / 1000} ألف د.أ`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                    </LineChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الدورات الأكثر تسجيلاً</CardTitle>
            <CardDescription>ترتيب الدورات حسب عدد المستفيدين المسجلين فيها.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={courseEnrollmentConfig} className="h-[250px] w-full relative">
                {courseEnrollmentData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <BarChart accessibilityLayer data={courseEnrollmentData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                        <XAxis type="number" dataKey="enrollments" />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={4} name="عدد المسجلين" />
                    </BarChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
