"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import {
  ArrowLeft, BookOpen, Users, Store, Building, GraduationCap,
  UserCheck, CheckCircle, TrendingUp, Award, Globe, ChevronDown,
  Star, BarChart3, Shield, Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FeatureCard = ({ icon, title, description, color }: {
  icon: React.ReactNode, title: string, description: string, color: string
}) => (
  <Card className="card-hover border-0 shadow-md bg-card">
    <CardContent className="pt-6 pb-6">
      <div className={`flex items-center justify-center h-14 w-14 rounded-2xl ${color} mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const RoleCard = ({ icon, title, description, link, badge }: {
  icon: React.ReactNode, title: string, description: string, link: string, badge?: string
}) => (
  <Card className="card-hover text-center flex flex-col group border-0 shadow-md bg-card relative overflow-hidden">
    {badge && (
      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">{badge}</Badge>
    )}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="relative">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mx-auto mb-3 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
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
          ابدأ الآن
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover/btn:-translate-x-1" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const StatCard = ({ number, label, icon }: { number: string, label: string, icon: React.ReactNode }) => (
  <div className="text-center group">
    <div className="flex justify-center mb-2">
      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-extrabold text-primary mb-1">{number}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const TestimonialCard = ({ name, role, text, stars }: {
  name: string, role: string, text: string, stars: number
}) => (
  <Card className="card-hover border-0 shadow-md bg-card">
    <CardContent className="pt-6">
      <div className="flex mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {name[0]}
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((image) => image.id === 'register-background');

  return (
    <div className="bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Logo />
            <span className="gradient-text">EmpowerHub</span>
          </Link>
          <nav className="flex-1 mr-8 hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-primary">الميزات</Link>
            <Link href="#stats" className="text-muted-foreground transition-colors hover:text-primary">إحصائياتنا</Link>
            <Link href="#roles" className="text-muted-foreground transition-colors hover:text-primary">انضم إلينا</Link>
            <Link href="/market" className="text-muted-foreground transition-colors hover:text-primary">المتجر</Link>
            <Link href="/try-roles" className="text-muted-foreground transition-colors hover:text-primary">تجربة المنصة</Link>
          </nav>
          <div className="flex items-center gap-2 mr-auto">
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild className="shadow-md">
              <Link href="/register">ابدأ مجاناً</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[85vh] items-center justify-center text-center text-white overflow-hidden">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover scale-105"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

          <div className="relative z-10 container px-4 md:px-6 animate-fade-in-up">
            <Badge className="mb-6 bg-primary/20 text-primary-foreground border border-primary/30 backdrop-blur px-4 py-1.5 text-sm">
              🚀 منصة التمكين الرقمي الشاملة
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-7xl leading-tight">
              <span className="block">EmpowerHub</span>
              <span className="block mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white/90">
                بوابتك للتمكين والنجاح
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/80 leading-relaxed">
              منصة متكاملة تجمع بين التدريب المتخصص، الإرشاد الشخصي، والتجارة الإلكترونية
              <br />لمساعدتك على بناء مستقبلك وتحقيق أهدافك.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="shadow-xl text-base px-8 py-6">
                <Link href="/register">
                  ابدأ رحلتك مجاناً
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur text-base px-8 py-6">
                <Link href="/market">تصفح المتجر</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>مجاني تماماً للبدء</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>لا يتطلب بطاقة ائتمان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>دعم باللغة العربية</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-white/50" />
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-16 bg-card border-y">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number="2,500+" label="مستفيد نشط" icon={<Users className="h-6 w-6" />} />
              <StatCard number="150+" label="دورة تدريبية" icon={<BookOpen className="h-6 w-6" />} />
              <StatCard number="80+" label="مرشد ومدرب" icon={<GraduationCap className="h-6 w-6" />} />
              <StatCard number="95%" label="نسبة الرضا" icon={<Award className="h-6 w-6" />} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">ميزاتنا</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">كل ما تحتاجه للنجاح في مكان واحد</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                نقدم لك الأدوات والموارد اللازمة لتنمية مهاراتك وتحقيق أهدافك المهنية والشخصية.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<BookOpen size={28} className="text-white" />}
                title="تدريب متخصص"
                description="مسارات تعليمية ودورات تدريبية مصممة لتزويدك بالمهارات المطلوبة في سوق العمل الحديث."
                color="bg-primary"
              />
              <FeatureCard
                icon={<Users size={28} className="text-white" />}
                title="إرشاد شخصي"
                description="تواصل مع مرشدين وخبراء لمساعدتك في رحلتك وتقديم النصح والتوجيه المخصص."
                color="bg-accent"
              />
              <FeatureCard
                icon={<Store size={28} className="text-white" />}
                title="متجر إلكتروني"
                description="أنشئ متجرك الخاص، اعرض منتجاتك، وابدأ في تحقيق الدخل من مشروعك بسهولة."
                color="bg-amber-500"
              />
              <FeatureCard
                icon={<BarChart3 size={28} className="text-white" />}
                title="تقارير وتحليلات"
                description="تابع تقدمك ونموك بتقارير مرئية شاملة تساعدك على اتخاذ قرارات أفضل."
                color="bg-purple-500"
              />
              <FeatureCard
                icon={<Zap size={28} className="text-white" />}
                title="توصيات بالذكاء الاصطناعي"
                description="احصل على توصيات مخصصة لمحتوى التدريب والموارد المناسبة لأهدافك."
                color="bg-rose-500"
              />
              <FeatureCard
                icon={<Shield size={28} className="text-white" />}
                title="أمان وموثوقية"
                description="بياناتك محمية بأحدث تقنيات الأمان. نضمن لك تجربة موثوقة وآمنة في كل وقت."
                color="bg-teal-600"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">كيف تعمل المنصة</Badge>
              <h2 className="text-3xl font-bold tracking-tight">ابدأ رحلتك في 3 خطوات بسيطة</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {[
                { step: '١', title: 'أنشئ حسابك', desc: 'سجّل مجاناً واختر دورك على المنصة سواء كمستفيد أو مرشد أو منظمة.', icon: <UserCheck className="h-8 w-8" /> },
                { step: '٢', title: 'استكشف المحتوى', desc: 'تصفح الدورات التدريبية، تواصل مع المرشدين، وابنِ مهاراتك.', icon: <Globe className="h-8 w-8" /> },
                { step: '٣', title: 'حقق أهدافك', desc: 'أطلق متجرك، احصل على شهاداتك، وابنِ مستقبلاً أفضل.', icon: <TrendingUp className="h-8 w-8" /> },
              ].map((item, i) => (
                <div key={i} className="text-center relative z-10">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground text-2xl font-extrabold mx-auto mb-4 shadow-lg shadow-primary/30">
                    {item.step}
                  </div>
                  <div className="flex justify-center mb-3 text-primary">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles CTA Section */}
        <section id="roles" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">انضم إلينا</Badge>
              <h2 className="text-3xl font-bold tracking-tight">انضم إلى مجتمعنا اليوم</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                سواء كنت مستفيدًا، مرشدًا، أو منظمة، هناك مكان لك في EmpowerHub.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <RoleCard
                icon={<UserCheck size={32} />}
                title="كمستفيد"
                description="طور مهاراتك، ابنِ مشروعك، وحقق استقلاليتك المالية من خلال برامج تمكين متكاملة."
                link="/register?role=beneficiary"
                badge="الأكثر شعبية"
              />
              <RoleCard
                icon={<GraduationCap size={32} />}
                title="كمدرب"
                description="شارك خبراتك ومعرفتك من خلال إنشاء وتقديم دورات تدريبية متخصصة."
                link="/register?role=coach"
              />
              <RoleCard
                icon={<Users size={32} />}
                title="كمرشد"
                description="ساهم في نجاح الآخرين من خلال تقديم الإرشاد والتوجيه الشخصي."
                link="/register?role=mentor"
              />
              <RoleCard
                icon={<Building size={32} />}
                title="كمنظمة"
                description="أدر برامج التمكين الخاصة بك، وتابع تقدم المستفيدين بفعالية."
                link="/register?role=organization"
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">آراء مستخدمينا</Badge>
              <h2 className="text-3xl font-bold tracking-tight">ماذا يقول من جربوا المنصة</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard
                name="سارة أحمد"
                role="مستفيدة - رائدة أعمال"
                text="بفضل EmpowerHub، تمكنت من إطلاق متجري الإلكتروني وتحقيق أول ألف ريال خلال شهرين فقط. الدعم والتدريب كانا استثنائيين!"
                stars={5}
              />
              <TestimonialCard
                name="محمد الخالد"
                role="مدرب - خبير تسويق رقمي"
                text="المنصة أتاحت لي الفرصة للوصول إلى مئات المستفيدين ومشاركتهم خبرتي. الأدوات سهلة الاستخدام والدعم الفني ممتاز."
                stars={5}
              />
              <TestimonialCard
                name="منظمة بناء المستقبل"
                role="منظمة غير ربحية"
                text="ساعدتنا المنصة في إدارة 200 مستفيد بكل احترافية. التقارير التفصيلية مكّنتنا من قياس أثر برامجنا بشكل دقيق."
                stars={5}
              />
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              جاهز للبدء؟ انضم إلى آلاف المستفيدين
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح مع EmpowerHub
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="text-primary font-bold px-8 py-6 text-base shadow-xl">
                <Link href="/register">
                  ابدأ مجاناً الآن
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/40 text-white hover:bg-white/10 px-8 py-6 text-base">
                <Link href="/try-roles">تجربة المنصة أولاً</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t bg-card">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Logo className="h-8 w-8" />
                <span className="font-bold text-lg gradient-text">EmpowerHub</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية في مكان واحد.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">روابط سريعة</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="#features" className="hover:text-primary transition-colors">الميزات</Link>
                <Link href="/market" className="hover:text-primary transition-colors">المتجر</Link>
                <Link href="/try-roles" className="hover:text-primary transition-colors">تجربة المنصة</Link>
                <Link href="/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">قانوني</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</Link>
                <Link href="#" className="hover:text-primary transition-colors">شروط الاستخدام</Link>
                <Link href="#" className="hover:text-primary transition-colors">تواصل معنا</Link>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">© 2024 EmpowerHub. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
