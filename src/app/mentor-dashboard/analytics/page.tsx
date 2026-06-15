
"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, BarChart3, Clock, DollarSign, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ProgressData {
  name: string;
  progress: number;
}

interface SessionFrequencyData {
  month: string;
  sessions: number;
}

const progressConfig = {
  progress: { label: "التقدم", color: "hsl(var(--chart-1))" },
}

const sessionFrequencyConfig = {
  sessions: { label: "عدد الجلسات", color: "hsl(var(--chart-2))" },
}


export default function MentorAnalyticsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    progress: true,
    frequency: true,
  });

  const [progressData] = useState<ProgressData[]>([
    { name: "سارة م.", progress: 88 },
    { name: "نورة أ.", progress: 72 },
    { name: "منى س.", progress: 55 },
    { name: "ريم ع.", progress: 40 },
    { name: "فاطمة ن.", progress: 25 },
  ]);
  const [sessionFrequencyData] = useState<SessionFrequencyData[]>([
    { month: "يناير", sessions: 8 },
    { month: "فبراير", sessions: 12 },
    { month: "مارس", sessions: 10 },
    { month: "أبريل", sessions: 15 },
    { month: "مايو", sessions: 18 },
    { month: "يونيو", sessions: 14 },
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
        <h1 className="text-lg font-semibold md:text-2xl">تحليلات الإرشاد</h1>
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
                            <Checkbox id="progress" checked={exportOptions.progress} onCheckedChange={() => handleCheckboxChange("progress")} />
                            <Label htmlFor="progress">تقدم المستفيدين</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="frequency" checked={exportOptions.frequency} onCheckedChange={() => handleCheckboxChange("frequency")} />
                            <Label htmlFor="frequency">تكرار الجلسات</Label>
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
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستفيدين</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">مستفيدين نشطين</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">متوسط تقدم المستفيدين</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">56%</div>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">+8% هذا الشهر</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">جلسات هذا الشهر</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">بإجمالي 21 ساعة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">أرباح هذا الشهر</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">840 د.أ</div>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">+15% عن الشهر الماضي</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تقدم المستفيدين</CardTitle>
            <CardDescription>التقدم الحالي للمستفيدين الذين تشرف عليهم.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
                {progressData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <BarChart accessibilityLayer data={progressData} margin={{ left: 10, right: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value}%`}/>
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                    </BarChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تكرار الجلسات الشهرية</CardTitle>
            <CardDescription>عدد الجلسات الإرشادية التي عقدتها على مدار 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={sessionFrequencyConfig} className="h-[250px] w-full relative">
                {sessionFrequencyData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
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
