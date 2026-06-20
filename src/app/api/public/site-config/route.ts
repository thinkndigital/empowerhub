import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const defaultConfig = {
  siteName: 'EmpowerHub',
  tagline: 'منصة التمكين الرقمي',
  primaryColor: '#3b82f6',
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
  features: [
    { title: 'تدريب متخصص', description: 'مسارات تعليمية ودورات تدريبية مصممة لتزويدك بالمهارات المطلوبة في سوق العمل الحديث.', icon: 'BookOpen' },
    { title: 'إرشاد شخصي', description: 'تواصل مع مرشدين وخبراء لمساعدتك في رحلتك وتقديم النصح والتوجيه المخصص.', icon: 'Users' },
    { title: 'متجر إلكتروني', description: 'أنشئ متجرك الخاص، اعرض منتجاتك، وابدأ في تحقيق الدخل من مشروعك بسهولة.', icon: 'Store' },
    { title: 'تقارير وتحليلات', description: 'تابع تقدمك ونموك بتقارير مرئية شاملة تساعدك على اتخاذ قرارات أفضل.', icon: 'BarChart3' },
    { title: 'توصيات بالذكاء الاصطناعي', description: 'احصل على توصيات مخصصة لمحتوى التدريب والموارد المناسبة لأهدافك.', icon: 'Zap' },
    { title: 'أمان وموثوقية', description: 'بياناتك محمية بأحدث تقنيات الأمان. نضمن لك تجربة موثوقة وآمنة في كل وقت.', icon: 'Shield' },
  ],
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
    showContact: true,
    showCTA: true,
  },
  footer: {
    description: 'منصة متكاملة للتمكين الرقمي تجمع التدريب، الإرشاد، والتجارة الإلكترونية في مكان واحد.',
    email: 'info@empowerhub.com',
    phone: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    copyright: '© 2024 EmpowerHub. جميع الحقوق محفوظة.',
  },
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
      stats: data?.stats ?? defaultConfig.stats,
      features: data?.features ?? defaultConfig.features,
      opportunities: data?.opportunities ?? defaultConfig.opportunities,
      howItWorks: data?.howItWorks ?? defaultConfig.howItWorks,
      testimonials: data?.testimonials ?? defaultConfig.testimonials,
      blogPosts: data?.blogPosts ?? defaultConfig.blogPosts,
      roles: data?.roles ?? defaultConfig.roles,
    };
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ config: defaultConfig });
  }
}
