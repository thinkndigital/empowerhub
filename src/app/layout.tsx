import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseProviderDynamic } from '@/components/firebase-provider-dynamic';
import { ThemeProvider } from '@/components/theme-provider';
import { adminDb } from '@/lib/firebase-admin';

export const metadata: Metadata = {
  title: 'EmpowerHub | منصة التمكين الرقمي',
  description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية.',
  keywords: 'تمكين, تدريب, إرشاد, تجارة إلكترونية, ريادة أعمال',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const clean = hex.replace(/^#/, '');
  if (clean.length !== 6) return null;
  let r = parseInt(clean.slice(0, 2), 16) / 255;
  let g = parseInt(clean.slice(2, 4), 16) / 255;
  let b = parseInt(clean.slice(4, 6), 16) / 255;
  const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let H = 0, S = 0;
  const L = (cmax + cmin) / 2;
  if (delta !== 0) {
    S = L > 0.5 ? delta / (2 - cmax - cmin) : delta / (cmax + cmin);
    if (cmax === r) H = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    else if (cmax === g) H = ((b - r) / delta + 2) * 60;
    else H = ((r - g) / delta + 4) * 60;
  }
  if (H < 0) H += 360;
  return { h: Math.round(H), s: Math.round(S * 100), l: Math.round(L * 100) };
}

async function getBrandColorStyle(): Promise<string> {
  try {
    const snap = await adminDb.collection('config').doc('site').get();
    const hex: string = snap.data()?.primaryColor || '';
    const hsl = hexToHsl(hex);
    if (!hsl) return '';
    const { h, s, l } = hsl;
    const sS = Math.min(90, s + 8);
    const sL = Math.max(62, Math.min(76, l + 15));
    return `:root{--primary:${h} ${s}% ${l}%;--ring:${h} ${s}% ${l}%;--sidebar-primary:${h} ${sS}% ${sL}%;--sidebar-ring:${h} ${sS}% ${sL}%;}`;
  } catch {
    return '';
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandStyle = await getBrandColorStyle();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {brandStyle && (
          <style dangerouslySetInnerHTML={{ __html: brandStyle }} />
        )}
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="empowerhub-theme">
          <FirebaseProviderDynamic>
            {children}
            <Toaster />
          </FirebaseProviderDynamic>
        </ThemeProvider>
      </body>
    </html>
  );
}
