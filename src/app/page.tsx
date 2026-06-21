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
  Star, BarChart3, Shield, Zap, MessageSquare, Phone, Mail, Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { OrderDialog } from '@/components/order-dialog';
import { SessionBookingDialog } from '@/components/session-booking-dialog';

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

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  Store: <Store className="h-6 w-6" />,
  BarChart3: <BarChart3 className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
  UserCheck: <UserCheck className="h-6 w-6" />,
  Building: <Building className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  MessageSquare: <MessageSquare className="h-6 w-6" />,
};

const featureColors = ['bg-primary', 'bg-sky-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-600'];

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
        {Array.from({ length: Math.max(1, Math.min(5, stars)) }).map((_, i) => (
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

const MentorCard = ({ mentor, onBook }: { mentor: MentorUser; onBook?: (m: MentorUser) => void }) => {
  const name = mentor.displayName || mentor.name || 'بدون اسم';
  const bio = mentor.bio || mentor.description || '';
  const specializations = Array.isArray(mentor.specializations) ? mentor.specializations : [];
  const hasPrice = mentor.sessionPrice != null && mentor.sessionPrice > 0;
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
        {hasPrice && (
          <p className="text-primary font-bold text-sm">{mentor.sessionPrice} د.أ / جلسة</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1 text-xs" asChild>
          <Link href={`/mentors/${mentor.id}`}>الملف الشخصي</Link>
        </Button>
        {hasPrice && (
          <Button className="flex-1 text-xs" onClick={() => onBook?.(mentor)}>احجز جلسة</Button>
        )}
      </CardFooter>
    </Card>
  );
};

const CoachCard = ({ coach, onBook }: { coach: MentorUser; onBook?: (c: MentorUser) => void }) => {
  const name = coach.displayName || coach.name || 'بدون اسم';
  const bio = coach.bio || coach.description || '';
  const specializations = Array.isArray(coach.specializations) ? coach.specializations : [];
  const hasPrice = coach.sessionPrice != null && coach.sessionPrice > 0;
  return (
    <Card className="card-hover border-0 shadow-md bg-card flex flex-col">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-3 flex-grow">
        <div className="h-16 w-16 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-600 font-bold text-2xl">
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
        {hasPrice && (
          <p className="text-sky-600 font-bold text-sm">{coach.sessionPrice} د.أ / جلسة</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1 text-xs" asChild>
          <Link href={`/coaches/${coach.id}`}>الملف الشخصي</Link>
        </Button>
        {hasPrice && (
          <Button className="flex-1 text-xs" onClick={() => onBook?.(coach)}>احجز جلسة</Button>
        )}
      </CardFooter>
    </Card>
  );
};

const CourseCard = ({ course }: { course: CourseItem }) => (
  <Card className="card-hover border-0 shadow-md bg-card flex flex-col overflow-hidden">
    <div className="relative h-36 bg-muted">
      {course.coverImageUrl ? (
        <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
      ) : (
        <div className="h-full flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
      {course.price != null && (
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
          {course.price === 0 ? 'مجاني' : `${course.price} د.أ`}
        </Badge>
      )}
    </div>
    <CardContent className="pt-4 flex-grow">
      <h3 className="font-bold text-sm line-clamp-2 mb-1">{course.title}</h3>
      {course.coachName && (
        <p className="text-xs text-muted-foreground mb-2">بقلم {course.coachName}</p>
      )}
      {course.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
      )}
    </CardContent>
    <CardFooter className="pt-0">
      <Button variant="outline" className="w-full text-xs" asChild>
        <Link href={`/courses/${course.id}`}>
          تفاصيل الدورة
          <ArrowLeft className="mr-2 h-3 w-3" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const ProductCard = ({ product, onOrder }: { product: Product; onOrder: (p: Product) => void }) => {
  const name = product.name || 'منتج';
  const imageUrl = product.imageUrl || product.image || '';
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
          <p className="text-primary font-semibold text-sm">{product.price} د.أ</p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button className="w-full" onClick={() => onOrder(product)}>
          <Store className="h-4 w-4 ml-2" />
          اطلب الآن
        </Button>
      </CardFooter>
    </Card>
  );
};

const OpportunityCard = ({ icon, title, description, badge, color, link }: {
  icon: React.ReactNode, title: string, description: string, badge?: string, color: string, link?: string
}) => (
  <Card className="card-hover border-0 shadow-md bg-card group overflow-hidden flex flex-col">
    <div className={`h-1 w-full ${color}`} />
    <CardContent className="pt-5 pb-6 flex flex-col flex-grow">
      <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <span className="text-white">{icon}</span>
      </div>
      {badge && (
        <Badge className="self-start mb-3 text-xs bg-primary/10 text-primary border-primary/20">{badge}</Badge>
      )}
      <h3 className="font-bold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{description}</p>
      {link && (
        <Link href={link} className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-4 hover:underline">
          اكتشف المزيد <ArrowLeft className="h-3 w-3" />
        </Link>
      )}
    </CardContent>
  </Card>
);

const BlogCard = ({ title, excerpt, category, imageUrl, link }: {
  title: string, excerpt: string, category: string, imageUrl?: string, link?: string
}) => (
  <Card className="card-hover border-0 shadow-md bg-card overflow-hidden flex flex-col group">
    <div className="h-36 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center relative">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 absolute inset-0" />
      ) : (
        <BookOpen className="h-10 w-10 text-primary/25" />
      )}
    </div>
    <CardContent className="pt-4 pb-5 flex flex-col flex-grow">
      <Badge variant="secondary" className="self-start mb-3 text-xs">{category}</Badge>
      <h3 className="font-bold text-sm mb-2 line-clamp-2 leading-snug">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-grow">{excerpt}</p>
      {link ? (
        <Link href={link} className="inline-flex items-center gap-1 text-primary text-xs font-medium mt-4 hover:underline">
          اقرأ المزيد <ArrowLeft className="h-3 w-3" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs mt-4">قريباً</span>
      )}
    </CardContent>
  </Card>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((image) => image.id === 'register-background');
  const db = useFirestore();
  const { toast } = useToast();

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
  const [bookingHost, setBookingHost] = useState<MentorUser | null>(null);
  const [bookingRole, setBookingRole] = useState<'mentor' | 'coach'>('mentor');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Load site config from API
  useEffect(() => {
    fetch('/api/public/site-config', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.config) setSiteConfig(d.config);
    }).catch(() => {});
  }, []);

  // Apply platform primary color from admin config
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

  // Derived values from config (with fallbacks)
  const cfg = siteConfig;
  const sections = {
    showStats: true, showFeatures: true, showOpportunities: true, showHowItWorks: true,
    showRoles: true, showMentors: true, showCoaches: true, showCourses: true, showBlog: true,
    showTestimonials: true, showProducts: true, showStores: true, showContact: true, showCTA: true,
    ...(cfg?.sections ?? {}),
  };

  const heroTitle = cfg?.hero?.title || 'بوابتك للتمكين والنجاح';
  const heroSubtitle = cfg?.hero?.subtitle || 'منصة متكاملة تجمع بين التدريب المتخصص، الإرشاد الشخصي، والتجارة الإلكترونية\nلمساعدتك على بناء مستقبلك وتحقيق أهدافك.';
  const heroCta = cfg?.hero?.ctaText || 'ابدأ رحلتك مجاناً';
  const heroCtaSecondary = cfg?.hero?.ctaSecondaryText || 'تصفح المتجر';
  const heroBg = cfg?.hero?.backgroundImage || '';

  const statsData = cfg?.stats?.length ? cfg.stats : [
    { label: 'مستفيد نشط', value: '2,500+', icon: 'Users' },
    { label: 'دورة تدريبية', value: '150+', icon: 'BookOpen' },
    { label: 'مرشد ومدرب', value: '80+', icon: 'GraduationCap' },
    { label: 'نسبة الرضا', value: '95%', icon: 'Award' },
  ];

  const featuresData = cfg?.features?.length ? cfg.features : [
    { title: 'تدريب متخصص', description: 'مسارات تعليمية ودورات تدريبية مصممة لتزويدك بالمهارات المطلوبة في سوق العمل الحديث.', icon: 'BookOpen' },
    { title: 'إرشاد شخصي', description: 'تواصل مع مرشدين وخبراء لمساعدتك في رحلتك وتقديم النصح والتوجيه المخصص.', icon: 'Users' },
    { title: 'متجر إلكتروني', description: 'أنشئ متجرك الخاص، اعرض منتجاتك، وابدأ في تحقيق الدخل من مشروعك بسهولة.', icon: 'Store' },
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

  const ctaBanner = cfg?.ctaBanner ?? { title: 'جاهز للبدء؟ انضم إلى آلاف المستفيدين', subtitle: 'سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح مع EmpowerHub', primaryText: 'ابدأ مجاناً الآن', secondaryText: 'تجربة المنصة أولاً' };

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

  const contactInfo = cfg?.contact ?? { phone: '+966 XX XXX XXXX', whatsapp: '+966 XX XXX XXXX', whatsappLink: 'https://wa.me/966XXXXXXXXX', email: 'info@empowerhub.com' };
  const footerData = cfg?.footer ?? { description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية في مكان واحد.', email: 'info@empowerhub.com', phone: '', twitter: '', linkedin: '', instagram: '', copyright: '© 2024 EmpowerHub. جميع الحقوق محفوظة.' };

  return (
    <div className="bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Logo />
            <span className="gradient-text">{cfg?.siteName || 'EmpowerHub'}</span>
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
              <Link href="/register">سجّل الآن</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[85vh] items-center justify-center text-center text-white overflow-hidden">
          {heroBg ? (
            <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
          ) : heroImage ? (
            <Image src={heroImage.imageUrl} alt={heroImage.description} fill className="object-cover scale-105" data-ai-hint={heroImage.imageHint} priority />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

          <div className="relative z-10 container px-4 md:px-6 animate-fade-in-up">
            <Badge className="mb-6 bg-primary/20 text-primary-foreground border border-primary/30 backdrop-blur px-4 py-1.5 text-sm">
              🚀 {cfg?.tagline || 'منصة التمكين الرقمي الشاملة'}
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-7xl leading-tight">
              <span className="block">EmpowerHub</span>
              <span className="block mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white/90">
                {heroTitle}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/80 leading-relaxed whitespace-pre-line">
              {heroSubtitle}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="shadow-xl text-base px-8 py-6">
                <Link href="/register">
                  {heroCta}
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur text-base px-8 py-6">
                <Link href="#features">{heroCtaSecondary}</Link>
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
        {sections.showStats && (
          <section id="stats" className="py-16 bg-card border-y">
            <div className="container px-4 md:px-6">
              <div className={`grid grid-cols-2 md:grid-cols-${Math.min(4, statsData.length)} gap-8`}>
                {statsData.map((s, i) => (
                  <StatCard key={i} number={s.value} label={s.label} icon={iconMap[s.icon] ?? <Star className="h-6 w-6" />} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Combined Opportunities + Features Section */}
        {(sections.showOpportunities || sections.showFeatures) && (
          <section id="features" className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">ما نقدمه</Badge>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">كل ما تحتاجه للنجاح في مكان واحد</h2>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                  فرص متنوعة وأدوات متكاملة مصممة لتناسب طموحاتك وتحقق أهدافك المهنية والشخصية.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.showOpportunities && opportunitiesData.map((opp, i) => (
                  <FeatureCard
                    key={`opp-${i}`}
                    title={opp.title}
                    description={opp.description}
                    color={opp.color || featureColors[i % featureColors.length]}
                    icon={<span className="text-white">{iconMap[opp.icon] ?? <Sparkles className="h-6 w-6" />}</span>}
                  />
                ))}
                {sections.showFeatures && featuresData.map((f, i) => (
                  <FeatureCard
                    key={`feat-${i}`}
                    title={f.title}
                    description={f.description}
                    color={featureColors[(i + (sections.showOpportunities ? opportunitiesData.length : 0)) % featureColors.length]}
                    icon={<span className="text-white">{iconMap[f.icon] ?? <Sparkles className="h-6 w-6" />}</span>}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        {sections.showHowItWorks && howItWorksData.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">كيف تعمل المنصة</Badge>
                <h2 className="text-3xl font-bold tracking-tight">ابدأ رحلتك في {howItWorksData.length} خطوات بسيطة</h2>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-${Math.min(3, howItWorksData.length)} gap-8`}>
                {howItWorksData.map((item, i) => (
                  <div key={i} className="text-center relative z-10">
                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground text-2xl font-extrabold mx-auto mb-4 shadow-lg shadow-primary/30">
                      {item.step}
                    </div>
                    <div className="flex justify-center mb-3 text-primary">
                      {iconMap[item.icon] ?? <CheckCircle className="h-8 w-8" />}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Roles CTA Section */}
        {sections.showRoles && rolesData.length > 0 && (
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
                {rolesData.map((role, i) => (
                  <RoleCard
                    key={i}
                    icon={iconMap[role.icon] ?? <UserCheck size={32} />}
                    title={role.title}
                    description={role.description}
                    link={role.link || '/register'}
                    badge={role.badge || undefined}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Mentors Section */}
        {sections.showMentors && (
          <section id="mentors" className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">مرشدون</Badge>
                <h2 className="text-3xl font-bold tracking-tight">مرشدون متميزون</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  تواصل مع نخبة من المرشدين المتخصصين الذين يساعدونك في رحلتك نحو النجاح.
                </p>
              </div>
              {loadingMentors || mentors.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mentors.map(m => <MentorCard key={m.id} mentor={m} onBook={h => { setBookingHost(h); setBookingRole('mentor'); }} />)}
                </div>
              )}
              <div className="text-center mt-10">
                <Button variant="outline" asChild>
                  <Link href="/register?role=mentor">انضم كمرشد</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Featured Coaches Section */}
        {sections.showCoaches && (
          <section id="coaches" className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">مدربون</Badge>
                <h2 className="text-3xl font-bold tracking-tight">مدربون متميزون</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  تعلم من أفضل المدربين في مختلف المجالات وطور مهاراتك معهم.
                </p>
              </div>
              {loadingCoaches || coaches.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {coaches.map(c => <CoachCard key={c.id} coach={c} onBook={h => { setBookingHost(h); setBookingRole('coach'); }} />)}
                </div>
              )}
              <div className="text-center mt-10">
                <Button variant="outline" asChild>
                  <Link href="/register?role=coach">انضم كمدرب</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Courses Section */}
        {sections.showCourses && (
          <section id="courses" className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">الدورات التدريبية</Badge>
                <h2 className="text-3xl font-bold tracking-tight">دورات تدريبية من مدربينا</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  طور مهاراتك مع دورات متخصصة يقدمها أفضل المدربين على المنصة.
                </p>
              </div>
              {loadingCourses ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد دورات بعد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {courses.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Blog / Resources Section */}
        {sections.showBlog && blogPostsData.length > 0 && (
          <section id="blog" className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">الموارد والمقالات</Badge>
                <h2 className="text-3xl font-bold tracking-tight">تعلم وتطور مع محتوانا</h2>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                  مقالات ونصائح من خبراء المنصة لمساعدتك في رحلة التمكين والنجاح.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogPostsData.map((post, i) => (
                  <BlogCard
                    key={i}
                    title={post.title}
                    excerpt={post.excerpt}
                    category={post.category}
                    imageUrl={post.imageUrl}
                    link={post.link}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {sections.showTestimonials && testimonialsData.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">آراء مستخدمينا</Badge>
                <h2 className="text-3xl font-bold tracking-tight">ماذا يقول من جربوا المنصة</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonialsData.map((t, i) => (
                  <TestimonialCard key={i} name={t.name} role={t.role} text={t.text} stars={t.stars} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Marketplace Preview Section */}
        {sections.showProducts && (
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
                      <CardFooter><div className="h-9 w-full rounded bg-muted" /></CardFooter>
                    </Card>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Store className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">لا توجد منتجات بعد. كن أول من يضيف منتجه!</p>
                  <Button asChild className="mt-6"><Link href="/register">ابدأ الآن</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(p => <ProductCard key={p.id} product={p} onOrder={setSelectedProduct} />)}
                </div>
              )}
              <div className="text-center mt-10">
                <Button asChild size="lg">
                  <Link href="/market">تصفح جميع المنتجات <ArrowLeft className="mr-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Stores Section */}
        {sections.showStores && (
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
                    <Card key={store.id} className="border-0 shadow-md hover:shadow-lg transition-shadow flex flex-col">
                      <CardContent className="pt-6 flex flex-col gap-2 flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-bold text-base">{store.name}</h3>
                        </div>
                        {store.beneficiaryName && <p className="text-sm text-muted-foreground">البائع: {store.beneficiaryName}</p>}
                        {store.location && <p className="text-sm text-muted-foreground">الموقع: {store.location}</p>}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button variant="outline" className="w-full text-xs" asChild>
                          <Link href={`/stores/${store.id}`}>
                            تصفح المتجر <ArrowLeft className="mr-2 h-3 w-3" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contact Section */}
        {sections.showContact && (
          <section id="contact" className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">تواصل</Badge>
                <h2 className="text-3xl font-bold tracking-tight">تواصل معنا</h2>
                <p className="mt-3 text-lg text-muted-foreground">نحن هنا للإجابة على استفساراتك ومساعدتك في كل خطوة.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="flex flex-col gap-4">
                  {contactInfo.phone && (
                    <Card className="border-0 shadow-md bg-card">
                      <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">الهاتف</p>
                          <p className="text-muted-foreground text-sm" dir="ltr">{contactInfo.phone}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {contactInfo.email && (
                    <Card className="border-0 shadow-md bg-card">
                      <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">البريد الإلكتروني</p>
                          <p className="text-muted-foreground text-sm" dir="ltr">{contactInfo.email}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {contactInfo.whatsapp && (
                    <Card className="border-0 shadow-md bg-card">
                      <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#25D366' }}>
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">واتساب</p>
                          <p className="text-muted-foreground text-sm mb-3" dir="ltr">{contactInfo.whatsapp}</p>
                          <Button
                            asChild
                            className="text-white text-sm px-4 py-2 h-auto"
                            style={{ backgroundColor: '#25D366' }}
                          >
                            <a href={contactInfo.whatsappLink || `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="h-4 w-4 ml-1" />
                              تواصل عبر واتساب
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Card className="border-0 shadow-md bg-card">
                  <CardHeader>
                    <CardTitle className="text-xl">أرسل لنا رسالة</CardTitle>
                    <CardDescription>سنرد عليك في أقرب وقت ممكن</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">الاسم</label>
                        <Input placeholder="اسمك الكريم" value={contactName} onChange={e => setContactName(e.target.value)} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                        <Input type="email" placeholder="example@email.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required dir="ltr" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">رسالتك</label>
                        <Textarea placeholder="اكتب رسالتك هنا..." rows={5} value={contactMessage} onChange={e => setContactMessage(e.target.value)} required className="resize-none" />
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
        )}

        {/* CTA Banner */}
        {sections.showCTA && (
          <section className="py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="container px-4 md:px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                {ctaBanner.title}
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                {ctaBanner.subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" asChild className="text-primary font-bold px-8 py-6 text-base shadow-xl">
                  <Link href="/register">
                    {ctaBanner.primaryText}
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/40 text-white hover:bg-white/10 px-8 py-6 text-base">
                  <Link href="/try-roles">{ctaBanner.secondaryText}</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Order dialog for products */}
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

      {/* Booking dialog for mentors/coaches */}
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

      {/* Footer */}
      <footer className="py-10 border-t bg-card">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Logo className="h-8 w-8" />
                <span className="font-bold text-lg gradient-text">{cfg?.siteName || 'EmpowerHub'}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {footerData.description}
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
            <p className="text-sm text-muted-foreground">{footerData.copyright || '© 2024 EmpowerHub. جميع الحقوق محفوظة.'}</p>
            <div className="flex items-center gap-3">
              {footerData.twitter && <a href={footerData.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary text-xs transition-colors">تويتر</a>}
              {footerData.linkedin && <a href={footerData.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary text-xs transition-colors">LinkedIn</a>}
              {footerData.instagram && <a href={footerData.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary text-xs transition-colors">Instagram</a>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
