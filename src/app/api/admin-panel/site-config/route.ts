import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  siteName: 'EmpowerHub',
  tagline: 'منصة التمكين الرقمي',
  primaryColor: '',
  secondaryColor: '',
  hoverColor: '',
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
    backgroundColor: '',
  },
  sectionStyles: {
    hero: { bg: '' },
    stats: { bg: '', iconColor: '' },
    features: { bg: '', iconColor: '' },
    opportunities: { bg: '', iconColor: '' },
    howItWorks: { bg: '', iconColor: '' },
    roles: { bg: '', iconColor: '' },
  } as Record<string, { bg?: string; iconColor?: string }>,
  authBranding: {
    imageUrl: '',
    title: 'منصة التمكين الرقمي',
    subtitle: 'نربط المستفيدين بالمرشدين والمدربين المتخصصين لدعم نموهم المهني والشخصي',
  },
  registerBranding: {
    imageUrl: '',
    title: 'ابدأ رحلتك نحو النجاح',
    subtitle: 'انضم إلى منصة EmpowerHub وابدأ التغيير اليوم',
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
    showTestimonials: true, showProducts: true, showStores: true, showPricing: true, showContact: true, showCTA: true,
    showAISpotlight: true, showFAQ: true, showCourses: true, showSessions: true, showSuccessStories: true,
  },
  footer: {
    description: 'منصة EmpowerHub للتمكين الرقمي',
    email: 'info@empowerhub.com',
    phone: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    copyright: '© 2024 EmpowerHub. جميع الحقوق محفوظة.',
    newsletterTitle: '',
    newsletterPlaceholder: '',
    newsletterButton: '',
    quickLinksTitle: '',
    roleLinksTitle: '',
    companyLinksTitle: '',
    legalLinksTitle: '',
  },
  sectionHeadings: {
    roles: {}, features: {}, experts: {}, courses: {}, sessions: {}, products: {},
    stores: {}, pricing: {}, testimonials: {}, blog: {}, opportunities: {}, successStories: {}, contact: {},
  } as Record<string, { eyebrow?: string; heading?: string; subheading?: string }>,
  aiSpotlight: {
    eyebrow: '', heading: '', subheading: '',
    cards: [{ title: '', description: '' }, { title: '', description: '' }],
  },
  faq: [] as { question: string; answer: string }[],
  header: {
    navLinks: [
      { label: 'كيف تعمل' },
      { label: 'الخدمات' },
      { label: 'الدورات' },
      { label: 'جلسات مباشرة' },
      { label: 'المقالات' },
      { label: 'الفرص' },
      { label: 'المتجر' },
    ],
    teamLabel: 'فريقنا',
    teamLinks: [
      { label: 'المرشدون' },
      { label: 'المدربون' },
    ],
    loginText: 'تسجيل الدخول',
    registerText: 'ابدأ مجاناً',
    registerTextMobile: 'ابدأ',
  },
  tourRoles: [
    {
      headline: 'أدر برامج التمكين بالكامل من مكان واحد',
      ctaText: '',
      benefits: [
        'إضافة وإدارة المستفيدين والمرشدين والمدربين بسهولة',
        'تتبع تقدم كل مستفيد بتقارير وتحليلات تفصيلية',
        'نماذج تقييم مخصصة ترسلها وتحلل نتائجها',
        'تخصيص هوية منصتك الخاصة بشعارك وألوانك',
      ],
      stats: [{ label: 'مستفيدون', value: '٢٥٠' }, { label: 'مرشدون', value: '١٢' }, { label: 'دورات', value: '٣٠' }],
      items: [
        { title: 'المستفيدون', subtitle: '٢٥٠ عضو نشط هذا الشهر' },
        { title: 'تقرير الأثر', subtitle: 'معدل إكمال ٧٨٪' },
        { title: 'نموذج تقييم جديد', subtitle: 'أُرسل لـ ٤٠ مستفيداً' },
      ],
    },
    {
      headline: 'قدّم إرشادك وشاهد أثره ينعكس مباشرة',
      ctaText: '',
      benefits: [
        'جدولة جلسات إرشاد فردية مع من تختار مرافقتهم',
        'متابعة تقدم كل مستفيد تشرف عليه في مكان واحد',
        'شارك مقالاتك وخبراتك مع مجتمع المنصة',
        'انضم لأي منظمة عبر كود دعوة بسيط',
      ],
      stats: [{ label: 'مستفيدون', value: '١٨' }, { label: 'جلسات', value: '٦' }, { label: 'تقييم', value: '٤.٩' }],
      items: [
        { title: 'جلسة اليوم', subtitle: '٣:٠٠ مساءً — مع نور' },
        { title: 'مستفيديّ', subtitle: '١٨ شخصاً تحت إرشادك' },
        { title: 'مقال جديد', subtitle: '١٢٠ مشاهدة هذا الأسبوع' },
      ],
    },
    {
      headline: 'حوّل خبرتك إلى دورات ودخل مستمر',
      ctaText: '',
      benefits: [
        'أنشئ دوراتك التدريبية وانشرها لآلاف المستفيدين',
        'قدّم جلسات مباشرة وتابع التسجيل والحضور',
        'تحليلات أداء تفصيلية لكل دورة ومحتوى',
        'متجرك الخاص لبيع دوراتك مباشرة',
      ],
      stats: [{ label: 'دورات', value: '٥' }, { label: 'مشتركون', value: '٣٤٠' }, { label: 'دخل', value: '١٫٢k' }],
      items: [
        { title: 'دورة التسويق الرقمي', subtitle: '٣٤٠ مشترك — ٧٥٪ إكمال' },
        { title: 'جلسة مباشرة قادمة', subtitle: 'غداً — ٥٠ مسجّل' },
        { title: 'الأداء هذا الشهر', subtitle: '+١٨٪ عن الشهر الماضي' },
      ],
    },
    {
      headline: 'تعلّم، تدرّب، وابنِ مشروعك الخاص',
      ctaText: '',
      benefits: [
        'دورات تدريبية متخصصة تناسب مسارك المهني',
        'جلسات إرشاد فردية مع خبراء في مجالك',
        'متجرك الإلكتروني الخاص لبيع منتجاتك أو خدماتك',
        'تتبع تقدمك الشخصي خطوة بخطوة',
      ],
      stats: [{ label: 'دورات', value: '٣' }, { label: 'تقدمي', value: '٦٥٪' }, { label: 'الطلبات', value: '١٢' }],
      items: [
        { title: 'دورتي الحالية', subtitle: 'التسويق الرقمي — ٦٥٪ مكتمل' },
        { title: 'متجري', subtitle: '١٢ طلباً هذا الشهر' },
        { title: 'جلستي القادمة', subtitle: 'مع المرشدة سارة — غداً' },
      ],
    },
    {
      headline: 'تسوّق وبِع داخل مجتمع واحد',
      ctaText: 'تصفح المتجر',
      benefits: [
        'تصفح منتجات وخدمات حقيقية من رواد أعمال في مجتمعنا',
        'افتح متجرك الخاص وابدأ البيع مباشرة من لوحة تحكمك',
        'تواصل مع البائعين مباشرة عبر واتساب لإتمام الطلب',
        'كل الفئات — من المنتجات اليدوية إلى الخدمات الرقمية',
      ],
      stats: [{ label: 'منتج', value: '٣٢٠' }, { label: 'متجر', value: '٤٥' }, { label: 'طلب هذا الشهر', value: '١١٠' }],
      items: [
        { title: 'طلب جديد', subtitle: 'منتج يدوي — قبل ٥ دقائق' },
        { title: 'متجر جديد', subtitle: 'انضم اليوم' },
        { title: 'الأكثر مبيعاً', subtitle: 'شمعة معطرة يدوية' },
      ],
    },
  ],
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
    authBranding: { ...defaultConfig.authBranding, ...d?.authBranding },
    registerBranding: { ...defaultConfig.registerBranding, ...d?.registerBranding },
    sectionStyles: Object.fromEntries(
      Object.keys(defaultConfig.sectionStyles).map(k => [
        k,
        { ...(defaultConfig.sectionStyles as any)[k], ...(d?.sectionStyles?.[k] || {}) },
      ])
    ),
    sectionHeadings: Object.fromEntries(
      Object.keys(defaultConfig.sectionHeadings).map(k => [
        k,
        { ...(defaultConfig.sectionHeadings as any)[k], ...(d?.sectionHeadings?.[k] || {}) },
      ])
    ),
    aiSpotlight: { ...defaultConfig.aiSpotlight, ...d?.aiSpotlight },
    header: {
      ...defaultConfig.header,
      ...d?.header,
      navLinks: d?.header?.navLinks?.length ? d.header.navLinks : defaultConfig.header.navLinks,
      teamLinks: d?.header?.teamLinks?.length ? d.header.teamLinks : defaultConfig.header.teamLinks,
    },
    stats: d?.stats ?? defaultConfig.stats,
    features: d?.features ?? defaultConfig.features,
    opportunities: d?.opportunities ?? defaultConfig.opportunities,
    howItWorks: d?.howItWorks ?? defaultConfig.howItWorks,
    testimonials: d?.testimonials ?? defaultConfig.testimonials,
    blogPosts: d?.blogPosts ?? defaultConfig.blogPosts,
    roles: d?.roles ?? defaultConfig.roles,
    faq: d?.faq ?? defaultConfig.faq,
    tourRoles: d?.tourRoles?.length === defaultConfig.tourRoles.length ? d.tourRoles : defaultConfig.tourRoles,
  };
  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await adminDb.collection('config').doc('site').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
