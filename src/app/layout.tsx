import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseProviderDynamic } from '@/components/firebase-provider-dynamic';

export const metadata: Metadata = {
  title: 'EmpowerHub | منصة التمكين الرقمي',
  description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية.',
  keywords: 'تمكين, تدريب, إرشاد, تجارة إلكترونية, ريادة أعمال',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </head>
      <body className="font-body antialiased">
        <FirebaseProviderDynamic>
          {children}
          <Toaster />
        </FirebaseProviderDynamic>
      </body>
    </html>
  );
}
