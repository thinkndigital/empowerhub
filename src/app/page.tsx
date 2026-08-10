"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePlatformBrand } from '@/components/platform-brand-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import {
  ArrowLeft, BookOpen, Store, GraduationCap, CheckCircle,
  Star, MessageSquare, Phone, Mail, Calendar, Clock,
  Tag, MapPin, FileText, Briefcase, Video, Building2, Users, BarChart3,
  Zap, Crown, Check, ClipboardCheck, TrendingUp, ShoppingBag, ShoppingCart, HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { applyOrgColor } from '@/lib/apply-org-color';
import { getDynamicIcon } from '@/lib/dynamic-icons';
import { translateCategory } from '@/lib/product-category';
import { DEFAULT_PLATFORM_SERVICES } from '@/lib/default-platform-services';
import { SessionBookingDialog } from '@/components/session-booking-dialog';
import { CourseEnrollDialog } from '@/components/course-enroll-dialog';
import { useCart } from '@/components/cart-provider';
import { useLanguage } from '@/components/language-provider';

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
  category?: string;
}

interface Product {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  image?: string;
  whatsapp?: string;
  storeId?: string;
  storeName?: string;
  organizationId?: string;
  beneficiaryId?: string;
  deliveryCost?: number;
  store?: { phone?: string };
  stock?: number | null;
  location?: string;
}

interface Plan {
  id: string;
  name: string;
  nameEn?: string;
  key: string;
  description?: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  color: string;
  icon: string;
  highlighted: boolean;
  features: string[];
}

interface CtaButton { text: string; link: string; style: 'primary' | 'outline' }

