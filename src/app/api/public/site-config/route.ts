import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const defaultConfig = {
  siteName: 'EmpowerHub',
  tagline: 'منصة التمكين الرقمي',
  primaryColor: '#3b82f6',
  secondaryColor: '',
  hoverColor: '',
  logoUrl: '',
  faviconUrl: '',
  hero: {
    title: 'بوابتك للتمكين والنجاح',
    subtitle: 'منصة متكاملة تجمع بين التدريب المتخصص، الإرشاد الشخصي، والتجارة الإلكترونية\nلمساعدتك على بناء مستقبلك وتحقيق أهدافك.',
    ctaText: 'ابدأ رحلتك مجاناً',
    ctaSecondaryText: 'تصفح المتجر',
    backgroundImage: '',
  },
  stats: [
    { label: 'مستفيد نشط', value: '2,500+', icon: 'Users' },
    { label: 'دورة تدريبية', value: '150+', icon: 'BookOpen' },
    { label: 'مرشد ومدرب', value: '80+', icon: 'GraduationCap' },
    { label: 'نسبة الرضا', value: '95%', icon: 'Award' },
  ],
  // Empty on purpose: the homepage (src/app/page.tsx) has its own built-in
  // 8-service showcase with working CTA links that it renders whenever no
  // custom features are configured. A non-empty default here used to
  // silently override that showcase with plainer, link-less placeholder
  // content the moment this route ever ran with no Firestore doc present.
  features: [] as { title: string; description: string; icon: string }[],
  howItWorks: [
    { step: '١', title: 'أنشئ حسابك', desc: 'سجّل مجاناً واختر دورك على المنصة سواء كمستفيد أو مرشد أو منظمة.', icon: 'UserCheck' },
    { step: '٢', title: 'استكشف المحتوى', desc: 'تصفح الدورات التدريبية، تواصل مع المرشدين، وابنِ مهاراتك.', icon: 'Globe' },
    { step: '٣', title: 'حقق أهدافك', desc: 'أطلق متجرك، احصل على شهاداتك، وابنِ مستقبلاً أفضل.', icon: 'TrendingUp' },
  ],
  testimonials: [
    { name: 'سارة أحمد', role: 'مستفيدة - رائدة أعمال', text: 'بفضل EmpowerHub، تمكنت من إطلاق متجري الإلكتروني وتحقيق أول ألف ريال خلال شهرين فقط. الدعم والتدريب كانا استثنائيين!', stars: 5 },
    { name: 'محمد الخالد', role: 'مدرب - خبير تسويق رقمي', text: 'المنصة أتاحت لي الفرصة للوصول إلى مئات المستفيدين ومشاركتهم خبرتي. الأدوات سهلة الاستخدام والدعم الفني ممتاز.', stars: 5 },
    { name: 'منظمة بناء المستقبل', role: 'منظمة غير ربحية', text: 'ساعدتنا المنصة في إدارة 200 مستفيد بكل احترافية. التقارير التفصيلية مكّنتنا من قياس أثر برامجنا بشكل دقيق.', stars: 5 },
  ],
  contact: {
    phone: '+966 XX XXX XXXX',
    whatsapp: '+966 XX XXX XXXX',
    whatsappLink: 'https://wa.me/966XXXXXXXXX',
    email: 'info@empowerhub.com',
  },
  ctaBanner: {
    title: 'جاهز للبدء؟ انضم إلى آلاف المستفيدين',
    subtitle: 'سجّل مجاناً اليوم وابدأ رحلتك نحو التمكين والنجاح مع EmpowerHub',
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
    { title: 'كمستفيد', description: 'طور مهاراتك، ابنِ مشروعك، وحقق استقلاليتك المالية من خلال برامج تمكين متكاملة.', icon: 'UserCheck', badge: 'الأكثر شعبية', link: '/register?role=beneficiary' },
    { title: 'كمدرب', description: 'شارك خبراتك ومعرفتك من خلال إنشاء وتقديم دورات تدريبية متخصصة.', icon: 'GraduationCap', badge: '', link: '/register?role=coach' },
    { title: 'كمرشد', description: 'ساهم في نجاح الآخرين من خلال تقديم الإرشاد والتوجيه الشخصي.', icon: 'Users', badge: '', link: '/register?role=mentor' },
    { title: 'كمنظمة', description: 'أدر برامج التمكين الخاصة بك، وتابع تقدم المستفيدين بفعالية.', icon: 'Building', badge: '', link: '/register?role=organization' },
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
    showStats: true,
    showFeatures: true,
    showOpportunities: true,
    showHowItWorks: true,
    showRoles: true,
    showMentors: true,
    showCoaches: true,
    showBlog: true,
    showTestimonials: true,
    showProducts: true,
    showStores: true,
    showPricing: true,
    showContact: true,
    showCTA: true,
    showAISpotlight: true,
    showFAQ: true,
    showCourses: true,
    showSessions: true,
    showSuccessStories: true,
  },
  footer: {
    description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية في مكان واحد.',
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
  try {
    const snap = await adminDb.collection('config').doc('site').get();
    const data = snap.exists ? snap.data() as any : {};
    const config = {
      ...defaultConfig,
      ...data,
      hero: { ...defaultConfig.hero, ...data?.hero },
      sections: { ...defaultConfig.sections, ...data?.sections },
      footer: { ...defaultConfig.footer, ...data?.footer },
      contact: { ...defaultConfig.contact, ...data?.contact },
      ctaBanner: { ...defaultConfig.ctaBanner, ...data?.ctaBanner },
      authBranding: { ...defaultConfig.authBranding, ...data?.authBranding },
      registerBranding: { ...defaultConfig.registerBranding, ...data?.registerBranding },
      sectionStyles: Object.fromEntries(
        Object.keys(defaultConfig.sectionStyles).map(k => [
          k,
          { ...(defaultConfig.sectionStyles as any)[k], ...(data?.sectionStyles?.[k] || {}) },
        ])
      ),
      sectionHeadings: Object.fromEntries(
        Object.keys(defaultConfig.sectionHeadings).map(k => [
          k,
          { ...(defaultConfig.sectionHeadings as any)[k], ...(data?.sectionHeadings?.[k] || {}) },
        ])
      ),
      aiSpotlight: { ...defaultConfig.aiSpotlight, ...data?.aiSpotlight },
      header: {
        ...defaultConfig.header,
        ...data?.header,
        navLinks: data?.header?.navLinks?.length ? data.header.navLinks : defaultConfig.header.navLinks,
        teamLinks: data?.header?.teamLinks?.length ? data.header.teamLinks : defaultConfig.header.teamLinks,
      },
      stats: data?.stats ?? defaultConfig.stats,
      features: data?.features ?? defaultConfig.features,
      opportunities: data?.opportunities ?? defaultConfig.opportunities,
      howItWorks: data?.howItWorks ?? defaultConfig.howItWorks,
      testimonials: data?.testimonials ?? defaultConfig.testimonials,
      blogPosts: data?.blogPosts ?? defaultConfig.blogPosts,
      roles: data?.roles ?? defaultConfig.roles,
      faq: data?.faq ?? defaultConfig.faq,
      tourRoles: data?.tourRoles?.length === defaultConfig.tourRoles.length ? data.tourRoles : defaultConfig.tourRoles,
    };
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ config: defaultConfig });
  }
}
