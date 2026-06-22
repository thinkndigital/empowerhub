"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: '/#how-it-works', label: 'كيف تعمل' },
  { href: '/#services', label: 'الخدمات' },
  { href: '/mentors', label: 'المرشدون' },
  { href: '/coaches', label: 'المدربون' },
  { href: '/live-sessions', label: 'جلسات مباشرة' },
  { href: '/articles', label: 'المقالات' },
  { href: '/projects', label: 'الفرص' },
  { href: '/market', label: 'المتجر' },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState('');
  const [siteName, setSiteName] = useState('EmpowerHub');

  useEffect(() => {
    fetch('/api/public/platform-config').then(r => r.json()).then(d => {
      if (d.config?.logoUrl) setLogoSrc(d.config.logoUrl);
      if (d.config?.platformName) setSiteName(d.config.platformName);
    }).catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/60 relative" dir="rtl">
      <div className="container flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm shrink-0">
          {logoSrc
            ? <img src={logoSrc} alt="logo" className="h-7 w-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Logo className="h-7 w-7" />}
          <span className="text-foreground">{siteName}</span>
        </Link>

        <nav className="flex-1 hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 mr-auto">
          <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">ابدأ مجاناً</Link>
          </Button>
        </div>

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
  );
}
