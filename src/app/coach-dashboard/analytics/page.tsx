
"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Activity, Download, CheckCircle, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EnrollmentChartData {
  month: string;
  users: number;
}

interface CompletionRateData {
  course: string;
  rate: number;
}

interface EarningsData {
  month: string;
  earnings: number;
}

interface TopCourseData {
  title: string;
  enrolled: number;
  completion: string;
}

const enrollmentChartConfig = {
  users: { label: "الطلاب الجدد", color: "hsl(var(--chart-1))" },
}
const completionRateConfig = {
    rate: { label: "معدل الإكمال", color: "hsl(var(--chart-2))" },
}
const earningsConfig = {
  earnings: { label: "الأرباح", color: "hsl(var(--chart-1))" },
}

export default function CoachAnalyticsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    enrollment: true,
    completion: true,
    earnings: true,
    topCourses: true,
  });

  // Data is reset for production. In a real app, this would be fetched from the backend.
  const [enrollmentChartData, setEnrollmentChartData] = useState<EnrollmentChartData[]>([]);
  const [completionRateData, setCompletionRateData] = useState<CompletionRateData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [topCoursesData, setTopCoursesData] = useState<TopCourseData[]>([]);

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
        <h1 className="text-lg font-semibold md:text-2xl">تحليلات الدورات</h1>
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
                            <Checkbox id="enrollment" checked={exportOptions.enrollment} onCheckedChange={() => handleCheckboxChange("enrollment")} />
                            <Label htmlFor="enrollment">نمو الطلاب</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="completion" checked={exportOptions.completion} onCheckedChange={() => handleCheckboxChange("completion")} />
                            <Label htmlFor="completion">معدل إكمال الدورات</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="earnings" checked={exportOptions.earnings} onCheckedChange={() => handleCheckboxChange("earnings")} />
                            <Label htmlFor="earnings">تطور الأرباح</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="topCourses" checked={exportOptions.topCourses} onCheckedChange={() => handleCheckboxChange("topCourses")} />
                            <Label htmlFor="topCourses">الدورات الأفضل أداءً</Label>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المسجلين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلاب النشطون</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط معدل الإكمال</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">لكل الدورات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">الأرباح من الجلسات التدريبية</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نمو الطلاب</CardTitle>
            <CardDescription>عدد الطلاب الجدد المسجلين في دوراتك على مدار الـ 6 أشهر الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={enrollmentChartConfig} className="h-[250px] w-full relative">
                {enrollmentChartData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <LineChart accessibilityLayer data={enrollmentChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Line dataKey="users" type="monotone" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                    </LineChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>معدل إكمال الدورات</CardTitle>
            <CardDescription>مقارنة بين معدلات إكمال أشهر دوراتك.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={completionRateConfig} className="h-[250px] w-full relative">
                {completionRateData.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <BarChart accessibilityLayer data={completionRateData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="course" tickLine={false} tickMargin={10} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value}%`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
                    </BarChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
          <Card>
              <CardHeader>
                <CardTitle>تطور الأرباح الشهرية</CardTitle>
                <CardDescription>إجمالي أرباحك من الجلسات التدريبية على مدار 6 أشهر.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={earningsConfig} className="h-[250px] w-full relative">
                    {earningsData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                    ) : (
                        <LineChart accessibilityLayer data={earningsData} margin={{ left: -20, right: 10 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value} د.أ`}/>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Line dataKey="earnings" type="monotone" stroke="var(--color-earnings)" strokeWidth={2} dot={false} />
                        </LineChart>
                    )}
                </ChartContainer>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                <CardTitle>الدورات الأفضل أداءً</CardTitle>
                <CardDescription>قائمة بالدورات الأعلى تسجيلاً ومعدل إكمال.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>الدورة</TableHead>
                              <TableHead className="text-center">المسجلون</TableHead>
                              <TableHead className="text-center">معدل الإكمال</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {topCoursesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">لا توجد بيانات لعرضها.</TableCell>
                            </TableRow>
                          ) : topCoursesData.map((course) => (
                            <TableRow key={course.title}>
                                <TableCell className="font-medium">{course.title}</TableCell>
                                <TableCell className="text-center">{course.enrolled}</TableCell>
                                <TableCell className="text-center">{course.completion}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      </div>
    </>
  );
}
