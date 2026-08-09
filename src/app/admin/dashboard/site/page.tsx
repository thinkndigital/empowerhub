"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save, Plus, Trash2, Upload, Globe, Image as ImageIcon, BarChart3, Sparkles,
  Link2, Eye, EyeOff, MessageSquare, Phone, Star, LogIn, Users, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { applyOrgColor } from "@/lib/apply-org-color";
import { useToast } from "@/hooks/use-toast";

interface CtaButton { text: string; link: string; style: 'primary' | 'outline' }

interface SiteConfig {
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  hoverColor: string;
  logoUrl: string;
  faviconUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; backgroundImage: string; buttons: CtaButton[] };
  stats: { label: string; value: string; icon: string }[];
  features: { title: string; description: string; icon: string }[];
  opportunities: { title: string; description: string; icon: string; badge: string; color: string; link: string }[];
  howItWorks: { step: string; title: string; desc: string; icon: string }[];
  testimonials: { name: string; role: string; text: string; stars: number }[];
  blogPosts: { title: string; excerpt: string; category: string; imageUrl: string; link: string }[];
  contact: { phone: string; whatsapp: string; whatsappLink: string; email: string };
  ctaBanner: { title: string; subtitle: string; primaryText: string; secondaryText: string; backgroundColor: string; buttons: CtaButton[] };
  authBranding: { imageUrl: string; title: string; subtitle: string };
  registerBranding: { imageUrl: string; title: string; subtitle: string };
  roles: { title: string; description: string; icon: string; badge: string; link: string }[];
  sectionStyles: Record<string, { bg?: string; iconColor?: string }>;
  sections: {
    showStats: boolean; showFeatures: boolean; showOpportunities: boolean; showHowItWorks: boolean;
    showRoles: boolean; showMentors: boolean; showCoaches: boolean; showBlog: boolean;
    showTestimonials: boolean; showProducts: boolean; showStores: boolean; showPricing: boolean; showContact: boolean; showCTA: boolean;
    showAISpotlight: boolean; showFAQ: boolean; showCourses: boolean; showSessions: boolean; showSuccessStories: boolean;
  };
  footer: {
    description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string; copyright: string;
    newsletterTitle: string; newsletterPlaceholder: string; newsletterButton: string;
    quickLinksTitle: string; roleLinksTitle: string; companyLinksTitle: string; legalLinksTitle: string;
  };
  sectionHeadings: Record<string, { eyebrow?: string; heading?: string; subheading?: string }>;
  aiSpotlight: { eyebrow: string; heading: string; subheading: string; cards: { title: string; description: string }[] };
  faq: { question: string; answer: string }[];
  header: {
    navLinks: { label: string }[];
    teamLabel: string;
    teamLinks: { label: string }[];
    loginText: string;
    registerText: string;
    registerTextMobile: string;
  };
  tourRoles: {
    headline: string;
    ctaText: string;
    benefits: string[];
    stats: { label: string; value: string }[];
    items: { title: string; subtitle: string }[];
  }[];
}

const HEADER_NAV_LABELS = ['كيف تعمل', 'الخدمات', 'الدورات', 'جلسات مباشرة', 'المقالات', 'الفرص', 'المتجر'];
const HEADER_TEAM_LABELS = ['المرشدون', 'المدربون'];

const TOUR_ROLE_LABELS = ['المنظمة', 'المرشد', 'المدرب', 'المستفيد', 'المتجر'];

const SECTION_HEADING_KEYS: { key: string; label: string }[] = [
  { key: 'roles', label: 'جولة الأدوار' },
  { key: 'features', label: 'المميزات' },
  { key: 'experts', label: 'المرشدون والمدربون' },
  { key: 'courses', label: 'الدورات' },
  { key: 'sessions', label: 'الجلسات المباشرة' },
  { key: 'products', label: 'المنتجات' },
  { key: 'stores', label: 'المتاجر' },
  { key: 'pricing', label: 'خطط الأسعار' },
  { key: 'testimonials', label: 'آراء المستخدمين' },
  { key: 'blog', label: 'المقالات' },
  { key: 'opportunities', label: 'الفرص والمشاريع' },
  { key: 'successStories', label: 'قصص النجاح' },
  { key: 'contact', label: 'التواصل' },
];

