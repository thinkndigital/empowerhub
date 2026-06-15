import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, BarChart3, DollarSign, TrendingUp, BookOpen, ArrowUpRight, GraduationCap, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StatCard = ({
  title, value, sub, icon, trend, color
}: {
  title: string, value: string, sub: string, icon: React.ReactNode, trend?: string, color: string
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && (
          <span className="text-xs flex items-center font-medium text-primary">
            <ArrowUpRight className="h-3 w-3" />{trend}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function OrganizationDashboardPage() {
  const beneficiariesProgress = [
    { name: "أحمد الشمري", progress: 85, status: "نشط" },
    { name: "فاطمة العلي", progress: 62, status: "نشط" },
    { name: "محمد الزيد", progress: 100, status: "مكتمل" },
    { name: "نورة السالم", progress: 40, status: "نشط" },
    { name: "خالد المطيري", progress: 15, status: "جديد" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المنظمة</h1>
          <p className="text-muted-foreground">نظرة عامة على أداء المستفيدين في منظمتك.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مدير المنظمة</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي المستفيدين" value="124" sub="مستفيد مسجل" icon={<Users className="h-5 w-5 text-white" />} trend="+8 هذا الشهر" color="bg-primary" />
        <StatCard title="المستفيدون النشطون" value="98" sub="79% من الإجمالي" icon={<UserCheck className="h-5 w-5 text-white" />} trend="+5%" color="bg-accent" />
        <StatCard title="متوسط التقدم" value="67%" sub="في جميع الدورات" icon={<BarChart3 className="h-5 w-5 text-white" />} trend="+4%" color="bg-purple-500" />
        <StatCard title="إجمالي مبيعات المتاجر" value="12,450 د.أ" sub="هذا الشهر" icon={<DollarSign className="h-5 w-5 text-white" />} trend="+18%" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* Beneficiaries Progress */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">تقدم المستفيدين</CardTitle>
                <CardDescription>أعلى المستفيدين تقدماً هذا الشهر</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/organization-dashboard/beneficiaries">عرض الكل</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {beneficiariesProgress.map((b, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {b.name[0]}
                    </div>
                    <span className="text-sm font-medium">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.status === "مكتمل" ? "default" : b.status === "جديد" ? "secondary" : "outline"} className="text-xs">
                      {b.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground w-8 text-left">{b.progress}%</span>
                  </div>
                </div>
                <Progress value={b.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions + Summary */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ملخص المنظمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "الدورات النشطة", value: "12", icon: <BookOpen className="h-4 w-4 text-primary" /> },
                { label: "المرشدون", value: "8", icon: <GraduationCap className="h-4 w-4 text-accent" /> },
                { label: "المتاجر النشطة", value: "23", icon: <Store className="h-4 w-4 text-amber-500" /> },
                { label: "معدل الإكمال", value: "72%", icon: <TrendingUp className="h-4 w-4 text-purple-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    {item.icon}
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-bold text-sm">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/beneficiaries"><Users className="h-3 w-3" />المستفيدون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/courses"><BookOpen className="h-3 w-3" />الدورات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/mentors"><GraduationCap className="h-3 w-3" />المرشدون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/organization-dashboard/reports"><BarChart3 className="h-3 w-3" />التقارير</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
