"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { usePlatformBrand } from "@/components/platform-brand-provider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

interface FooterData {
  description: string;
  email?: string;
  phone?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  copyright: string;
  newsletterTitle?: string;
  newsletterPlaceholder?: string;
  newsletterButton?: string;
  quickLinksTitle?: string;
  roleLinksTitle?: string;
  companyLinksTitle?: string;
  legalLinksTitle?: string;
}

interface FooterLink { href: string; label: string; key: TranslationKey }

const quickLinks: FooterLink[] = [
  { href: '/#how-it-works', label: 'كيف تعمل', key: 'nav.howItWorks' },
  { href: '/#services', label: 'الخدمات', key: 'nav.services' },
  { href: '/market', label: 'المتجر', key: 'nav.market' },
  { href: '/live-sessions', label: 'جلسات مباشرة', key: 'nav.liveSessions' },
  { href: '/articles', label: 'المقالات', key: 'nav.articles' },
];

const roleLinks: FooterLink[] = [
  { href: '/register?role=beneficiary', label: 'كمستفيد', key: 'footer.asBeneficiary' },
  { href: '/register?role=mentor', label: 'كمرشد', key: 'footer.asMentor' },
  { href: '/register?role=coach', label: 'كمدرب', key: 'footer.asCoach' },
  { href: '/register?role=organization', label: 'كمنظمة', key: 'footer.asOrganization' },
];

const companyLinks: FooterLink[] = [
  { href: '/try-roles', label: 'تجربة المنصة', key: 'footer.tryPlatform' },
  { href: '#pricing', label: 'الأسعار', key: 'footer.pricing' },
  { href: '#contact', label: 'تواصل معنا', key: 'footer.contactUs' },
  { href: '/login', label: 'تسجيل الدخول', key: 'nav.login' },
];

const legalLinks: FooterLink[] = [
  { href: '#', label: 'سياسة الخصوصية', key: 'footer.privacy' },
  { href: '#', label: 'شروط الاستخدام', key: 'footer.terms' },
];

function FooterCol({ title, links, lang, t }: { title: string; links: FooterLink[]; lang: string; t: (key: TranslationKey) => string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-background mb-4">{title}</h4>
      <div className="flex flex-col gap-2.5 text-sm text-background/55">
        {links.map(l => (
          <Link key={l.href + l.label} href={l.href} className="hover:text-background transition-colors">
            {lang === 'en' ? t(l.key) : l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteFooter({ siteName, footerData, logoUrl }: { siteName?: string; footerData: FooterData; logoUrl?: string }) {
  const { logoUrl: platformLogoFallback, platformName } = usePlatformBrand();
  const { toast } = useToast();
  const { lang, dir, t } = useLanguage();
  const logoSrc = logoUrl || platformLogoFallback;
  const displayName = siteName || platformName || 'EmpowerHub';
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t('footer.subscribeThanks') });
    setEmail('');
  };

  const newsletterTitle = lang === 'en' ? t('footer.newsletterTitle') : (footerData.newsletterTitle || `انضم لمجتمع ${displayName} الآن`);
  const newsletterPlaceholder = lang === 'en' ? t('footer.newsletterPlaceholder') : (footerData.newsletterPlaceholder || 'بريدك الإلكتروني');
  const newsletterButton = lang === 'en' ? t('footer.newsletterButton') : (footerData.newsletterButton || 'اشترك');
  const quickLinksTitle = lang === 'en' ? t('footer.quickLinks') : (footerData.quickLinksTitle || 'روابط سريعة');
  const roleLinksTitle = lang === 'en' ? t('footer.forRoles') : (footerData.roleLinksTitle || 'ابدأ كـ');
  const companyLinksTitle = lang === 'en' ? t('footer.company') : (footerData.companyLinksTitle || 'الشركة');
  const legalLinksTitle = lang === 'en' ? t('footer.legal') : (footerData.legalLinksTitle || 'قانوني');
  const copyright = lang === 'en' && !footerData.copyright
    ? `© ${new Date().getFullYear()} ${displayName}. ${t('footer.rights')}.`
    : (footerData.copyright || `© 2024 ${displayName}. جميع الحقوق محفوظة.`);

  return (
    <footer className="bg-foreground text-background" dir={dir}>
      {/* Newsletter bar */}
      <div className="border-b border-background/10">
        <div className="container py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-base sm:text-lg font-bold text-background text-center sm:text-right">
            {newsletterTitle}
          </p>
          <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto items-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={newsletterPlaceholder}
              dir="ltr"
              className="h-11 flex-1 sm:w-64 rounded-full bg-background/10 border border-background/15 px-4 text-sm text-background placeholder:text-background/40 outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="submit" className="h-11 rounded-full px-5 bg-background text-foreground hover:bg-background/90 shrink-0">
              {newsletterButton}
            </Button>
          </form>
        </div>
      </div>

      {/* Link grid */}
      <div className="container py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 mb-12 sm:mb-16">
          <FooterCol title={quickLinksTitle} links={quickLinks} lang={lang} t={t} />
          <FooterCol title={roleLinksTitle} links={roleLinks} lang={lang} t={t} />
          <FooterCol title={companyLinksTitle} links={companyLinks} lang={lang} t={t} />
          <FooterCol title={legalLinksTitle} links={legalLinks} lang={lang} t={t} />
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
          {copyright}
        </p>
      </div>
    </footer>
  );
}
