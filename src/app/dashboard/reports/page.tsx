
"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, DollarSign, BookOpenCheck, ShoppingCart } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface RevenueData {
  date: string;
  revenue: number;
}

interface ProgressData {
  name: string;
  "التقدم": number;
}

interface SalesByCategoryData {
  name: string;
  value: number;
  fill: string;
}

const revenueConfig = {
  revenue: { label: "الإيرادات", color: "hsl(var(--chart-1))" },
}
const progressConfig = {
  "التقدم": { label: "التقدم", color: "hsl(var(--chart-2))" },
}
const salesByCategoryConfig = {
  jewelry: { label: "مجوهرات" },
  decor: { label: "ديكور منزلي" },
  apparel: { label: "ملابس" },
}

export default function ReportsPage() {
    const { toast } = useToast();
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        summary: true,
        revenue: true,
        progress: true,
        salesCategory: true,
    });
    
    // Data is reset for production. In a real app, this would be fetched from the backend.
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [salesByCategoryData, setSalesByCategoryData] = useState<SalesByCategoryData[]>([]);

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
                <h1 className="text-2xl font-bold tracking-tight">التقارير والتحليلات</h1>
                <p className="text-muted-foreground">نظرة عميقة على أدائك وتأثيرك.</p>
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
                                <Checkbox id="summary" checked={exportOptions.summary} onCheckedChange={() => handleCheckboxChange("summary")} />
                                <Label htmlFor="summary">الملخص الإحصائي</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="revenue" checked={exportOptions.revenue} onCheckedChange={() => handleCheckboxChange("revenue")} />
                                <Label htmlFor="revenue">إيرادات المتجر</Label>
                            </div>
                             <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="progress" checked={exportOptions.progress} onCheckedChange={() => handleCheckboxChange("progress")} />
                                <Label htmlFor="progress">تقدم المسار التعليمي</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="salesCategory" checked={exportOptions.salesCategory} onCheckedChange={() => handleCheckboxChange("salesCategory")} />
                                <Label htmlFor="salesCategory">المبيعات حسب الفئة</Label>
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

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي إيرادات المتجر</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0.00 د.أ</div>
                    <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الدورات المكتملة</CardTitle>
                    <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">من أصل 0 دورات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المنتج الأكثر مبيعاً</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">-</div>
                    <p className="text-xs text-muted-foreground">0 قطعة مباعة</p>
                </CardContent>
            </Card>
        </div>


       <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>إيرادات المتجر الشهرية</CardTitle>
                    <CardDescription>إجمالي الإيرادات من متجرك على مدار الأشهر الستة الماضية.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={revenueConfig} className="h-[250px] w-full relative">
                        {revenueData.length === 0 ? (
                             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <LineChart accessibilityLayer data={revenueData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value} د.أ`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                            </LineChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>تقدم المسار التعليمي</CardTitle>
                    <CardDescription>التقدم المحرز في الفئات الرئيسية لمسارك التعليمي.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
                        {progressData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <BarChart accessibilityLayer data={progressData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                                <XAxis type="number" dataKey="التقدم" orientation="top" tickFormatter={(value) => `${value}%`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="التقدم" fill="var(--color-التقدم)" radius={5} />
                            </BarChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
       </div>
       <Card>
            <CardHeader>
                <CardTitle>مبيعات المتجر حسب الفئة</CardTitle>
                <CardDescription>توزيع إيرادات المتجر على فئات المنتجات المختلفة.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={salesByCategoryConfig} className="h-[250px] w-full relative">
                    {salesByCategoryData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                    ) : (
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={salesByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} >
                                {salesByCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend/>
                        </PieChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
