"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/logo';
import { SiteHeader } from '@/components/site-header';
import {
  ArrowLeft, BookOpen, Store, GraduationCap, CheckCircle,
  Star, MessageSquare, Phone, Mail, Globe, Calendar, Clock,
  Tag, MapPin, FileText, Briefcase, Video, Building2, Users, BarChart3,
  Zap, Crown, Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { applyOrgColor } from '@/lib/apply-org-color';
import { getDynamicIcon } from '@/lib/dynamic-icons';
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
  ctaBanner: { title: string; subtitle: string; primaryText: string; secondaryText: string; backgroundColor?: string };
  roles: { title: string; description: string; icon: string; badge: string; link: string }[];
  sectionStyles?: Record<string, { bg?: string; iconColor?: string }>;
  sections: {
    showStats: boolean; showFeatures: boolean; showOpportunities: boolean; showHowItWorks: boolean;
    showRoles: boolean; showMentors: boolean; showCoaches: boolean; showCourses: boolean; showBlog: boolean;
    showTestimonials: boolean; showProducts: boolean; showStores: boolean; showPricing: boolean; showContact: boolean; showCTA: boolean;
  };
  footer: { description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string; copyright: string };
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
    <div dir="rtl" className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
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
      <div className="px-3 py-3 flex flex-col items-center gap-1">
        <Link href={profileLink} className="font-bold text-sm text-foreground text-center leading-snug hover:text-primary transition-colors">
          {name}
        </Link>
        {(() => {
          const specs = Array.isArray(expert.specializations)
            ? expert.specializations
            : typeof expert.specializations === 'string' && expert.specializations
            ? [expert.specializations]
            : [];
          return specs.length > 0 ? (
            <p className="text-xs text-muted-foreground text-center line-clamp-1">
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
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
  }, [active, count]);

  const dotCount = Math.min(count, 8);
  return (
    <div>
      <div
        ref={containerRef}
        dir="ltr"
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

const PublicSessionCard = ({ session, currencySymbol, onBook }: { session: PublicSession; currencySymbol: string; onBook?: () => void }) => {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const isFree = session.price === 0 || session.price == null;
  return (
    <div className="group rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all flex flex-col overflow-hidden">
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

export default function LandingPage() {
  const { toast } = useToast();
  const { symbol: currencySymbol } = useCurrency();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [coaches, setCoaches] = useState<MentorUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [publicStores, setPublicStores] = useState<{ id: string; name: string; logoUrl?: string; location?: string; beneficiaryName?: string }[]>([]);
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [selectedSession, setSelectedSession] = useState<PublicSession | null>(null);
  const [bookingHost, setBookingHost] = useState<MentorUser | null>(null);
  const [bookingRole, setBookingRole] = useState<'mentor' | 'coach'>('mentor');
  const [courseFilter, setCourseFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'free' | 'paid'>('all');

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
    ...(cfg?.sections ?? {}),
  };

  const sectionStyle = (key: string) => cfg?.sectionStyles?.[key] || {};

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
    { name: 'سارة أحمد', role: 'مستفيدة - رائدة أعمال', text: 'بفضل EmpowerHub، تمكنت من إطلاق متجري الإلكتروني وتحقيق أول ألف دينار خلال شهرين فقط. الدعم والتدريب كانا استثنائيين!', stars: 5 },
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

  const platformServices = [
    {
      icon: BookOpen,
      color: 'bg-primary/10 text-primary',
      title: 'الدورات التدريبية',
      description: 'محتوى تدريبي متخصص من مدربين معتمدين في مختلف المجالات — من المهارات الرقمية إلى ريادة الأعمال.',
      link: '#courses',
      linkLabel: 'استعرض الدورات',
    },
    {
      icon: Video,
      color: 'bg-sky-500/10 text-sky-600',
      title: 'الجلسات المباشرة',
      description: 'حضور مباشر مع المدربين في جلسات تفاعلية مباشرة — سجّل مقدماً واحصل على تجربة تدريبية حقيقية.',
      link: '/live-sessions',
      linkLabel: 'اكتشف الجلسات',
    },
    {
      icon: GraduationCap,
      color: 'bg-violet-500/10 text-violet-600',
      title: 'الإرشاد الشخصي',
      description: 'تواصل مع مرشد متخصص يساعدك على رسم مسارك المهني وتجاوز التحديات بتوجيه فردي مثمر.',
      link: '#experts',
      linkLabel: 'تعرف على المرشدين',
    },
    {
      icon: Calendar,
      color: 'bg-amber-500/10 text-amber-600',
      title: 'جلسات الإرشاد الجماعية',
      description: 'جلسات مجدولة مفتوحة للمجتمع — احجز مقعدك وانضم إلى نقاشات وورش عمل تفاعلية مع الخبراء.',
      link: '#sessions',
      linkLabel: 'احجز جلسة',
    },
    {
      icon: Briefcase,
      color: 'bg-orange-500/10 text-orange-600',
      title: 'الفرص والمشاريع',
      description: 'اكتشف فرص عمل، مشاريع تطوعية، وشراكات من منظمات موثوقة تبحث عن مواهب مجتمعنا.',
      link: '/projects',
      linkLabel: 'استعرض الفرص',
    },
    {
      icon: FileText,
      color: 'bg-emerald-500/10 text-emerald-600',
      title: 'المقالات والمعرفة',
      description: 'اقرأ مقالات عملية ورؤى من خبراء المنصة في التسويق الرقمي، ريادة الأعمال، والتطوير المهني.',
      link: '/articles',
      linkLabel: 'اقرأ المقالات',
    },
    {
      icon: Store,
      color: 'bg-rose-500/10 text-rose-600',
      title: 'المتجر الإلكتروني',
      description: 'تصفح منتجات حقيقية من رواد أعمال في مجتمعنا — يدوية، رقمية، وخدمات متنوعة بأسعار مناسبة.',
      link: '/market',
      linkLabel: 'تسوق الآن',
    },
    {
      icon: Building2,
      color: 'bg-indigo-500/10 text-indigo-600',
      title: 'إدارة برامج التمكين',
      description: 'للمنظمات والجمعيات: أدر مستفيديك، وزّع الدورات والجلسات، وتابع التقدم بتقارير تفصيلية.',
      link: '/register?role=organization',
      linkLabel: 'للمنظمات',
    },
  ];

  const logoSrc = cfg?.logoUrl || '';

  return (
    <div className="bg-background text-foreground" dir="rtl">

      <SiteHeader />

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section
          className="relative min-h-[85vh] lg:min-h-screen flex items-center overflow-hidden bg-background"
          style={sectionStyle('hero').bg ? { backgroundColor: sectionStyle('hero').bg } : undefined}
        >
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
          <section
            className="border-y border-border"
            style={sectionStyle('stats').bg ? { backgroundColor: sectionStyle('stats').bg } : undefined}
          >
            {/* gap-px + bg-border creates 1px dividers in all directions regardless of RTL */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {statsData.map((s, i) => {
                const StatIcon = getDynamicIcon(s.icon);
                const iconColor = sectionStyle('stats').iconColor;
                return (
                  <div
                    key={i}
                    className={`text-center py-8 sm:py-10 px-4 sm:px-6 ${sectionStyle('stats').bg ? '' : 'bg-card'}`}
                    style={sectionStyle('stats').bg ? { backgroundColor: sectionStyle('stats').bg } : undefined}
                  >
                    <StatIcon className="h-5 w-5 mx-auto mb-2 text-primary" style={iconColor ? { color: iconColor } : undefined} />
                    <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tabular-nums tracking-tight mb-1.5">
                      {s.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Features ─────────────────────────────────────────────────────────── */}
        {sections.showFeatures && featuresData.length > 0 && (
          <section
            className="py-16 sm:py-20 md:py-28"
            style={sectionStyle('features').bg ? { backgroundColor: sectionStyle('features').bg } : undefined}
          >
            <div className="container">
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">لماذا EmpowerHub</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">مميزات تصنع فرقاً حقيقياً</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuresData.map((f, i) => {
                  const FeatureIcon = getDynamicIcon(f.icon);
                  const iconColor = sectionStyle('features').iconColor;
                  return (
                    <div key={i} className="p-6 rounded-2xl border border-border bg-card">
                      <FeatureIcon className="h-6 w-6 mb-3 text-primary" style={iconColor ? { color: iconColor } : undefined} />
                      <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── How It Works ────────────────────────────────────────────────────── */}
        {sections.showHowItWorks && howItWorksData.length > 0 && (
          <section
            id="how-it-works"
            className="py-16 sm:py-20 md:py-28"
            style={sectionStyle('howItWorks').bg ? { backgroundColor: sectionStyle('howItWorks').bg } : undefined}
          >
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
                {howItWorksData.map((item, i) => {
                  const StepIcon = getDynamicIcon(item.icon);
                  const iconColor = sectionStyle('howItWorks').iconColor;
                  return (
                    <div key={i} className="flex flex-col">
                      {/* Giant ghost number */}
                      <span className="text-8xl sm:text-9xl md:text-[8rem] lg:text-[9rem] font-extrabold text-foreground/[0.06] leading-none select-none tabular-nums mb-4">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {/* Step content — overlaps the number slightly */}
                      <div className="-mt-4 sm:-mt-6">
                        <StepIcon className="h-6 w-6 mb-2 text-primary" style={iconColor ? { color: iconColor } : undefined} />
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── All Platform Services ────────────────────────────────────────────── */}
        <section id="services" className="py-16 sm:py-20 md:py-28 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">ما تقدمه المنصة</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                كل ما تحتاجه لبناء مستقبلك في مكان واحد
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                منصة متكاملة تجمع التدريب، الإرشاد، المشاريع، والتجارة — كل شيء تحتاجه في رحلة تمكينك الرقمي.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {platformServices.map((svc, i) => (
                <Link
                  key={i}
                  href={svc.link}
                  className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col gap-4"
                >
                  <div className={`h-10 w-10 rounded-xl ${svc.color} flex items-center justify-center shrink-0`}>
                    <svc.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{svc.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-auto">
                    {svc.linkLabel}
                    <ArrowLeft className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Roles / Join ────────────────────────────────────────────────────── */}
        {sections.showRoles && rolesData.length > 0 && (
          <section
            id="roles"
            className="py-16 sm:py-20 md:py-28"
            style={sectionStyle('roles').bg ? { backgroundColor: sectionStyle('roles').bg } : undefined}
          >
            <div className="container">
              <div className="text-center mb-10 sm:mb-14">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">انضم إلينا</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  ما دورك في منظومة التمكين؟
                </h2>
                <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                  سواء كنت تسعى للتعلم، أو تملك خبرة تشاركها، أو تقود منظمة — هناك مكان لك هنا.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesData.map((role, i) => {
                  const RoleIcon = getDynamicIcon(role.icon);
                  const iconColor = sectionStyle('roles').iconColor;
                  return (
                    <Link
                      key={i}
                      href={role.link || '/register'}
                      className="group p-5 rounded-2xl border border-border hover:border-primary/40 bg-card transition-all flex flex-col gap-3"
                    >
                      <RoleIcon className="h-6 w-6 text-primary" style={iconColor ? { color: iconColor } : undefined} />
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
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">فريق الخبراء</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">تعلم من الأفضل</h2>
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
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">الدورات التدريبية</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  طور مهاراتك مع دوراتنا
                </h2>
                {!loadingCourses && courses.length > 0 && (
                  <div className="inline-flex items-center gap-0.5 bg-muted/70 rounded-lg p-0.5 border border-border/50">
                    {(['all', 'free', 'paid'] as const).map(f => (
                      <button key={f} onClick={() => setCourseFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${courseFilter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        {f === 'all' ? 'الكل' : f === 'free' ? 'مجاني' : 'مدفوع'}
                      </button>
                    ))}
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
                  if (courseFilter === 'free') return c.price === 0 || c.price == null;
                  if (courseFilter === 'paid') return c.price != null && c.price > 0;
                  return true;
                });
                return filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">لا توجد دورات {courseFilter === 'free' ? 'مجانية' : 'مدفوعة'} حالياً.</p>
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
            </div>
          </section>
        )}

        {/* ── Public Sessions ─────────────────────────────────────────────────── */}
        {publicSessions.length > 0 && (
          <section id="sessions" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-8 sm:mb-10">
                <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-widest mb-2">جلسات إرشادية</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">الجلسات المتاحة</h2>
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
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">متجر المجتمع</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">منتجات من مجتمعنا</h2>
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
                      <ProductCard product={p} currencySymbol={currencySymbol} onOrder={setSelectedProduct} />
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
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">رواد الأعمال</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">متاجر مجتمعنا</h2>
              </div>
              {loadingStores ? (
                <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-[82vw] sm:w-72 shrink-0 h-20 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {publicStores.map(store => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.id}`}
                      className="group w-[82vw] sm:w-72 shrink-0 snap-start p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl overflow-hidden shrink-0 border border-border/50 bg-primary/10 flex items-center justify-center">
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="h-full w-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Store className="h-4 w-4 text-primary" />
                          )}
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

        {/* ── Pricing ──────────────────────────────────────────────────────────── */}
        {sections.showPricing && plans.length > 0 && (
          <section id="pricing" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-10 sm:mb-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">خطط الأسعار</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">اختر الخطة المناسبة لك</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {plans.map(plan => {
                  const PlanIcon = { Star, Zap, Building2, Crown }[plan.icon] || Star;
                  const savings = plan.priceAnnual > 0 && plan.priceMonthly > 0
                    ? Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)
                    : 0;
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border bg-card p-6 sm:p-8 flex flex-col ${
                        plan.highlighted ? 'border-primary shadow-lg shadow-primary/10 md:-translate-y-2' : 'border-border'
                      }`}
                    >
                      {plan.highlighted && (
                        <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                          الأكثر شعبية
                        </span>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${plan.color}20` }}>
                          <PlanIcon className="h-5 w-5" style={{ color: plan.color }} />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                      </div>
                      <div className="mb-4">
                        {plan.priceMonthly === 0 ? (
                          <p className="text-2xl font-bold text-emerald-600">مجاني</p>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-foreground">{plan.priceMonthly.toLocaleString()}</span>
                              <span className="text-muted-foreground text-sm">{plan.currency}/شهر</span>
                            </div>
                            {savings > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                أو {plan.priceAnnual.toLocaleString()} {plan.currency}/سنة
                                {' '}<span className="text-emerald-600">(وفر {savings}%)</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {plan.description && <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {(plan.features || []).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant={plan.highlighted ? 'default' : 'outline'} className="w-full">
                        <Link href="/register">ابدأ الآن</Link>
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
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">قصص النجاح</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">ماذا يقول مجتمعنا</h2>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {testimonialsData.map((t, i) => (
                  <div key={i} className="w-[82vw] sm:w-80 lg:w-96 shrink-0 snap-start flex flex-col gap-4 sm:gap-5 p-6 rounded-2xl border border-border bg-card">
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

        {/* ── Latest Articles ─────────────────────────────────────────────────── */}
        {sections.showBlog && latestArticles.length > 0 && (
          <section id="articles" className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container">
              <div className="text-center mb-10 sm:mb-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">رؤى ومعرفة</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  أحدث المقالات
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
                    className="group w-[82vw] sm:w-72 shrink-0 snap-start rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col"
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
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">فرص حقيقية</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  أحدث الفرص والمشاريع
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
                    className="group w-[82vw] sm:w-72 shrink-0 snap-start rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col"
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
        {successStories.length > 0 && (
          <section id="success-stories" className="py-16 sm:py-20 md:py-28">
            <div className="container">
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">إلهام حقيقي</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                  قصص نجاح من مجتمعنا
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                  أشخاص حقيقيون غيّروا مساراتهم بفضل التدريب والإرشاد والدعم.
                </p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {successStories.map(story => (
                  <div
                    key={story.id}
                    className="group w-[82vw] sm:w-80 shrink-0 snap-start rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/30 hover:shadow-md transition-all"
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
          <section
            className={`py-16 sm:py-20 md:py-28 ${cfg?.ctaBanner?.backgroundColor ? 'text-white' : 'bg-foreground text-background'}`}
            style={cfg?.ctaBanner?.backgroundColor ? { backgroundColor: cfg.ctaBanner.backgroundColor } : undefined}
          >
            <div className="container text-center">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight">
                {ctaBanner.title}
              </h2>
              <p className={`text-sm sm:text-base md:text-lg mb-7 sm:mb-9 max-w-xl mx-auto leading-relaxed ${cfg?.ctaBanner?.backgroundColor ? 'text-white/70' : 'text-background/60'}`}>
                {ctaBanner.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button size="lg" variant="secondary" asChild className="h-12 px-7 text-base font-semibold text-foreground w-full sm:w-auto">
                  <Link href="/register">
                    {ctaBanner.primaryText}
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className={`h-12 px-7 text-base w-full sm:w-auto ${cfg?.ctaBanner?.backgroundColor ? 'border-white/30 text-white hover:bg-white/10' : 'border-background/30 text-background hover:bg-background/10'}`}
                >
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
