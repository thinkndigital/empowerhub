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
import { useStorage } from "@/firebase/provider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface SiteConfig {
  siteName: string;
  tagline: string;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; backgroundImage: string };
  stats: { label: string; value: string; icon: string }[];
  features: { title: string; description: string; icon: string }[];
  howItWorks: { step: string; title: string; desc: string; icon: string }[];
  testimonials: { name: string; role: string; text: string; stars: number }[];
  contact: { phone: string; whatsapp: string; whatsappLink: string; email: string };
  ctaBanner: { title: string; subtitle: string; primaryText: string; secondaryText: string };
  roles: { title: string; description: string; icon: string; badge: string; link: string }[];
  sections: {
    showStats: boolean; showFeatures: boolean; showHowItWorks: boolean; showRoles: boolean;
    showMentors: boolean; showCoaches: boolean; showTestimonials: boolean; showProducts: boolean;
    showStores: boolean; showContact: boolean; showCTA: boolean;
  };
  footer: { description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string; copyright: string };
}

const defaultConfig: SiteConfig = {
  siteName: 'EmpowerHub', tagline: 'منصة التمكين الرقمي',
  primaryColor: '#3b82f6',
  logoUrl: '', faviconUrl: '',
  hero: { title: '', subtitle: '', ctaText: 'ابدأ الآن', ctaSecondaryText: 'تعرف على المزيد', backgroundImage: '' },
  stats: [], features: [], howItWorks: [], testimonials: [],
  contact: { phone: '', whatsapp: '', whatsappLink: '', email: '' },
  ctaBanner: { title: '', subtitle: '', primaryText: 'ابدأ مجاناً الآن', secondaryText: 'تجربة المنصة أولاً' },
  roles: [],
  sections: {
    showStats: true, showFeatures: true, showHowItWorks: true, showRoles: true,
    showMentors: true, showCoaches: true, showTestimonials: true, showProducts: true,
    showStores: true, showContact: true, showCTA: true,
  },
  footer: { description: '', email: '', phone: '', twitter: '', linkedin: '', instagram: '', copyright: '' },
};

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="sticky top-14 z-20 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <p className="text-slate-400 text-sm">تعديل محتوى الموقع</p>
      <Button onClick={onSave} disabled={saving} className={`gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}>
        <Save className="h-4 w-4" />
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ جميع التغييرات'}
      </Button>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, storagePath }: {
  label: string; value: string; onChange: (url: string) => void; storagePath: string;
}) {
  const storage = useStorage();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;
    setUploading(true);
    try {
      const r = ref(storage, `${storagePath}/${Date.now()}-${file.name}`);
      const snap = await uploadBytes(r, file);
      const url = await getDownloadURL(snap.ref);
      onChange(url);
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
        <div className="h-20 w-20 border border-white/20 rounded-xl overflow-hidden bg-slate-700/30">
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
          roles: d.config.roles ?? defaultConfig.roles,
          stats: d.config.stats ?? defaultConfig.stats,
          features: d.config.features ?? defaultConfig.features,
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

  if (loading) return <div className="text-slate-400 text-center py-16">جاري التحميل...</div>;

  return (
    <div className="space-y-0" dir="rtl">
      <div className="px-0 pb-4">
        <h1 className="text-2xl font-bold text-white">تعديل الموقع</h1>
        <p className="text-slate-400 text-sm">تحكم كامل في محتوى وتصميم الصفحة الرئيسية — التغييرات تظهر فوراً بعد الحفظ</p>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />

      <div className="pt-4">
        <Tabs defaultValue="identity">
          <TabsList className="bg-slate-800 border border-white/10 w-full flex-wrap h-auto gap-1 p-1">
            {[
              { value: 'identity', label: 'الهوية', icon: Globe },
              { value: 'hero', label: 'الترحيب', icon: ImageIcon },
              { value: 'stats', label: 'الإحصائيات', icon: BarChart3 },
              { value: 'features', label: 'المميزات', icon: Sparkles },
              { value: 'howitworks', label: 'كيف تعمل', icon: Layout },
              { value: 'roles', label: 'الأدوار', icon: Users },
              { value: 'testimonials', label: 'الآراء', icon: Star },
              { value: 'contact', label: 'التواصل', icon: Phone },
              { value: 'cta', label: 'CTA بانر', icon: MessageSquare },
              { value: 'sections', label: 'الأقسام', icon: Eye },
              { value: 'footer', label: 'الفوتر', icon: Link2 },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400 gap-1 text-xs">
                <t.icon className="h-3 w-3" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* IDENTITY */}
          <TabsContent value="identity" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">هوية الموقع والشعار</CardTitle></CardHeader>
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
                      className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5"
                    />
                    <Input
                      value={config.primaryColor || '#3b82f6'}
                      onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                      placeholder="#3b82f6"
                      className="max-w-[140px] font-mono"
                    />
                    <p className="text-xs text-slate-400">يؤثر على لون الأزرار والعناصر في صفحة الهبوط</p>
                  </div>
                </div>
                <ImageUploadField label="شعار الموقع (Logo)" value={config.logoUrl} onChange={url => setConfig(c => ({ ...c, logoUrl: url }))} storagePath="site/logo" />
                <ImageUploadField label="أيقونة الموقع (Favicon)" value={config.faviconUrl} onChange={url => setConfig(c => ({ ...c, faviconUrl: url }))} storagePath="site/favicon" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* HERO */}
          <TabsContent value="hero" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">قسم الترحيب (Hero Section)</CardTitle></CardHeader>
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
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <div
                    className="p-8 text-center bg-gradient-to-br from-primary/20 to-purple-900/30"
                    style={config.hero.backgroundImage ? { backgroundImage: `url(${config.hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <h2 className="text-white text-xl font-bold mb-2">{config.hero.title || 'العنوان الرئيسي'}</h2>
                    <p className="text-slate-300 text-sm mb-4 whitespace-pre-line">{config.hero.subtitle || 'الوصف...'}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <span className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm">{config.hero.ctaText || 'ابدأ الآن'}</span>
                      <span className="border border-white/30 text-white px-4 py-1.5 rounded-lg text-sm">{config.hero.ctaSecondaryText || 'تعرف على المزيد'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS */}
          <TabsContent value="stats" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base">الإحصائيات</CardTitle>
                <Button size="sm" onClick={addStat} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.stats.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">لا توجد إحصائيات. أضف واحدة!</p>
                ) : config.stats.map((stat, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-slate-700/30 rounded-xl border border-white/5">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">الرقم/القيمة</Label>
                        <Input value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="500+" className="mt-1 h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-slate-500">التسمية</Label>
                        <Input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="مستفيد نشط" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeStat(i)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 mt-4 flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {config.stats.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-white/10">
                    <p className="text-slate-500 text-xs mb-3">معاينة:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {config.stats.map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="text-white text-2xl font-bold">{s.value}</p>
                          <p className="text-slate-400 text-xs mt-1">{s.label}</p>
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
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base">بطاقات المميزات</CardTitle>
                <Button size="sm" onClick={addFeature} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة ميزة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.features.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">لا توجد ميزات. أضف واحدة!</p>
                ) : config.features.map((feat, i) => (
                  <div key={i} className="p-3 bg-slate-700/30 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs font-medium">ميزة {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFeature(i)} className="h-7 w-7 p-0 text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">العنوان</Label>
                        <Input value={feat.title} onChange={e => updateFeature(i, 'title', e.target.value)} placeholder="عنوان الميزة" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">الأيقونة (اختياري)</Label>
                        <Input value={feat.icon} onChange={e => updateFeature(i, 'icon', e.target.value)} placeholder="BookOpen" className="mt-1 h-8 text-sm" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">الوصف</Label>
                      <Input value={feat.description} onChange={e => updateFeature(i, 'description', e.target.value)} placeholder="وصف الميزة..." className="mt-1 h-8 text-sm" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HOW IT WORKS */}
          <TabsContent value="howitworks" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base">خطوات "كيف تعمل المنصة"</CardTitle>
                <Button size="sm" onClick={addStep} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة خطوة</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.howItWorks.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">لا توجد خطوات.</p>
                ) : config.howItWorks.map((step, i) => (
                  <div key={i} className="p-3 bg-slate-700/30 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs font-medium">خطوة {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeStep(i)} className="h-7 w-7 p-0 text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">رقم الخطوة</Label>
                        <Input value={step.step} onChange={e => updateStep(i, 'step', e.target.value)} placeholder="١" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">العنوان</Label>
                        <Input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} placeholder="أنشئ حسابك" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">الوصف</Label>
                      <Textarea value={step.desc} onChange={e => updateStep(i, 'desc', e.target.value)} placeholder="وصف الخطوة..." rows={2} className="mt-1 text-sm resize-none" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base">بطاقات الأدوار (انضم إلينا)</CardTitle>
                <Button size="sm" onClick={addRole} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة دور</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.roles.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">لا توجد أدوار.</p>
                ) : config.roles.map((role, i) => (
                  <div key={i} className="p-3 bg-slate-700/30 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs font-medium">دور {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeRole(i)} className="h-7 w-7 p-0 text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">العنوان</Label>
                        <Input value={role.title} onChange={e => updateRole(i, 'title', e.target.value)} placeholder="كمستفيد" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">الشارة (اختياري)</Label>
                        <Input value={role.badge} onChange={e => updateRole(i, 'badge', e.target.value)} placeholder="الأكثر شعبية" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">الوصف</Label>
                      <Textarea value={role.description} onChange={e => updateRole(i, 'description', e.target.value)} placeholder="وصف الدور..." rows={2} className="mt-1 text-sm resize-none" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">رابط التسجيل</Label>
                      <Input value={role.link} onChange={e => updateRole(i, 'link', e.target.value)} placeholder="/register?role=beneficiary" className="mt-1 h-8 text-sm" dir="ltr" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TESTIMONIALS */}
          <TabsContent value="testimonials" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base">آراء المستخدمين (Testimonials)</CardTitle>
                <Button size="sm" onClick={addTestimonial} className="gap-1"><Plus className="h-3.5 w-3.5" />إضافة رأي</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.testimonials.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">لا توجد آراء.</p>
                ) : config.testimonials.map((t, i) => (
                  <div key={i} className="p-3 bg-slate-700/30 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs font-medium">رأي {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeTestimonial(i)} className="h-7 w-7 p-0 text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">الاسم</Label>
                        <Input value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} placeholder="اسم المستخدم" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">الدور/المسمى</Label>
                        <Input value={t.role} onChange={e => updateTestimonial(i, 'role', e.target.value)} placeholder="مستفيد - رائد أعمال" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">نص الرأي</Label>
                      <Textarea value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)} placeholder="ماذا قال المستخدم..." rows={3} className="mt-1 text-sm resize-none" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">التقييم (1-5 نجوم)</Label>
                      <div className="flex gap-2 mt-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateTestimonial(i, 'stars', n)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${t.stars >= n ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-600'}`}
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
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">معلومات التواصل</CardTitle></CardHeader>
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
                  <p className="text-slate-500 text-xs">مثال: https://wa.me/966500000000</p>
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
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">بانر الدعوة للعمل (CTA Banner)</CardTitle></CardHeader>
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
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <div className="p-8 text-center bg-primary">
                    <h2 className="text-white text-xl font-bold mb-2">{config.ctaBanner.title || 'العنوان...'}</h2>
                    <p className="text-white/80 text-sm mb-4">{config.ctaBanner.subtitle || 'الوصف...'}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <span className="bg-white text-primary px-4 py-1.5 rounded-lg text-sm font-bold">{config.ctaBanner.primaryText}</span>
                      <span className="border border-white/40 text-white px-4 py-1.5 rounded-lg text-sm">{config.ctaBanner.secondaryText}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTIONS */}
          <TabsContent value="sections" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">تشغيل وإيقاف الأقسام</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'showStats' as const, label: 'قسم الإحصائيات', desc: 'أرقام الإنجازات والإحصائيات' },
                  { key: 'showFeatures' as const, label: 'قسم المميزات', desc: 'بطاقات ميزات المنصة' },
                  { key: 'showHowItWorks' as const, label: 'قسم كيف تعمل', desc: 'خطوات البدء بالمنصة' },
                  { key: 'showRoles' as const, label: 'قسم الأدوار', desc: 'بطاقات مستفيد / مدرب / مرشد / منظمة' },
                  { key: 'showMentors' as const, label: 'قسم المرشدون', desc: 'عرض المرشدين' },
                  { key: 'showCoaches' as const, label: 'قسم المدربون', desc: 'عرض المدربين' },
                  { key: 'showTestimonials' as const, label: 'قسم الآراء', desc: 'شهادات وتقييمات المستخدمين' },
                  { key: 'showProducts' as const, label: 'قسم المنتجات', desc: 'عرض منتجات المستفيدين' },
                  { key: 'showStores' as const, label: 'قسم المتاجر', desc: 'عرض متاجر رواد الأعمال' },
                  { key: 'showContact' as const, label: 'قسم التواصل', desc: 'نموذج ومعلومات التواصل' },
                  { key: 'showCTA' as const, label: 'قسم الدعوة للعمل', desc: 'بانر التسجيل في نهاية الصفحة' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      {config.sections[item.key]
                        ? <Eye className="h-4 w-4 text-emerald-400" />
                        : <EyeOff className="h-4 w-4 text-slate-500" />
                      }
                      <div>
                        <p className="text-white text-sm font-medium">{item.label}</p>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
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
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">الفوتر وروابط التواصل</CardTitle></CardHeader>
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
