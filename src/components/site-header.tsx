"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { usePlatformBrand } from "@/components/platform-brand-provider";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Menu, X, ChevronDown, Users, GraduationCap, ShoppingCart } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/dictionary";

function CartLink() {
  const { count } = useCart();
  const { t } = useLanguage();
  return (
    <Link href="/cart" className="relative p-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors" aria-label={t('common.cart')}>
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-0.5 left-0.5 h-4.5 min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
          {count}
        </span>
      )}
    </Link>
  );
}

const navLinks: { href: string; label: string; key: TranslationKey }[] = [
  { href: '/#roles', label: 'كيف تعمل', key: 'nav.howItWorks' },
  { href: '/#services', label: 'الخدمات', key: 'nav.services' },
  { href: '/courses', label: 'الدورات', key: 'nav.courses' },
  { href: '/live-sessions', label: 'جلسات مباشرة', key: 'nav.liveSessions' },
  { href: '/articles', label: 'المقالات', key: 'nav.articles' },
  { href: '/projects', label: 'الفرص', key: 'nav.opportunities' },
  { href: '/market', label: 'المتجر', key: 'nav.market' },
];

const teamLinks: { href: string; label: string; icon: any; key: TranslationKey }[] = [
  { href: '/mentors', label: 'المرشدون', icon: Users, key: 'nav.mentors' },
  { href: '/coaches', label: 'المدربون', icon: GraduationCap, key: 'nav.coaches' },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logoUrl: logoSrc, platformName: siteName, header: headerCfg } = usePlatformBrand();
  const { lang, dir, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  const resolvedNavLinks = navLinks.map((l, i) => ({
    ...l,
    label: lang === 'en' ? t(l.key) : (headerCfg?.navLinks[i]?.label || l.label),
  }));
  const resolvedTeamLinks = teamLinks.map((l, i) => ({
    ...l,
    label: lang === 'en' ? t(l.key) : (headerCfg?.teamLinks[i]?.label || l.label),
  }));
  const teamLabel = lang === 'en' ? t('nav.team') : (headerCfg?.teamLabel || 'فريقنا');
  const loginText = lang === 'en' ? t('nav.login') : (headerCfg?.loginText || 'تسجيل الدخول');
  const registerText = lang === 'en' ? t('nav.registerFull') : (headerCfg?.registerText || 'ابدأ مجاناً');
  const registerTextMobile = lang === 'en' ? t('nav.registerShort') : (headerCfg?.registerTextMobile || 'ابدأ');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b relative transition-shadow duration-200 ${scrolled ? 'border-border/60 shadow-sm' : 'border-transparent'}`}
      dir={dir}
    >
      <div className="container flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm shrink-0">
          {logoSrc
            ? <img src={logoSrc} alt="logo" className="h-7 w-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Logo className="h-7 w-7" />}
          <span className="text-foreground">{siteName}</span>
        </Link>

        <nav className="flex-1 hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {resolvedNavLinks.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors outline-none">
              {teamLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ direction: dir }} className="w-40">
              {resolvedTeamLinks.map(t => (
                <DropdownMenuItem key={t.href} asChild className="gap-2 cursor-pointer">
                  <Link href={t.href}>
                    <t.icon className="h-4 w-4 text-primary" />
                    {t.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden md:flex items-center gap-1 mr-auto">
          <LanguageSwitcher />
          <CartLink />
          <Button variant="ghost" size="sm" asChild className="text-sm font-medium rounded-full">
            <Link href="/login">{loginText}</Link>
          </Button>
          <Button size="sm" asChild className="rounded-full px-5">
            <Link href="/register">{registerText}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 mr-auto md:hidden">
          <LanguageSwitcher />
          <CartLink />
          <Button size="sm" asChild className="text-xs px-3.5 h-8 rounded-full">
            <Link href="/register">{registerTextMobile}</Link>
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label={t('common.menu')}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full right-0 left-0 bg-background border-b border-border/60 shadow-lg z-50">
          <nav className="container py-3 flex flex-col gap-0.5" dir={dir}>
            {resolvedNavLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-border my-1 mx-3" />
            <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-muted-foreground">{teamLabel}</p>
            {resolvedTeamLinks.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <t.icon className="h-4 w-4 text-primary" />
                {t.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2 mx-3" />
            <Link href="/login" className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {loginText}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
