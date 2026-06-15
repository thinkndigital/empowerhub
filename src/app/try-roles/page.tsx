import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Building, Users, GraduationCap, UserCheck, ArrowLeft } from 'lucide-react';

const roles = [
  {
    icon: <Shield size={32} />,
    title: "مشرف عام",
    description: "إدارة كاملة للمنصة، بما في ذلك المنظمات والمستخدمين وصحة النظام.",
    link: "/admin-dashboard"
  },
  {
    icon: <Building size={32} />,
    title: "مدير منظمة",
    description: "إدارة المستفيدين، المرشدين، الدورات، والتقارير الخاصة بمنظمتك.",
    link: "/organization-dashboard"
  },
  {
    icon: <UserCheck size={32} />,
    title: "مستفيد",
    description: "الوصول إلى الدورات التدريبية، جلسات الإرشاد، وإدارة متجرك الخاص.",
    link: "/dashboard"
  },
  {
    icon: <Users size={32} />,
    title: "مرشد",
    description: "متابعة المستفيدين، جدولة الجلسات، وتقديم التوجيه والدعم.",
    link: "/mentor-dashboard"
  },
  {
    icon: <GraduationCap size={32} />,
    title: "مدرب",
    description: "إنشاء وإدارة الدورات التدريبية، ومتابعة أداء الطلاب.",
    link: "/coach-dashboard"
  }
];

const RoleCard = ({ icon, title, description, link }: { icon: React.ReactNode, title: string, description: string, link: string }) => (
    <Card className="text-center flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1">
        <CardHeader>
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent text-accent-foreground mx-auto mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </div>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <CardDescription>{description}</CardDescription>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={link}>عرض لوحة التحكم <ArrowLeft className="mr-2 h-4 w-4" /></Link>
            </Button>
        </CardFooter>
    </Card>
);


export default function TryRolesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">تجربة المنصة</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          اختر أحد الأدوار أدناه لتصفح لوحة التحكم الخاصة به وتجربة الميزات المتاحة.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full max-w-7xl">
          {roles.map(role => (
              <RoleCard key={role.title} {...role} />
          ))}
      </div>

       <div className="mt-12">
            <Button variant="outline" asChild>
                <Link href="/">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة إلى الصفحة الرئيسية
                </Link>
            </Button>
        </div>
    </div>
  );
}
