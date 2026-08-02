"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Plus, Trash2, Globe, Palette, Layout, Phone, Upload } from "lucide-react";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";

interface SiteConfig {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  hero?: { title?: string; subtitle?: string; ctaText?: string; ctaSecondaryText?: string; backgroundImage?: string; };
  stats?: { label: string; value: string; icon?: string }[];
  features?: { title: string; description: string; icon?: string }[];
  howItWorks?: { step: string; title: string; desc: string; icon?: string }[];
  contact?: { phone?: string; whatsapp?: string; whatsappLink?: string; email?: string; };
  ctaBanner?: { title?: string; subtitle?: string; primaryText?: string; secondaryText?: string; };
  footer?: { description?: string; email?: string; phone?: string; twitter?: string; linkedin?: string; instagram?: string; copyright?: string; };
  sections?: {
    showStats?: boolean; showFeatures?: boolean; showOpportunities?: boolean; showHowItWorks?: boolean;
    showRoles?: boolean; showMentors?: boolean; showCoaches?: boolean; showCourses?: boolean; showBlog?: boolean;
    showTestimonials?: boolean; showProducts?: boolean; showStores?: boolean; showPricing?: boolean; showContact?: boolean; showCTA?: boolean;
  };
}

const sectionLabels: Record<string, string> = {
  showStats: 'الإحصائيات', showFeatures: 'المميزات', showOpportunities: 'الفرص',
  showHowItWorks: 'كيف تعمل', showRoles: 'الأدوار', showMentors: 'المرشدون',
  showCoaches: 'المدربون', showCourses: 'الدورات', showBlog: 'المقالات',
  showTestimonials: 'الشهادات', showProducts: 'المنتجات', showStores: 'المتاجر',
  showPricing: 'خطط الأسعار', showContact: 'التواصل', showCTA: 'دعوة للتسجيل',
};

