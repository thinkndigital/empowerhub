"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save, Plus, Trash2, Upload, Globe, Image as ImageIcon, BarChart3, Sparkles,
  Layout, Link2, Eye, EyeOff, MessageSquare, Phone, Star, Users, UserCheck,
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

interface SiteConfig {
  siteName: string;
  tagline: string;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; backgroundImage: string };
  stats: { label: string; value: string; icon: string }[];
  features: { title: string; description: string; icon: string }[];
  opportunities: { title: string; description: string; icon: string; badge: string; color: string; link: string }[];
  howItWorks: { step: string; title: string; desc: string; icon: string }[];
  testimonials: { name: string; role: string; text: string; stars: number }[];
  blogPosts: { title: string; excerpt: string; category: string; imageUrl: string; link: string }[];
  contact: { phone: string; whatsapp: string; whatsappLink: string; email: string };
  ctaBanner: { title: string; subtitle: string; primaryText: string; secondaryText: string };
  roles: { title: string; description: string; icon: string; badge: string; link: string }[];
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
  logoUrl: '', faviconUrl: '',
  hero: { title: '', subtitle: '', ctaText: 'ابدأ الآن', ctaSecondaryText: 'تعرف على المزيد', backgroundImage: '' },
  stats: [], features: [], opportunities: [], howItWorks: [], testimonials: [], blogPosts: [],
  contact: { phone: '', whatsapp: '', whatsappLink: '', email: '' },
  ctaBanner: { title: '', subtitle: '', primaryText: 'ابدأ مجاناً الآن', secondaryText: 'تجربة المنصة أولاً' },
  roles: [],
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
      <Button onClick={onSave} disabled={saving} className={`gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}>
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
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const token = await user.getIdToken();
      onChange(await uploadToStorage(file, storagePath, token));
    } catch {}
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

export default function SiteEditorPage() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Live-preview brand color in the admin panel itself
  useEffect(() => {
    if (config.primaryColor) applyOrgColor(config.primaryColor);
  }, [config.primaryColor]);

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
  const setBanner = (k: keyof SiteConfig['ctaBanner'], v: string) =>
    setConfig(c => ({ ...c, ctaBanner: { ...c.ctaBanner, [k]: v } }));

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
          <TabsList className="bg-muted border border-border w-full flex-wrap h-auto gap-1 p-1">
            {[
              { value: 'identity', label: 'الهوية', icon: Globe },
              { value: 'hero', label: 'الترحيب', icon: ImageIcon },
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
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground gap-1 text-xs">
                <t.icon className="h-3 w-3" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* IDENTITY */}
          <TabsContent value="identity" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
                <div className="space-y-2">
                  <Label>اللون الرئيسي للمنصة</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primaryColor || '#3b82f6'}
                      onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                      className="h-10 w-10 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                    />
                    <Input
                      value={config.primaryColor || '#3b82f6'}
                      onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                      placeholder="#3b82f6"
                      className="max-w-[140px] font-mono"
                    />
                    <p className="text-xs text-muted-foreground">يؤثر على لون الأزرار والعناصر في صفحة الهبوط</p>
                  </div>
                </div>
                <ImageUploadField label="شعار الموقع (Logo)" value={config.logoUrl} onChange={url => setConfig(c => ({ ...c, logoUrl: url }))} storagePath="site/logo" />
                <ImageUploadField label="أيقونة الموقع (Favicon)" value={config.faviconUrl} onChange={url => setConfig(c => ({ ...c, faviconUrl: url }))} storagePath="site/favicon" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* HERO */}
          <TabsContent value="hero" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>نص الزر الرئيسي</Label>
                    <Input value={config.hero.ctaText} onChange={e => setHero('ctaText', e.target.value)} placeholder="ابدأ الآن" />
                  </div>
                  <div className="space-y-2">
                    <Label>نص الزر الثانوي</Label>
                    <Input value={config.hero.ctaSecondaryText} onChange={e => setHero('ctaSecondaryText', e.target.value)} placeholder="تعرف على المزيد" />
                  </div>
                </div>
                <ImageUploadField label="صورة الخلفية (اختياري)" value={config.hero.backgroundImage} onChange={url => setHero('backgroundImage', url)} storagePath="site/hero" />
                <div className="rounded-xl overflow-hidden border border-border">
                  <div
                    className="p-8 text-center bg-gradient-to-br from-primary/20 to-purple-900/30"
                    style={config.hero.backgroundImage ? { backgroundImage: `url(${config.hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <h2 className="text-foreground text-xl font-bold mb-2">{config.hero.title || 'العنوان الرئيسي'}</h2>
                    <p className="text-foreground/90 text-sm mb-4 whitespace-pre-line">{config.hero.subtitle || 'الوصف...'}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm">{config.hero.ctaText || 'ابدأ الآن'}</span>
                      <span className="border border-border text-foreground px-4 py-1.5 rounded-lg text-sm">{config.hero.ctaSecondaryText || 'تعرف على المزيد'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS */}
          <TabsContent value="stats" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-base">الإحصائيات</CardTitle>
                <Button size="sm" onClick={addStat} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.stats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لا توجد إحصائيات. أضف واحدة!</p>
                ) : config.stats.map((stat, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-muted/40 rounded-xl border border-border">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">الرقم/القيمة</Label>
                        <Input value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="500+" className="mt-1 h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">التسمية</Label>
                        <Input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="مستفيد نشط" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeStat(i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 mt-4 flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
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
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* OPPORTUNITIES */}
          <TabsContent value="opportunities" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* HOW IT WORKS */}
          <TabsContent value="howitworks" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">رقم الخطوة</Label>
                        <Input value={step.step} onChange={e => updateStep(i, 'step', e.target.value)} placeholder="١" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <Input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} placeholder="أنشئ حسابك" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <Textarea value={step.desc} onChange={e => updateStep(i, 'desc', e.target.value)} placeholder="وصف الخطوة..." rows={2} className="mt-1 text-sm resize-none" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <Input value={role.title} onChange={e => updateRole(i, 'title', e.target.value)} placeholder="كمستفيد" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">الشارة (اختياري)</Label>
                        <Input value={role.badge} onChange={e => updateRole(i, 'badge', e.target.value)} placeholder="الأكثر شعبية" className="mt-1 h-8 text-sm" />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* BLOG POSTS */}
          <TabsContent value="blog" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>نص الزر الرئيسي</Label>
                    <Input value={config.ctaBanner.primaryText} onChange={e => setBanner('primaryText', e.target.value)} placeholder="ابدأ مجاناً الآن" />
                  </div>
                  <div className="space-y-2">
                    <Label>نص الزر الثانوي</Label>
                    <Input value={config.ctaBanner.secondaryText} onChange={e => setBanner('secondaryText', e.target.value)} placeholder="تجربة المنصة أولاً" />
                  </div>
                </div>
                {/* Preview */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="p-8 text-center bg-primary">
                    <h2 className="text-foreground text-xl font-bold mb-2">{config.ctaBanner.title || 'العنوان...'}</h2>
                    <p className="text-foreground/80 text-sm mb-4">{config.ctaBanner.subtitle || 'الوصف...'}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <span className="bg-white text-primary px-4 py-1.5 rounded-lg text-sm font-bold">{config.ctaBanner.primaryText}</span>
                      <span className="border border-border text-foreground px-4 py-1.5 rounded-lg text-sm">{config.ctaBanner.secondaryText}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTIONS */}
          <TabsContent value="sections" className="mt-4">
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
            <Card className="bg-card border-border shadow-lg shadow-black/20">
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
