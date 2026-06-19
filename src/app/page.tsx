"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import {
  ArrowLeft, BookOpen, Users, Store, Building, GraduationCap,
  UserCheck, CheckCircle, TrendingUp, Award, Globe, ChevronDown,
  Star, BarChart3, Shield, Zap, MessageSquare, Phone, Mail
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorUser {
  id: string;
  displayName?: string;
  name?: string;
  bio?: string;
  description?: string;
  specializations?: string[];
}

interface Product {
  id: string;
  name?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  image?: string;
  whatsapp?: string;
  store?: { phone?: string };
}

interface LiveStats {
  totalUsers: number;
  beneficiaries: number;
  organizations: number;
  products: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

const ShimmerCard = () => (
  <Card className="border-0 shadow-md bg-card animate-pulse">
    <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
      <div className="h-16 w-16 rounded-full bg-muted" />
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="h-3 w-40 rounded bg-muted" />
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-16 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
    </CardContent>
  </Card>
);

const MentorCard = ({ mentor }: { mentor: MentorUser }) => {
  const name = mentor.displayName || mentor.name || 'بدون اسم';
  const bio = mentor.bio || mentor.description || '';
  const specializations = mentor.specializations || [];
  return (
    <Card className="card-hover border-0 shadow-md bg-card flex flex-col">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-3 flex-grow">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
          {name[0]}
        </div>
        <div>
          <h3 className="font-bold text-base">{name}</h3>
          {bio && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">{bio}</p>
          )}
        </div>
        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {specializations.slice(0, 3).map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">تواصل</Button>
      </CardFooter>
    </Card>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const name = product.name || 'منتج';
  const imageUrl = product.imageUrl || product.image || '';
  const whatsapp = product.whatsapp || product.store?.phone || '';
  const waLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}`
    : 'https://wa.me/';

  return (
    <Card className="card-hover border-0 shadow-md bg-card flex flex-col overflow-hidden">
      <div className="relative h-40 w-full bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Store className="h-10 w-10 opacity-30" />
          </div>
        )}
        {product.category && (
          <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs">
            {product.category}
          </Badge>
        )}
      </div>
      <CardContent className="pt-4 flex flex-col gap-1 flex-grow">
        <h3 className="font-bold text-sm line-clamp-2">{name}</h3>
        {product.price != null && (
          <p className="text-primary font-semibold text-sm">{product.price} ر.س</p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          asChild
          className="w-full text-white font-semibold"
          style={{ backgroundColor: '#25D366' }}
        >
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-4 w-4 ml-2" />
            تواصل عبر واتساب
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((image) => image.id === 'register-background');
  const db = useFirestore();
  const { toast } = useToast();

  const [stats, setStats] = useState<LiveStats>({ totalUsers: 0, beneficiaries: 0, organizations: 0, products: 0 });
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [coaches, setCoaches] = useState<MentorUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [publicStores, setPublicStores] = useState<{ id: string; name: string; logoUrl?: string; location?: string; beneficiaryName?: string }[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    if (!db) return;

    // Fetch live stats
    (async () => {
      try {
        const usersRef = collection(db, 'users');
        const [totalSnap, benefSnap, orgSnap] = await Promise.all([
          getCountFromServer(usersRef),
          getCountFromServer(query(usersRef, where('role', '==', 'beneficiary'))),
          getCountFromServer(query(usersRef, where('role', '==', 'organization'))),
        ]);
        const productsRef = collection(db, 'products');
        const prodSnap = await getCountFromServer(productsRef);
        setStats({
          totalUsers: totalSnap.data().count,
          beneficiaries: benefSnap.data().count,
          organizations: orgSnap.data().count,
          products: prodSnap.data().count,
        });
      } catch {
        // keep defaults on error
      }
    })();

    // Fetch mentors
    (async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'mentor'), limit(4));
        const snap = await getDocs(q);
        setMentors(snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorUser)));
      } catch {
        // keep empty
      } finally {
        setLoadingMentors(false);
      }
    })();

    // Fetch coaches
    (async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'coach'), limit(4));
        const snap = await getDocs(q);
        setCoaches(snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorUser)));
      } catch {
        // keep empty
      } finally {
        setLoadingCoaches(false);
      }
    })();

    // Fetch products
    (async () => {
      try {
        const q = query(collection(db, 'products'), limit(6));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch {
        // keep empty
      } finally {
        setLoadingProducts(false);
      }
    })();

    // Fetch public stores
    (async () => {
      try {
        const res = await fetch('/api/public/stores');
        if (res.ok) {
          const json = await res.json();
          setPublicStores(json.stores || []);
        }
      } catch {
        // keep empty
      } finally {
        setLoadingStores(false);
      }
    })();
  }, [db]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'شكراً لتواصلك! سنرد عليك قريباً.' });
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  const formatCount = (n: number) => (n > 0 ? n.toLocaleString('ar-SA') + '+' : '...');

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

        {/* Stats Section — live from Firestore */}
        <section id="stats" className="py-16 bg-card border-y">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard
                number={stats.beneficiaries > 0 ? formatCount(stats.beneficiaries) : '2,500+'}
                label="مستفيد نشط"
                icon={<Users className="h-6 w-6" />}
              />
              <StatCard number="150+" label="دورة تدريبية" icon={<BookOpen className="h-6 w-6" />} />
              <StatCard
                number={stats.totalUsers > 0 ? formatCount(stats.totalUsers) : '80+'}
                label="مرشد ومدرب"
                icon={<GraduationCap className="h-6 w-6" />}
              />
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

        {/* Featured Mentors Section */}
        <section id="mentors" className="py-16 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">مرشدون</Badge>
              <h2 className="text-3xl font-bold tracking-tight">مرشدون متميزون</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                تواصل مع نخبة من المرشدين المتخصصين الذين يساعدونك في رحلتك نحو النجاح.
              </p>
            </div>
            {loadingMentors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
              </div>
            ) : mentors.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mentors.map(m => <MentorCard key={m.id} mentor={m} />)}
              </div>
            )}
            <div className="text-center mt-10">
              <Button variant="outline" asChild>
                <Link href="/register?role=mentor">انضم كمرشد</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Trainers (Coaches) Section */}
        <section id="coaches" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">مدربون</Badge>
              <h2 className="text-3xl font-bold tracking-tight">مدربون متميزون</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                تعلم من أفضل المدربين في مختلف المجالات وطور مهاراتك معهم.
              </p>
            </div>
            {loadingCoaches ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
              </div>
            ) : coaches.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {coaches.map(c => <MentorCard key={c.id} mentor={c} />)}
              </div>
            )}
            <div className="text-center mt-10">
              <Button variant="outline" asChild>
                <Link href="/register?role=coach">انضم كمدرب</Link>
              </Button>
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

        {/* Marketplace Preview Section */}
        <section id="marketplace" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">المتجر</Badge>
              <h2 className="text-3xl font-bold tracking-tight">منتجات من مجتمعنا</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                اكتشف منتجات متنوعة من رواد الأعمال في منصتنا وادعم مشاريعهم.
              </p>
            </div>
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-md bg-card animate-pulse overflow-hidden">
                    <div className="h-40 bg-muted w-full" />
                    <CardContent className="pt-4 flex flex-col gap-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/3 rounded bg-muted" />
                    </CardContent>
                    <CardFooter>
                      <div className="h-9 w-full rounded bg-muted" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Store className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">لا توجد منتجات بعد. كن أول من يضيف منتجه!</p>
                <Button asChild className="mt-6">
                  <Link href="/register">ابدأ الآن</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            <div className="text-center mt-10">
              <Button asChild size="lg">
                <Link href="/market">
                  تصفح جميع المنتجات
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stores Section */}
        <section id="stores" className="py-16 md:py-24 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">المتاجر</Badge>
              <h2 className="text-3xl font-bold tracking-tight">متاجر رواد الأعمال</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                اكتشف متاجر المستفيدين في مجتمعنا وادعم مشاريعهم.
              </p>
            </div>
            {loadingStores ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-md animate-pulse">
                    <CardContent className="pt-6 flex flex-col gap-2">
                      <div className="h-5 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : publicStores.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد متاجر بعد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicStores.map(store => (
                  <Card key={store.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6 flex flex-col gap-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base">{store.name}</h3>
                      </div>
                      {store.beneficiaryName && (
                        <p className="text-sm text-muted-foreground">البائع: {store.beneficiaryName}</p>
                      )}
                      {store.location && (
                        <p className="text-sm text-muted-foreground">الموقع: {store.location}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">تواصل</Badge>
              <h2 className="text-3xl font-bold tracking-tight">تواصل معنا</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                نحن هنا للإجابة على استفساراتك ومساعدتك في كل خطوة.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Contact info */}
              <div className="flex flex-col gap-4">
                <Card className="border-0 shadow-md bg-card">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">الهاتف</p>
                      <p className="text-muted-foreground text-sm" dir="ltr">+966 XX XXX XXXX</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-card">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">البريد الإلكتروني</p>
                      <p className="text-muted-foreground text-sm" dir="ltr">info@empowerhub.com</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-card">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#25D366' }}>
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">واتساب</p>
                      <p className="text-muted-foreground text-sm mb-3" dir="ltr">+966 XX XXX XXXX</p>
                      <Button
                        asChild
                        className="text-white text-sm px-4 py-2 h-auto"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <a href="https://wa.me/966XXXXXXXXX" target="_blank" rel="noopener noreferrer">
                          <MessageSquare className="h-4 w-4 ml-1" />
                          تواصل عبر واتساب
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact form */}
              <Card className="border-0 shadow-md bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">أرسل لنا رسالة</CardTitle>
                  <CardDescription>سنرد عليك في أقرب وقت ممكن</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">الاسم</label>
                      <Input
                        placeholder="اسمك الكريم"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">رسالتك</label>
                      <Textarea
                        placeholder="اكتب رسالتك هنا..."
                        rows={5}
                        value={contactMessage}
                        onChange={e => setContactMessage(e.target.value)}
                        required
                        className="resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full mt-2" size="lg">
                      <Mail className="h-4 w-4 ml-2" />
                      إرسال الرسالة
                    </Button>
                  </form>
                </CardContent>
              </Card>
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
                <Link href="#contact" className="hover:text-primary transition-colors">تواصل معنا</Link>
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