export default function AdminHomepagePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const token = await user.getIdToken();
      const url = await uploadToStorage(file, 'site/logo', token);
      setConfig(c => ({ ...c, logoUrl: url }));
    } catch {}
    setUploadingLogo(false);
  };

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/public/site-config');
      const json = await res.json();
      if (json.config) setConfig(json.config);
    } catch {
      toast({ variant: 'destructive', title: 'خطأ في تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const save = async (patch: Partial<SiteConfig>) => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      toast({ title: 'تم الحفظ بنجاح' });
      fetchConfig();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof SiteConfig, value: any) => setConfig(c => ({ ...c, [key]: value }));
  const setHero = (key: string, value: string) => setConfig(c => ({ ...c, hero: { ...c.hero, [key]: value } }));
  const setContact = (key: string, value: string) => setConfig(c => ({ ...c, contact: { ...c.contact, [key]: value } }));
  const setFooter = (key: string, value: string) => setConfig(c => ({ ...c, footer: { ...c.footer, [key]: value } }));
  const setCtaBanner = (key: string, value: string) => setConfig(c => ({ ...c, ctaBanner: { ...c.ctaBanner, [key]: value } }));
  const setSection = (key: string, value: boolean) => setConfig(c => ({ ...c, sections: { ...c.sections, [key]: value } }));

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">محرر الموقع الرئيسي</h1>
        <p className="text-sm text-muted-foreground mt-1">تحكم في محتوى وإعدادات الصفحة الرئيسية للموقع</p>
      </div>

      <Tabs defaultValue="identity" dir="rtl">
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="identity">الهوية</TabsTrigger>
          <TabsTrigger value="hero">قسم البطل</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          <TabsTrigger value="features">المميزات</TabsTrigger>
          <TabsTrigger value="howitworks">كيف تعمل</TabsTrigger>
          <TabsTrigger value="contact">التواصل</TabsTrigger>
          <TabsTrigger value="footer">التذييل</TabsTrigger>
          <TabsTrigger value="sections">إظهار الأقسام</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />هوية المنصة</CardTitle>
              <CardDescription>الاسم، الشعار، العلامة التجارية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>اسم المنصة</Label>
                  <Input value={config.siteName || ''} onChange={e => set('siteName', e.target.value)} placeholder="EmpowerHub" />
                </div>
                <div className="space-y-1.5">
                  <Label>الشعار الموجز (Tagline)</Label>
                  <Input value={config.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="منصة التمكين الرقمي" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>شعار المنصة (Logo)</Label>
                  <div className="flex gap-2 items-start">
                    <Input value={config.logoUrl || ''} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." dir="ltr" className="flex-1" />
                    <label className="cursor-pointer flex-shrink-0">
                      <Button type="button" variant="outline" size="icon" disabled={uploadingLogo} asChild>
                        <span>{uploadingLogo ? <span className="text-xs">⏳</span> : <Upload className="h-4 w-4" />}</span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                    </label>
                    {config.logoUrl && (
                      <div className="h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted/40 flex-shrink-0">
                        <img src={config.logoUrl} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2"><Palette className="h-4 w-4" />اللون الرئيسي (Hex)</Label>
                  <div className="flex gap-2">
                    <Input value={config.primaryColor || ''} onChange={e => set('primaryColor', e.target.value)} placeholder="#6366f1" dir="ltr" />
                    {config.primaryColor && <div className="h-9 w-9 rounded-md border border-border shrink-0" style={{ backgroundColor: config.primaryColor }} />}
                  </div>
                </div>
              </div>
              <Button onClick={() => save({ siteName: config.siteName, tagline: config.tagline, logoUrl: config.logoUrl, primaryColor: config.primaryColor })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ الهوية'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>قسم البطل (Hero)</CardTitle>
              <CardDescription>العنوان والوصف وأزرار الدعوة للتسجيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>العنوان الرئيسي</Label>
                <Input value={config.hero?.title || ''} onChange={e => setHero('title', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>النص التوضيحي</Label>
                <Textarea rows={3} value={config.hero?.subtitle || ''} onChange={e => setHero('subtitle', e.target.value)} className="resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>نص الزر الرئيسي</Label>
                  <Input value={config.hero?.ctaText || ''} onChange={e => setHero('ctaText', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>نص الزر الثانوي</Label>
                  <Input value={config.hero?.ctaSecondaryText || ''} onChange={e => setHero('ctaSecondaryText', e.target.value)} />
                </div>
              </div>
              <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
                <p className="text-sm font-semibold">بانر الدعوة للتسجيل (CTA Banner)</p>
                <div className="space-y-1.5">
                  <Label>العنوان</Label>
                  <Input value={config.ctaBanner?.title || ''} onChange={e => setCtaBanner('title', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  <Input value={config.ctaBanner?.subtitle || ''} onChange={e => setCtaBanner('subtitle', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>نص الزر الرئيسي</Label>
                    <Input value={config.ctaBanner?.primaryText || ''} onChange={e => setCtaBanner('primaryText', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>نص الزر الثانوي</Label>
                    <Input value={config.ctaBanner?.secondaryText || ''} onChange={e => setCtaBanner('secondaryText', e.target.value)} />
                  </div>
                </div>
              </div>
              <Button onClick={() => save({ hero: config.hero, ctaBanner: config.ctaBanner })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ قسم البطل'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات</CardTitle>
              <CardDescription>الأرقام التي تظهر في شريط الإنجازات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(config.stats || []).map((stat, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">القيمة</Label>
                      <Input value={stat.value} onChange={e => {
                        const stats = [...(config.stats || [])];
                        stats[i] = { ...stats[i], value: e.target.value };
                        set('stats', stats);
                      }} placeholder="500+" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">التسمية</Label>
                      <Input value={stat.label} onChange={e => {
                        const stats = [...(config.stats || [])];
                        stats[i] = { ...stats[i], label: e.target.value };
                        set('stats', stats);
                      }} placeholder="مستفيد" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive mt-5"
                    onClick={() => set('stats', (config.stats || []).filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set('stats', [...(config.stats || []), { label: '', value: '' }])}>
                <Plus className="h-4 w-4 ml-1" />إضافة إحصائية
              </Button>
              <br />
              <Button onClick={() => save({ stats: config.stats })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ الإحصائيات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>المميزات</CardTitle>
              <CardDescription>ميزات المنصة الظاهرة في قسم المميزات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(config.features || []).map((feat, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Input value={feat.title} onChange={e => {
                      const features = [...(config.features || [])];
                      features[i] = { ...features[i], title: e.target.value };
                      set('features', features);
                    }} placeholder="عنوان الميزة" />
                    <Textarea rows={2} value={feat.description} onChange={e => {
                      const features = [...(config.features || [])];
                      features[i] = { ...features[i], description: e.target.value };
                      set('features', features);
                    }} placeholder="وصف الميزة" className="resize-none text-sm" />
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => set('features', (config.features || []).filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set('features', [...(config.features || []), { title: '', description: '' }])}>
                <Plus className="h-4 w-4 ml-1" />إضافة ميزة
              </Button>
              <br />
              <Button onClick={() => save({ features: config.features })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ المميزات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="howitworks">
          <Card>
            <CardHeader>
              <CardTitle>كيف تعمل المنصة</CardTitle>
              <CardDescription>الخطوات الإرشادية لاستخدام المنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(config.howItWorks || []).map((step, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-lg border border-border bg-muted/30">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-1">{i + 1}</div>
                  <div className="flex-1 space-y-2">
                    <Input value={step.title} onChange={e => {
                      const hw = [...(config.howItWorks || [])];
                      hw[i] = { ...hw[i], title: e.target.value };
                      set('howItWorks', hw);
                    }} placeholder="عنوان الخطوة" />
                    <Textarea rows={2} value={step.desc} onChange={e => {
                      const hw = [...(config.howItWorks || [])];
                      hw[i] = { ...hw[i], desc: e.target.value };
                      set('howItWorks', hw);
                    }} placeholder="وصف الخطوة" className="resize-none text-sm" />
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => set('howItWorks', (config.howItWorks || []).filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => {
                const len = (config.howItWorks || []).length + 1;
                set('howItWorks', [...(config.howItWorks || []), { step: String(len), title: '', desc: '' }]);
              }}>
                <Plus className="h-4 w-4 ml-1" />إضافة خطوة
              </Button>
              <br />
              <Button onClick={() => save({ howItWorks: config.howItWorks })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ الخطوات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />معلومات التواصل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>رقم الهاتف</Label>
                  <Input value={config.contact?.phone || ''} onChange={e => setContact('phone', e.target.value)} dir="ltr" placeholder="+962XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم واتساب</Label>
                  <Input value={config.contact?.whatsapp || ''} onChange={e => setContact('whatsapp', e.target.value)} dir="ltr" placeholder="+962XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label>رابط واتساب</Label>
                  <Input value={config.contact?.whatsappLink || ''} onChange={e => setContact('whatsappLink', e.target.value)} dir="ltr" placeholder="https://wa.me/..." />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={config.contact?.email || ''} onChange={e => setContact('email', e.target.value)} dir="ltr" type="email" />
                </div>
              </div>
              <Button onClick={() => save({ contact: config.contact })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ التواصل'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer">
          <Card>
            <CardHeader><CardTitle>التذييل (Footer)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>وصف المنصة</Label>
                <Textarea rows={2} value={config.footer?.description || ''} onChange={e => setFooter('description', e.target.value)} className="resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={config.footer?.email || ''} onChange={e => setFooter('email', e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الهاتف</Label>
                  <Input value={config.footer?.phone || ''} onChange={e => setFooter('phone', e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>تويتر / X</Label>
                  <Input value={config.footer?.twitter || ''} onChange={e => setFooter('twitter', e.target.value)} dir="ltr" placeholder="https://twitter.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label>LinkedIn</Label>
                  <Input value={config.footer?.linkedin || ''} onChange={e => setFooter('linkedin', e.target.value)} dir="ltr" placeholder="https://linkedin.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Instagram</Label>
                  <Input value={config.footer?.instagram || ''} onChange={e => setFooter('instagram', e.target.value)} dir="ltr" placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label>حقوق النشر</Label>
                  <Input value={config.footer?.copyright || ''} onChange={e => setFooter('copyright', e.target.value)} />
                </div>
              </div>
              <Button onClick={() => save({ footer: config.footer })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ التذييل'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Visibility Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" />إظهار أقسام الموقع</CardTitle>
              <CardDescription>تحكم في الأقسام التي تظهر في الصفحة الرئيسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(sectionLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <Label className="cursor-pointer">{label}</Label>
                  <Switch
                    checked={config.sections?.[key as keyof typeof config.sections] !== false}
                    onCheckedChange={v => setSection(key, v)}
                  />
                </div>
              ))}
              <Button onClick={() => save({ sections: config.sections })} disabled={saving} className="mt-2">
                <Save className="h-4 w-4 ml-2" />{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الأقسام'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