interface SiteConfig {
  siteName: string;
  tagline: string;
  primaryColor?: string;
  logoUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; backgroundImage: string; buttons?: CtaButton[] };
  stats: { label: string; value: string; icon: string }[];
  features: { title: string; description: string; icon: string }[];
  opportunities?: { title: string; description: string; icon: string; badge?: string; color?: string; link?: string }[];
  howItWorks: { step: string; title: string; desc: string; icon: string }[];
  testimonials: { name: string; role: string; text: string; stars: number }[];
  blogPosts?: { title: string; excerpt: string; category: string; imageUrl?: string; link?: string }[];
  contact: { phone: string; whatsapp: string; whatsappLink: string; email: string };
  ctaBanner: { title: string; subtitle: string; primaryText: string; secondaryText: string; backgroundColor?: string; buttons?: CtaButton[] };
  roles: { title: string; description: string; icon: string; badge: string; link: string }[];
  sectionStyles?: Record<string, { bg?: string; iconColor?: string }>;
  sections: {
    showStats: boolean; showFeatures: boolean; showOpportunities: boolean; showHowItWorks: boolean;
    showRoles: boolean; showMentors: boolean; showCoaches: boolean; showCourses: boolean; showBlog: boolean;
    showTestimonials: boolean; showProducts: boolean; showStores: boolean; showPricing: boolean; showContact: boolean; showCTA: boolean;
    showAISpotlight?: boolean; showFAQ?: boolean; showSessions?: boolean; showSuccessStories?: boolean;
  };
  footer: {
    description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string; copyright: string;
    newsletterTitle?: string; newsletterPlaceholder?: string; newsletterButton?: string;
    quickLinksTitle?: string; roleLinksTitle?: string; companyLinksTitle?: string; legalLinksTitle?: string;
  };
  sectionHeadings?: Record<string, { eyebrow?: string; heading?: string; subheading?: string }>;
  aiSpotlight?: { eyebrow?: string; heading?: string; subheading?: string; cards?: { title?: string; description?: string }[] };
  faq?: { question: string; answer: string }[];
  header?: { navLinks: { label: string }[]; teamLabel: string; teamLinks: { label: string }[]; loginText: string; registerText: string; registerTextMobile: string };
  tourRoles?: { headline: string; ctaText?: string; benefits: string[]; stats: { label: string; value: string }[]; items: { title: string; subtitle: string }[] }[];
  translations?: { en?: Record<string, any> };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const LinkedInIcon = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const InstagramIcon = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const TwitterXIcon = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const ExpertCard = ({
  expert, role,
}: { expert: MentorUser; role: 'mentor' | 'coach'; onBook?: () => void; currencySymbol: string }) => {
  const name = expert.displayName || expert.name || 'بدون اسم';
  const initial = name[0] || '?';
  const isMentor = role === 'mentor';
  const gradient = isMentor
    ? 'from-violet-600 via-primary to-indigo-600'
    : 'from-sky-500 via-sky-400 to-cyan-500';
  const profileLink = `/${isMentor ? 'mentors' : 'coaches'}/${expert.id}`;
  const whatsappHref = expert.whatsapp
    ? `https://wa.me/${expert.whatsapp.replace(/\D/g, '')}`
    : null;

  const hasSocial = !!(expert.linkedin || expert.instagram || expert.twitter || whatsappHref);

  return (
    <div dir="rtl" className="rounded-3xl bg-card overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      {/* Photo with social icons overlay */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <Link href={profileLink} className="block w-full h-full">
          {expert.avatarUrl ? (
            <img
              src={expert.avatarUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => {
                const t = e.target as HTMLImageElement;
                t.style.display = 'none';
                (t.nextElementSibling as HTMLElement)?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold text-7xl ${expert.avatarUrl ? 'hidden' : ''}`}
          >
            {initial}
          </div>
        </Link>
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
          {isMentor ? 'مرشد' : 'مدرب'}
        </span>
        {/* Social icons overlay on bottom of photo */}
        {hasSocial && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2.5 bg-gradient-to-t from-black/60 to-transparent">
            {expert.linkedin && (
              <a href={expert.linkedin} target="_blank" rel="noopener noreferrer"
                className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white hover:text-primary transition-colors"
                title="LinkedIn"><LinkedInIcon /></a>
            )}
            {expert.instagram && (
              <a href={expert.instagram} target="_blank" rel="noopener noreferrer"
                className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white hover:text-pink-600 transition-colors"
                title="Instagram"><InstagramIcon /></a>
            )}
            {expert.twitter && (
              <a href={expert.twitter} target="_blank" rel="noopener noreferrer"
                className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white hover:text-foreground transition-colors"
                title="X"><TwitterXIcon /></a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white hover:text-green-600 transition-colors"
                title="واتساب"><WhatsAppIcon /></a>
            )}
          </div>
        )}
      </div>

      {/* Name + specialty */}
      <div className="px-4 py-4 flex flex-col items-center gap-1.5">
        <Link href={profileLink} className="font-bold text-base text-foreground text-center leading-snug hover:text-primary transition-colors">
          {name}
        </Link>
        {(() => {
          const specs = Array.isArray(expert.specializations)
            ? expert.specializations
            : typeof expert.specializations === 'string' && expert.specializations
            ? [expert.specializations]
            : [];
          return specs.length > 0 ? (
            <p className={`text-xs font-medium text-center line-clamp-1 px-2.5 py-0.5 rounded-full ${isMentor ? 'text-violet-600 bg-violet-500/10' : 'text-sky-600 bg-sky-500/10'}`}>
              {specs.slice(0, 2).join(' · ')}
            </p>
          ) : null;
        })()}
        {!expert.specializations && expert.bio ? (
          <p className="text-xs text-muted-foreground text-center line-clamp-1">{expert.bio}</p>
        ) : null}
      </div>
    </div>
  );
};

function AutoCarousel({ children, count }: { children: React.ReactNode; count: number }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setActive(p => (p + 1) % count), 4500);
    return () => clearInterval(t);
  }, [count]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || count === 0) return;
    const child = el.children[active] as HTMLElement;
    if (!child) return;
    // offsetLeft/scrollLeft disagree on sign conventions across browsers in
    // RTL, so measure the actual on-screen gap instead — this scrolls only
    // this container (never the page) and works the same regardless of dir.
    const elRect = el.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    el.scrollBy({ left: childRect.right - elRect.right, behavior: 'smooth' });
  }, [active, count]);

  const dotCount = Math.min(count, 8);
  return (
    <div>
      <div
        ref={containerRef}
        dir="rtl"
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`الشريحة ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active % dotCount ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const LEVEL_LABELS: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
const LEVEL_COLORS: Record<string, string> = { beginner: 'bg-green-500/10 text-green-700', intermediate: 'bg-amber-500/10 text-amber-700', advanced: 'bg-red-500/10 text-red-700' };

const CourseCard = ({ course, onEnroll, currencySymbol }: { course: CourseItem; onEnroll?: (c: CourseItem) => void; currencySymbol: string }) => (
  <div className="group rounded-3xl bg-card overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
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

      {/* Category */}
      {course.category && (
        <span className="text-[10px] font-medium text-primary/80 truncate">{course.category}</span>
      )}

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

const ProductCard = ({ product, currencySymbol }: { product: Product; currencySymbol: string }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const name = product.name || 'منتج';
  const imageUrl = product.imageUrl || product.image || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.beneficiaryId) return;
    addItem({
      productId: product.id,
      name,
      price: product.price || 0,
      deliveryCost: product.deliveryCost || 0,
      imageUrl,
      storeId: product.storeId || '',
      storeName: product.storeName || '',
      beneficiaryId: product.beneficiaryId,
      organizationId: product.organizationId || '',
      stock: product.stock ?? undefined,
    });
    toast({ title: 'أُضيف للسلة', description: name });
  };

  return (
    <div className="group flex flex-col">
      <Link
        href={`/market/${product.id}`}
        aria-label={`عرض تفاصيل ${name}`}
        className="relative block w-full aspect-square rounded-3xl bg-muted/60 p-2.5 shadow-sm group-hover:shadow-md transition-shadow duration-200 text-right"
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-background">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Store className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}
        </div>
        {product.category && (
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full px-2.5 py-0.5">
            {translateCategory(product.category)}
          </div>
        )}
        {/* Quick add-to-cart — hidden until hover */}
        {product.beneficiaryId && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleAddToCart}
            aria-label={`أضف للسلة ${name}`}
            className="absolute bottom-4 left-4 h-9 w-9 rounded-full bg-background text-foreground shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
          >
            <ShoppingBag className="h-4 w-4" />
          </span>
        )}
      </Link>
      <Link href={`/market/${product.id}`} className="mt-3 flex items-baseline justify-between gap-2 text-right">
        <span className="text-sm text-muted-foreground line-clamp-1">{name}</span>
        {product.price != null && (
          <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">{product.price?.toLocaleString('ar')} {currencySymbol}</span>
        )}
      </Link>
    </div>
  );
};

const PublicSessionCard = ({ session, currencySymbol, onBook }: { session: PublicSession; currencySymbol: string; onBook?: () => void }) => {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const isFree = session.price === 0 || session.price == null;
  return (
    <div className="group rounded-3xl bg-card hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
      {/* Banner */}
      <div className="relative h-36 overflow-hidden bg-muted shrink-0">
        {session.bannerUrl ? (
          <img src={session.bannerUrl} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-primary/30" />
          </div>
        )}
        {/* Price badge */}
        <div className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
          isFree
            ? 'bg-emerald-500 text-white'
            : 'bg-background/90 backdrop-blur-sm text-foreground border border-border/50'
        }`}>
          {isFree ? 'مجاني' : `${session.price} ${currencySymbol}`}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-grow">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">{session.title}</h3>
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
      </div>

      <div className="px-4 pb-4">
        <Button className="w-full h-9 text-sm" onClick={onBook}>
          {isFree ? 'احجز مجاناً' : `احجز — ${session.price} ${currencySymbol}`}
        </Button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

// Dot-path lookup into an admin-provided English overlay (translations.en),
// mirroring the same accessor used in the admin site editor.
function getPath(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export default function LandingPage() {
  const { toast } = useToast();
  const { symbol: currencySymbol } = useCurrency();
  const { logoUrl: platformLogoFallback } = usePlatformBrand();
  const { lang } = useLanguage();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [coaches, setCoaches] = useState<MentorUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [publicStores, setPublicStores] = useState<{ id: string; slug?: string; name: string; logoUrl?: string; coverUrl?: string; location?: string; beneficiaryName?: string }[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [publicSessions, setPublicSessions] = useState<PublicSession[]>([]);
  const [latestArticles, setLatestArticles] = useState<{ id: string; title: string; excerpt: string; coverImageUrl: string; authorName: string; authorRole: string; readTime: number; tags: string[] }[]>([]);
  const [latestProjects, setLatestProjects] = useState<{ id: string; title: string; description: string; coverImageUrl: string; organizationName: string; type: string; location: string; deadline: string }[]>([]);
  const [successStories, setSuccessStories] = useState<{ id: string; beneficiaryName: string; beneficiaryRole: string; content: string; avatarUrl: string; stars: number; orgName: string }[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [selectedSession, setSelectedSession] = useState<PublicSession | null>(null);
  const [bookingHost, setBookingHost] = useState<MentorUser | null>(null);
  const [bookingRole, setBookingRole] = useState<'mentor' | 'coach'>('mentor');
  const [courseFilter, setCourseFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('الكل');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [activeTour, setActiveTour] = useState(0);
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    fetch('/api/public/site-config', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.config) setSiteConfig(d.config);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (siteConfig?.primaryColor) applyOrgColor(siteConfig.primaryColor);
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

  useEffect(() => {
    fetch('/api/public/articles').then(r => r.json()).then(d => {
      setLatestArticles((d.articles || []).slice(0, 6));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/public/projects').then(r => r.json()).then(d => {
      setLatestProjects((d.projects || []).slice(0, 6));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/public/success-stories').then(r => r.json()).then(d => {
      setSuccessStories((d.stories || []).slice(0, 6));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/public/plans').then(r => r.json()).then(d => {
      setPlans(d.plans || []);
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
    showTestimonials: true, showProducts: true, showStores: true, showPricing: true, showContact: true, showCTA: true,
    showAISpotlight: true, showFAQ: true, showSessions: true, showSuccessStories: true,
    ...(cfg?.sections ?? {}),
  };

  const sectionStyle = (key: string) => cfg?.sectionStyles?.[key] || {};

  // Section eyebrow/heading/subheading text — admin-editable per section key,
  // with an optional English overlay (cfg.translations.en), falling back to
  // the Arabic value or the original copy when nothing's been set.
  const sh = (key: string, field: 'eyebrow' | 'heading' | 'subheading', fallback: string) => {
    if (lang === 'en') {
      const en = getPath(cfg?.translations?.en, `sectionHeadings.${key}.${field}`);
      if (en) return en;
    }
    return (cfg?.sectionHeadings?.[key] as any)?.[field] || fallback;
  };

  // Generic English-overlay resolver for a single cfg path — returns the
  // admin's English translation if set, else the Arabic value, else fallback.
  const trField = (path: string, arValue: string | undefined, fallback: string) => {
    if (lang === 'en') {
      const en = getPath(cfg?.translations?.en, path);
      if (en) return en;
    }
    return arValue || fallback;
  };

  const heroTitle = trField('hero.title', cfg?.hero?.title, 'بوابتك للتمكين والنجاح');
  const heroSubtitle = trField('hero.subtitle', cfg?.hero?.subtitle, 'منصة متكاملة تجمع بين التدريب المتخصص، الإرشاد الشخصي، والتجارة الإلكترونية لمساعدتك على بناء مستقبلك.');
  const heroButtonsBase: CtaButton[] = cfg?.hero?.buttons !== undefined ? cfg.hero.buttons : [
    { text: cfg?.hero?.ctaText || 'ابدأ رحلتك مجاناً', link: '/register', style: 'primary' },
    { text: cfg?.hero?.ctaSecondaryText || 'كيف تعمل المنصة', link: '#roles', style: 'outline' },
  ];
  const heroButtons: CtaButton[] = heroButtonsBase.map((btn, i) => ({
    ...btn,
    text: trField(`hero.buttons.${i}.text`, undefined, btn.text),
  }));

  const statsDataAr = cfg?.stats?.length ? cfg.stats : [
    { label: 'مستفيد نشط', value: '2,500+', icon: 'Users' },
    { label: 'دورة تدريبية', value: '150+', icon: 'BookOpen' },
    { label: 'مرشد ومدرب', value: '80+', icon: 'GraduationCap' },
    { label: 'نسبة الرضا', value: '95%', icon: 'Award' },
  ];
  const statsData = statsDataAr.map((s, i) => ({
    ...s,
    label: trField(`stats.${i}.label`, undefined, s.label),
    value: trField(`stats.${i}.value`, undefined, s.value),
  }));

  const testimonialsDataAr = cfg?.testimonials?.length ? cfg.testimonials : [
    { name: 'سارة أحمد', role: 'مستفيدة - رائدة أعمال', text: 'بفضل EmpowerHub، تمكنت من إطلاق متجري الإلكتروني وتحقيق أول ألف دينار خلال شهرين فقط. الدعم والتدريب كانا استثنائيين!', stars: 5 },
    { name: 'محمد الخالد', role: 'مدرب - خبير تسويق رقمي', text: 'المنصة أتاحت لي الفرصة للوصول إلى مئات المستفيدين ومشاركتهم خبرتي. الأدوات سهلة الاستخدام والدعم الفني ممتاز.', stars: 5 },
    { name: 'منظمة بناء المستقبل', role: 'منظمة غير ربحية', text: 'ساعدتنا المنصة في إدارة 200 مستفيد بكل احترافية. التقارير التفصيلية مكّنتنا من قياس أثر برامجنا بشكل دقيق.', stars: 5 },
  ];
  const testimonialsData = testimonialsDataAr.map((t, i) => ({
    ...t,
    name: trField(`testimonials.${i}.name`, undefined, t.name),
    role: trField(`testimonials.${i}.role`, undefined, t.role),
    text: trField(`testimonials.${i}.text`, undefined, t.text),
  }));


  // Per-role tour content — admin-editable via cfg.tourRoles[index], with an
  // optional English overlay (cfg.translations.en.tourRoles), falling back
  // to the Arabic value or the original copy when nothing's been set.
  const tr = (i: number) => cfg?.tourRoles?.[i];
  const trEn = (i: number) => getPath(cfg?.translations?.en, `tourRoles.${i}`);
  const trField2 = (i: number, path: string, arValue: string | undefined, fallback: string) => {
    if (lang === 'en') {
      const en = getPath(trEn(i), path);
      if (en) return en;
    }
    return arValue || fallback;
  };
  const trBenefits = (i: number, fallback: string[]) => {
    const base = tr(i)?.benefits?.length ? tr(i)!.benefits : fallback;
    return base.map((b, bi) => trField2(i, `benefits.${bi}`, undefined, b));
  };
  const trStats = (i: number, fallback: { label: string; value: string }[]) => {
    const base = tr(i)?.stats?.length ? tr(i)!.stats : fallback;
    return base.map((s, si) => ({
      label: trField2(i, `stats.${si}.label`, undefined, s.label),
      value: trField2(i, `stats.${si}.value`, undefined, s.value),
    }));
  };
  const trItem = (i: number, ii: number, field: 'title' | 'subtitle', fallback: string) =>
    trField2(i, `items.${ii}.${field}`, tr(i)?.items?.[ii]?.[field], fallback);
  const trLabel = (arLabel: string, enLabel: string) => (lang === 'en' ? enLabel : arLabel);

  const tourRoles = [
    {
      key: 'organization', label: trLabel('المنظمة', 'Organizations'), icon: Building2, path: 'organization-dashboard', link: '/register?role=organization',
      cta: trField2(0, 'ctaText', tr(0)?.ctaText, '') || undefined,
      headline: trField2(0, 'headline', tr(0)?.headline, 'أدر برامج التمكين بالكامل من مكان واحد'),
      benefits: trBenefits(0, [
        'إضافة وإدارة المستفيدين والمرشدين والمدربين بسهولة',
        'تتبع تقدم كل مستفيد بتقارير وتحليلات تفصيلية',
        'نماذج تقييم مخصصة ترسلها وتحلل نتائجها',
        'تخصيص هوية منصتك الخاصة بشعارك وألوانك',
      ]),
      stats: trStats(0, [{ label: 'مستفيدون', value: '٢٥٠' }, { label: 'مرشدون', value: '١٢' }, { label: 'دورات', value: '٣٠' }]),
      items: [
        { icon: Users, title: trItem(0, 0, 'title', 'المستفيدون'), subtitle: trItem(0, 0, 'subtitle', '٢٥٠ عضو نشط هذا الشهر') },
        { icon: BarChart3, title: trItem(0, 1, 'title', 'تقرير الأثر'), subtitle: trItem(0, 1, 'subtitle', 'معدل إكمال ٧٨٪') },
        { icon: ClipboardCheck, title: trItem(0, 2, 'title', 'نموذج تقييم جديد'), subtitle: trItem(0, 2, 'subtitle', 'أُرسل لـ ٤٠ مستفيداً') },
      ],
    },
    {
      key: 'mentor', label: trLabel('المرشد', 'Mentors'), icon: Users, path: 'mentor-dashboard', link: '/register?role=mentor',
      cta: trField2(1, 'ctaText', tr(1)?.ctaText, '') || undefined,
      headline: trField2(1, 'headline', tr(1)?.headline, 'قدّم إرشادك وشاهد أثره ينعكس مباشرة'),
      benefits: trBenefits(1, [
        'جدولة جلسات إرشاد فردية مع من تختار مرافقتهم',
        'متابعة تقدم كل مستفيد تشرف عليه في مكان واحد',
        'شارك مقالاتك وخبراتك مع مجتمع المنصة',
        'انضم لأي منظمة عبر كود دعوة بسيط',
      ]),
      stats: trStats(1, [{ label: 'مستفيدون', value: '١٨' }, { label: 'جلسات', value: '٦' }, { label: 'تقييم', value: '٤.٩' }]),
      items: [
        { icon: Calendar, title: trItem(1, 0, 'title', 'جلسة اليوم'), subtitle: trItem(1, 0, 'subtitle', '٣:٠٠ مساءً — مع نور') },
        { icon: Users, title: trItem(1, 1, 'title', 'مستفيديّ'), subtitle: trItem(1, 1, 'subtitle', '١٨ شخصاً تحت إرشادك') },
        { icon: FileText, title: trItem(1, 2, 'title', 'مقال جديد'), subtitle: trItem(1, 2, 'subtitle', '١٢٠ مشاهدة هذا الأسبوع') },
      ],
    },
    {
      key: 'coach', label: trLabel('المدرب', 'Coaches'), icon: GraduationCap, path: 'coach-dashboard', link: '/register?role=coach',
      cta: trField2(2, 'ctaText', tr(2)?.ctaText, '') || undefined,
      headline: trField2(2, 'headline', tr(2)?.headline, 'حوّل خبرتك إلى دورات ودخل مستمر'),
      benefits: trBenefits(2, [
        'أنشئ دوراتك التدريبية وانشرها لآلاف المستفيدين',
        'قدّم جلسات مباشرة وتابع التسجيل والحضور',
        'تحليلات أداء تفصيلية لكل دورة ومحتوى',
        'متجرك الخاص لبيع دوراتك مباشرة',
      ]),
      stats: trStats(2, [{ label: 'دورات', value: '٥' }, { label: 'مشتركون', value: '٣٤٠' }, { label: 'دخل', value: '١٫٢k' }]),
      items: [
        { icon: BookOpen, title: trItem(2, 0, 'title', 'دورة التسويق الرقمي'), subtitle: trItem(2, 0, 'subtitle', '٣٤٠ مشترك — ٧٥٪ إكمال') },
        { icon: Video, title: trItem(2, 1, 'title', 'جلسة مباشرة قادمة'), subtitle: trItem(2, 1, 'subtitle', 'غداً — ٥٠ مسجّل') },
        { icon: TrendingUp, title: trItem(2, 2, 'title', 'الأداء هذا الشهر'), subtitle: trItem(2, 2, 'subtitle', '+١٨٪ عن الشهر الماضي') },
      ],
    },
    {
      key: 'beneficiary', label: trLabel('المستفيد', 'Beneficiaries'), icon: BookOpen, path: 'beneficiary-dashboard', link: '/register?role=beneficiary',
      cta: trField2(3, 'ctaText', tr(3)?.ctaText, '') || undefined,
      headline: trField2(3, 'headline', tr(3)?.headline, 'تعلّم، تدرّب، وابنِ مشروعك الخاص'),
      benefits: trBenefits(3, [
        'دورات تدريبية متخصصة تناسب مسارك المهني',
        'جلسات إرشاد فردية مع خبراء في مجالك',
        'متجرك الإلكتروني الخاص لبيع منتجاتك أو خدماتك',
        'تتبع تقدمك الشخصي خطوة بخطوة',
      ]),
      stats: trStats(3, [{ label: 'دورات', value: '٣' }, { label: 'تقدمي', value: '٦٥٪' }, { label: 'الطلبات', value: '١٢' }]),
      items: [
        { icon: BookOpen, title: trItem(3, 0, 'title', 'دورتي الحالية'), subtitle: trItem(3, 0, 'subtitle', 'التسويق الرقمي — ٦٥٪ مكتمل') },
        { icon: ShoppingBag, title: trItem(3, 1, 'title', 'متجري'), subtitle: trItem(3, 1, 'subtitle', '١٢ طلباً هذا الشهر') },
        { icon: Calendar, title: trItem(3, 2, 'title', 'جلستي القادمة'), subtitle: trItem(3, 2, 'subtitle', 'مع المرشدة سارة — غداً') },
      ],
    },
    {
      key: 'market', label: trLabel('المتجر', 'Marketplace'), icon: Store, path: 'market', link: '/market',
      cta: trField2(4, 'ctaText', tr(4)?.ctaText, 'تصفح المتجر'),
      headline: trField2(4, 'headline', tr(4)?.headline, 'تسوّق وبِع داخل مجتمع واحد'),
      benefits: trBenefits(4, [
        'تصفح منتجات وخدمات حقيقية من رواد أعمال في مجتمعنا',
        'افتح متجرك الخاص وابدأ البيع مباشرة من لوحة تحكمك',
        'تواصل مع البائعين مباشرة عبر واتساب لإتمام الطلب',
        'كل الفئات — من المنتجات اليدوية إلى الخدمات الرقمية',
      ]),
      stats: trStats(4, [{ label: 'منتج', value: '٣٢٠' }, { label: 'متجر', value: '٤٥' }, { label: 'طلب هذا الشهر', value: '١١٠' }]),
      items: [
        { icon: ShoppingBag, title: trItem(4, 0, 'title', 'طلب جديد'), subtitle: trItem(4, 0, 'subtitle', 'منتج يدوي — قبل ٥ دقائق') },
        { icon: Store, title: trItem(4, 1, 'title', 'متجر جديد'), subtitle: trItem(4, 1, 'subtitle', 'انضم اليوم') },
        { icon: TrendingUp, title: trItem(4, 2, 'title', 'الأكثر مبيعاً'), subtitle: trItem(4, 2, 'subtitle', 'شمعة معطرة يدوية') },
      ],
    },
  ];

  const ctaBannerAr = cfg?.ctaBanner ?? {
    title: 'جاهز للبدء؟ انضم إلى آلاف المستفيدين',
    subtitle: 'سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح مع EmpowerHub',
    primaryText: 'ابدأ مجاناً الآن',
    secondaryText: 'تجربة المنصة أولاً',
  };
  const ctaBanner = {
    ...ctaBannerAr,
    title: trField('ctaBanner.title', ctaBannerAr.title, 'جاهز للبدء؟ انضم إلى آلاف المستفيدين'),
    subtitle: trField('ctaBanner.subtitle', ctaBannerAr.subtitle, 'سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح مع EmpowerHub'),
  };
  const ctaButtonsBase: CtaButton[] = cfg?.ctaBanner?.buttons !== undefined ? cfg.ctaBanner.buttons : [
    { text: ctaBannerAr.primaryText || 'ابدأ مجاناً الآن', link: '/register', style: 'primary' },
    { text: ctaBannerAr.secondaryText || 'تجربة المنصة أولاً', link: '/try-roles', style: 'outline' },
  ];
  const ctaButtons: CtaButton[] = ctaButtonsBase.map((btn, i) => ({
    ...btn,
    text: trField(`ctaBanner.buttons.${i}.text`, undefined, btn.text),
  }));

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
  const footerDataAr = cfg?.footer ?? {
    description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية في مكان واحد.',
    email: 'info@empowerhub.com', phone: '', twitter: '', linkedin: '', instagram: '',
    copyright: '© 2024 EmpowerHub. جميع الحقوق محفوظة.',
  };
  // In English mode, prefer the admin's English overlay per field; fields
  // with no English translation fall back to the Arabic value (SiteFooter
  // then falls back further to its own generic English label where one
  // exists, e.g. newsletter titles).
  const footerData = lang === 'en'
    ? {
        ...footerDataAr,
        description: getPath(cfg?.translations?.en, 'footer.description') || footerDataAr.description,
        copyright: getPath(cfg?.translations?.en, 'footer.copyright') || footerDataAr.copyright,
        newsletterTitle: getPath(cfg?.translations?.en, 'footer.newsletterTitle') || (footerDataAr as any).newsletterTitle,
        newsletterPlaceholder: getPath(cfg?.translations?.en, 'footer.newsletterPlaceholder') || (footerDataAr as any).newsletterPlaceholder,
        newsletterButton: getPath(cfg?.translations?.en, 'footer.newsletterButton') || (footerDataAr as any).newsletterButton,
        quickLinksTitle: getPath(cfg?.translations?.en, 'footer.quickLinksTitle') || (footerDataAr as any).quickLinksTitle,
        roleLinksTitle: getPath(cfg?.translations?.en, 'footer.roleLinksTitle') || (footerDataAr as any).roleLinksTitle,
        companyLinksTitle: getPath(cfg?.translations?.en, 'footer.companyLinksTitle') || (footerDataAr as any).companyLinksTitle,
        legalLinksTitle: getPath(cfg?.translations?.en, 'footer.legalLinksTitle') || (footerDataAr as any).legalLinksTitle,
      }
    : footerDataAr;

  // Palette applied by position so admin-edited feature lists still get
  // the same varied per-card accent colors as the built-in default.
  const FEATURE_COLORS = [
    'bg-primary/10 text-primary',
    'bg-sky-500/10 text-sky-600',
    'bg-violet-500/10 text-violet-600',
    'bg-amber-500/10 text-amber-600',
    'bg-orange-500/10 text-orange-600',
    'bg-emerald-500/10 text-emerald-600',
    'bg-rose-500/10 text-rose-600',
    'bg-indigo-500/10 text-indigo-600',
  ];
  const featuresData = (cfg?.features?.length ? cfg.features : DEFAULT_PLATFORM_SERVICES)
    .map((f: any, i: number) => ({
      icon: getDynamicIcon(f.icon),
      color: FEATURE_COLORS[i % FEATURE_COLORS.length],
      title: trField(`features.${i}.title`, undefined, f.title),
      description: trField(`features.${i}.description`, undefined, f.description),
      link: f.link || '',
      linkLabel: trField(`features.${i}.linkLabel`, undefined, f.linkLabel || ''),
    }));

  const logoSrc = cfg?.logoUrl || platformLogoFallback;

  return (
    <div className="bg-background text-foreground" dir="rtl">

      <SiteHeader />

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section
          className="grain-overlay relative flex items-center overflow-hidden bg-gradient-to-b from-foreground via-foreground to-primary"
          style={sectionStyle('hero').bg ? { backgroundColor: sectionStyle('hero').bg } : undefined}
        >
          {/* Admin-uploaded background image, tinted by the gradient above so hero text stays readable */}
          {cfg?.hero?.backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
              style={{ backgroundImage: `url(${cfg.hero.backgroundImage})` }}
            />
          )}
          {/* Mesh gradient backdrop */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 right-1/4 w-[600px] h-[600px] bg-primary/25 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 -left-24 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-primary/20 rounded-full blur-[120px]" />
          </div>
          {/* Faint grid, fades toward the edges */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]"
            style={{
              backgroundImage: 'linear-gradient(hsl(0 0% 100% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.4) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          <div className="relative z-10 container py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col items-center max-w-3xl mx-auto text-center">

              {/* Tagline pill */}
              <div className="animate-fade-in-up inline-flex items-center gap-2 text-xs font-medium text-white/80 border border-white/15 rounded-full px-3.5 py-1.5 mb-6 sm:mb-8 bg-white/10 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-white shrink-0" />
                <span className="truncate">{trField('tagline', cfg?.tagline, 'منصة التمكين الرقمي الشاملة')}</span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.08] mb-5 sm:mb-6 text-balance">
                {heroTitle}
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-in-up delay-200 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed mb-8 sm:mb-10 text-balance">
                {heroSubtitle}
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row justify-center gap-3 mb-8 sm:mb-10">
                {heroButtons.map((btn, i) => (
                  <Button
                    key={i}
                    size="lg"
                    variant={btn.style === 'outline' ? 'outline' : 'default'}
                    asChild
                    className={`h-12 px-7 text-base font-semibold rounded-full w-full sm:w-auto ${
                      btn.style === 'outline'
                        ? 'border-white/25 text-white bg-transparent hover:bg-white/10 hover:text-white'
                        : 'bg-white text-foreground hover:bg-white/90 shadow-lg shadow-black/10'
                    }`}
                  >
                    <Link href={btn.link || '/register'}>
                      {btn.text}
                      {btn.style !== 'outline' && <ArrowLeft className="mr-2 h-4 w-4" />}
                    </Link>
                  </Button>
                ))}
              </div>

              {/* Trust strip */}
              <div className="animate-fade-in-up delay-400 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/60 mb-14 sm:mb-16">
                {(lang === 'en'
                  ? ['Completely free to start', 'No credit card required', 'Arabic-first support']
                  : ['مجاني تماماً للبدء', 'لا يتطلب بطاقة ائتمان', 'دعم باللغة العربية']
                ).map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-white shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              {/* ── Interactive product preview — pick a role, see its dashboard ── */}
              <div className="animate-fade-in-up delay-500 w-full flex flex-col items-center">
                <div className="relative w-full max-w-lg">
                  {/* Glow behind card */}
                  <div className="absolute inset-6 bg-white/15 rounded-3xl blur-2xl pointer-events-none" />

                  {/* Browser-less screenshot card */}
                  <div className="relative rounded-2xl bg-card shadow-2xl p-5 flex flex-col gap-4 text-right">
                    {(() => {
                      const tour = tourRoles[activeTour];
                      return (
                        <>
                          {/* Top bar */}
                          <div className="flex items-center justify-between pb-3 border-b border-border">
                            <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                              <tour.icon className="h-4 w-4 text-primary" />
                              لوحة {tour.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-xs text-muted-foreground">نشط</span>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-2">
                            {tour.stats.map((s, si) => (
                              <div key={si} className="bg-muted/50 rounded-xl p-2.5 text-center">
                                <div className="text-lg font-extrabold text-primary tabular-nums leading-none mb-0.5">{s.value}</div>
                                <div className="text-[10px] text-muted-foreground">{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Item rows */}
                          <div className="space-y-2">
                            {tour.items.map((it, ii) => (
                              <div key={ii} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <it.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{it.title}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{it.subtitle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
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

                {/* Role toggle — switches the screenshot above */}
                <div className="mt-8 inline-flex items-center gap-1 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full p-1">
                  {tourRoles.map((r, i) => (
                    <button
                      key={r.key}
                      onClick={() => setActiveTour(i)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                        activeTour === i ? 'bg-white text-foreground shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <r.icon className="h-3.5 w-3.5" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Impact Strip ────────────────────────────────────────────────────── */}
        {sections.showStats && (
          <section
            className="py-10 sm:py-12 border-b border-border"
            style={sectionStyle('stats').bg ? { backgroundColor: sectionStyle('stats').bg } : undefined}
          >
            <div className="container grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-border">
              {statsData.map((s, i) => {
                const StatIcon = getDynamicIcon(s.icon);
                const iconColor = sectionStyle('stats').iconColor;
                return (
                  <div key={i} className="text-center px-3 sm:px-6">
                    <StatIcon className="h-4 w-4 mx-auto mb-2 text-muted-foreground" style={iconColor ? { color: iconColor } : undefined} />
                    <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tabular-nums tracking-tighter mb-1.5">
                      {s.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Product Tour by Role ────────────────────────────────────────────── */}
        {sections.showRoles && (
          <section id="roles" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="text-center mb-10 sm:mb-14">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('roles', 'eyebrow', 'جولة داخل المنصة')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
                  {sh('roles', 'heading', 'منصة واحدة، تجربة مصمّمة لكل دور')}
                </h2>
                <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                  {sh('roles', 'subheading', 'اختر دورك وشاهد كيف تبدو تجربتك داخل EmpowerHub.')}
                </p>
              </div>

              {/* Role tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-10 sm:mb-14">
                {tourRoles.map((r, i) => (
                  <button
                    key={r.key}
                    onClick={() => setActiveTour(i)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      activeTour === i
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <r.icon className="h-4 w-4" />
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Active tour content */}
              {tourRoles.map((tour, i) => activeTour === i && (
                <div key={tour.key} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-5xl mx-auto animate-fade-in-up">
                  {/* Benefits */}
                  <div className="order-2 lg:order-1 text-center lg:text-right">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-5">{tour.headline}</h3>
                    <ul className="space-y-3 mb-6 sm:mb-8">
                      {tour.benefits.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild size="lg" className="h-12 px-7 text-base font-semibold rounded-full bg-gradient-to-t from-primary to-primary/80 hover:to-primary hover:shadow-lg hover:shadow-primary/20 w-full sm:w-auto">
                      <Link href={tour.link}>
                        {(tour as { cta?: string }).cta || `ابدأ كـ${tour.label}`}
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* Dashboard preview mockup */}
                  <div className="order-1 lg:order-2">
                    <div className="relative rounded-2xl bg-card shadow-2xl overflow-hidden">
                      {/* Browser chrome */}
                      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        <span className="mr-3 text-[11px] text-muted-foreground font-mono truncate">
                          empowerhub.thinkndigital.com/{tour.path}
                        </span>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2">
                          {tour.stats.map((s, si) => (
                            <div key={si} className="bg-muted/50 rounded-xl p-2.5 text-center">
                              <div className="text-lg font-extrabold text-primary tabular-nums leading-none mb-0.5">{s.value}</div>
                              <div className="text-[10px] text-muted-foreground">{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {/* Item rows */}
                        <div className="space-y-2">
                          {tour.items.map((it, ii) => (
                            <div key={ii} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <it.icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{it.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{it.subtitle}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── AI Spotlight (dark) ──────────────────────────────────────────────── */}
        {sections.showAISpotlight && (
        <section className="grain-overlay relative overflow-hidden bg-foreground py-16 sm:py-20 md:py-28">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/25 rounded-full blur-[140px]" />
          </div>
          <div className="relative container">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {trField('aiSpotlight.eyebrow', cfg?.aiSpotlight?.eyebrow, 'مدعوم بالذكاء الاصطناعي')}
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] mb-4 text-balance">
                <span className="text-white">{trField('aiSpotlight.heading', cfg?.aiSpotlight?.heading, 'توصيات ذكية تسبقك خطوة.')}</span>
              </h2>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                {trField('aiSpotlight.subheading', cfg?.aiSpotlight?.subheading, 'يحلل EmpowerHub تقدمك وأهدافك ليقترح عليك الدورة، المرشد، أو الفرصة التالية — بدل أن تبحث عنها بنفسك.')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{trField('aiSpotlight.cards.0.title', cfg?.aiSpotlight?.cards?.[0]?.title, 'مسار تعلّم مخصص')}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{trField('aiSpotlight.cards.0.description', cfg?.aiSpotlight?.cards?.[0]?.description, 'يقترح عليك الدورات والجلسات الأنسب لهدفك ومستواك الحالي، ويحدّثها كلما تقدمت.')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{trField('aiSpotlight.cards.1.title', cfg?.aiSpotlight?.cards?.[1]?.title, 'تحليلات تقدم واضحة')}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{trField('aiSpotlight.cards.1.description', cfg?.aiSpotlight?.cards?.[1]?.description, 'تقارير مرئية تُظهر ما أنجزته وما تحتاج التركيز عليه بعد ذلك — لا أرقام مبعثرة.')}</p>
              </div>
            </div>
          </div>
        </section>
        )}


        {/* ── All Platform Services ────────────────────────────────────────────── */}
        {sections.showFeatures && (
        <section id="services" className="py-16 sm:py-20 md:py-28 bg-muted/30">
          <div className="container">
            <div className="mb-10 sm:mb-14">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {sh('features', 'eyebrow', 'ما تقدمه المنصة')}
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground leading-[1.1] mb-3 text-balance">
                {sh('features', 'heading', 'كل ما تحتاجه لبناء مستقبلك في مكان واحد')}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
                {sh('features', 'subheading', 'منصة متكاملة تجمع التدريب، الإرشاد، المشاريع، والتجارة — كل شيء تحتاجه في رحلة تمكينك الرقمي.')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuresData.map((svc: any, i: number) => {
                const cardClass = "group p-6 rounded-3xl bg-card hover:shadow-lg transition-shadow duration-200 flex flex-col gap-4";
                const cardContent = (
                  <>
                    <div className={`h-11 w-11 rounded-2xl ${svc.color} flex items-center justify-center shrink-0`}>
                      <svc.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {svc.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{svc.description}</p>
                    </div>
                    {svc.linkLabel && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-auto">
                        {svc.linkLabel}
                        <ArrowLeft className="h-3 w-3" />
                      </div>
                    )}
                  </>
                );
                return svc.link ? (
                  <Link key={i} href={svc.link} className={cardClass}>{cardContent}</Link>
                ) : (
                  <div key={i} className={cardClass}>{cardContent}</div>
                );
              })}
            </div>
          </div>
        </section>
        )}

        {/* ── Expert Preview ──────────────────────────────────────────────────── */}
        {(sections.showMentors || sections.showCoaches) && (
          <section id="experts" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              {/* Section header */}
              <div className="text-center mb-10 sm:mb-14">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('experts', 'eyebrow', 'فريق الخبراء')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-4 text-balance">{sh('experts', 'heading', 'تعلم من الأفضل')}</h2>
                <div className="flex flex-wrap justify-center gap-2">
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
                    <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {[...Array(4)].map((_, i) => <div key={i} className="w-[82vw] sm:w-72 shrink-0 h-52 rounded-2xl bg-muted animate-pulse" />)}
                    </div>
                  ) : mentors.length > 0 ? (
                    <AutoCarousel count={mentors.length}>
                      {mentors.map(m => (
                        <div key={m.id} className="w-[82vw] sm:w-72 shrink-0 snap-start" dir="rtl">
                          <ExpertCard expert={m} role="mentor" currencySymbol={currencySymbol} onBook={() => { setBookingHost(m); setBookingRole('mentor'); }} />
                        </div>
                      ))}
                    </AutoCarousel>
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
                    <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {[...Array(4)].map((_, i) => <div key={i} className="w-[82vw] sm:w-72 shrink-0 h-52 rounded-2xl bg-muted animate-pulse" />)}
                    </div>
                  ) : coaches.length > 0 ? (
                    <AutoCarousel count={coaches.length}>
                      {coaches.map(c => (
                        <div key={c.id} className="w-[82vw] sm:w-72 shrink-0 snap-start" dir="rtl">
                          <ExpertCard expert={c} role="coach" currencySymbol={currencySymbol} onBook={() => { setBookingHost(c); setBookingRole('coach'); }} />
                        </div>
                      ))}
                    </AutoCarousel>
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
              <div className="text-center mb-10 sm:mb-12">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('courses', 'eyebrow', 'الدورات التدريبية')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-4 text-balance">
                  {sh('courses', 'heading', 'طور مهاراتك مع دوراتنا')}
                </h2>
                {!loadingCourses && courses.length > 0 && (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="inline-flex items-center gap-0.5 bg-muted/70 rounded-lg p-0.5 border border-border/50">
                      {(['all', 'free', 'paid'] as const).map(f => (
                        <button key={f} onClick={() => setCourseFilter(f)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${courseFilter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          {f === 'all' ? 'الكل' : f === 'free' ? 'مجاني' : 'مدفوع'}
                        </button>
                      ))}
                    </div>
                    {(() => {
                      const cats = Array.from(new Set(courses.map(c => c.category).filter(Boolean))) as string[];
                      return cats.length > 1 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button onClick={() => setCourseCategoryFilter('الكل')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${courseCategoryFilter === 'الكل' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                            كل الفئات
                          </button>
                          {cats.map(cat => (
                            <button key={cat} onClick={() => setCourseCategoryFilter(cat)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${courseCategoryFilter === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              {cat}
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
              {loadingCourses ? (
                <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-[82vw] sm:w-72 shrink-0 h-60 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">لا توجد دورات بعد.</p>
                </div>
              ) : (() => {
                const filtered = courses.filter(c => {
                  if (courseCategoryFilter !== 'الكل' && c.category !== courseCategoryFilter) return false;
                  if (courseFilter === 'free') return c.price === 0 || c.price == null;
                  if (courseFilter === 'paid') return c.price != null && c.price > 0;
                  return true;
                });
                return filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">لا توجد دورات مطابقة حالياً.</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filtered.map(c => (
                      <div key={c.id} className="w-[82vw] sm:w-72 shrink-0 snap-start">
                        <CourseCard course={c} currencySymbol={currencySymbol} onEnroll={setSelectedCourse} />
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="text-center mt-8">
                <Button asChild variant="outline">
                  <Link href="/courses">عرض جميع الدورات</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ── Public Sessions ─────────────────────────────────────────────────── */}
        {sections.showSessions && publicSessions.length > 0 && (
          <section id="sessions" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-8 sm:mb-10">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('sessions', 'eyebrow', 'جلسات إرشادية')}
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">{sh('sessions', 'heading', 'الجلسات المتاحة')}</h2>
                <div className="inline-flex items-center gap-0.5 bg-background rounded-lg p-0.5 border border-border/50">
                  {(['all', 'free', 'paid'] as const).map(f => (
                    <button key={f} onClick={() => setSessionFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sessionFilter === f ? 'bg-muted shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      {f === 'all' ? 'الكل' : f === 'free' ? 'مجاني' : 'مدفوع'}
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const filtered = publicSessions.filter(s => {
                  if (sessionFilter === 'free') return s.price === 0 || s.price == null;
                  if (sessionFilter === 'paid') return s.price != null && s.price > 0;
                  return true;
                });
                return filtered.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">لا توجد جلسات {sessionFilter === 'free' ? 'مجانية' : 'مدفوعة'} حالياً.</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filtered.map(s => (
                      <div key={s.id} className="w-[82vw] sm:w-72 shrink-0 snap-start">
                        <PublicSessionCard session={s} currencySymbol={currencySymbol} onBook={() => setSelectedSession(s)} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* ── Marketplace Preview ─────────────────────────────────────────────── */}
        {sections.showProducts && (
          <section id="marketplace" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-10 sm:mb-12">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('products', 'eyebrow', 'متجر المجتمع')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-4 text-balance">{sh('products', 'heading', 'منتجات من مجتمعنا')}</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/market">
                    تصفح جميع المنتجات
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {loadingProducts ? (
                <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-[46vw] sm:w-64 shrink-0 h-64 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm mb-4">لا توجد منتجات بعد. كن أول من يضيف منتجه!</p>
                  <Button asChild size="sm"><Link href="/register">ابدأ الآن</Link></Button>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {products.map(p => (
                    <div key={p.id} className="w-[46vw] sm:w-64 shrink-0 snap-start">
                      <ProductCard product={p} currencySymbol={currencySymbol} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Stores ──────────────────────────────────────────────────────────── */}
        {sections.showStores && publicStores.length > 0 && (
          <section id="stores" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="text-center mb-10 sm:mb-12">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('stores', 'eyebrow', 'رواد الأعمال')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground text-balance">{sh('stores', 'heading', 'متاجر مجتمعنا')}</h2>
              </div>
              {loadingStores ? (
                <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-[82vw] sm:w-72 shrink-0 h-48 rounded-3xl bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {publicStores.map(store => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug || store.id}`}
                      className="group w-[82vw] sm:w-72 shrink-0 snap-start rounded-3xl bg-card overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Cover */}
                      <div className="relative h-28 bg-muted overflow-hidden">
                        {store.coverUrl ? (
                          <img src={store.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
                        )}
                      </div>

                      <div className="p-4 pt-0">
                        {/* Logo overlapping cover */}
                        <div className="h-16 w-16 -mt-8 rounded-2xl overflow-hidden shrink-0 border-4 border-card bg-primary/10 flex items-center justify-center shadow-md">
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="h-full w-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Store className="h-6 w-6 text-primary" />
                          )}
                        </div>

                        <div className="mt-3 min-w-0">
                          <p className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">{store.name}</p>
                          {store.beneficiaryName && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">بإدارة {store.beneficiaryName}</p>
                          )}
                          {store.location && (
                            <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />{store.location}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-3 pt-3 border-t border-border/60">
                          تسوّق الآن
                          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Pricing ──────────────────────────────────────────────────────────── */}
        {sections.showPricing && plans.length > 0 && (
          <section id="pricing" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-8 sm:mb-10">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('pricing', 'eyebrow', 'خطط الأسعار')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground text-balance">{sh('pricing', 'heading', 'اختر الخطة المناسبة لك')}</h2>
              </div>

              {/* Billing cycle toggle */}
              {plans.some(p => p.priceAnnual > 0 && p.priceMonthly > 0) && (
                <div className="flex justify-center mb-10 sm:mb-12">
                  <div className="inline-flex items-center gap-0.5 bg-card rounded-full p-1 border border-border shadow-sm">
                    <button
                      onClick={() => setPricingCycle('monthly')}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${pricingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      شهري
                    </button>
                    <button
                      onClick={() => setPricingCycle('annual')}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${pricingCycle === 'annual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      سنوي
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${pricingCycle === 'annual' ? 'bg-primary-foreground/20' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        وفّر
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center items-stretch gap-6 max-w-5xl mx-auto">
                {plans.map(plan => {
                  const PlanIcon = { Star, Zap, Building2, Crown }[plan.icon] || Star;
                  const savings = plan.priceAnnual > 0 && plan.priceMonthly > 0
                    ? Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)
                    : 0;
                  const showAnnual = pricingCycle === 'annual' && plan.priceAnnual > 0;
                  const displayPrice = showAnnual ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
                  return (
                    <div
                      key={plan.id}
                      className={`relative w-full sm:w-80 rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-300 ${
                        plan.highlighted
                          ? 'grain-overlay bg-gradient-to-br from-primary via-primary to-violet-600 shadow-xl sm:-translate-y-2'
                          : 'bg-muted/50 hover:shadow-lg'
                      }`}
                    >
                      {plan.highlighted && (
                        <span className="relative z-10 self-center -mt-2 mb-3 bg-white text-foreground text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                          الأكثر شعبية
                        </span>
                      )}
                      <div className={`relative z-10 h-11 w-11 rounded-2xl flex items-center justify-center mb-4 ${plan.highlighted ? 'bg-white/15' : 'bg-background'}`}>
                        <PlanIcon className={`h-5 w-5 ${plan.highlighted ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <h3 className={`relative z-10 font-bold text-lg mb-4 ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                      <div className="relative z-10 mb-4">
                        {plan.priceMonthly === 0 ? (
                          <p className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>مجاني</p>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-3xl font-bold tabular-nums ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>{displayPrice.toLocaleString()}</span>
                              <span className={`text-sm ${plan.highlighted ? 'text-white/60' : 'text-muted-foreground'}`}>{plan.currency}/شهر</span>
                            </div>
                            {savings > 0 && (
                              <p className={`text-xs mt-1 ${plan.highlighted ? 'text-white/60' : 'text-muted-foreground'}`}>
                                {showAnnual
                                  ? <>يُحتسب {plan.priceAnnual.toLocaleString()} {plan.currency} سنوياً {' '}<span className={`font-medium ${plan.highlighted ? 'text-white' : 'text-emerald-600'}`}>(وفّرت {savings}%)</span></>
                                  : <>أو {plan.priceAnnual.toLocaleString()} {plan.currency}/سنة {' '}<span className={plan.highlighted ? 'text-white' : 'text-emerald-600'}>(وفر {savings}%)</span></>}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {plan.description && <p className={`relative z-10 text-sm mb-5 ${plan.highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>{plan.description}</p>}
                      <ul className="relative z-10 space-y-2.5 mb-6 flex-1">
                        {(plan.features || []).map((f, i) => (
                          <li key={i} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-white/90' : 'text-foreground'}`}>
                            <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-white' : 'text-primary'}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        className={`relative z-10 w-full rounded-full ${plan.highlighted ? 'bg-white text-foreground hover:bg-white/90' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                      >
                        <Link href={`/register?role=organization&plan=${plan.key}`}>ابدأ الآن</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Testimonials ────────────────────────────────────────────────────── */}
        {sections.showTestimonials && testimonialsData.length > 0 && (
          <section className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-12 sm:mb-16">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('testimonials', 'eyebrow', 'قصص النجاح')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground text-balance">{sh('testimonials', 'heading', 'ماذا يقول مجتمعنا')}</h2>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {testimonialsData.map((t, i) => (
                  <div key={i} className="group relative w-[82vw] sm:w-80 lg:w-96 shrink-0 snap-start flex flex-col gap-4 sm:gap-5 p-6 sm:p-7 rounded-2xl bg-card transition-shadow duration-300 hover:shadow-xl">
                    <span className="absolute top-5 left-6 text-6xl font-serif leading-none text-primary/10 select-none pointer-events-none" aria-hidden="true">&rdquo;</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(5, Math.max(1, t.stars)) }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <blockquote className="relative text-lg text-foreground leading-relaxed font-medium flex-grow">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/60">
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

        {/* ── Latest Articles ─────────────────────────────────────────────────── */}
        {sections.showBlog && latestArticles.length > 0 && (
          <section id="articles" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-10 sm:mb-12">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('blog', 'eyebrow', 'رؤى ومعرفة')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-4 text-balance">
                  {sh('blog', 'heading', 'أحدث المقالات')}
                </h2>
                <Link href="/articles" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  عرض جميع المقالات <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {latestArticles.map(article => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="group w-[82vw] sm:w-72 shrink-0 snap-start rounded-3xl bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{article.excerpt}</p>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Tag className="h-2 w-2" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                        <span>{article.authorName}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{article.readTime} د
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Latest Projects / Opportunities ─────────────────────────────────── */}
        {sections.showOpportunities && latestProjects.length > 0 && (
          <section
            id="opportunities-live"
            className="py-16 sm:py-20 md:py-28"
            style={sectionStyle('opportunities').bg ? { backgroundColor: sectionStyle('opportunities').bg } : undefined}
          >
            <div className="container">
              <div className="text-center mb-10 sm:mb-12">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('opportunities', 'eyebrow', 'فرص حقيقية')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-4 text-balance">
                  {sh('opportunities', 'heading', 'أحدث الفرص والمشاريع')}
                </h2>
                <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  عرض جميع الفرص <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {latestProjects.map(project => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group w-[82vw] sm:w-72 shrink-0 snap-start rounded-3xl bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      {project.coverImageUrl ? (
                        <img
                          src={project.coverImageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Briefcase
                            className="h-8 w-8 text-primary/20"
                            style={sectionStyle('opportunities').iconColor ? { color: sectionStyle('opportunities').iconColor, opacity: 0.5 } : undefined}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {project.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{project.description}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border">
                        {project.organizationName && (
                          <span className="flex items-center gap-1">{project.organizationName}</span>
                        )}
                        {project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{project.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Success Stories ──────────────────────────────────────────────────── */}
        {sections.showSuccessStories && successStories.length > 0 && (
          <section id="success-stories" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="text-center mb-12 sm:mb-16">
                <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {sh('successStories', 'eyebrow', 'إلهام حقيقي')}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-3 text-balance">
                  {sh('successStories', 'heading', 'قصص نجاح من مجتمعنا')}
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                  {sh('successStories', 'subheading', 'أشخاص حقيقيون غيّروا مساراتهم بفضل التدريب والإرشاد والدعم.')}
                </p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {successStories.map(story => (
                  <div
                    key={story.id}
                    className="group w-[82vw] sm:w-80 shrink-0 snap-start rounded-3xl bg-card p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${j < story.stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`}
                        />
                      ))}
                    </div>
                    {/* Quote */}
                    <blockquote className="text-sm text-foreground leading-relaxed flex-1 font-medium">
                      &ldquo;{story.content}&rdquo;
                    </blockquote>
                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      {story.avatarUrl ? (
                        <img
                          src={story.avatarUrl}
                          alt={story.beneficiaryName}
                          className="h-10 w-10 rounded-full object-cover shrink-0 border border-border"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {story.beneficiaryName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{story.beneficiaryName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {story.beneficiaryRole}
                          {story.beneficiaryRole && story.orgName ? ' · ' : ''}
                          {story.orgName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
        {sections.showFAQ && (
        <section id="faq" className="py-16 sm:py-20 md:py-28">
          <div className="container max-w-3xl">
            <div className="text-center mb-10 sm:mb-14">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {lang === 'en' ? 'FAQ' : 'الأسئلة الشائعة'}
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground text-balance">{lang === 'en' ? 'Everything you need to know' : 'كل ما تحتاج معرفته'}</h2>
            </div>
            {(() => {
              const faqItems = cfg?.faq?.length ? cfg.faq.map((f, i) => ({
                q: trField(`faq.${i}.question`, undefined, f.question),
                a: trField(`faq.${i}.answer`, undefined, f.answer),
              })) : [
                {
                  q: 'هل يمكنني تجربة المنصة مجاناً؟',
                  a: 'نعم، يمكنك إنشاء حساب والبدء فوراً بدون بطاقة ائتمان. المنظمات التي تختار خطة مدفوعة تحصل على فترة تجريبية كاملة المزايا قبل تفعيل الاشتراك.',
                },
                {
                  q: 'من يمكنه استخدام EmpowerHub؟',
                  a: 'المنصة مصممة لأربعة أدوار: المنظمات وغير الربحية لإدارة برامج التمكين، المرشدون لتقديم الإرشاد الفردي، المدربون لنشر الدورات والجلسات، والمستفيدون للتعلم وبناء مشاريعهم الخاصة.',
                },
                {
                  q: 'هل يمكنني إطلاق متجري الإلكتروني الخاص؟',
                  a: 'نعم، كل مستفيد ومدرب يمكنه فتح متجره الخاص من لوحة التحكم وعرض منتجاته أو خدماته مباشرة لمجتمع المنصة.',
                },
                {
                  q: 'هل بياناتي وحسابي آمنان؟',
                  a: 'تعتمد المنصة على بنية تحتية آمنة لإدارة الحسابات والبيانات، مع صلاحيات دقيقة لكل دور بحيث لا يرى أحد إلا ما يخصه.',
                },
                {
                  q: 'هل يمكن للمنظمة تغيير خطتها أو ترقيتها لاحقاً؟',
                  a: 'نعم، يمكن لمدير المنظمة متابعة تفاصيل الاشتراك والترقية إلى خطة أعلى في أي وقت من إعدادات لوحة تحكم المنظمة.',
                },
                {
                  q: 'هل المنصة تدعم اللغة العربية بالكامل؟',
                  a: 'المنصة مصممة أساساً باللغة العربية بواجهة من اليمين لليسار (RTL)، من التسجيل وحتى كل تفاصيل لوحات التحكم.',
                },
              ];
              return (
                <Accordion type="single" collapsible defaultValue="faq-0" className="rounded-3xl bg-muted/40 px-5 sm:px-7">
                  {faqItems.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className={i === faqItems.length - 1 ? 'border-b-0' : ''}>
                      <AccordionTrigger className="text-right text-sm sm:text-base hover:no-underline [&>svg]:text-primary">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              );
            })()}
          </div>
        </section>
        )}

        {/* ── Contact ─────────────────────────────────────────────────────────── */}
        {sections.showContact && (
          <section id="contact" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {sh('contact', 'eyebrow', 'تواصل معنا')}
                  </p>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-foreground mb-3 sm:mb-4 text-balance">
                    {sh('contact', 'heading', 'كيف يمكننا مساعدتك؟')}
                  </h2>
                  <p className="text-muted-foreground mb-8 sm:mb-10 leading-relaxed text-sm sm:text-base">
                    {sh('contact', 'subheading', 'نحن هنا للإجابة على استفساراتك ومساعدتك في كل خطوة.')}
                  </p>
                  <div className="space-y-4 sm:space-y-5">
                    {contactInfo.phone && (
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
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
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
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

                <div className="p-5 sm:p-6 rounded-3xl bg-card">
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
          <section
            className={`relative overflow-hidden py-16 sm:py-20 md:py-28 ${cfg?.ctaBanner?.backgroundColor ? 'text-white' : 'bg-foreground text-background'}`}
            style={cfg?.ctaBanner?.backgroundColor ? { backgroundColor: cfg.ctaBanner.backgroundColor } : undefined}
          >
            {!cfg?.ctaBanner?.backgroundColor && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[140px]" />
              </div>
            )}
            <div className="relative container text-center">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight text-balance">
                {ctaBanner.title}
              </h2>
              <p className={`text-sm sm:text-base md:text-lg mb-7 sm:mb-9 max-w-xl mx-auto leading-relaxed ${cfg?.ctaBanner?.backgroundColor ? 'text-white/70' : 'text-background/60'}`}>
                {ctaBanner.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {ctaButtons.map((btn, i) => btn.style === 'outline' ? (
                  <Button
                    key={i}
                    size="lg"
                    variant="outline"
                    asChild
                    className={`h-12 px-7 text-base rounded-full w-full sm:w-auto ${cfg?.ctaBanner?.backgroundColor ? 'border-white/30 text-white hover:bg-white/10' : 'border-background/30 text-background hover:bg-background/10'}`}
                  >
                    <Link href={btn.link || '/try-roles'}>{btn.text}</Link>
                  </Button>
                ) : (
                  <Button key={i} size="lg" variant="secondary" asChild className="h-12 px-7 text-base font-semibold text-foreground rounded-full w-full sm:w-auto">
                    <Link href={btn.link || '/register'}>
                      {btn.text}
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
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

      {selectedSession && (
        <SessionBookingDialog
          isOpen={!!selectedSession}
          onOpenChange={open => { if (!open) setSelectedSession(null); }}
          hostId={selectedSession.hostId}
          hostName={selectedSession.hostName}
          hostRole="mentor"
          sessionPrice={selectedSession.price ?? 0}
        />
      )}

      <SiteFooter siteName={cfg?.siteName} footerData={footerData} logoUrl={logoSrc} />
    </div>
  );
}
