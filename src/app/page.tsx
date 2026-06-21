"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/logo';
import {
  ArrowLeft, BookOpen, Store, GraduationCap, CheckCircle,
  Star, MessageSquare, Phone, Mail, Globe, Menu, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderDialog } from '@/components/order-dialog';
import { SessionBookingDialog } from '@/components/session-booking-dialog';
import { CourseEnrollDialog } from '@/components/course-enroll-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorUser {
  id: string;
  displayName?: string;
  name?: string;
  bio?: string;
  description?: string;
  specializations?: string[];
  sessionPrice?: number | null;
  whatsapp?: string;
  linkedin?: string;
  email?: string;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  price: number | null;
  coverImageUrl: string;
  duration: string;
  coachName: string;
  enrollmentCount: number;
}

interface Product {
  id: string;
  name?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  image?: string;
  whatsapp?: string;
  storeId?: string;
  storeName?: string;
  organizationId?: string;
  store?: { phone?: string };
}

interface SiteConfig {
  siteName: string;
  tagline: string;
  primaryColor?: string;
  logoUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; backgroundImage: string };
  stats: { label: string; value: string; icon: string }[];
  features: { title: string; description: string; icon: string }[];
  opportunities?: { title: string; description: string; icon: string; badge?: string; color?: string; link?: string }[];
  howItWorks: { step: string; title: string; desc: string; icon: string }[];
  testimonials: { name: string; role: string; text: string; stars: number }[];
  blogPosts?: { title: string; excerpt: string; category: string; imageUrl?: string; link?: string }[];
  contact: { phone: string; whatsapp: string; whatsappLink: string; email: string };
  ctaBanner: { title: string; subtitle: string; primaryText: string; secondaryText: string };
  roles: { title: string; description: string; icon: string; badge: string; link: string }[];
  sections: {
    showStats: boolean; showFeatures: boolean; showOpportunities: boolean; showHowItWorks: boolean;
    showRoles: boolean; showMentors: boolean; showCoaches: boolean; showCourses: boolean; showBlog: boolean;
    showTestimonials: boolean; showProducts: boolean; showStores: boolean; showContact: boolean; showCTA: boolean;
  };
  footer: { description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string; copyright: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ExpertCard = ({
  expert, role, onBook,
}: { expert: MentorUser; role: 'mentor' | 'coach'; onBook?: () => void }) => {
  const name = expert.displayName || expert.name || 'بدون اسم';
  const bio = expert.bio || expert.description || '';
  const specializations = Array.isArray(expert.specializations) ? expert.specializations : [];
  const hasPrice = expert.sessionPrice != null && expert.sessionPrice > 0;
  const accent = role === 'mentor' ? 'bg-primary/10 text-primary' : 'bg-sky-500/10 text-sky-600';
  return (
    <div className="group p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full ${accent} flex items-center justify-center font-bold text-sm shrink-0`}>
          {name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{name}</p>
          {hasPrice && <p className="text-xs text-muted-foreground tabular-nums">{expert.sessionPrice} د.أ / جلسة</p>}
        </div>
      </div>
      {bio && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-grow">{bio}</p>}
      {specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {specializations.slice(0, 2).map((s, i) => (
            <span key={i} className="text-[10px] font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">{s}</span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5 mt-auto pt-1">
        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
          <Link href={`/${role === 'mentor' ? 'mentors' : 'coaches'}/${expert.id}`}>الملف</Link>
        </Button>
        {hasPrice && (
          <Button size="sm" className="flex-1 text-xs h-8" onClick={onBook}>احجز</Button>
        )}
      </div>
    </div>
  );
};

const CourseCard = ({ course, onEnroll }: { course: CourseItem; onEnroll?: (c: CourseItem) => void }) => (
  <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">
    <div className="relative h-36 bg-muted overflow-hidden">
      {course.coverImageUrl ? (
        <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="h-full flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/20" />
        </div>
      )}
      {course.price != null && (
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full px-2.5 py-0.5 border border-border/50">
          {course.price === 0 ? 'مجاني' : `${course.price} د.أ`}
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col gap-1 flex-grow">
      <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{course.title}</h3>
      {course.coachName && <p className="text-xs text-muted-foreground">{course.coachName}</p>}
    </div>
    <div className="px-4 pb-4 flex gap-2">
      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
        <Link href={`/courses/${course.id}`}>تفاصيل</Link>
      </Button>
      <Button size="sm" className="flex-1 text-xs h-8" onClick={() => onEnroll?.(course)}>
        {course.price === 0 || course.price === null ? 'اشترك مجاناً' : 'اشترك الآن'}
      </Button>
    </div>
  </div>
);

const ProductCard = ({ product, onOrder }: { product: Product; onOrder: (p: Product) => void }) => {
  const name = product.name || 'منتج';
  const imageUrl = product.imageUrl || product.image || '';
  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">
      <div className="relative h-40 bg-muted overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Store className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}
        {product.category && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full px-2.5 py-0.5 border border-border/50">
            {product.category}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-grow">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{name}</h3>
        {product.price != null && (
          <p className="text-primary font-bold text-sm">{product.price} د.أ</p>
        )}
      </div>
      <div className="px-4 pb-4">
        <Button className="w-full h-9 text-sm" onClick={() => onOrder(product)}>اطلب الآن</Button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [coaches, setCoaches] = useState<MentorUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [publicStores, setPublicStores] = useState<{ id: string; name: string; logoUrl?: string; location?: string; beneficiaryName?: string }[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [bookingHost, setBookingHost] = useState<MentorUser | null>(null);
  const [bookingRole, setBookingRole] = useState<'mentor' | 'coach'>('mentor');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    fetch('/api/public/site-config', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.config) setSiteConfig(d.config);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const hex = siteConfig?.primaryColor?.replace(/^#/, '');
    if (!hex || hex.length !== 6) return;
    let r = parseInt(hex.slice(0, 2), 16) / 255;
    let g = parseInt(hex.slice(2, 4), 16) / 255;
    let b = parseInt(hex.slice(4, 6), 16) / 255;
    const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
    let h = 0, s = 0, l = (cmax + cmin) / 2;
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - cmax - cmin) : delta / (cmax + cmin);
      if (cmax === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      else if (cmax === g) h = ((b - r) / delta + 2) * 60;
      else h = ((r - g) / delta + 4) * 60;
    }
    document.documentElement.style.setProperty('--primary', `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
  }, [siteConfig?.primaryColor]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/mentors');
        if (res.ok) {
          const json = await res.json();
          setMentors(json.mentors || []);
          setCoaches(json.coaches || []);
        }
      } catch {}
      finally {
        setLoadingMentors(false);
        setLoadingCoaches(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/stores');
        if (res.ok) {
          const json = await res.json();
          setProducts((json.products || []) as Product[]);
          setPublicStores(json.stores || []);
        }
      } catch {}
      finally {
        setLoadingProducts(false);
        setLoadingStores(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetch('/api/public/courses').then(r => r.json()).then(d => {
      setCourses(d.courses || []);
    }).catch(() => {}).finally(() => setLoadingCourses(false));
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'شكراً لتواصلك! سنرد عليك قريباً.' });
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  const cfg = siteConfig;
  const sections = {
    showStats: true, showFeatures: true, showOpportunities: true, showHowItWorks: true,
    showRoles: true, showMentors: true, showCoaches: true, showCourses: true, showBlog: true,
    showTestimonials: true, showProducts: true, showStores: true, showContact: true, showCTA: true,
    ...(cfg?.sections ?? {}),
  };

  const heroTitle = cfg?.hero?.title || 'بوابتك للتمكين والنجاح';
  const heroSubtitle = cfg?.hero?.subtitle || 'منصة متكاملة تجمع بين التدريب المتخصص، الإرشاد الشخصي، والتجارة الإلكترونية لمساعدتك على بناء مستقبلك.';
  const heroCta = cfg?.hero?.ctaText || 'ابدأ رحلتك مجاناً';
  const heroCtaSecondary = cfg?.hero?.ctaSecondaryText || 'كيف تعمل المنصة';

  const statsData = cfg?.stats?.length ? cfg.stats : [
    { label: 'مستفيد نشط', value: '2,500+', icon: 'Users' },
    { label: 'دورة تدريبية', value: '150+', icon: 'BookOpen' },
    { label: 'مرشد ومدرب', value: '80+', icon: 'GraduationCap' },
    { label: 'نسبة الرضا', value: '95%', icon: 'Award' },
  ];

  const featuresData = cfg?.features?.length ? cfg.features : [
    { title: 'تقارير وتحليلات', description: 'تابع تقدمك ونموك بتقارير مرئية شاملة تساعدك على اتخاذ قرارات أفضل.', icon: 'BarChart3' },
    { title: 'توصيات بالذكاء الاصطناعي', description: 'احصل على توصيات مخصصة لمحتوى التدريب والموارد المناسبة لأهدافك.', icon: 'Zap' },
    { title: 'أمان وموثوقية', description: 'بياناتك محمية بأحدث تقنيات الأمان. نضمن لك تجربة موثوقة وآمنة في كل وقت.', icon: 'Shield' },
  ];

  const howItWorksData = cfg?.howItWorks?.length ? cfg.howItWorks : [
    { step: '١', title: 'أنشئ حسابك', desc: 'سجّل مجاناً واختر دورك على المنصة سواء كمستفيد أو مرشد أو منظمة.', icon: 'UserCheck' },
    { step: '٢', title: 'استكشف المحتوى', desc: 'تصفح الدورات التدريبية، تواصل مع المرشدين، وابنِ مهاراتك.', icon: 'Globe' },
    { step: '٣', title: 'حقق أهدافك', desc: 'أطلق متجرك، احصل على شهاداتك، وابنِ مستقبلاً أفضل.', icon: 'TrendingUp' },
  ];

  const testimonialsData = cfg?.testimonials?.length ? cfg.testimonials : [
    { name: 'سارة أحمد', role: 'مستفيدة - رائدة أعمال', text: 'بفضل EmpowerHub، تمكنت من إطلاق متجري الإلكتروني وتحقيق أول ألف ريال خلال شهرين فقط. الدعم والتدريب كانا استثنائيين!', stars: 5 },
    { name: 'محمد الخالد', role: 'مدرب - خبير تسويق رقمي', text: 'المنصة أتاحت لي الفرصة للوصول إلى مئات المستفيدين ومشاركتهم خبرتي. الأدوات سهلة الاستخدام والدعم الفني ممتاز.', stars: 5 },
    { name: 'منظمة بناء المستقبل', role: 'منظمة غير ربحية', text: 'ساعدتنا المنصة في إدارة 200 مستفيد بكل احترافية. التقارير التفصيلية مكّنتنا من قياس أثر برامجنا بشكل دقيق.', stars: 5 },
  ];

  const rolesData = cfg?.roles?.length ? cfg.roles : [
    { title: 'كمستفيد', description: 'طور مهاراتك، ابنِ مشروعك، وحقق استقلاليتك المالية من خلال برامج تمكين متكاملة.', icon: 'UserCheck', badge: 'الأكثر شعبية', link: '/register?role=beneficiary' },
    { title: 'كمدرب', description: 'شارك خبراتك ومعرفتك من خلال إنشاء وتقديم دورات تدريبية متخصصة.', icon: 'GraduationCap', badge: '', link: '/register?role=coach' },
    { title: 'كمرشد', description: 'ساهم في نجاح الآخرين من خلال تقديم الإرشاد والتوجيه الشخصي.', icon: 'Users', badge: '', link: '/register?role=mentor' },
    { title: 'كمنظمة', description: 'أدر برامج التمكين الخاصة بك، وتابع تقدم المستفيدين بفعالية.', icon: 'Building', badge: '', link: '/register?role=organization' },
  ];

  const ctaBanner = cfg?.ctaBanner ?? {
    title: 'جاهز للبدء؟ انضم إلى آلاف المستفيدين',
    subtitle: 'سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح مع EmpowerHub',
    primaryText: 'ابدأ مجاناً الآن',
    secondaryText: 'تجربة المنصة أولاً',
  };

  const opportunitiesData = cfg?.opportunities?.length ? cfg.opportunities : [
    { title: 'برامج التدريب المهني', description: 'دورات متخصصة في التقنية، الأعمال والتصميم لتزويدك بمهارات سوق العمل الحديث.', icon: 'GraduationCap', badge: 'متاح الآن', color: 'bg-primary', link: '/register' },
    { title: 'الإرشاد الفردي', description: 'جلسات مخصصة مع مرشدين خبراء لمساعدتك في رسم مسارك المهني وتحقيق أهدافك.', icon: 'Users', badge: 'مجاني', color: 'bg-sky-500', link: '/register' },
    { title: 'ريادة الأعمال', description: 'ابدأ مشروعك، أطلق متجرك الإلكتروني، وابنِ مصدر دخل مستدام مع دعم متكامل.', icon: 'Store', badge: 'جديد', color: 'bg-amber-500', link: '/register' },
  ];

  const blogPostsData = cfg?.blogPosts?.length ? cfg.blogPosts : [
    { title: 'كيف تبني مسارك المهني في عالم رقمي متسارع', excerpt: 'تعرف على أهم المهارات المطلوبة في سوق العمل الحديث وكيف تكتسبها.', category: 'مسار مهني', imageUrl: '' },
    { title: '٥ خطوات لإطلاق متجرك الإلكتروني بنجاح', excerpt: 'دليل عملي للمبتدئين في التجارة الإلكترونية من الفكرة حتى أول عملية بيع ناجحة.', category: 'ريادة أعمال', imageUrl: '' },
    { title: 'قصص نجاح: التدريب الذي غيّر مساراتنا', excerpt: 'قصص ملهمة لأشخاص حققوا أهدافهم بفضل التدريب الصحيح والإرشاد المتخصص.', category: 'قصص نجاح', imageUrl: '' },
  ];

  const contactInfo = cfg?.contact ?? {
    phone: '+966 XX XXX XXXX', whatsapp: '+966 XX XXX XXXX',
    whatsappLink: 'https://wa.me/966XXXXXXXXX', email: 'info@empowerhub.com',
  };
  const footerData = cfg?.footer ?? {
    description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية في مكان واحد.',
    email: 'info@empowerhub.com', phone: '', twitter: '', linkedin: '', instagram: '',
    copyright: '© 2024 EmpowerHub. جميع الحقوق محفوظة.',
  };

  const allModules = [
    ...(sections.showOpportunities ? opportunitiesData : []),
    ...(sections.showFeatures ? featuresData : []),
  ].slice(0, 6);

  const logoSrc = cfg?.logoUrl || '';

  const navLinks = [
    { href: '#how-it-works', label: 'كيف تعمل' },
    { href: '#modules', label: 'الخدمات' },
    { href: '#experts', label: 'الخبراء' },
    { href: '/market', label: 'المتجر' },
  ];

  return (
    <div className="bg-background text-foreground" dir="rtl">

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/60 relative">
        <div className="container flex h-14 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-sm shrink-0">
            {logoSrc
              ? <img src={logoSrc} alt="logo" className="h-7 w-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <Logo className="h-7 w-7" />}
            <span className="text-foreground">{cfg?.siteName || 'EmpowerHub'}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="flex-1 hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2 mr-auto">
            <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">ابدأ مجاناً</Link>
            </Button>
          </div>

          {/* Mobile: register CTA + hamburger */}
          <div className="flex items-center gap-2 mr-auto md:hidden">
            <Button size="sm" asChild className="text-xs px-3 h-8">
              <Link href="/register">ابدأ</Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full right-0 left-0 bg-background/98 backdrop-blur-md border-b border-border/60 shadow-lg z-50">
            <nav className="container py-3 flex flex-col gap-0.5" dir="rtl">
              {navLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="h-px bg-border my-2 mx-3" />
              <Link href="/login" className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
                تسجيل الدخول
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[80vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          {/* Gradient blob */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] md:w-[800px] md:h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 container text-center py-16 sm:py-20 md:py-28">
            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground border border-border/80 rounded-full px-3.5 py-1.5 mb-6 sm:mb-8 bg-card/60 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="truncate">{cfg?.tagline || 'منصة التمكين الرقمي الشاملة'}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-foreground leading-[1.1] mb-5 sm:mb-6">
              {heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl sm:max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
              {heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10 sm:mb-14">
              <Button size="lg" asChild className="h-12 px-7 text-base font-semibold shadow-sm w-full sm:w-auto">
                <Link href="/register">
                  {heroCta}
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-7 text-base w-full sm:w-auto">
                <Link href="#how-it-works">{heroCtaSecondary}</Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              {[
                'مجاني تماماً للبدء',
                'لا يتطلب بطاقة ائتمان',
                'دعم باللغة العربية',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Impact Strip ────────────────────────────────────────────────────── */}
        {sections.showStats && (
          <section className="border-y border-border">
            {/* gap-px + bg-border creates 1px dividers in all directions regardless of RTL */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {statsData.map((s, i) => (
                <div key={i} className="bg-card text-center py-8 sm:py-10 px-4 sm:px-6">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tabular-nums tracking-tight mb-1.5">
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── How It Works ────────────────────────────────────────────────────── */}
        {sections.showHowItWorks && howItWorksData.length > 0 && (
          <section id="how-it-works" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="max-w-xl mb-12 sm:mb-16">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">كيف تعمل المنصة</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  من الفكرة إلى النجاح في خطوات واضحة
                </h2>
              </div>

              <div className="space-y-12 sm:space-y-16">
                {howItWorksData.map((item, i) => (
                  <div key={i} className="flex gap-5 sm:gap-8 md:gap-12 items-start">
                    {/* Ghost number */}
                    <div className="shrink-0 w-14 sm:w-20 md:w-28 flex items-start justify-center pt-1">
                      <span className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-foreground/8 leading-none select-none tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1 sm:pt-2">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Modules ─────────────────────────────────────────────────────────── */}
        {allModules.length > 0 && (
          <section id="modules" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="max-w-xl mb-10 sm:mb-14">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">ما تقدمه المنصة</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  كل ما تحتاجه لبناء مستقبلك في مكان واحد
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {allModules.map((m, i) => (
                  <div key={i} className="group p-5 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="text-xs font-bold text-primary/30 tabular-nums mb-3 sm:mb-4 tracking-widest">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Roles / Join ────────────────────────────────────────────────────── */}
        {sections.showRoles && rolesData.length > 0 && (
          <section id="roles" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="max-w-xl mb-10 sm:mb-14">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">انضم إلينا</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  ما دورك في منظومة التمكين؟
                </h2>
                <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                  سواء كنت تسعى للتعلم، أو تملك خبرة تشاركها، أو تقود منظمة — هناك مكان لك هنا.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesData.map((role, i) => (
                  <Link
                    key={i}
                    href={role.link || '/register'}
                    className="group p-5 rounded-2xl border border-border hover:border-primary/40 bg-card transition-all flex flex-col gap-3"
                  >
                    <div className="text-xs font-bold text-primary/30 tabular-nums tracking-widest">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1.5">
                        {role.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-auto">
                      ابدأ الآن <ArrowLeft className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Expert Preview ──────────────────────────────────────────────────── */}
        {(sections.showMentors || sections.showCoaches) && (
          <section id="experts" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              {/* Section header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-14">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">فريق الخبراء</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">تعلم من الأفضل</h2>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {sections.showMentors && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/register?role=mentor">انضم كمرشد</Link>
                    </Button>
                  )}
                  {sections.showCoaches && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/register?role=coach">انضم كمدرب</Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Mentors */}
              {sections.showMentors && (
                <div className="mb-10 sm:mb-12">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 sm:mb-5">المرشدون</p>
                  {loadingMentors ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {[...Array(4)].map((_, i) => <div key={i} className="h-48 sm:h-52 rounded-2xl bg-muted animate-pulse" />)}
                    </div>
                  ) : mentors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {mentors.map(m => (
                        <ExpertCard key={m.id} expert={m} role="mentor" onBook={() => { setBookingHost(m); setBookingRole('mentor'); }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">لا يوجد مرشدون بعد.</p>
                  )}
                </div>
              )}

              {/* Coaches */}
              {sections.showCoaches && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 sm:mb-5">المدربون</p>
                  {loadingCoaches ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {[...Array(4)].map((_, i) => <div key={i} className="h-48 sm:h-52 rounded-2xl bg-muted animate-pulse" />)}
                    </div>
                  ) : coaches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {coaches.map(c => (
                        <ExpertCard key={c.id} expert={c} role="coach" onBook={() => { setBookingHost(c); setBookingRole('coach'); }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">لا يوجد مدربون بعد.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Courses ─────────────────────────────────────────────────────────── */}
        {sections.showCourses && (
          <section id="courses" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="max-w-xl mb-10 sm:mb-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">الدورات التدريبية</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  طور مهاراتك مع دوراتنا
                </h2>
              </div>
              {loadingCourses ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-56 sm:h-60 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">لا توجد دورات بعد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {courses.map(c => <CourseCard key={c.id} course={c} onEnroll={setSelectedCourse} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Marketplace Preview ─────────────────────────────────────────────── */}
        {sections.showProducts && (
          <section id="marketplace" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-12">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">متجر المجتمع</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">منتجات من مجتمعنا</h2>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
                  <Link href="/market">
                    تصفح جميع المنتجات
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-56 sm:h-64 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm mb-4">لا توجد منتجات بعد. كن أول من يضيف منتجه!</p>
                  <Button asChild size="sm"><Link href="/register">ابدأ الآن</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {products.map(p => <ProductCard key={p.id} product={p} onOrder={setSelectedProduct} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Stores ──────────────────────────────────────────────────────────── */}
        {sections.showStores && publicStores.length > 0 && (
          <section id="stores" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="max-w-xl mb-10 sm:mb-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">رواد الأعمال</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">متاجر مجتمعنا</h2>
              </div>
              {loadingStores ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {publicStores.map(store => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.id}`}
                      className="group p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{store.name}</p>
                          {store.beneficiaryName && (
                            <p className="text-xs text-muted-foreground truncate">{store.beneficiaryName}</p>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Testimonials ────────────────────────────────────────────────────── */}
        {sections.showTestimonials && testimonialsData.length > 0 && (
          <section className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="max-w-xl mb-12 sm:mb-16">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">قصص النجاح</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">ماذا يقول مجتمعنا</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
                {testimonialsData.map((t, i) => (
                  <div key={i} className="flex flex-col gap-4 sm:gap-5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(5, Math.max(1, t.stars)) }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <blockquote className="text-base text-foreground leading-relaxed font-medium flex-grow">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Blog ────────────────────────────────────────────────────────────── */}
        {sections.showBlog && blogPostsData.length > 0 && (
          <section id="blog" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="max-w-xl mb-10 sm:mb-14">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">الموارد والمقالات</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  تعلم وتطور مع محتوانا
                </h2>
              </div>
              <div className="divide-y divide-border">
                {blogPostsData.map((post, i) => (
                  <div key={i} className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest sm:w-28 shrink-0">{post.category}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-0.5">{post.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 leading-relaxed">{post.excerpt}</p>
                    </div>
                    {post.link ? (
                      <Link href={post.link} className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0 self-start sm:self-auto">
                        اقرأ المزيد <ArrowLeft className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">قريباً</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Contact ─────────────────────────────────────────────────────────── */}
        {sections.showContact && (
          <section id="contact" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">تواصل معنا</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                    كيف يمكننا مساعدتك؟
                  </h2>
                  <p className="text-muted-foreground mb-8 sm:mb-10 leading-relaxed text-sm sm:text-base">
                    نحن هنا للإجابة على استفساراتك ومساعدتك في كل خطوة.
                  </p>
                  <div className="space-y-4 sm:space-y-5">
                    {contactInfo.phone && (
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">الهاتف</p>
                          <p className="text-sm font-semibold text-foreground" dir="ltr">{contactInfo.phone}</p>
                        </div>
                      </div>
                    )}
                    {contactInfo.email && (
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">البريد الإلكتروني</p>
                          <p className="text-sm font-semibold text-foreground" dir="ltr">{contactInfo.email}</p>
                        </div>
                      </div>
                    )}
                    {contactInfo.whatsapp && (
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#25D366' }}>
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">واتساب</p>
                          <a
                            href={contactInfo.whatsappLink || `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                            dir="ltr"
                          >
                            {contactInfo.whatsapp}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card">
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-5">أرسل لنا رسالة</h3>
                  <form onSubmit={handleContactSubmit} className="flex flex-col gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">الاسم</label>
                      <Input placeholder="اسمك الكريم" value={contactName} onChange={e => setContactName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">البريد الإلكتروني</label>
                      <Input type="email" placeholder="example@email.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required dir="ltr" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">رسالتك</label>
                      <Textarea placeholder="اكتب رسالتك هنا..." rows={4} value={contactMessage} onChange={e => setContactMessage(e.target.value)} required className="resize-none" />
                    </div>
                    <Button type="submit" className="w-full mt-1">
                      <Mail className="h-4 w-4 ml-2" />
                      إرسال الرسالة
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA Block ───────────────────────────────────────────────────────── */}
        {sections.showCTA && (
          <section className="py-16 sm:py-20 md:py-28 bg-foreground text-background">
            <div className="container text-center">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight">
                {ctaBanner.title}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-background/60 mb-7 sm:mb-9 max-w-xl mx-auto leading-relaxed">
                {ctaBanner.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button size="lg" variant="secondary" asChild className="h-12 px-7 text-base font-semibold text-foreground w-full sm:w-auto">
                  <Link href="/register">
                    {ctaBanner.primaryText}
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-7 text-base border-background/30 text-background hover:bg-background/10 w-full sm:w-auto">
                  <Link href="/try-roles">{ctaBanner.secondaryText}</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <OrderDialog
        product={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name || '',
          price: selectedProduct.price ?? 0,
          imageUrl: selectedProduct.imageUrl || selectedProduct.image || '',
          storeId: selectedProduct.storeId || '',
          storeName: selectedProduct.storeName || '',
          organizationId: selectedProduct.organizationId || '',
        } as any : null}
        isOpen={!!selectedProduct}
        onOpenChange={open => { if (!open) setSelectedProduct(null); }}
      />

      {selectedCourse && (
        <CourseEnrollDialog
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
          coursePrice={selectedCourse.price}
          isOpen={!!selectedCourse}
          onOpenChange={open => { if (!open) setSelectedCourse(null); }}
        />
      )}

      {bookingHost && (
        <SessionBookingDialog
          isOpen={!!bookingHost}
          onOpenChange={open => { if (!open) setBookingHost(null); }}
          hostId={bookingHost.id}
          hostName={bookingHost.displayName || bookingHost.name || ''}
          hostRole={bookingRole}
          sessionPrice={bookingHost.sessionPrice ?? 0}
        />
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-12 sm:py-14 border-t bg-card">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-10">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                {logoSrc
                  ? <img src={logoSrc} alt="logo" className="h-6 w-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <Logo className="h-6 w-6" />}
                <span className="font-bold text-base text-foreground">{cfg?.siteName || 'EmpowerHub'}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {footerData.description}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">روابط سريعة</h4>
              <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link href="#how-it-works" className="hover:text-foreground transition-colors">كيف تعمل</Link>
                <Link href="#modules" className="hover:text-foreground transition-colors">الخدمات</Link>
                <Link href="/market" className="hover:text-foreground transition-colors">المتجر</Link>
                <Link href="/try-roles" className="hover:text-foreground transition-colors">تجربة المنصة</Link>
                <Link href="/login" className="hover:text-foreground transition-colors">تسجيل الدخول</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">قانوني</h4>
              <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link>
                <Link href="#" className="hover:text-foreground transition-colors">شروط الاستخدام</Link>
                <Link href="#contact" className="hover:text-foreground transition-colors">تواصل معنا</Link>
              </div>
            </div>
          </div>
          <div className="border-t pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              {footerData.copyright || '© 2024 EmpowerHub. جميع الحقوق محفوظة.'}
            </p>
            <div className="flex items-center gap-4">
              {footerData.twitter && (
                <a href={footerData.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">تويتر</a>
              )}
              {footerData.linkedin && (
                <a href={footerData.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>
              )}
              {footerData.instagram && (
                <a href={footerData.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>مدعوم بالذكاء الاصطناعي</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
