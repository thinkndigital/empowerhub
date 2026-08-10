export type Lang = 'ar' | 'en';

// Flat, dot-free namespaces — deliberately simple (no path parsing lib)
// since this only needs to grow additively as more of the platform gets
// translated. Each namespace mirrors one UI surface.
export const dictionary = {
  common: {
    loading: { ar: 'جاري التحميل...', en: 'Loading...' },
    save: { ar: 'حفظ', en: 'Save' },
    cancel: { ar: 'إلغاء', en: 'Cancel' },
    edit: { ar: 'تعديل', en: 'Edit' },
    delete: { ar: 'حذف', en: 'Delete' },
    remove: { ar: 'إزالة', en: 'Remove' },
    add: { ar: 'إضافة', en: 'Add' },
    search: { ar: 'بحث', en: 'Search' },
    viewAll: { ar: 'عرض الكل', en: 'View all' },
    viewDetails: { ar: 'عرض التفاصيل', en: 'View details' },
    learnMore: { ar: 'تعرف على المزيد', en: 'Learn more' },
    getStarted: { ar: 'ابدأ الآن', en: 'Get started' },
    signIn: { ar: 'تسجيل الدخول', en: 'Sign in' },
    signUp: { ar: 'ابدأ مجاناً', en: 'Sign up free' },
    home: { ar: 'الرئيسية', en: 'Home' },
    back: { ar: 'العودة', en: 'Back' },
    close: { ar: 'إغلاق', en: 'Close' },
    submit: { ar: 'إرسال', en: 'Submit' },
    email: { ar: 'البريد الإلكتروني', en: 'Email' },
    password: { ar: 'كلمة المرور', en: 'Password' },
    fullName: { ar: 'الاسم الكامل', en: 'Full name' },
    phone: { ar: 'رقم الهاتف', en: 'Phone number' },
    noResults: { ar: 'لا توجد نتائج', en: 'No results' },
    or: { ar: 'أو', en: 'or' },
    cart: { ar: 'سلة المشتريات', en: 'Shopping cart' },
    menu: { ar: 'القائمة', en: 'Menu' },
  },

  nav: {
    howItWorks: { ar: 'كيف تعمل', en: 'How it works' },
    services: { ar: 'الخدمات', en: 'Services' },
    courses: { ar: 'الدورات', en: 'Courses' },
    liveSessions: { ar: 'جلسات مباشرة', en: 'Live sessions' },
    articles: { ar: 'المقالات', en: 'Articles' },
    opportunities: { ar: 'الفرص', en: 'Opportunities' },
    market: { ar: 'المتجر', en: 'Marketplace' },
    team: { ar: 'فريقنا', en: 'Our team' },
    mentors: { ar: 'المرشدون', en: 'Mentors' },
    coaches: { ar: 'المدربون', en: 'Coaches' },
    login: { ar: 'تسجيل الدخول', en: 'Log in' },
    registerFull: { ar: 'ابدأ مجاناً', en: 'Start free' },
    registerShort: { ar: 'ابدأ', en: 'Start' },
    language: { ar: 'English', en: 'العربية' },
  },

  footer: {
    quickLinks: { ar: 'روابط سريعة', en: 'Quick links' },
    forRoles: { ar: 'انضم كـ', en: 'Join as' },
    company: { ar: 'الشركة', en: 'Company' },
    legal: { ar: 'قانوني', en: 'Legal' },
    newsletterTitle: { ar: 'اشترك في نشرتنا البريدية', en: 'Subscribe to our newsletter' },
    newsletterPlaceholder: { ar: 'بريدك الإلكتروني', en: 'Your email address' },
    newsletterButton: { ar: 'اشترك', en: 'Subscribe' },
    rights: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
    privacy: { ar: 'سياسة الخصوصية', en: 'Privacy policy' },
    terms: { ar: 'الشروط والأحكام', en: 'Terms of service' },
    asBeneficiary: { ar: 'كمستفيد', en: 'As a beneficiary' },
    asMentor: { ar: 'كمرشد', en: 'As a mentor' },
    asCoach: { ar: 'كمدرب', en: 'As a coach' },
    asOrganization: { ar: 'كمنظمة', en: 'As an organization' },
    tryPlatform: { ar: 'تجربة المنصة', en: 'Try the platform' },
    pricing: { ar: 'الأسعار', en: 'Pricing' },
    contactUs: { ar: 'تواصل معنا', en: 'Contact us' },
    subscribeThanks: { ar: 'شكراً لاشتراكك! سنبقيك على اطلاع بكل جديد.', en: "Thanks for subscribing! We'll keep you posted." },
  },

  auth: {
    loginTitle: { ar: 'تسجيل الدخول', en: 'Log in' },
    loginSubtitle: { ar: 'مرحباً بعودتك! سجّل الدخول لمتابعة رحلتك.', en: 'Welcome back! Log in to continue your journey.' },
    registerTitle: { ar: 'إنشاء حساب جديد', en: 'Create an account' },
    registerSubtitle: { ar: 'انضم إلى منصة EmpowerHub وابدأ رحلتك اليوم.', en: 'Join EmpowerHub and start your journey today.' },
    forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
    noAccount: { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
    haveAccount: { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
    createAccount: { ar: 'إنشاء حساب', en: 'Create account' },
    orContinueWith: { ar: 'أو تابع عبر', en: 'Or continue with' },
    continueWithGoogle: { ar: 'المتابعة باستخدام جوجل', en: 'Continue with Google' },
    signingIn: { ar: 'جاري تسجيل الدخول...', en: 'Signing in...' },
    creatingAccount: { ar: 'جاري إنشاء الحساب...', en: 'Creating account...' },
    selectRole: { ar: 'اختر دورك', en: 'Choose your role' },
    welcomeBack: { ar: 'مرحبًا بعودتك', en: 'Welcome back' },
    loginHint: { ar: 'سجّل دخولك للوصول إلى حسابك', en: 'Sign in to access your account' },
    createFreeAccountLink: { ar: 'أنشئ حسابًا مجانًا', en: 'Create a free account' },
  },

  hero: {
    tagline: { ar: 'منصة التمكين الرقمي الشاملة', en: 'The complete digital empowerment platform' },
  },

  register: {
    heading: { ar: 'إنشاء حساب جديد', en: 'Create an account' },
    subtitle: { ar: 'انضم إلى منصة EmpowerHub', en: 'Join EmpowerHub' },
    planHeading: { ar: 'اختر خطتك', en: 'Choose your plan' },
    planSubtitle: { ar: 'اختر الخطة المناسبة للبدء', en: 'Pick the plan that fits you' },
    accountType: { ar: 'نوع الحساب', en: 'Account type' },
    accountTypePlaceholder: { ar: 'اختر نوع حسابك', en: 'Select account type' },
    roleBeneficiary: { ar: 'مستفيد', en: 'Beneficiary' },
    roleMerchant: { ar: 'تاجر', en: 'Merchant' },
    roleOrganization: { ar: 'مدير منظمة / جهة', en: 'Organization admin' },
    roleMentor: { ar: 'مرشد', en: 'Mentor' },
    roleCoach: { ar: 'مدرب / مدربة', en: 'Coach' },
    orgTypeLabel: { ar: 'تصنيف الجهة', en: 'Organization type' },
    orgTypePlaceholder: { ar: 'اختر تصنيف جهتك', en: 'Select your organization type' },
    orgTypeHint: { ar: 'اختر النوع الذي يمثل جهتك.', en: 'Pick the type that best represents your organization.' },
    orgNameLabel: { ar: 'اسم الجهة', en: 'Organization name' },
    orgNameHint: { ar: 'سيتم إنشاء حساب جهتك تلقائياً.', en: 'Your organization account will be created automatically.' },
    inviteCodeLabel: { ar: 'كود دعوة المنظمة', en: 'Organization invite code' },
    inviteCodeOptional: { ar: '(اختياري)', en: '(optional)' },
    inviteCodePlaceholder: { ar: 'أدخل كود الدعوة إن وجد', en: 'Enter an invite code if you have one' },
    nextChoosePlan: { ar: 'التالي — اختيار الخطة', en: 'Next — choose a plan' },
    createFreeAccount: { ar: 'إنشاء حساب مجاناً', en: 'Create free account' },
    monthly: { ar: 'شهري', en: 'Monthly' },
    annual: { ar: 'سنوي', en: 'Annual' },
    popular: { ar: 'الأكثر شيوعاً', en: 'Most popular' },
    free: { ar: 'مجاني', en: 'Free' },
    perMonth: { ar: 'شهر', en: 'month' },
    perYear: { ar: 'سنة', en: 'year' },
    creatingPlan: { ar: 'جاري الإنشاء...', en: 'Creating...' },
    createAndPay: { ar: 'إنشاء الحساب والانتقال للدفع', en: 'Create account and go to payment' },
    loadingPlans: { ar: 'جاري تحميل الخطط...', en: 'Loading plans...' },
    noPlans: { ar: 'لا توجد خطط متاحة حالياً — سيتم إنشاء حسابك بدون خطة محددة.', en: 'No plans available right now — your account will be created without a specific plan.' },
    trialHint: { ar: 'الخطط المجانية تبدأ بفترة تجريبية محدودة. الخطط المدفوعة تُفعَّل بعد إتمام الدفع.', en: 'Free plans start with a limited trial. Paid plans activate after payment.' },
    termsAgree: { ar: 'بالتسجيل أنت توافق على', en: 'By signing up, you agree to' },
    and: { ar: 'و', en: 'and' },
  },
} as const;

type Dictionary = typeof dictionary;
export type TranslationKey = {
  [K in keyof Dictionary]: `${K & string}.${keyof Dictionary[K] & string}`
}[keyof Dictionary];

export function translate(lang: Lang, key: TranslationKey): string {
  const [ns, k] = key.split('.') as [keyof Dictionary, string];
  const entry = (dictionary[ns] as any)?.[k];
  if (!entry) return key;
  return entry[lang] ?? entry.ar;
}
