"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { Shield, Building, Users, GraduationCap, UserCheck, ArrowLeft, Eye } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

const rolesData = [
  {
    icon: <Shield size={28} />,
    titleAr: "مشرف عام", titleEn: "Super Admin",
    descAr: "إدارة كاملة للمنصة، بما في ذلك المنظمات والمستخدمين وصحة النظام.",
    descEn: "Full platform management, including organizations, users, and system health.",
    link: "/admin-dashboard",
    color: "bg-rose-500",
    badgeAr: "صلاحيات كاملة", badgeEn: "Full access",
  },
  {
    icon: <Building size={28} />,
    titleAr: "مدير منظمة", titleEn: "Organization Manager",
    descAr: "إدارة المستفيدين، المرشدين، الدورات، والتقارير الخاصة بجهتك.",
    descEn: "Manage your organization's beneficiaries, mentors, courses, and reports.",
    link: "/organization-dashboard",
    color: "bg-purple-500",
    badgeAr: null, badgeEn: null,
  },
  {
    icon: <UserCheck size={28} />,
    titleAr: "مستفيد", titleEn: "Beneficiary",
    descAr: "الوصول إلى الدورات التدريبية، جلسات الإرشاد، وإدارة متجرك الخاص.",
    descEn: "Access training courses, mentoring sessions, and manage your own store.",
    link: "/dashboard",
    color: "bg-primary",
    badgeAr: "الأكثر شيوعاً", badgeEn: "Most popular",
  },
  {
    icon: <Users size={28} />,
    titleAr: "مرشد", titleEn: "Mentor",
    descAr: "متابعة المستفيدين، جدولة الجلسات، وتقديم التوجيه والدعم.",
    descEn: "Follow up with beneficiaries, schedule sessions, and provide guidance and support.",
    link: "/mentor-dashboard",
    color: "bg-sky-500",
    badgeAr: null, badgeEn: null,
  },
  {
    icon: <GraduationCap size={28} />,
    titleAr: "مدرب", titleEn: "Coach",
    descAr: "إنشاء وإدارة الدورات التدريبية، ومتابعة أداء الطلاب.",
    descEn: "Create and manage training courses, and track student performance.",
    link: "/coach-dashboard",
    color: "bg-amber-500",
    badgeAr: null, badgeEn: null,
  }
];

const RoleCard = ({ icon, title, description, link, color, badge }: {
  icon: React.ReactNode, title: string, description: string,
  link: string, color: string, badge: string | null
}) => {
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  return (
    <Card className="card-hover text-center flex flex-col group border-0 shadow-md bg-card relative overflow-hidden">
      {badge && (
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs">{badge}</Badge>
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
            {bi('عرض لوحة التحكم', 'View dashboard')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function TryRolesPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const roles = rolesData.map(r => ({
    icon: r.icon,
    title: bi(r.titleAr, r.titleEn),
    description: bi(r.descAr, r.descEn),
    link: r.link,
    color: r.color,
    badge: r.badgeAr ? bi(r.badgeAr, r.badgeEn!) : null,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo />
            <span className="gradient-text">EmpowerHub</span>
          </Link>
          <Button variant="outline" asChild size="sm">
            <Link href="/register">{bi('إنشاء حساب حقيقي', 'Create a real account')}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 py-16">
        <div className="text-center mb-12 max-w-2xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{bi('وضع التجربة', 'Trial mode')}</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">{bi('تجربة المنصة بدون تسجيل', 'Try the platform without signing up')}</h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {bi('اختر أحد الأدوار أدناه لاستكشاف لوحة التحكم وتجربة الميزات المتاحة.', 'Choose one of the roles below to explore the dashboard and try out the available features.')}
            <br />
            <span className="text-sm">{bi('لن يتم حفظ أي بيانات في وضع التجربة.', 'No data will be saved in trial mode.')}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 w-full max-w-6xl">
          {roles.map(role => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>

        <div className="mt-14 text-center space-y-4">
          <p className="text-muted-foreground text-sm">{bi('مستعد للانضمام الفعلي؟', 'Ready to join for real?')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="shadow-md">
              <Link href="/register">{bi('إنشاء حساب مجاناً', 'Create a free account')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="ml-2 h-4 w-4" />
                {bi('العودة للرئيسية', 'Back to home')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
