"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Plus, Trash2, Upload, Globe, Image as ImageIcon, BarChart3, Sparkles, Layout, Link2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useStorage } from "@/firebase/provider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface SiteConfig {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; backgroundImage: string };
  stats: { label: string; value: string; icon: string }[];
  features: { title: string; description: string; icon: string }[];
  sections: { showStats: boolean; showFeatures: boolean; showMentors: boolean; showProducts: boolean; showTestimonials: boolean; showCTA: boolean };
  footer: { description: string; email: string; phone: string; twitter: string; linkedin: string; instagram: string };
}

const defaultConfig: SiteConfig = {
  siteName: 'EmpowerHub', tagline: 'منصة التمكين الرقمي',
  logoUrl: '', faviconUrl: '',
  hero: { title: '', subtitle: '', ctaText: 'ابدأ الآن', ctaSecondaryText: 'تعرف على المزيد', backgroundImage: '' },
  stats: [], features: [],
  sections: { showStats: true, showFeatures: true, showMentors: true, showProducts: true, showTestimonials: true, showCTA: true },
  footer: { description: '', email: '', phone: '', twitter: '', linkedin: '', instagram: '' },
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
            <span>{uploading ? <span className="animate-spin text-xs">⏳</span> : <Upload className="h-4 w-4" />}</span>
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
      if (d.config) setConfig(d.config);
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

  const addStat = () => setConfig(c => ({ ...c, stats: [...c.stats, { label: '', value: '', icon: 'Users' }] }));
  const updateStat = (i: number, k: string, v: string) =>
    setConfig(c => { const s = [...c.stats]; s[i] = { ...s[i], [k]: v }; return { ...c, stats: s }; });
  const removeStat = (i: number) =>
    setConfig(c => ({ ...c, stats: c.stats.filter((_, idx) => idx !== i) }));

  const addFeature = () => setConfig(c => ({ ...c, features: [...c.features, { title: '', description: '', icon: 'Star' }] }));
  const updateFeature = (i: number, k: string, v: string) =>
    setConfig(c => { const f = [...c.features]; f[i] = { ...f[i], [k]: v }; return { ...c, features: f }; });
  const removeFeature = (i: number) =>
    setConfig(c => ({ ...c, features: c.features.filter((_, idx) => idx !== i) }));

  if (loading) return <div className="text-slate-400 text-center py-16">جاري التحميل...</div>;

  return (
    <div className="space-y-0" dir="rtl">
      <div className="px-0 pb-4">
        <h1 className="text-2xl font-bold text-white">تعديل الموقع</h1>
        <p className="text-slate-400 text-sm">تحكم كامل في محتوى وتصميم الصفحة الرئيسية</p>
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
              { value: 'sections', label: 'الأقسام', icon: Layout },
              { value: 'footer', label: 'الفوتر', icon: Link2 },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400 gap-1.5 text-xs sm:text-sm">
                <t.icon className="h-3.5 w-3.5" />
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
                <ImageUploadField
                  label="شعار الموقع (Logo)"
                  value={config.logoUrl}
                  onChange={url => setConfig(c => ({ ...c, logoUrl: url }))}
                  storagePath="site/logo"
                />
                <ImageUploadField
                  label="أيقونة الموقع (Favicon)"
                  value={config.faviconUrl}
                  onChange={url => setConfig(c => ({ ...c, faviconUrl: url }))}
                  storagePath="site/favicon"
                />
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
                  <Input value={config.hero.title} onChange={e => setHero('title', e.target.value)} placeholder="منصة التمكين الرقمي" />
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
                <ImageUploadField
                  label="صورة الخلفية (اختياري)"
                  value={config.hero.backgroundImage}
                  onChange={url => setHero('backgroundImage', url)}
                  storagePath="site/hero"
                />
                {/* Preview */}
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <div
                    className="p-8 text-center bg-gradient-to-br from-primary/20 to-purple-900/30"
                    style={config.hero.backgroundImage ? { backgroundImage: `url(${config.hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <h2 className="text-white text-xl font-bold mb-2">{config.hero.title || 'العنوان الرئيسي'}</h2>
                    <p className="text-slate-300 text-sm mb-4">{config.hero.subtitle || 'الوصف...'}</p>
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
                <Button size="sm" onClick={addStat} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  إضافة
                </Button>
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
                {/* Preview */}
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
                <Button size="sm" onClick={addFeature} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  إضافة ميزة
                </Button>
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
                        <Label className="text-xs text-slate-500">الأيقونة</Label>
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

          {/* SECTIONS */}
          <TabsContent value="sections" className="mt-4">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader><CardTitle className="text-white text-base">تشغيل وإيقاف الأقسام</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'showStats' as const, label: 'قسم الإحصائيات', desc: 'أرقام الإنجازات والإحصائيات' },
                  { key: 'showFeatures' as const, label: 'قسم المميزات', desc: 'بطاقات ميزات المنصة' },
                  { key: 'showMentors' as const, label: 'قسم المرشدون والمدربون', desc: 'عرض المرشدين والمدربين' },
                  { key: 'showProducts' as const, label: 'قسم المنتجات', desc: 'عرض منتجات المستفيدين' },
                  { key: 'showTestimonials' as const, label: 'قسم الآراء', desc: 'شهادات وتقييمات المستخدمين' },
                  { key: 'showCTA' as const, label: 'قسم الدعوة للعمل', desc: 'زر التسجيل في نهاية الصفحة' },
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
