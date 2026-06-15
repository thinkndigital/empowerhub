
"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, Users, Activity, BarChart3, DollarSign } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EngagementData {
  month: string;
  active: number;
}

interface CompletionData {
  name: string;
  "معدل الإكمال": number;
}

interface SalesData {
  name: string;
  sales: number;
}

const engagementConfig = {
  active: { label: "مستفيد نشط", color: "hsl(var(--chart-1))" },
}

const completionConfig = {
  "معدل الإكمال": { label: "معدل الإكمال", color: "hsl(var(--chart-2))" },
}

const salesConfig = {
    sales: { label: "المبيعات", color: "hsl(var(--chart-1))" },
}

export default function OrgReportsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    engagement: true,
    completion: true,
    sales: true,
  });

  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [completionData, setCompletionData] = useState<CompletionData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);


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
     <div className="space-y-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">تقارير المنظمة</h1>
                <p className="text-muted-foreground">
                تحليل أداء وتأثير المستفيدين في منظمتك.
                </p>
            </div>
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
                                <Checkbox id="engagement" checked={exportOptions.engagement} onCheckedChange={() => handleCheckboxChange("engagement")} />
                                <Label htmlFor="engagement">تفاعل المستفيدين</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="completion" checked={exportOptions.completion} onCheckedChange={() => handleCheckboxChange("completion")} />
                                <Label htmlFor="completion">معدلات إكمال الدورات</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="sales" checked={exportOptions.sales} onCheckedChange={() => handleCheckboxChange("sales")} />
                                <Label htmlFor="sales">مبيعات متاجر المستفيدين</Label>
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
                    <CardTitle className="text-sm font-medium">إجمالي المستفيدين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المستفيدون النشطون</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">0% من الإجمالي</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">التقدم العام للمسارات</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0%</div>
                    <p className="text-xs text-muted-foreground">متوسط إكمال الدورات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إيرادات المتاجر</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0 د.أ</div>
                    <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                </CardContent>
            </Card>
        </div>


       <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>تفاعل المستفيدين</CardTitle>
                    <CardDescription>عدد المستفيدين النشطين شهريًا.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={engagementConfig} className="h-[250px] w-full relative">
                        {engagementData.length === 0 ? (
                             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <LineChart accessibilityLayer data={engagementData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Line dataKey="active" type="monotone" stroke="var(--color-active)" strokeWidth={2} dot={false} />
                            </LineChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>معدلات إكمال الدورات</CardTitle>
                    <CardDescription>معدل إكمال الدورات حسب الفئة.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={completionConfig} className="h-[250px] w-full relative">
                        {completionData.length === 0 ? (
                           <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <BarChart accessibilityLayer data={completionData} margin={{ left: 10, right: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value}%`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="معدل الإكمال" fill="var(--color-معدل الإكمال)" radius={4} />
                            </BarChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
       </div>
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>مبيعات متاجر المستفيدين</CardTitle>
                <CardDescription>أفضل المستفيدين أداءً من حيث المبيعات.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={salesConfig} className="h-[300px] w-full relative">
                    {salesData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                    ) : (
                        <BarChart accessibilityLayer data={salesData} margin={{ left: 10, right: 20 }}>
                                <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value / 1000} ألف`} />
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
