export interface PlatformService {
  title: string;
  description: string;
  icon: string;
  link: string;
  linkLabel: string;
}

// The platform's 8 core services, shown on the homepage's "ما تقدمه
// المنصة" section whenever no admin-edited features exist yet. Shared
// between the homepage and both site-config API routes so their fallback
// content can never drift out of sync with each other again.
export const DEFAULT_PLATFORM_SERVICES: PlatformService[] = [
  {
    icon: 'BookOpen',
    title: 'الدورات التدريبية',
    description: 'محتوى تدريبي متخصص من مدربين معتمدين في مختلف المجالات — من المهارات الرقمية إلى ريادة الأعمال.',
    link: '#courses',
    linkLabel: 'استعرض الدورات',
  },
  {
    icon: 'Video',
    title: 'الجلسات المباشرة',
    description: 'حضور مباشر مع المدربين في جلسات تفاعلية مباشرة — سجّل مقدماً واحصل على تجربة تدريبية حقيقية.',
    link: '/live-sessions',
    linkLabel: 'اكتشف الجلسات',
  },
  {
    icon: 'GraduationCap',
    title: 'الإرشاد الشخصي',
    description: 'تواصل مع مرشد متخصص يساعدك على رسم مسارك المهني وتجاوز التحديات بتوجيه فردي مثمر.',
    link: '#experts',
    linkLabel: 'تعرف على المرشدين',
  },
  {
    icon: 'Calendar',
    title: 'جلسات الإرشاد الجماعية',
    description: 'جلسات مجدولة مفتوحة للمجتمع — احجز مقعدك وانضم إلى نقاشات وورش عمل تفاعلية مع الخبراء.',
    link: '#sessions',
    linkLabel: 'احجز جلسة',
  },
  {
    icon: 'Briefcase',
    title: 'الفرص والمشاريع',
    description: 'اكتشف فرص عمل، مشاريع تطوعية، وشراكات من منظمات موثوقة تبحث عن مواهب مجتمعنا.',
    link: '/projects',
    linkLabel: 'استعرض الفرص',
  },
  {
    icon: 'FileText',
    title: 'المقالات والمعرفة',
    description: 'اقرأ مقالات عملية ورؤى من خبراء المنصة في التسويق الرقمي، ريادة الأعمال، والتطوير المهني.',
    link: '/articles',
    linkLabel: 'اقرأ المقالات',
  },
  {
    icon: 'Store',
    title: 'المتجر الإلكتروني',
    description: 'تصفح منتجات حقيقية من رواد أعمال في مجتمعنا — يدوية، رقمية، وخدمات متنوعة بأسعار مناسبة.',
    link: '/market',
    linkLabel: 'تسوق الآن',
  },
  {
    icon: 'Building2',
    title: 'إدارة برامج التمكين',
    description: 'للمنظمات والجمعيات: أدر مستفيديك، وزّع الدورات والجلسات، وتابع التقدم بتقارير تفصيلية.',
    link: '/register?role=organization',
    linkLabel: 'للمنظمات',
  },
];
