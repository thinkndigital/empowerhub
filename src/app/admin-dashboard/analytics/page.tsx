
"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Building, Activity, ShoppingCart, Download, BookOpen, UserCheck } from "lucide-react"
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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    userGrowth: true,
    salesGrowth: true,
    roleDistribution: true,
    courseEnrollment: true,
  });

  // Data is reset for production. In a real app, this would be fetched from the backend.
  const [userChartData, setUserChartData] = useState<UserGrowthData[]>([]);
  const [salesChartData, setSalesChartData] = useState<SalesData[]>([]);
  const [userRolesData, setUserRolesData] = useState<PieChartData[]>([]);
  const [courseEnrollmentData, setCourseEnrollmentData] = useState<CourseEnrollmentData[]>([]);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنظمات</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
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
