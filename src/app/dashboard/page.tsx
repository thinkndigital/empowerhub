import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Activity, BookOpenCheck, DollarSign, TrendingUp, Clock, Target, ChevronRight } from "lucide-react";
import { AiRecommender } from "./ai-recommender";
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
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && (
          <Badge variant="secondary" className="text-xs text-primary bg-primary/10 px-1.5 py-0">
            <TrendingUp className="h-3 w-3 mr-0.5" />{trend}
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
);

const CourseProgress = ({ name, progress, category }: { name: string, progress: number, category: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">{name}</span>
      <span className="text-muted-foreground">{progress}%</span>
    </div>
    <Progress value={progress} className="h-2" />
    <Badge variant="outline" className="text-xs">{category}</Badge>
  </div>
);

export default function DashboardPage() {
  return (
    <>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بعودتك! هنا يمكنك متابعة تقدمك والحصول على توصيات مخصصة.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>آخر تسجيل دخول: اليوم</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="الدورات الجارية"
          value="1"
          sub="من أصل 4 دورات"
          icon={<Activity className="h-5 w-5 text-white" />}
          trend="+1 هذا الشهر"
          color="bg-primary"
        />
        <StatCard
          title="الشهادات المكتملة"
          value="1"
          sub="شهادة معتمدة"
          icon={<BookOpenCheck className="h-5 w-5 text-white" />}
          trend="+1 هذا الشهر"
          color="bg-accent"
        />
        <StatCard
          title="إيرادات المتجر"
          value="0 د.أ"
          sub="لا توجد مبيعات بعد"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-amber-500"
        />
        <StatCard
          title="أهداف محققة"
          value="25%"
          sub="من الأهداف الشهرية"
          icon={<Target className="h-5 w-5 text-white" />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content: AI Recommender */}
        <div className="lg:col-span-2 space-y-6">
          <AiRecommender />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Course Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">تقدم الدورات</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                  <Link href="/dashboard/training">
                    عرض الكل
                    <ChevronRight className="h-3 w-3 mr-1" />
                  </Link>
                </Button>
              </div>
              <CardDescription>الدورات الجارية حالياً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <CourseProgress name="مقدمة في ريادة الأعمال" progress={100} category="أعمال" />
              <CourseProgress name="أساسيات التسويق الرقمي" progress={100} category="تسويق" />
              <CourseProgress name="تصوير المنتجات للتجارة الإلكترونية" progress={35} category="تجارة إلكترونية" />
              <CourseProgress name="إدارة المتجر الإلكتروني" progress={0} category="تجارة إلكترونية" />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/training">
                  <BookOpenCheck className="h-4 w-4 text-primary" />
                  متابعة الدورات
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/my-store">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  إدارة المتجر
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/mentorship">
                  <Activity className="h-4 w-4 text-accent" />
                  جلسة إرشاد
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs">
                <Link href="/dashboard/reports">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  التقارير
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">المواعيد القادمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                    <span className="text-xs font-bold leading-none">15</span>
                    <span className="text-xs leading-none text-muted-foreground">يون</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">جلسة إرشاد أسبوعية</p>
                    <p className="text-xs text-muted-foreground">10:00 ص - مع المرشد أحمد</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex flex-col items-center justify-center text-accent shrink-0">
                    <span className="text-xs font-bold leading-none">20</span>
                    <span className="text-xs leading-none text-muted-foreground">يون</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">اختبار التسويق الرقمي</p>
                    <p className="text-xs text-muted-foreground">الموعد النهائي للتسليم</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
