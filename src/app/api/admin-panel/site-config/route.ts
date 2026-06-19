import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  siteName: 'EmpowerHub',
  tagline: 'منصة التمكين الرقمي',
  logoUrl: '',
  faviconUrl: '',
  hero: {
    title: 'منصة التمكين الرقمي',
    subtitle: 'تدريب احترافي، إرشاد شخصي، وسوق رقمي في مكان واحد',
    ctaText: 'ابدأ مجاناً',
    ctaSecondaryText: 'تعرف على المزيد',
    backgroundImage: '',
  },
  stats: [
    { label: 'مستفيد', value: '500+', icon: 'Users' },
    { label: 'مرشد', value: '50+', icon: 'GraduationCap' },
    { label: 'منظمة', value: '20+', icon: 'Building2' },
    { label: 'دورة', value: '100+', icon: 'BookOpen' },
  ],
  features: [
    { title: 'التدريب المهني', description: 'دورات تدريبية متنوعة تناسب احتياجاتك', icon: 'BookOpen' },
    { title: 'الإرشاد الشخصي', description: 'تواصل مع مرشدين متخصصين في مجالك', icon: 'Users' },
    { title: 'السوق الرقمي', description: 'بع منتجاتك وخدماتك بسهولة', icon: 'ShoppingBag' },
    { title: 'التقارير والتحليل', description: 'تتبع تقدمك مع تقارير تفصيلية', icon: 'BarChart3' },
  ],
  sections: {
    showStats: true,
    showFeatures: true,
    showMentors: true,
    showProducts: true,
    showTestimonials: true,
    showCTA: true,
  },
  footer: {
    description: 'منصة EmpowerHub للتمكين الرقمي',
    email: 'info@empowerhub.com',
    phone: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  },
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('site').get();
  const data = snap.exists ? snap.data() : {};
  // Deep merge with defaults
  const config = {
    ...defaultConfig,
    ...data,
    hero: { ...defaultConfig.hero, ...(data as any)?.hero },
    sections: { ...defaultConfig.sections, ...(data as any)?.sections },
    footer: { ...defaultConfig.footer, ...(data as any)?.footer },
    stats: (data as any)?.stats || defaultConfig.stats,
    features: (data as any)?.features || defaultConfig.features,
  };
  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await adminDb.collection('config').doc('site').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
