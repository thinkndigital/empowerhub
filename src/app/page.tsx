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
  Star, MessageSquare, Phone, Mail, Globe, Menu, X, Calendar, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
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
  avatarUrl?: string;
  sessionPrice?: number | null;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  twitter?: string;
  email?: string;
}

interface PublicSession {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  meetLink: string;
  bannerUrl: string;
  hostId: string;
  hostName: string;
  hostAvatarUrl: string;
  price: number | null;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  price: number | null;
  coverImageUrl: string;
  duration: string;
  coachName: string;
  coachAvatarUrl?: string;
  enrollmentCount: number;
  level?: string;
  language?: string;
  tags?: string[];
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
  expert, role, onBook, currencySymbol,
}: { expert: MentorUser; role: 'mentor' | 'coach'; onBook?: () => void; currencySymbol: string }) => {
  const name = expert.displayName || expert.name || 'بدون اسم';
  const bio = expert.bio || expert.description || '';
  const specializations = Array.isArray(expert.specializations) ? expert.specializations : [];
  const hasPrice = expert.sessionPrice != null && expert.sessionPrice > 0;
  const accent = role === 'mentor' ? 'bg-primary/10 text-primary' : 'bg-sky-500/10 text-sky-600';
  const initial = name[0] || '?';
  return (
    <div className="group p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {expert.avatarUrl ? (
          <img src={expert.avatarUrl} alt={name} className="h-12 w-12 rounded-full object-cover shrink-0 border border-border" />
        ) : (
          <div className={`h-12 w-12 rounded-full ${accent} flex items-center justify-center font-bold text-base shrink-0`}>
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground truncate">{name}</p>
          {hasPrice && <p className="text-xs text-muted-foreground tabular-nums">{expert.sessionPrice} {currencySymbol} / جلسة</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {expert.linkedin && (
            <a href={expert.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="LinkedIn">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          )}
          {expert.website && (
            <a href={expert.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="الموقع">
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      {bio && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-grow">{bio}</p>}
      {specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {specializations.slice(0, 3).map((s, i) => (
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

const LEVEL_LABELS: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
const LEVEL_COLORS: Record<string, string> = { beginner: 'bg-green-500/10 text-green-700', intermediate: 'bg-amber-500/10 text-amber-700', advanced: 'bg-red-500/10 text-red-700' };

const CourseCard = ({ course, onEnroll, currencySymbol }: { course: CourseItem; onEnroll?: (c: CourseItem) => void; currencySymbol: string }) => (
  <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col">
    {/* Cover */}
    <div className="relative h-40 bg-muted overflow-hidden shrink-0">
      {course.coverImageUrl ? (
        <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <BookOpen className="h-9 w-9 text-primary/20" />
        </div>
      )}
      {/* Price badge */}
      {course.price != null && (
        <div className="absolute top-2.5 left-2.5 bg-background/90 backdrop-blur-sm text-foreground text-[11px] font-bold rounded-full px-2.5 py-0.5 border border-border/50">
          {course.price === 0 ? 'مجاني' : `${course.price} ${currencySymbol}`}
        </div>
      )}
      {/* Level badge */}
      {course.level && LEVEL_LABELS[course.level] && (
        <div className={`absolute top-2.5 right-2.5 text-[10px] font-semibold rounded-full px-2 py-0.5 ${LEVEL_COLORS[course.level] || 'bg-muted text-muted-foreground'}`}>
          {LEVEL_LABELS[course.level]}
        </div>
      )}
    </div>

    {/* Body */}
    <div className="p-3.5 flex flex-col gap-2 flex-grow">
      {/* Coach */}
      <div className="flex items-center gap-1.5">
        {course.coachAvatarUrl ? (
          <img src={course.coachAvatarUrl} alt={course.coachName} className="h-5 w-5 rounded-full object-cover border border-border/50" />
        ) : (
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
            {course.coachName?.[0] || 'م'}
          </div>
        )}
        <span className="text-[11px] text-muted-foreground truncate">{course.coachName || 'مدرب'}</span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
        {course.title}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        {course.duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duration}
          </span>
        )}
        {course.enrollmentCount > 0 && (
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            {course.enrollmentCount}+
          </span>
        )}
      </div>
    </div>

    {/* Actions */}
    <div className="px-3.5 pb-3.5 flex gap-2">
      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
        <Link href={`/courses/${course.id}`}>تفاصيل</Link>
      </Button>
      <Button size="sm" className="flex-1 text-xs h-8" onClick={() => onEnroll?.(course)}>
        {course.price === 0 || course.price === null ? 'اشترك مجاناً' : 'اشترك الآن'}
      </Button>
    </div>
  </div>
);

const ProductCard = ({ product, onOrder, currencySymbol }: { product: Product; onOrder: (p: Product) => void; currencySymbol: string }) => {
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
          <p className="text-primary font-bold text-sm">{product.price} {currencySymbol}</p>
        )}
      </div>
      <div className="px-4 pb-4">
        <Button className="w-full h-9 text-sm" onClick={() => onOrder(product)}>اطلب الآن</Button>
      </div>
    </div>
  );
};

const PublicSessionCard = ({ session, currencySymbol }: { session: PublicSession; currencySymbol: string }) => {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="group rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      {session.bannerUrl ? (
        <div className="h-36 overflow-hidden bg-muted">
          <img src={session.bannerUrl} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <GraduationCap className="h-10 w-10 text-primary/30" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-grow">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{session.title}</h3>
        {session.description && <p className="text-xs text-muted-foreground line-clamp-2">{session.description}</p>}
        <div className="flex items-center gap-2 mt-auto pt-2">
          {session.hostAvatarUrl ? (
            <img src={session.hostAvatarUrl} alt={session.hostName} className="h-6 w-6 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{session.hostName[0]}</div>
          )}
          <span className="text-xs text-muted-foreground">{session.hostName}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span>{dateStr} — {timeStr}</span>
          <span>{session.duration} د</span>
        </div>
        {session.price != null && (
          <p className="text-primary font-bold text-sm">{session.price === 0 ? 'مجاني' : `${session.price} ${currencySymbol}`}</p>
        )}
      </div>
      {session.meetLink && (
        <div className="px-4 pb-4">
          <Button className="w-full h-9 text-sm" asChild>
            <a href={session.meetLink} target="_blank" rel="noopener noreferrer">انضم للجلسة</a>
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { toast } = useToast();
  const { symbol: currencySymbol } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [coaches, setCoaches] = useState<MentorUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [publicStores, setPublicStores] = useState<{ id: string; name: string; logoUrl?: string; location?: string; beneficiaryName?: string }[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [publicSessions, setPublicSessions] = useState<PublicSession[]>([]);
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

  useEffect(() => {
    fetch('/api/public/sessions').then(r => r.json()).then(d => {
      setPublicSessions(d.sessions || []);
    }).catch(() => {});
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
    { title: 'تتبع التقدم والنمو', description: 'تابع إنجازاتك خطوة بخطوة بتقارير مرئية واضحة تساعدك على معرفة ما حققته وما التالي.', icon: 'BarChart3' },
    { title: 'توصيات ذكية بالذكاء الاصطناعي', description: 'احصل على توصيات مخصصة تناسب أهدافك وظروفك لتحقيق أقصى استفادة من المنصة.', icon: 'Zap' },
    { title: 'أمان وخصوصية تامة', description: 'بياناتك ومعلوماتك الشخصية محمية بأحدث تقنيات التشفير. تجربة آمنة وموثوقة دائماً.', icon: 'Shield' },
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
    { title: 'مشاريع منزلية ناجحة', description: 'أطلق مشروعك من المنزل وابنِ متجرك الإلكتروني مع دعم متكامل من الفكرة حتى أول عملية بيع ناجحة.', icon: 'Store', badge: 'جديد', color: 'bg-amber-500', link: '/register' },
    { title: 'التمكين الاقتصادي', description: 'مهارات مالية وأدوات عملية تساعدك على تحقيق الاستقلالية الاقتصادية وبناء مصدر دخل حقيقي ومستدام.', icon: 'TrendingUp', badge: 'متاح', color: 'bg-green-500', link: '/register' },
    { title: 'مجتمع الدعم والتشبيك', description: 'انضم لمجتمع من المستفيدين والخبراء الذين يتشاركون التجارب ويدعمون بعضهم نحو النجاح.', icon: 'Users', badge: '', color: 'bg-primary', link: '/register' },
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
    { href: '/articles', label: 'المقالات' },
    { href: '/projects', label: 'الفرص' },
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
        <section className="relative min-h-[85vh] lg:min-h-screen flex items-center overflow-hidden bg-background">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          {/* Gradient blob */}
          <div className="absolute top-1/3 left-1/4 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/4 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 container py-16 sm:py-20 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* ── Text Column ── */}
              <div className="text-center lg:text-right">
                {/* Tagline pill */}
                <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground border border-border/80 rounded-full px-3.5 py-1.5 mb-6 sm:mb-8 bg-card/60 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                  <span className="truncate">{cfg?.tagline || 'منصة التمكين الرقمي الشاملة'}</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5 sm:mb-6">
                  {heroTitle}
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 sm:mb-10">
                  {heroSubtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 mb-8 sm:mb-10">
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
                <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                  {['مجاني تماماً للبدء', 'لا يتطلب بطاقة ائتمان', 'دعم باللغة العربية'].map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Visual Column — Dashboard mockup ── */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-sm xl:max-w-md">
                  {/* Glow behind card */}
                  <div className="absolute inset-6 bg-primary/10 rounded-3xl blur-2xl pointer-events-none" />

                  {/* Main dashboard card */}
                  <div className="relative rounded-2xl border border-border bg-card shadow-2xl p-5 flex flex-col gap-4">

                    {/* Top bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="text-sm font-bold text-foreground">لوحة التحكم</span>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">نشط</span>
                      </div>
                    </div>

                    {/* Profile row */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm font-extrabold text-primary">ن</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">مرحباً، نور! 👋</p>
                        <p className="text-xs text-muted-foreground">مشروعك المنزلي ينمو</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'المبيعات', value: '١٢٤٠', color: 'text-primary' },
                        { label: 'الدورات', value: '٥', color: 'text-sky-500' },
                        { label: 'الجلسات', value: '١٢', color: 'text-amber-500' },
                      ].map((s, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-xl p-2.5 text-center">
                          <div className={`text-lg font-extrabold ${s.color} tabular-nums leading-none mb-0.5`}>{s.value}</div>
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>تقدم دورة التسويق الرقمي</span>
                        <span className="font-semibold text-primary">٧٥٪</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary rounded-full" />
                      </div>
                    </div>

                    {/* Upcoming session */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-xs font-bold text-primary">س</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">جلسة مع المرشدة سارة</p>
                        <p className="text-[10px] text-muted-foreground">اليوم — ٣:٠٠ مساءً</p>
                      </div>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">قريباً</span>
                    </div>

                    {/* New store order */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                        <Store className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">طلب جديد في متجرك!</p>
                        <p className="text-[10px] text-muted-foreground">منتج يدوي — ٢٥ د.أ</p>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    </div>
                  </div>

                  {/* Floating badge top */}
                  <div className="absolute -top-3 -right-4 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-foreground whitespace-nowrap">٢٫٥٠٠+ مستفيدة</span>
                  </div>

                  {/* Floating badge bottom */}
                  <div className="absolute -bottom-3 -left-4 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-foreground whitespace-nowrap">٤.٩ تقييم المستفيدين</span>
                  </div>
                </div>
              </div>

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
              {/* Centered header */}
              <div className="text-center mb-14 sm:mb-20">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">كيف تعمل المنصة</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  من الفكرة إلى النجاح في خطوات واضحة
                </h2>
              </div>

              {/* 3-column horizontal grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-14">
                {howItWorksData.map((item, i) => (
                  <div key={i} className="flex flex-col">
                    {/* Giant ghost number */}
                    <span className="text-8xl sm:text-9xl md:text-[8rem] lg:text-[9rem] font-extrabold text-foreground/[0.06] leading-none select-none tabular-nums mb-4">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {/* Step content — overlaps the number slightly */}
                    <div className="-mt-4 sm:-mt-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                        <ExpertCard key={m.id} expert={m} role="mentor" currencySymbol={currencySymbol} onBook={() => { setBookingHost(m); setBookingRole('mentor'); }} />
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
                        <ExpertCard key={c.id} expert={c} role="coach" currencySymbol={currencySymbol} onBook={() => { setBookingHost(c); setBookingRole('coach'); }} />
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
                  {courses.map(c => <CourseCard key={c.id} course={c} currencySymbol={currencySymbol} onEnroll={setSelectedCourse} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Public Sessions ─────────────────────────────────────────────────── */}
        {publicSessions.length > 0 && (
          <section id="sessions" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8 sm:mb-10">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">جلسات إرشادية</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">الجلسات المتاحة</h2>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{publicSessions.length} جلسة متاحة</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {publicSessions.map(s => (
                  <PublicSessionCard key={s.id} session={s} currencySymbol={currencySymbol} />
                ))}
              </div>
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
                  {products.map(p => <ProductCard key={p.id} product={p} currencySymbol={currencySymbol} onOrder={setSelectedProduct} />)}
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
