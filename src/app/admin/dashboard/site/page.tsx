"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save, Plus, Trash2, Upload, Globe, Image as ImageIcon, BarChart3, Sparkles,
  Layout, Link2, Eye, EyeOff, MessageSquare, Phone, Star, Users, UserCheck, LogIn,
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
  };
  footer: { description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string; copyright: string };
}

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
  },
  footer: { description: '', email: '', phone: '', twitter: '', linkedin: '', instagram: '', copyright: '' },
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
    if (!user) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم التعرف على حسابك، أعد تحميل الصفحة وحاول مجدداً.' });
      return;
    }
    setUploading(true);
    try {
      const token = await user.getIdToken();
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

  // How it works
  const addStep = () => setConfig(c => ({ ...c, howItWorks: [...c.howItWorks, { step: String(c.howItWorks.length + 1), title: '', desc: '', icon: 'CheckCircle' }] }));
  const updateStep = (i: number, k: string, v: string) =>
    setConfig(c => { const h = [...c.howItWorks]; h[i] = { ...h[i], [k]: v }; return { ...c, howItWorks: h }; });
  const removeStep = (i: number) =>
    setConfig(c => ({ ...c, howItWorks: c.howItWorks.filter((_, idx) => idx !== i) }));

  // Testimonials
  const addTestimonial = () => setConfig(c => ({ ...c, testimonials: [...c.testimonials, { name: '', role: '', text: '', stars: 5 }] }));
  const updateTestimonial = (i: number, k: string, v: string | number) =>
    setConfig(c => { const t = [...c.testimonials]; t[i] = { ...t[i], [k]: v }; return { ...c, testimonials: t }; });
  const removeTestimonial = (i: number) =>
    setConfig(c => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }));

  // Roles
  const addRole = () => setConfig(c => ({ ...c, roles: [...c.roles, { title: '', description: '', icon: 'UserCheck', badge: '', link: '/register' }] }));
  const updateRole = (i: number, k: string, v: string) =>
    setConfig(c => { const r = [...c.roles]; r[i] = { ...r[i], [k]: v }; return { ...c, roles: r }; });
  const removeRole = (i: number) =>
    setConfig(c => ({ ...c, roles: c.roles.filter((_, idx) => idx !== i) }));

  // Opportunities
  const addOpportunity = () => setConfig(c => ({ ...c, opportunities: [...c.opportunities, { title: '', description: '', icon: 'Star', badge: '', color: 'bg-primary', link: '/register' }] }));
  const updateOpportunity = (i: number, k: string, v: string) =>
    setConfig(c => { const o = [...c.opportunities]; o[i] = { ...o[i], [k]: v }; return { ...c, opportunities: o }; });
  const removeOpportunity = (i: number) =>
    setConfig(c => ({ ...c, opportunities: c.opportunities.filter((_, idx) => idx !== i) }));

  // Blog Posts
  const addBlogPost = () => setConfig(c => ({ ...c, blogPosts: [...c.blogPosts, { title: '', excerpt: '', category: '', imageUrl: '', link: '' }] }));
  const updateBlogPost = (i: number, k: string, v: string) =>
    setConfig(c => { const b = [...c.blogPosts]; b[i] = { ...b[i], [k]: v }; return { ...c, blogPosts: b }; });
  const removeBlogPost = (i: number) =>
    setConfig(c => ({ ...c, blogPosts: c.blogPosts.filter((_, idx) => idx !== i) }));

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
              { value: 'hero', label: 'الترحيب', icon: ImageIcon },
              { value: 'auth', label: 'صفحات الدخول', icon: LogIn },
              { value: 'stats', label: 'الإحصائيات', icon: BarChart3 },
              { value: 'features', label: 'المميزات', icon: Sparkles },
              { value: 'opportunities', label: 'الفرص', icon: UserCheck },
              { value: 'howitworks', label: 'كيف تعمل', icon: Layout },
              { value: 'roles', label: 'الأدوار', icon: Users },
              { value: 'blog', label: 'المقالات', icon: MessageSquare },
              { value: 'testimonials', label: 'الآراء', icon: Star },
              { value: 'contact', label: 'التواصل', icon: Phone },
              { value: 'cta', label: 'CTA بانر', icon: MessageSquare },
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
                <Button size="sm" onClick={addFeature} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة ميزة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.features.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد ميزات. أضف واحدة!</p>
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

          {/* OPPORTUNITIES */}
          <TabsContent value="opportunities" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">قسم الفرص المتاحة</CardTitle>
                <Button size="sm" onClick={addOpportunity} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة فرصة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-xs">الألوان المتاحة: bg-primary | bg-sky-500 | bg-amber-500 | bg-purple-500 | bg-rose-500 | bg-teal-600</p>
                {config.opportunities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد فرص. أضف واحدة!</p>
                ) : config.opportunities.map((opp, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">فرصة {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeOpportunity(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <input value={opp.title} onChange={e => updateOpportunity(i, 'title', e.target.value)} placeholder="اسم الفرصة" className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الشارة (اختياري)</Label>
                        <input value={opp.badge} onChange={e => updateOpportunity(i, 'badge', e.target.value)} placeholder="متاح الآن" className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <input value={opp.description} onChange={e => updateOpportunity(i, 'description', e.target.value)} placeholder="وصف الفرصة..." className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">اللون (Tailwind class)</Label>
                        <input value={opp.color} onChange={e => updateOpportunity(i, 'color', e.target.value)} placeholder="bg-primary" className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground font-mono" dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الرابط (اختياري)</Label>
                        <input value={opp.link} onChange={e => updateOpportunity(i, 'link', e.target.value)} placeholder="/register" className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" dir="ltr" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">تحكم بمظهر القسم الظاهر فعليًا بالموقع ("أحدث الفرص والمشاريع")</p>
                  <SectionStyleFields config={config} sectionKey="opportunities" setSectionStyle={setSectionStyle} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HOW IT WORKS */}
          <TabsContent value="howitworks" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">خطوات "كيف تعمل المنصة"</CardTitle>
                <Button size="sm" onClick={addStep} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة خطوة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.howItWorks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد خطوات.</p>
                ) : config.howItWorks.map((step, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">خطوة {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeStep(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">رقم الخطوة</Label>
                        <Input value={step.step} onChange={e => updateStep(i, 'step', e.target.value)} placeholder="١" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <Input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} placeholder="أنشئ حسابك" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الأيقونة</Label>
                        <Input value={step.icon} onChange={e => updateStep(i, 'icon', e.target.value)} placeholder="UserCheck" className="mt-1 h-8 text-sm" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <Textarea value={step.desc} onChange={e => updateStep(i, 'desc', e.target.value)} placeholder="وصف الخطوة..." rows={2} className="mt-1 text-sm resize-none" />
                    </div>
                  </div>
                ))}
                <SectionStyleFields config={config} sectionKey="howItWorks" setSectionStyle={setSectionStyle} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">بطاقات الأدوار (انضم إلينا)</CardTitle>
                <Button size="sm" onClick={addRole} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة دور</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.roles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد أدوار.</p>
                ) : config.roles.map((role, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">دور {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeRole(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <Input value={role.title} onChange={e => updateRole(i, 'title', e.target.value)} placeholder="كمستفيد" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الشارة (اختياري)</Label>
                        <Input value={role.badge} onChange={e => updateRole(i, 'badge', e.target.value)} placeholder="الأكثر شعبية" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الأيقونة</Label>
                        <Input value={role.icon} onChange={e => updateRole(i, 'icon', e.target.value)} placeholder="UserCheck" className="mt-1 h-8 text-sm" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <Textarea value={role.description} onChange={e => updateRole(i, 'description', e.target.value)} placeholder="وصف الدور..." rows={2} className="mt-1 text-sm resize-none" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">رابط التسجيل</Label>
                      <Input value={role.link} onChange={e => updateRole(i, 'link', e.target.value)} placeholder="/register?role=beneficiary" className="mt-1 h-8 text-sm" dir="ltr" />
                    </div>
                  </div>
                ))}
                <SectionStyleFields config={config} sectionKey="roles" setSectionStyle={setSectionStyle} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* BLOG POSTS */}
          <TabsContent value="blog" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">قسم الموارد والمقالات</CardTitle>
                <Button size="sm" onClick={addBlogPost} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة مقال</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.blogPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد مقالات. أضف واحداً!</p>
                ) : config.blogPosts.map((post, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">مقال {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeBlogPost(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <input value={post.title} onChange={e => updateBlogPost(i, 'title', e.target.value)} placeholder="عنوان المقال" className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">التصنيف</Label>
                        <input value={post.category} onChange={e => updateBlogPost(i, 'category', e.target.value)} placeholder="مسار مهني" className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">المقتطف</Label>
                      <input value={post.excerpt} onChange={e => updateBlogPost(i, 'excerpt', e.target.value)} placeholder="وصف مختصر للمقال..." className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">رابط الصورة (اختياري)</Label>
                        <input value={post.imageUrl} onChange={e => updateBlogPost(i, 'imageUrl', e.target.value)} placeholder="https://..." className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground font-mono" dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">رابط المقال (اختياري)</Label>
                        <input value={post.link} onChange={e => updateBlogPost(i, 'link', e.target.value)} placeholder="https://..." className="mt-1 w-full h-8 text-sm bg-card border border-border rounded-md px-2 text-foreground placeholder-muted-foreground font-mono" dir="ltr" />
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
                  { key: 'showOpportunities' as const, label: 'قسم الفرص المتاحة', desc: 'بطاقات الفرص والبرامج (مستوحى من Scholarships)' },
                  { key: 'showHowItWorks' as const, label: 'قسم كيف تعمل', desc: 'خطوات البدء بالمنصة' },
                  { key: 'showRoles' as const, label: 'قسم الأدوار', desc: 'بطاقات مستفيد / مدرب / مرشد / منظمة' },
                  { key: 'showMentors' as const, label: 'قسم المرشدون', desc: 'عرض المرشدين' },
                  { key: 'showCoaches' as const, label: 'قسم المدربون', desc: 'عرض المدربين' },
                  { key: 'showBlog' as const, label: 'قسم الموارد والمقالات', desc: 'بطاقات المقالات والموارد التعليمية' },
                  { key: 'showTestimonials' as const, label: 'قسم الآراء', desc: 'شهادات وتقييمات المستخدمين' },
                  { key: 'showProducts' as const, label: 'قسم المنتجات', desc: 'عرض منتجات المستفيدين' },
                  { key: 'showStores' as const, label: 'قسم المتاجر', desc: 'عرض متاجر رواد الأعمال' },
                  { key: 'showPricing' as const, label: 'قسم خطط الأسعار', desc: 'يعرض الخطط المُدارة من صفحة "خطط التسعير" — لن يظهر القسم إن لم توجد خطط' },
                  { key: 'showContact' as const, label: 'قسم التواصل', desc: 'نموذج ومعلومات التواصل' },
                  { key: 'showCTA' as const, label: 'قسم الدعوة للعمل', desc: 'بانر التسجيل في نهاية الصفحة' },
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
