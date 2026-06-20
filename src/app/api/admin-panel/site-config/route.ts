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
  howItWorks: [
    { step: '١', title: 'أنشئ حسابك', desc: 'سجّل مجاناً واختر دورك على المنصة.', icon: 'UserCheck' },
    { step: '٢', title: 'استكشف المحتوى', desc: 'تصفح الدورات التدريبية وتواصل مع المرشدين.', icon: 'Globe' },
    { step: '٣', title: 'حقق أهدافك', desc: 'أطلق متجرك واحصل على شهاداتك.', icon: 'TrendingUp' },
  ],
  testimonials: [
    { name: 'سارة أحمد', role: 'مستفيدة - رائدة أعمال', text: 'بفضل EmpowerHub، تمكنت من إطلاق متجري الإلكتروني وتحقيق أول ألف ريال خلال شهرين.', stars: 5 },
    { name: 'محمد الخالد', role: 'مدرب - خبير تسويق رقمي', text: 'المنصة أتاحت لي الفرصة للوصول إلى مئات المستفيدين ومشاركتهم خبرتي.', stars: 5 },
    { name: 'منظمة بناء المستقبل', role: 'منظمة غير ربحية', text: 'ساعدتنا المنصة في إدارة 200 مستفيد بكل احترافية.', stars: 5 },
  ],
  contact: {
    phone: '+966 XX XXX XXXX',
    whatsapp: '+966 XX XXX XXXX',
    whatsappLink: 'https://wa.me/966XXXXXXXXX',
    email: 'info@empowerhub.com',
  },
  ctaBanner: {
    title: 'جاهز للبدء؟ انضم إلى آلاف المستفيدين',
    subtitle: 'سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح',
    primaryText: 'ابدأ مجاناً الآن',
    secondaryText: 'تجربة المنصة أولاً',
  },
  roles: [
    { title: 'كمستفيد', description: 'طور مهاراتك وحقق استقلاليتك المالية.', icon: 'UserCheck', badge: 'الأكثر شعبية', link: '/register?role=beneficiary' },
    { title: 'كمدرب', description: 'شارك خبراتك من خلال دورات تدريبية متخصصة.', icon: 'GraduationCap', badge: '', link: '/register?role=coach' },
    { title: 'كمرشد', description: 'ساهم في نجاح الآخرين بالإرشاد والتوجيه.', icon: 'Users', badge: '', link: '/register?role=mentor' },
    { title: 'كمنظمة', description: 'أدر برامج التمكين وتابع تقدم المستفيدين.', icon: 'Building', badge: '', link: '/register?role=organization' },
  ],
  opportunities: [
    { title: 'برامج التدريب المهني', description: 'دورات متخصصة في التقنية، الأعمال والتصميم لتزويدك بمهارات سوق العمل الحديث.', icon: 'GraduationCap', badge: 'متاح الآن', color: 'bg-primary', link: '/register' },
    { title: 'الإرشاد الفردي', description: 'جلسات مخصصة مع مرشدين خبراء لمساعدتك في رسم مسارك المهني وتحقيق أهدافك.', icon: 'Users', badge: 'مجاني', color: 'bg-sky-500', link: '/register' },
    { title: 'ريادة الأعمال', description: 'ابدأ مشروعك، أطلق متجرك الإلكتروني، وابنِ مصدر دخل مستدام مع دعم متكامل.', icon: 'Store', badge: 'جديد', color: 'bg-amber-500', link: '/register' },
  ],
  blogPosts: [
    { title: 'كيف تبني مسارك المهني في عالم رقمي متسارع', excerpt: 'تعرف على أهم المهارات المطلوبة في سوق العمل الحديث وكيف تكتسبها.', category: 'مسار مهني', imageUrl: '', link: '' },
    { title: '٥ خطوات لإطلاق متجرك الإلكتروني بنجاح', excerpt: 'دليل عملي للمبتدئين في التجارة الإلكترونية من الفكرة حتى أول عملية بيع ناجحة.', category: 'ريادة أعمال', imageUrl: '', link: '' },
    { title: 'قصص نجاح: التدريب الذي غيّر مساراتنا', excerpt: 'قصص ملهمة لأشخاص حققوا أهدافهم بفضل التدريب الصحيح والإرشاد المتخصص.', category: 'قصص نجاح', imageUrl: '', link: '' },
  ],
  sections: {
    showStats: true, showFeatures: true, showOpportunities: true, showHowItWorks: true,
    showRoles: true, showMentors: true, showCoaches: true, showBlog: true,
    showTestimonials: true, showProducts: true, showStores: true, showContact: true, showCTA: true,
  },
  footer: {
    description: 'منصة EmpowerHub للتمكين الرقمي',
    email: 'info@empowerhub.com',
    phone: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    copyright: '© 2024 EmpowerHub. جميع الحقوق محفوظة.',
  },
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('site').get();
  const data = snap.exists ? snap.data() : {};
  // Deep merge with defaults
  const d = data as any;
  const config = {
    ...defaultConfig,
    ...d,
    hero: { ...defaultConfig.hero, ...d?.hero },
    sections: { ...defaultConfig.sections, ...d?.sections },
    footer: { ...defaultConfig.footer, ...d?.footer },
    contact: { ...defaultConfig.contact, ...d?.contact },
    ctaBanner: { ...defaultConfig.ctaBanner, ...d?.ctaBanner },
    stats: d?.stats ?? defaultConfig.stats,
    features: d?.features ?? defaultConfig.features,
    opportunities: d?.opportunities ?? defaultConfig.opportunities,
    howItWorks: d?.howItWorks ?? defaultConfig.howItWorks,
    testimonials: d?.testimonials ?? defaultConfig.testimonials,
    blogPosts: d?.blogPosts ?? defaultConfig.blogPosts,
    roles: d?.roles ?? defaultConfig.roles,
  };
  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await adminDb.collection('config').doc('site').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
