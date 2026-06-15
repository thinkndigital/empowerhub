import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Building, BookOpen, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight, UserCheck, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StatCard = ({
  title, value, sub, icon, trend, trendUp, color
}: {
  title: string, value: string, sub: string, icon: React.ReactNode,
  trend?: string, trendUp?: boolean, color: string
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
          <span className={`text-xs flex items-center font-medium ${trendUp ? 'text-primary' : 'text-destructive'}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

const QuickLink = ({ href, label, desc, icon }: { href: string, label: string, desc: string, icon: React.ReactNode }) => (
  <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-start gap-1 card-hover border-border">
    <Link href={href}>
      <div className="flex items-center gap-2 text-primary">{icon}<span className="font-semibold">{label}</span></div>
      <p className="text-xs text-muted-foreground text-right">{desc}</p>
    </Link>
  </Button>
);

export default function AdminDashboardPage() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
          <p className="text-muted-foreground">نظرة عامة وشاملة على أداء المنصة بالكامل.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مشرف النظام</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-5">
        <StatCard title="إجمالي المستخدمين" value="2,547" sub="مستخدم مسجل" icon={<Users className="h-5 w-5 text-white" />} trend="+12%" trendUp color="bg-primary" />
        <StatCard title="إجمالي المنظمات" value="38" sub="منظمة نشطة" icon={<Building className="h-5 w-5 text-white" />} trend="+3" trendUp color="bg-accent" />
        <StatCard title="المستخدمون النشطون" value="1,284" sub="هذا الشهر" icon={<Activity className="h-5 w-5 text-white" />} trend="+8%" trendUp color="bg-purple-500" />
        <StatCard title="إجمالي المبيعات" value="48,320 د.أ" sub="هذا الشهر" icon={<ShoppingCart className="h-5 w-5 text-white" />} trend="+23%" trendUp color="bg-amber-500" />
        <StatCard title="إجمالي الدورات" value="154" sub="دورة منشورة" icon={<BookOpen className="h-5 w-5 text-white" />} trend="+7" trendUp color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* Quick Links */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            <CardDescription>الوصول السريع لأهم أقسام الإدارة</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <QuickLink href="/admin-dashboard/users" label="إدارة المستخدمين" desc="عرض وإدارة جميع المستخدمين" icon={<Users className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/organizations" label="المنظمات" desc="إدارة المنظمات المسجلة" icon={<Building className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/courses" label="الدورات" desc="إدارة المحتوى التعليمي" icon={<BookOpen className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/mentors" label="المرشدون" desc="إدارة فريق الإرشاد" icon={<UserCheck className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/analytics" label="التحليلات" desc="تقارير وإحصائيات المنصة" icon={<TrendingUp className="h-4 w-4" />} />
            <QuickLink href="/admin-dashboard/messages" label="الرسائل" desc="الرسائل والإشعارات" icon={<GraduationCap className="h-4 w-4" />} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">آخر النشاطات</CardTitle>
            <CardDescription>أحدث الأحداث على المنصة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { text: "انضمت منظمة جديدة: مؤسسة الأمل", time: "منذ ساعة", color: "bg-primary" },
              { text: "تم تسجيل 12 مستفيد جديد", time: "منذ 3 ساعات", color: "bg-accent" },
              { text: "نُشرت دورة: أساسيات المحاسبة", time: "أمس", color: "bg-amber-500" },
              { text: "تم إتمام 5 طلبات شراء جديدة", time: "أمس", color: "bg-purple-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full ${item.color} mt-1.5 shrink-0`} />
                <div>
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
