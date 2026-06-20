import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { Shield, Building, Users, GraduationCap, UserCheck, ArrowLeft, Eye } from 'lucide-react';

const roles = [
  {
    icon: <Shield size={28} />,
    title: "مشرف عام",
    description: "إدارة كاملة للمنصة، بما في ذلك المنظمات والمستخدمين وصحة النظام.",
    link: "/admin-dashboard",
    color: "bg-rose-500",
    badge: "صلاحيات كاملة",
  },
  {
    icon: <Building size={28} />,
    title: "مدير منظمة",
    description: "إدارة المستفيدين، المرشدين، الدورات، والتقارير الخاصة بجهتك.",
    link: "/organization-dashboard",
    color: "bg-purple-500",
    badge: null,
  },
  {
    icon: <UserCheck size={28} />,
    title: "مستفيد",
    description: "الوصول إلى الدورات التدريبية، جلسات الإرشاد، وإدارة متجرك الخاص.",
    link: "/dashboard",
    color: "bg-primary",
    badge: "الأكثر شيوعاً",
  },
  {
    icon: <Users size={28} />,
    title: "مرشد",
    description: "متابعة المستفيدين، جدولة الجلسات، وتقديم التوجيه والدعم.",
    link: "/mentor-dashboard",
    color: "bg-sky-500",
    badge: null,
  },
  {
    icon: <GraduationCap size={28} />,
    title: "مدرب",
    description: "إنشاء وإدارة الدورات التدريبية، ومتابعة أداء الطلاب.",
    link: "/coach-dashboard",
    color: "bg-amber-500",
    badge: null,
  }
];

const RoleCard = ({ icon, title, description, link, color, badge }: {
  icon: React.ReactNode, title: string, description: string,
  link: string, color: string, badge: string | null
}) => (
  <Card className="card-hover text-center flex flex-col group border-0 shadow-md bg-card relative overflow-hidden">
    {badge && (
      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">{badge}</Badge>
    )}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="relative">
      <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${color} text-white mx-auto mb-3 transition-transform group-hover:scale-110 shadow-lg`}>
        {icon}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow relative">
      <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
    </CardContent>
    <CardFooter className="relative">
      <Button asChild className="w-full group/btn">
        <Link href={link}>
          <Eye className="ml-2 h-4 w-4" />
          عرض لوحة التحكم
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function TryRolesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo />
            <span className="gradient-text">EmpowerHub</span>
          </Link>
          <Button variant="outline" asChild size="sm">
            <Link href="/register">إنشاء حساب حقيقي</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 py-16">
        <div className="text-center mb-12 max-w-2xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">وضع التجربة</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">تجربة المنصة بدون تسجيل</h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            اختر أحد الأدوار أدناه لاستكشاف لوحة التحكم وتجربة الميزات المتاحة.
            <br />
            <span className="text-sm">لن يتم حفظ أي بيانات في وضع التجربة.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 w-full max-w-6xl">
          {roles.map(role => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>

        <div className="mt-14 text-center space-y-4">
          <p className="text-muted-foreground text-sm">مستعد للانضمام الفعلي؟</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="shadow-md">
              <Link href="/register">إنشاء حساب مجاناً</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة للرئيسية
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
