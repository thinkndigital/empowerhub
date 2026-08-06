"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { usePlatformBrand } from "@/components/platform-brand-provider";
import { useToast } from "@/hooks/use-toast";

interface FooterData {
  description: string;
  email?: string;
  phone?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  copyright: string;
}

interface FooterLink { href: string; label: string }

const quickLinks: FooterLink[] = [
  { href: '/#how-it-works', label: 'كيف تعمل' },
  { href: '/#services', label: 'الخدمات' },
  { href: '/market', label: 'المتجر' },
  { href: '/live-sessions', label: 'جلسات مباشرة' },
  { href: '/articles', label: 'المقالات' },
];

const roleLinks: FooterLink[] = [
  { href: '/register?role=beneficiary', label: 'كمستفيد' },
  { href: '/register?role=mentor', label: 'كمرشد' },
  { href: '/register?role=coach', label: 'كمدرب' },
  { href: '/register?role=organization', label: 'كمنظمة' },
];

const companyLinks: FooterLink[] = [
  { href: '/try-roles', label: 'تجربة المنصة' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '#contact', label: 'تواصل معنا' },
  { href: '/login', label: 'تسجيل الدخول' },
];

const legalLinks: FooterLink[] = [
  { href: '#', label: 'سياسة الخصوصية' },
  { href: '#', label: 'شروط الاستخدام' },
];

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-background mb-4">{title}</h4>
      <div className="flex flex-col gap-2.5 text-sm text-background/55">
        {links.map(l => (
          <Link key={l.href + l.label} href={l.href} className="hover:text-background transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteFooter({ siteName, footerData, logoUrl }: { siteName?: string; footerData: FooterData; logoUrl?: string }) {
  const { logoUrl: platformLogoFallback, platformName } = usePlatformBrand();
  const { toast } = useToast();
  const logoSrc = logoUrl || platformLogoFallback;
  const displayName = siteName || platformName || 'EmpowerHub';
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'شكراً لاشتراكك! سنبقيك على اطلاع بكل جديد.' });
    setEmail('');
  };

  return (
    <footer className="bg-foreground text-background" dir="rtl">
      {/* Newsletter bar */}
      <div className="border-b border-background/10">
        <div className="container py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-base sm:text-lg font-bold text-background text-center sm:text-right">
            انضم لمجتمع {displayName} الآن
          </p>
          <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto items-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني"
              dir="ltr"
              className="h-11 flex-1 sm:w-64 rounded-full bg-background/10 border border-background/15 px-4 text-sm text-background placeholder:text-background/40 outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="submit" className="h-11 rounded-full px-5 bg-background text-foreground hover:bg-background/90 shrink-0">
              اشترك
            </Button>
          </form>
        </div>
      </div>

      {/* Link grid */}
      <div className="container py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 mb-12 sm:mb-16">
          <FooterCol title="روابط سريعة" links={quickLinks} />
          <FooterCol title="ابدأ كـ" links={roleLinks} />
          <FooterCol title="الشركة" links={companyLinks} />
          <FooterCol title="قانوني" links={legalLinks} />
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2 shrink-0">
            {logoSrc
              ? <img src={logoSrc} alt="logo" className="h-6 w-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <Logo className="h-6 w-6 text-background" />}
            <span className="font-bold text-sm text-background">{displayName}</span>
          </div>
          <div className="text-center max-w-md">
            <p className="text-xs text-background/45 leading-relaxed">
              {footerData.description}
            </p>
            {(footerData.email || footerData.phone) && (
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-background/55">
                {footerData.email && (
                  <a href={`mailto:${footerData.email}`} dir="ltr" className="hover:text-background transition-colors">{footerData.email}</a>
                )}
                {footerData.email && footerData.phone && <span className="text-background/30">·</span>}
                {footerData.phone && (
                  <a href={`tel:${footerData.phone}`} dir="ltr" className="hover:text-background transition-colors">{footerData.phone}</a>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {footerData.twitter && (
              <a href={footerData.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-background/55 hover:text-background transition-colors">تويتر</a>
            )}
            {footerData.linkedin && (
              <a href={footerData.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-background/55 hover:text-background transition-colors">LinkedIn</a>
            )}
            {footerData.instagram && (
              <a href={footerData.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-background/55 hover:text-background transition-colors">Instagram</a>
            )}
          </div>
        </div>
        <p className="mt-6 text-xs text-background/35 text-center sm:text-right">
          {footerData.copyright || `© 2024 ${displayName}. جميع الحقوق محفوظة.`}
        </p>
      </div>
    </footer>
  );
}