const defaultConfig: SiteConfig = {
  siteName: 'EmpowerHub', tagline: 'منصة التمكين الرقمي',
  primaryColor: '#3b82f6',
  secondaryColor: '',
  hoverColor: '',
  logoUrl: '', faviconUrl: '',
  hero: {
    title: '', subtitle: '', ctaText: 'ابدأ الآن', ctaSecondaryText: 'تعرف على المزيد', backgroundImage: '',
    buttons: [
      { text: 'ابدأ الآن', link: '/register', style: 'primary' },
      { text: 'تعرف على المزيد', link: '#how-it-works', style: 'outline' },
    ],
  },
  stats: [], features: [], opportunities: [], howItWorks: [], testimonials: [], blogPosts: [],
  contact: { phone: '', whatsapp: '', whatsappLink: '', email: '' },
  ctaBanner: {
    title: '', subtitle: '', primaryText: 'ابدأ مجاناً الآن', secondaryText: 'تجربة المنصة أولاً', backgroundColor: '',
    buttons: [
      { text: 'ابدأ مجاناً الآن', link: '/register', style: 'primary' },
      { text: 'تجربة المنصة أولاً', link: '/try-roles', style: 'outline' },
    ],
  },
  authBranding: { imageUrl: '', title: '', subtitle: '' },
  registerBranding: { imageUrl: '', title: '', subtitle: '' },
  roles: [],
  sectionStyles: {
    hero: {}, stats: {}, features: {}, opportunities: {}, howItWorks: {}, roles: {},
  },
  sections: {
    showStats: true, showFeatures: true, showOpportunities: true, showHowItWorks: true,
    showRoles: true, showMentors: true, showCoaches: true, showBlog: true,
    showTestimonials: true, showProducts: true, showStores: true, showPricing: true, showContact: true, showCTA: true,
    showAISpotlight: true, showFAQ: true, showCourses: true, showSessions: true, showSuccessStories: true,
  },
  footer: {
    description: '', email: '', phone: '', twitter: '', linkedin: '', instagram: '', copyright: '',
    newsletterTitle: '', newsletterPlaceholder: '', newsletterButton: '',
    quickLinksTitle: '', roleLinksTitle: '', companyLinksTitle: '', legalLinksTitle: '',
  },
  sectionHeadings: Object.fromEntries(SECTION_HEADING_KEYS.map(s => [s.key, {}])),
  aiSpotlight: { eyebrow: '', heading: '', subheading: '', cards: [{ title: '', description: '' }, { title: '', description: '' }] },
  faq: [],
  header: {
    navLinks: HEADER_NAV_LABELS.map(label => ({ label })),
    teamLabel: 'فريقنا',
    teamLinks: HEADER_TEAM_LABELS.map(label => ({ label })),
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

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
      <Button onClick={onSave} disabled={saving} className={`gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary-hover'}`}>
        <Save className="h-4 w-4" />
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ جميع التغييرات'}
      </Button>
      <p className="text-muted-foreground text-sm">تعديل محتوى الموقع</p>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, storagePath }: {
  label: string; value: string; onChange: (url: string) => void; storagePath: string;
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      // The super-admin panel uses its own cookie session, not Firebase Auth,
      // so there may be no Firebase user/token here — the upload endpoint
      // also accepts that cookie session directly.
      const token = user ? await user.getIdToken() : undefined;
      onChange(await uploadToStorage(file, storagePath, token));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'فشل رفع الصورة', description: err?.message || 'حدث خطأ غير متوقع' });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1" />
        <label className="cursor-pointer">
          <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
            <span>{uploading ? <span className="text-xs">⏳</span> : <Upload className="h-4 w-4" />}</span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {value && (
        <div className="h-20 w-20 border border-border rounded-xl overflow-hidden bg-muted/40">
          <img src={value} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}

function ColorField({ label, value, defaultSwatch, onChange, hint, placeholder }: {
  label: string; value: string; defaultSwatch: string; onChange: (v: string) => void; hint?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || defaultSwatch}
          onChange={e => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
        />
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'فارغ = افتراضي'} className="font-mono" dir="ltr" />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionStyleFields({ config, sectionKey, setSectionStyle, withIcon = true }: {
  config: SiteConfig; sectionKey: string; setSectionStyle: (section: string, field: 'bg' | 'iconColor', v: string) => void; withIcon?: boolean;
}) {
  const style = config.sectionStyles[sectionKey] || {};
  return (
    <div className={`grid grid-cols-1 ${withIcon ? 'sm:grid-cols-2' : ''} gap-4 p-3 rounded-xl border border-border bg-muted/30`}>
      <ColorField
        label="خلفية القسم"
        value={style.bg || ''}
        defaultSwatch="#ffffff"
        onChange={v => setSectionStyle(sectionKey, 'bg', v)}
        hint="فارغ = خلفية الموقع الافتراضية"
      />
      {withIcon && (
        <ColorField
          label="لون الأيقونات"
          value={style.iconColor || ''}
          defaultSwatch="#3b82f6"
          onChange={v => setSectionStyle(sectionKey, 'iconColor', v)}
          hint="فارغ = اللون الرئيسي للمنصة"
        />
      )}
    </div>
  );
}

function ButtonsEditor({ buttons, onAdd, onUpdate, onRemove }: {
  buttons: CtaButton[];
  onAdd: () => void;
  onUpdate: (i: number, k: keyof CtaButton, v: string) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>الأزرار</Label>
        <Button type="button" size="sm" variant="outline" onClick={onAdd} className="gap-1 h-7 text-xs">
          <Plus className="h-3 w-3" />إضافة زر
        </Button>
      </div>
      {buttons.length === 0 && (
        <p className="text-muted-foreground text-xs py-2">لا توجد أزرار — القسم سيظهر بدون أزرار.</p>
      )}
      <div className="space-y-2">
        {buttons.map((btn, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-2.5 rounded-lg border border-border bg-muted/30">
            <Input value={btn.text} onChange={e => onUpdate(i, 'text', e.target.value)} placeholder="نص الزر" className="h-8 text-sm flex-1" />
            <Input value={btn.link} onChange={e => onUpdate(i, 'link', e.target.value)} placeholder="/register" dir="ltr" className="h-8 text-sm flex-1 font-mono" />
            <select
              value={btn.style}
              onChange={e => onUpdate(i, 'style', e.target.value)}
              className="h-8 text-sm border border-border rounded-md bg-background px-2 shrink-0"
            >
              <option value="primary">تعبئة</option>
              <option value="outline">إطار</option>
            </select>
            <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SiteEditorPage() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Live-preview brand color in the admin panel itself
  useEffect(() => {
    if (config.primaryColor) applyOrgColor(config.primaryColor, { secondary: config.secondaryColor, hover: config.hoverColor });
  }, [config.primaryColor, config.secondaryColor, config.hoverColor]);

  useEffect(() => {
    fetch('/api/admin-panel/site-config').then(r => r.json()).then(d => {
      if (d.config) {
        setConfig(c => ({
          ...defaultConfig,
          ...d.config,
          hero: { ...defaultConfig.hero, ...d.config.hero },
          sections: { ...defaultConfig.sections, ...d.config.sections },
          footer: { ...defaultConfig.footer, ...d.config.footer },
          contact: { ...defaultConfig.contact, ...d.config.contact },
          ctaBanner: { ...defaultConfig.ctaBanner, ...d.config.ctaBanner },
          authBranding: { ...defaultConfig.authBranding, ...d.config.authBranding },
          registerBranding: { ...defaultConfig.registerBranding, ...d.config.registerBranding },
          sectionStyles: Object.fromEntries(
            Object.keys(defaultConfig.sectionStyles).map(k => [
              k,
              { ...defaultConfig.sectionStyles[k], ...(d.config.sectionStyles?.[k] || {}) },
            ])
          ),
          howItWorks: d.config.howItWorks ?? defaultConfig.howItWorks,
          testimonials: d.config.testimonials ?? defaultConfig.testimonials,
          blogPosts: d.config.blogPosts ?? defaultConfig.blogPosts,
          roles: d.config.roles ?? defaultConfig.roles,
          stats: d.config.stats ?? defaultConfig.stats,
          features: d.config.features ?? defaultConfig.features,
          opportunities: d.config.opportunities ?? defaultConfig.opportunities,
          faq: d.config.faq ?? defaultConfig.faq,
          sectionHeadings: Object.fromEntries(
            SECTION_HEADING_KEYS.map(s => [
              s.key,
              { ...(defaultConfig.sectionHeadings as any)[s.key], ...(d.config.sectionHeadings?.[s.key] || {}) },
            ])
          ),
          aiSpotlight: {
            ...defaultConfig.aiSpotlight,
            ...d.config.aiSpotlight,
            cards: d.config.aiSpotlight?.cards?.length ? d.config.aiSpotlight.cards : defaultConfig.aiSpotlight.cards,
          },
          header: {
            ...defaultConfig.header,
            ...d.config.header,
            navLinks: d.config.header?.navLinks?.length ? d.config.header.navLinks : defaultConfig.header.navLinks,
            teamLinks: d.config.header?.teamLinks?.length ? d.config.header.teamLinks : defaultConfig.header.teamLinks,
          },
          tourRoles: d.config.tourRoles?.length === defaultConfig.tourRoles.length ? d.config.tourRoles : defaultConfig.tourRoles,
        }));
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await fetch('/api/admin-panel/site-config', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [config]);

  const setHero = (k: keyof SiteConfig['hero'], v: string) =>
    setConfig(c => ({ ...c, hero: { ...c.hero, [k]: v } }));
  const setSection = (k: keyof SiteConfig['sections']) =>
    setConfig(c => ({ ...c, sections: { ...c.sections, [k]: !c.sections[k] } }));
  const setFooter = (k: keyof SiteConfig['footer'], v: string) =>
    setConfig(c => ({ ...c, footer: { ...c.footer, [k]: v } }));
  const setContact = (k: keyof SiteConfig['contact'], v: string) =>
    setConfig(c => ({ ...c, contact: { ...c.contact, [k]: v } }));
  const setSectionStyle = (section: string, field: 'bg' | 'iconColor', v: string) =>
    setConfig(c => ({ ...c, sectionStyles: { ...c.sectionStyles, [section]: { ...c.sectionStyles[section], [field]: v } } }));
  const setBanner = (k: keyof SiteConfig['ctaBanner'], v: string) =>
    setConfig(c => ({ ...c, ctaBanner: { ...c.ctaBanner, [k]: v } }));
  const setAuthBranding = (k: keyof SiteConfig['authBranding'], v: string) =>
    setConfig(c => ({ ...c, authBranding: { ...c.authBranding, [k]: v } }));
  const setRegisterBranding = (k: keyof SiteConfig['registerBranding'], v: string) =>
    setConfig(c => ({ ...c, registerBranding: { ...c.registerBranding, [k]: v } }));

  // Generic add/update/remove for a CtaButton[] living at config[group].buttons
  const addButton = (group: 'hero' | 'ctaBanner') =>
    setConfig(c => ({ ...c, [group]: { ...c[group], buttons: [...c[group].buttons, { text: 'زر جديد', link: '/register', style: 'primary' as const }] } }));
  const updateButton = (group: 'hero' | 'ctaBanner', i: number, k: keyof CtaButton, v: string) =>
    setConfig(c => {
      const buttons = [...c[group].buttons];
      buttons[i] = { ...buttons[i], [k]: v };
      return { ...c, [group]: { ...c[group], buttons } };
    });
  const removeButton = (group: 'hero' | 'ctaBanner', i: number) =>
    setConfig(c => ({ ...c, [group]: { ...c[group], buttons: c[group].buttons.filter((_, idx) => idx !== i) } }));

  // Stats
  const addStat = () => setConfig(c => ({ ...c, stats: [...c.stats, { label: '', value: '', icon: 'Users' }] }));
  const updateStat = (i: number, k: string, v: string) =>
    setConfig(c => { const s = [...c.stats]; s[i] = { ...s[i], [k]: v }; return { ...c, stats: s }; });
  const removeStat = (i: number) =>
    setConfig(c => ({ ...c, stats: c.stats.filter((_, idx) => idx !== i) }));

  // Features
  const addFeature = () => setConfig(c => ({ ...c, features: [...c.features, { title: '', description: '', icon: 'Star' }] }));
  const updateFeature = (i: number, k: string, v: string) =>
    setConfig(c => { const f = [...c.features]; f[i] = { ...f[i], [k]: v }; return { ...c, features: f }; });
  const removeFeature = (i: number) =>
    setConfig(c => ({ ...c, features: c.features.filter((_, idx) => idx !== i) }));
  // Clearing the list (not deleting one-by-one) restores the homepage's
  // built-in 8-service showcase with working links — the same list shown
  // whenever no custom features are configured. Requires pressing Save.
  const resetFeatures = () => setConfig(c => ({ ...c, features: [] }));

  // Testimonials
  const addTestimonial = () => setConfig(c => ({ ...c, testimonials: [...c.testimonials, { name: '', role: '', text: '', stars: 5 }] }));
  const updateTestimonial = (i: number, k: string, v: string | number) =>
    setConfig(c => { const t = [...c.testimonials]; t[i] = { ...t[i], [k]: v }; return { ...c, testimonials: t }; });
  const removeTestimonial = (i: number) =>
    setConfig(c => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }));

  // Section headings
  const setSectionHeading = (key: string, field: 'eyebrow' | 'heading' | 'subheading', v: string) =>
    setConfig(c => ({ ...c, sectionHeadings: { ...c.sectionHeadings, [key]: { ...c.sectionHeadings[key], [field]: v } } }));

  // AI Spotlight
  const setAISpotlight = (k: 'eyebrow' | 'heading' | 'subheading', v: string) =>
    setConfig(c => ({ ...c, aiSpotlight: { ...c.aiSpotlight, [k]: v } }));
  const updateAISpotlightCard = (i: number, k: 'title' | 'description', v: string) =>
    setConfig(c => {
      const cards = [...c.aiSpotlight.cards];
      cards[i] = { ...cards[i], [k]: v };
      return { ...c, aiSpotlight: { ...c.aiSpotlight, cards } };
    });

  // FAQ
  const addFaq = () => setConfig(c => ({ ...c, faq: [...c.faq, { question: '', answer: '' }] }));
  const updateFaq = (i: number, k: 'question' | 'answer', v: string) =>
    setConfig(c => { const f = [...c.faq]; f[i] = { ...f[i], [k]: v }; return { ...c, faq: f }; });
  const removeFaq = (i: number) =>
    setConfig(c => ({ ...c, faq: c.faq.filter((_, idx) => idx !== i) }));

  // Header
  const setHeaderField = (k: 'teamLabel' | 'loginText' | 'registerText' | 'registerTextMobile', v: string) =>
    setConfig(c => ({ ...c, header: { ...c.header, [k]: v } }));
  const setHeaderNavLabel = (i: number, v: string) =>
    setConfig(c => {
      const navLinks = [...c.header.navLinks];
      navLinks[i] = { label: v };
      return { ...c, header: { ...c.header, navLinks } };
    });
  const setHeaderTeamLabel = (i: number, v: string) =>
    setConfig(c => {
      const teamLinks = [...c.header.teamLinks];
      teamLinks[i] = { label: v };
      return { ...c, header: { ...c.header, teamLinks } };
    });

  // Tour Roles
  const setTourRoleField = (i: number, k: 'headline' | 'ctaText', v: string) =>
    setConfig(c => {
      const tourRoles = [...c.tourRoles];
      tourRoles[i] = { ...tourRoles[i], [k]: v };
      return { ...c, tourRoles };
    });
  const setTourRoleBenefit = (i: number, bi: number, v: string) =>
    setConfig(c => {
      const tourRoles = [...c.tourRoles];
      const benefits = [...tourRoles[i].benefits];
      benefits[bi] = v;
      tourRoles[i] = { ...tourRoles[i], benefits };
      return { ...c, tourRoles };
    });
  const setTourRoleStat = (i: number, si: number, k: 'label' | 'value', v: string) =>
    setConfig(c => {
      const tourRoles = [...c.tourRoles];
      const stats = [...tourRoles[i].stats];
      stats[si] = { ...stats[si], [k]: v };
      tourRoles[i] = { ...tourRoles[i], stats };
      return { ...c, tourRoles };
    });
  const setTourRoleItem = (i: number, ii: number, k: 'title' | 'subtitle', v: string) =>
    setConfig(c => {
      const tourRoles = [...c.tourRoles];
      const items = [...tourRoles[i].items];
      items[ii] = { ...items[ii], [k]: v };
      tourRoles[i] = { ...tourRoles[i], items };
      return { ...c, tourRoles };
    });

  if (loading) return <div className="text-muted-foreground text-center py-16">جاري التحميل...</div>;

  return (
    <div className="space-y-0" dir="rtl">
      <div className="px-0 pb-4">
        <h1 className="text-2xl font-bold text-foreground">تعديل الموقع</h1>
        <p className="text-muted-foreground text-sm">تحكم كامل في محتوى وتصميم الصفحة الرئيسية — التغييرات تظهر فوراً بعد الحفظ</p>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />

      <div className="pt-4">
        <Tabs defaultValue="identity">
          <TabsList className="bg-muted rounded-xl w-full flex-wrap h-auto gap-1 p-1">
            {[
              { value: 'identity', label: 'الهوية', icon: Globe },
              { value: 'header', label: 'الهيدر', icon: Link2 },
              { value: 'hero', label: 'الترحيب', icon: ImageIcon },
              { value: 'auth', label: 'صفحات الدخول', icon: LogIn },
              { value: 'stats', label: 'الإحصائيات', icon: BarChart3 },
              { value: 'features', label: 'المميزات', icon: Sparkles },
              { value: 'tourRoles', label: 'جولة الأدوار', icon: Users },
              { value: 'testimonials', label: 'الآراء', icon: Star },
              { value: 'contact', label: 'التواصل', icon: Phone },
              { value: 'cta', label: 'CTA بانر', icon: MessageSquare },
              { value: 'headings', label: 'عناوين الأقسام', icon: Globe },
              { value: 'aiSpotlight', label: 'الذكاء الاصطناعي', icon: Sparkles },
              { value: 'faq', label: 'الأسئلة الشائعة', icon: MessageSquare },
              { value: 'sections', label: 'الأقسام', icon: Eye },
              { value: 'footer', label: 'الفوتر', icon: Link2 },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-1 text-xs">
                <t.icon className="h-3 w-3" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* IDENTITY */}
          <TabsContent value="identity" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">هوية الموقع والشعار</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الموقع</Label>
                    <Input value={config.siteName} onChange={e => setConfig(c => ({ ...c, siteName: e.target.value }))} placeholder="EmpowerHub" />
                  </div>
                  <div className="space-y-2">
                    <Label>الشعار النصي (tagline)</Label>
                    <Input value={config.tagline} onChange={e => setConfig(c => ({ ...c, tagline: e.target.value }))} placeholder="منصة التمكين الرقمي" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>اللون الرئيسي</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.primaryColor || '#3b82f6'}
                        onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                        className="h-10 w-10 shrink-0 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                      />
                      <Input
                        value={config.primaryColor || '#3b82f6'}
                        onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                        placeholder="#3b82f6"
                        className="font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">لون الأزرار الرئيسية والعناصر البارزة في كل المنصة</p>
                  </div>
                  <div className="space-y-2">
                    <Label>لون الهوفر (Hover)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.hoverColor || config.primaryColor || '#3b82f6'}
                        onChange={e => setConfig(c => ({ ...c, hoverColor: e.target.value }))}
                        className="h-10 w-10 shrink-0 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                      />
                      <Input
                        value={config.hoverColor}
                        onChange={e => setConfig(c => ({ ...c, hoverColor: e.target.value }))}
                        placeholder="فارغ = تعتيم تلقائي للون الرئيسي"
                        className="font-mono"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">لون الأزرار الرئيسية عند تمرير الفأرة (Hover) بكل المنصة</p>
                  </div>
                  <div className="space-y-2">
                    <Label>اللون الثانوي</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.secondaryColor || '#e5e7eb'}
                        onChange={e => setConfig(c => ({ ...c, secondaryColor: e.target.value }))}
                        className="h-10 w-10 shrink-0 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                      />
                      <Input
                        value={config.secondaryColor}
                        onChange={e => setConfig(c => ({ ...c, secondaryColor: e.target.value }))}
                        placeholder="فارغ = افتراضي"
                        className="font-mono"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">لون أزرار "ثانوي" (variant=secondary) بكل المنصة</p>
                  </div>
                </div>
                <ImageUploadField label="شعار الموقع (Logo)" value={config.logoUrl} onChange={url => setConfig(c => ({ ...c, logoUrl: url }))} storagePath="site/logo" />
                <ImageUploadField label="أيقونة الموقع (Favicon)" value={config.faviconUrl} onChange={url => setConfig(c => ({ ...c, faviconUrl: url }))} storagePath="site/favicon" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* HEADER */}
          <TabsContent value="header" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-base">شريط التنقل العلوي (الهيدر)</CardTitle>
                <p className="text-muted-foreground text-xs">يظهر هذا الشريط في أعلى كل صفحات الموقع العامة</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>روابط التنقل</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {config.header.navLinks.map((l, i) => (
                      <Input key={i} value={l.label} onChange={e => setHeaderNavLabel(i, e.target.value)} placeholder={HEADER_NAV_LABELS[i]} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>عنوان قائمة "فريقنا"</Label>
                    <Input value={config.header.teamLabel} onChange={e => setHeaderField('teamLabel', e.target.value)} placeholder="فريقنا" />
                  </div>
                  {config.header.teamLinks.map((l, i) => (
                    <div key={i} className="space-y-2">
                      <Label>رابط فريقنا {i + 1}</Label>
                      <Input value={l.label} onChange={e => setHeaderTeamLabel(i, e.target.value)} placeholder={HEADER_TEAM_LABELS[i]} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>نص زر تسجيل الدخول</Label>
                    <Input value={config.header.loginText} onChange={e => setHeaderField('loginText', e.target.value)} placeholder="تسجيل الدخول" />
                  </div>
                  <div className="space-y-2">
                    <Label>نص زر التسجيل (سطح المكتب)</Label>
                    <Input value={config.header.registerText} onChange={e => setHeaderField('registerText', e.target.value)} placeholder="ابدأ مجاناً" />
                  </div>
                  <div className="space-y-2">
                    <Label>نص زر التسجيل (الجوال)</Label>
                    <Input value={config.header.registerTextMobile} onChange={e => setHeaderField('registerTextMobile', e.target.value)} placeholder="ابدأ" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HERO */}
          <TabsContent value="hero" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">قسم الترحيب (Hero Section)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان الرئيسي</Label>
                  <Input value={config.hero.title} onChange={e => setHero('title', e.target.value)} placeholder="بوابتك للتمكين والنجاح" />
                </div>
                <div className="space-y-2">
                  <Label>العنوان الفرعي</Label>
                  <Textarea value={config.hero.subtitle} onChange={e => setHero('subtitle', e.target.value)} rows={3} className="resize-none" placeholder="وصف مختصر..." />
                </div>
                <ButtonsEditor
                  buttons={config.hero.buttons}
                  onAdd={() => addButton('hero')}
                  onUpdate={(i, k, v) => updateButton('hero', i, k, v)}
                  onRemove={i => removeButton('hero', i)}
                />
                <ImageUploadField label="صورة الخلفية (اختياري)" value={config.hero.backgroundImage} onChange={url => setHero('backgroundImage', url)} storagePath="site/hero" />
                <SectionStyleFields config={config} sectionKey="hero" setSectionStyle={setSectionStyle} withIcon={false} />
                <div className="rounded-xl overflow-hidden border border-border">
                  <div
                    className="p-8 text-center bg-gradient-to-br from-primary/20 to-purple-900/30"
                    style={config.hero.backgroundImage ? { backgroundImage: `url(${config.hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <h2 className="text-foreground text-xl font-bold mb-2">{config.hero.title || 'العنوان الرئيسي'}</h2>
                    <p className="text-foreground/90 text-sm mb-4 whitespace-pre-line">{config.hero.subtitle || 'الوصف...'}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {config.hero.buttons.map((btn, i) => (
                        <span
                          key={i}
                          className={`px-4 py-1.5 rounded-lg text-sm ${btn.style === 'outline' ? 'border border-border text-foreground' : 'bg-primary text-primary-foreground'}`}
                        >
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUTH BRANDING */}
          <TabsContent value="auth" className="mt-4 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-base">صفحة تسجيل الدخول</CardTitle>
                <p className="text-muted-foreground text-xs">الصورة والنص الجانبي المعروض في صفحة تسجيل الدخول</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUploadField label="الصورة" value={config.authBranding.imageUrl} onChange={url => setAuthBranding('imageUrl', url)} storagePath="site/auth" />
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input value={config.authBranding.title} onChange={e => setAuthBranding('title', e.target.value)} placeholder="منصة التمكين الرقمي" />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea value={config.authBranding.subtitle} onChange={e => setAuthBranding('subtitle', e.target.value)} rows={3} className="resize-none" placeholder="وصف مختصر..." />
                </div>
                {config.authBranding.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-border relative h-40">
                    <img src={config.authBranding.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 right-3 left-3">
                      <p className="text-white font-bold text-sm">{config.authBranding.title || 'العنوان'}</p>
                      <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{config.authBranding.subtitle || 'الوصف...'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-base">صفحة إنشاء حساب</CardTitle>
                <p className="text-muted-foreground text-xs">الصورة والنص الجانبي المعروض في صفحة إنشاء حساب جديد — مستقلة عن صفحة تسجيل الدخول</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUploadField label="الصورة" value={config.registerBranding.imageUrl} onChange={url => setRegisterBranding('imageUrl', url)} storagePath="site/register" />
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input value={config.registerBranding.title} onChange={e => setRegisterBranding('title', e.target.value)} placeholder="ابدأ رحلتك نحو النجاح" />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea value={config.registerBranding.subtitle} onChange={e => setRegisterBranding('subtitle', e.target.value)} rows={3} className="resize-none" placeholder="وصف مختصر..." />
                </div>
                {config.registerBranding.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-border relative h-40">
                    <img src={config.registerBranding.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 right-3 left-3">
                      <p className="text-white font-bold text-sm">{config.registerBranding.title || 'العنوان'}</p>
                      <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{config.registerBranding.subtitle || 'الوصف...'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS */}
          <TabsContent value="stats" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">الإحصائيات</CardTitle>
                <Button size="sm" onClick={addStat} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.stats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد إحصائيات. أضف واحدة!</p>
                ) : config.stats.map((stat, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-muted/40 rounded-xl border border-border">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">الرقم/القيمة</Label>
                        <Input value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="500+" className="mt-1 h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">التسمية</Label>
                        <Input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="مستفيد نشط" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الأيقونة</Label>
                        <Input value={stat.icon} onChange={e => updateStat(i, 'icon', e.target.value)} placeholder="Users" className="mt-1 h-8 text-sm" dir="ltr" />
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeStat(i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 mt-4 flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <SectionStyleFields config={config} sectionKey="stats" setSectionStyle={setSectionStyle} />
                {config.stats.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-muted-foreground text-xs mb-3">معاينة:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {config.stats.map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="text-foreground text-2xl font-bold">{s.value}</p>
                          <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURES */}
          <TabsContent value="features" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">بطاقات المميزات</CardTitle>
                <div className="flex items-center gap-2">
                  {config.features.length > 0 && (
                    <Button size="sm" variant="outline" onClick={resetFeatures} className="gap-1">
                      <RotateCcw className="h-3.5 w-3.5" />استعادة الافتراضي
                    </Button>
                  )}
                  <Button size="sm" onClick={addFeature} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة ميزة</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.features.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm leading-relaxed">
                    لا توجد ميزات مخصصة — الصفحة الرئيسية تعرض حالياً قائمة الخدمات الافتراضية (٨ بطاقات مع روابط). أضف ميزة لتخصيص القائمة، أو احفظ التغييرات بدون إضافة شيء لإبقاء القائمة الافتراضية.
                  </p>
                ) : config.features.map((feat, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">ميزة {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFeature(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <Input value={feat.title} onChange={e => updateFeature(i, 'title', e.target.value)} placeholder="عنوان الميزة" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الأيقونة (اختياري)</Label>
                        <Input value={feat.icon} onChange={e => updateFeature(i, 'icon', e.target.value)} placeholder="BookOpen" className="mt-1 h-8 text-sm" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <Input value={feat.description} onChange={e => updateFeature(i, 'description', e.target.value)} placeholder="وصف الميزة..." className="mt-1 h-8 text-sm" />
                    </div>
                  </div>
                ))}
                <SectionStyleFields config={config} sectionKey="features" setSectionStyle={setSectionStyle} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TOUR ROLES */}
          <TabsContent value="tourRoles" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-base">جولة الأدوار داخل المنصة</CardTitle>
                <p className="text-muted-foreground text-xs">محتوى قسم "جولة داخل المنصة" — النص والأرقام المعروضة لكل دور في معاينة لوحة التحكم</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {config.tourRoles.map((role, i) => (
                  <div key={i} className="p-4 bg-muted/40 rounded-xl border border-border space-y-4">
                    <p className="text-sm font-semibold text-foreground">{TOUR_ROLE_LABELS[i]}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">العنوان الرئيسي</Label>
                        <Input value={role.headline} onChange={e => setTourRoleField(i, 'headline', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">نص زر الدعوة {i === 4 ? '' : '(فارغ = "ابدأ كـ' + TOUR_ROLE_LABELS[i] + '")'}</Label>
                        <Input value={role.ctaText} onChange={e => setTourRoleField(i, 'ctaText', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">المزايا (٤)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {role.benefits.map((b, bi) => (
                          <Input key={bi} value={b} onChange={e => setTourRoleBenefit(i, bi, e.target.value)} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الإحصائيات (٣)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {role.stats.map((s, si) => (
                          <div key={si} className="flex gap-1.5">
                            <Input value={s.value} onChange={e => setTourRoleStat(i, si, 'value', e.target.value)} placeholder="القيمة" className="w-16" />
                            <Input value={s.label} onChange={e => setTourRoleStat(i, si, 'label', e.target.value)} placeholder="التسمية" className="flex-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">عناصر المعاينة (٣)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {role.items.map((it, ii) => (
                          <div key={ii} className="space-y-1">
                            <Input value={it.title} onChange={e => setTourRoleItem(i, ii, 'title', e.target.value)} placeholder="العنوان" />
                            <Input value={it.subtitle} onChange={e => setTourRoleItem(i, ii, 'subtitle', e.target.value)} placeholder="الوصف الفرعي" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TESTIMONIALS */}
          <TabsContent value="testimonials" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">آراء المستخدمين (Testimonials)</CardTitle>
                <Button size="sm" onClick={addTestimonial} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة رأي</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.testimonials.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد آراء.</p>
                ) : config.testimonials.map((t, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">رأي {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeTestimonial(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">الاسم</Label>
                        <Input value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} placeholder="اسم المستخدم" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الدور/المسمى</Label>
                        <Input value={t.role} onChange={e => updateTestimonial(i, 'role', e.target.value)} placeholder="مستفيد - رائد أعمال" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">نص الرأي</Label>
                      <Textarea value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)} placeholder="ماذا قال المستخدم..." rows={3} className="mt-1 text-sm resize-none" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">التقييم (1-5 نجوم)</Label>
                      <div className="flex gap-2 mt-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateTestimonial(i, 'stars', n)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${t.stars >= n ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT */}
          <TabsContent value="contact" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">معلومات التواصل</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف (يظهر في قسم التواصل)</Label>
                  <Input value={config.contact.phone} onChange={e => setContact('phone', e.target.value)} placeholder="+966 XX XXX XXXX" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>رقم واتساب</Label>
                  <Input value={config.contact.whatsapp} onChange={e => setContact('whatsapp', e.target.value)} placeholder="+966 XX XXX XXXX" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>رابط واتساب (wa.me link)</Label>
                  <Input value={config.contact.whatsappLink} onChange={e => setContact('whatsappLink', e.target.value)} placeholder="https://wa.me/966XXXXXXXXX" dir="ltr" />
                  <p className="text-muted-foreground text-xs">مثال: https://wa.me/966500000000</p>
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={config.contact.email} onChange={e => setContact('email', e.target.value)} placeholder="info@empowerhub.com" dir="ltr" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CTA BANNER */}
          <TabsContent value="cta" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">بانر الدعوة للعمل (CTA Banner)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان الرئيسي</Label>
                  <Input value={config.ctaBanner.title} onChange={e => setBanner('title', e.target.value)} placeholder="جاهز للبدء؟ انضم إلى آلاف المستفيدين" />
                </div>
                <div className="space-y-2">
                  <Label>العنوان الفرعي</Label>
                  <Textarea value={config.ctaBanner.subtitle} onChange={e => setBanner('subtitle', e.target.value)} rows={2} className="resize-none" placeholder="سجّل مجاناً اليوم..." />
                </div>
                <ButtonsEditor
                  buttons={config.ctaBanner.buttons}
                  onAdd={() => addButton('ctaBanner')}
                  onUpdate={(i, k, v) => updateButton('ctaBanner', i, k, v)}
                  onRemove={i => removeButton('ctaBanner', i)}
                />
                <ColorField
                  label="لون خلفية البانر"
                  value={config.ctaBanner.backgroundColor}
                  defaultSwatch="#111827"
                  onChange={v => setBanner('backgroundColor', v)}
                  hint="فارغ = التصميم الافتراضي (خلفية داكنة تتبع الثيم)"
                />
                {/* Preview — matches the real banner's default vs. custom-color behavior */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <div
                    className={`p-8 text-center ${config.ctaBanner.backgroundColor ? 'text-white' : 'bg-foreground text-background'}`}
                    style={config.ctaBanner.backgroundColor ? { backgroundColor: config.ctaBanner.backgroundColor } : undefined}
                  >
                    <h2 className="text-xl font-bold mb-2">{config.ctaBanner.title || 'العنوان...'}</h2>
                    <p className={`text-sm mb-4 ${config.ctaBanner.backgroundColor ? 'text-white/70' : 'text-background/60'}`}>{config.ctaBanner.subtitle || 'الوصف...'}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {config.ctaBanner.buttons.map((btn, i) => (
                        <span
                          key={i}
                          className={`px-4 py-1.5 rounded-lg text-sm ${
                            btn.style === 'outline'
                              ? `border ${config.ctaBanner.backgroundColor ? 'border-white/30 text-white' : 'border-background/30 text-background'}`
                              : 'bg-secondary text-foreground font-bold'
                          }`}
                        >
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTIONS */}
          <TabsContent value="sections" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">تشغيل وإيقاف الأقسام</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'showStats' as const, label: 'قسم الإحصائيات', desc: 'أرقام الإنجازات والإحصائيات' },
                  { key: 'showFeatures' as const, label: 'قسم المميزات', desc: 'بطاقات ميزات المنصة' },
                  { key: 'showOpportunities' as const, label: 'قسم الفرص المتاحة', desc: 'يعرض أحدث المشاريع المنشورة من صفحة "إدارة المحتوى" — لن يظهر القسم إن لم توجد مشاريع' },
                  { key: 'showRoles' as const, label: 'قسم الأدوار', desc: 'بطاقات مستفيد / مدرب / مرشد / منظمة' },
                  { key: 'showMentors' as const, label: 'قسم المرشدون', desc: 'عرض المرشدين' },
                  { key: 'showCoaches' as const, label: 'قسم المدربون', desc: 'عرض المدربين' },
                  { key: 'showBlog' as const, label: 'قسم الموارد والمقالات', desc: 'يعرض أحدث المقالات المنشورة من صفحة "إدارة المحتوى" — لن يظهر القسم إن لم توجد مقالات' },
                  { key: 'showTestimonials' as const, label: 'قسم الآراء', desc: 'شهادات وتقييمات المستخدمين' },
                  { key: 'showProducts' as const, label: 'قسم المنتجات', desc: 'عرض منتجات المستفيدين' },
                  { key: 'showStores' as const, label: 'قسم المتاجر', desc: 'عرض متاجر رواد الأعمال' },
                  { key: 'showPricing' as const, label: 'قسم خطط الأسعار', desc: 'يعرض الخطط المُدارة من صفحة "خطط التسعير" — لن يظهر القسم إن لم توجد خطط' },
                  { key: 'showContact' as const, label: 'قسم التواصل', desc: 'نموذج ومعلومات التواصل' },
                  { key: 'showCTA' as const, label: 'قسم الدعوة للعمل', desc: 'بانر التسجيل في نهاية الصفحة' },
                  { key: 'showAISpotlight' as const, label: 'قسم الذكاء الاصطناعي', desc: 'قسم "مدعوم بالذكاء الاصطناعي" الغامق' },
                  { key: 'showFAQ' as const, label: 'قسم الأسئلة الشائعة', desc: 'الأسئلة والأجوبة الشائعة' },
                  { key: 'showCourses' as const, label: 'قسم الدورات', desc: 'عرض الدورات التدريبية' },
                  { key: 'showSessions' as const, label: 'قسم الجلسات المباشرة', desc: 'يعرض الجلسات المتاحة — لن يظهر القسم إن لم توجد جلسات' },
                  { key: 'showSuccessStories' as const, label: 'قسم قصص النجاح', desc: 'يعرض قصص نجاح المستفيدين — لن يظهر القسم إن لم توجد قصص' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border hover:border-border transition-all">
                    <div className="flex items-center gap-3">
                      {config.sections[item.key]
                        ? <Eye className="h-4 w-4 text-emerald-400" />
                        : <EyeOff className="h-4 w-4 text-muted-foreground" />
                      }
                      <div>
                        <p className="text-foreground text-sm font-medium">{item.label}</p>
                        <p className="text-muted-foreground text-xs">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={config.sections[item.key]} onCheckedChange={() => setSection(item.key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FOOTER */}
          <TabsContent value="footer" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">الفوتر وروابط التواصل</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>وصف الفوتر</Label>
                  <Textarea value={config.footer.description} onChange={e => setFooter('description', e.target.value)} rows={2} className="resize-none" placeholder="وصف قصير للمنصة..." />
                </div>
                <div className="space-y-2">
                  <Label>نص حقوق النشر</Label>
                  <Input value={config.footer.copyright} onChange={e => setFooter('copyright', e.target.value)} placeholder="© 2024 EmpowerHub. جميع الحقوق محفوظة." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input value={config.footer.email} onChange={e => setFooter('email', e.target.value)} placeholder="info@empowerhub.com" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input value={config.footer.phone} onChange={e => setFooter('phone', e.target.value)} placeholder="+966..." dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>تويتر / X</Label>
                    <Input value={config.footer.twitter} onChange={e => setFooter('twitter', e.target.value)} placeholder="https://twitter.com/..." dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input value={config.footer.linkedin} onChange={e => setFooter('linkedin', e.target.value)} placeholder="https://linkedin.com/..." dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input value={config.footer.instagram} onChange={e => setFooter('instagram', e.target.value)} placeholder="https://instagram.com/..." dir="ltr" />
                  </div>
                </div>
                <div className="pt-2 border-t border-border space-y-4">
                  <p className="text-sm font-medium text-foreground">شريط الاشتراك بالنشرة</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>عنوان شريط الاشتراك</Label>
                      <Input value={config.footer.newsletterTitle} onChange={e => setFooter('newsletterTitle', e.target.value)} placeholder="انضم لمجتمع EmpowerHub الآن" />
                    </div>
                    <div className="space-y-2">
                      <Label>نص حقل البريد</Label>
                      <Input value={config.footer.newsletterPlaceholder} onChange={e => setFooter('newsletterPlaceholder', e.target.value)} placeholder="بريدك الإلكتروني" />
                    </div>
                    <div className="space-y-2">
                      <Label>نص زر الاشتراك</Label>
                      <Input value={config.footer.newsletterButton} onChange={e => setFooter('newsletterButton', e.target.value)} placeholder="اشترك" />
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border space-y-4">
                  <p className="text-sm font-medium text-foreground">عناوين أعمدة الروابط</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>عمود الروابط السريعة</Label>
                      <Input value={config.footer.quickLinksTitle} onChange={e => setFooter('quickLinksTitle', e.target.value)} placeholder="روابط سريعة" />
                    </div>
                    <div className="space-y-2">
                      <Label>عمود "ابدأ كـ"</Label>
                      <Input value={config.footer.roleLinksTitle} onChange={e => setFooter('roleLinksTitle', e.target.value)} placeholder="ابدأ كـ" />
                    </div>
                    <div className="space-y-2">
                      <Label>عمود الشركة</Label>
                      <Input value={config.footer.companyLinksTitle} onChange={e => setFooter('companyLinksTitle', e.target.value)} placeholder="الشركة" />
                    </div>
                    <div className="space-y-2">
                      <Label>عمود قانوني</Label>
                      <Input value={config.footer.legalLinksTitle} onChange={e => setFooter('legalLinksTitle', e.target.value)} placeholder="قانوني" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION HEADINGS */}
          <TabsContent value="headings" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-base">عناوين الأقسام</CardTitle>
                <p className="text-muted-foreground text-xs">النص التمهيدي والعنوان والوصف الفرعي لكل قسم في الصفحة الرئيسية — اتركها فارغة لاستخدام النص الافتراضي</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {SECTION_HEADING_KEYS.map(s => (
                  <div key={s.key} className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">النص التمهيدي</Label>
                        <Input
                          value={config.sectionHeadings[s.key]?.eyebrow || ''}
                          onChange={e => setSectionHeading(s.key, 'eyebrow', e.target.value)}
                          placeholder="افتراضي"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">العنوان</Label>
                        <Input
                          value={config.sectionHeadings[s.key]?.heading || ''}
                          onChange={e => setSectionHeading(s.key, 'heading', e.target.value)}
                          placeholder="افتراضي"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">الوصف الفرعي</Label>
                        <Input
                          value={config.sectionHeadings[s.key]?.subheading || ''}
                          onChange={e => setSectionHeading(s.key, 'subheading', e.target.value)}
                          placeholder="افتراضي"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI SPOTLIGHT */}
          <TabsContent value="aiSpotlight" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-base">قسم الذكاء الاصطناعي</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>النص التمهيدي</Label>
                    <Input value={config.aiSpotlight.eyebrow} onChange={e => setAISpotlight('eyebrow', e.target.value)} placeholder="مدعوم بالذكاء الاصطناعي" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input value={config.aiSpotlight.heading} onChange={e => setAISpotlight('heading', e.target.value)} placeholder="توصيات ذكية تسبقك خطوة." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الوصف الفرعي</Label>
                  <Textarea value={config.aiSpotlight.subheading} onChange={e => setAISpotlight('subheading', e.target.value)} rows={2} className="resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.aiSpotlight.cards.map((card, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                      <Label className="text-xs">بطاقة {i + 1} — العنوان</Label>
                      <Input value={card.title} onChange={e => updateAISpotlightCard(i, 'title', e.target.value)} />
                      <Label className="text-xs">بطاقة {i + 1} — الوصف</Label>
                      <Textarea value={card.description} onChange={e => updateAISpotlightCard(i, 'description', e.target.value)} rows={2} className="resize-none" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-base">الأسئلة الشائعة</CardTitle>
                  <Button type="button" size="sm" variant="outline" onClick={addFaq} className="gap-1">
                    <Plus className="h-4 w-4" />إضافة سؤال
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">اتركها فارغة لاستخدام الأسئلة الافتراضية</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.faq.length === 0 && (
                  <p className="text-muted-foreground text-sm py-4 text-center">لا توجد أسئلة مخصصة بعد — يتم عرض الأسئلة الافتراضية.</p>
                )}
                {config.faq.map((item, i) => (
                  <div key={i} className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">السؤال</Label>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeFaq(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input value={item.question} onChange={e => updateFaq(i, 'question', e.target.value)} placeholder="نص السؤال" />
                    <Label className="text-xs">الإجابة</Label>
                    <Textarea value={item.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} rows={2} className="resize-none" placeholder="نص الإجابة" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
