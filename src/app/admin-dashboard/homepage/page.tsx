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
import { useLanguage } from "@/components/language-provider";

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
const sectionLabelsEn: Record<string, string> = {
  showStats: 'Stats', showFeatures: 'Features', showOpportunities: 'Opportunities',
  showHowItWorks: 'How it works', showRoles: 'Roles', showMentors: 'Mentors',
  showCoaches: 'Coaches', showCourses: 'Courses', showBlog: 'Articles',
  showTestimonials: 'Testimonials', showProducts: 'Products', showStores: 'Stores',
  showPricing: 'Pricing plans', showContact: 'Contact', showCTA: 'Sign-up CTA',
};

export default function AdminHomepagePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const tSectionLabels = lang === 'en' ? sectionLabelsEn : sectionLabels;
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!user) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('لم يتم التعرف على حسابك، أعد تحميل الصفحة وحاول مجدداً.', 'We could not identify your account. Reload the page and try again.') });
      return;
    }
    setUploadingLogo(true);
    try {
      const token = await user.getIdToken();
      const url = await uploadToStorage(file, 'site/logo', token);
      setConfig(c => ({ ...c, logoUrl: url }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: bi('فشل رفع الصورة', 'Image upload failed'), description: err?.message || bi('حدث خطأ غير متوقع', 'An unexpected error occurred') });
    }
    setUploadingLogo(false);
  };

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/public/site-config');
      const json = await res.json();
      if (json.config) setConfig(json.config);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ في تحميل الإعدادات', 'Error loading settings') });
    } finally {
      setLoading(false);
    }
  }, [toast, lang]);

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
      if (!res.ok) throw new Error(bi('فشل الحفظ', 'Save failed'));
      toast({ title: bi('تم الحفظ بنجاح', 'Saved successfully') });
      fetchConfig();
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
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
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("محرر الموقع الرئيسي", "Homepage Editor")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{bi("تحكم في محتوى وإعدادات الصفحة الرئيسية للموقع", "Control the content and settings of the site's homepage")}</p>
      </div>

      <Tabs defaultValue="identity" dir={dir}>
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="identity">{bi("الهوية", "Identity")}</TabsTrigger>
          <TabsTrigger value="hero">{bi("قسم البطل", "Hero section")}</TabsTrigger>
          <TabsTrigger value="stats">{bi("الإحصائيات", "Stats")}</TabsTrigger>
          <TabsTrigger value="features">{bi("المميزات", "Features")}</TabsTrigger>
          <TabsTrigger value="howitworks">{bi("كيف تعمل", "How it works")}</TabsTrigger>
          <TabsTrigger value="contact">{bi("التواصل", "Contact")}</TabsTrigger>
          <TabsTrigger value="footer">{bi("التذييل", "Footer")}</TabsTrigger>
          <TabsTrigger value="sections">{bi("إظهار الأقسام", "Section visibility")}</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{bi("هوية المنصة", "Platform identity")}</CardTitle>
              <CardDescription>{bi("الاسم، الشعار، العلامة التجارية", "Name, logo, branding")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{bi("اسم المنصة", "Platform name")}</Label>
                  <Input value={config.siteName || ''} onChange={e => set('siteName', e.target.value)} placeholder="EmpowerHub" />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("الشعار الموجز (Tagline)", "Tagline")}</Label>
                  <Input value={config.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="منصة التمكين الرقمي" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{bi("شعار المنصة (Logo)", "Logo")}</Label>
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
                  <Label className="flex items-center gap-2"><Palette className="h-4 w-4" />{bi("اللون الرئيسي (Hex)", "Primary color (Hex)")}</Label>
                  <div className="flex gap-2">
                    <Input value={config.primaryColor || ''} onChange={e => set('primaryColor', e.target.value)} placeholder="#6366f1" dir="ltr" />
                    {config.primaryColor && <div className="h-9 w-9 rounded-md border border-border shrink-0" style={{ backgroundColor: config.primaryColor }} />}
                  </div>
                </div>
              </div>
              <Button onClick={() => save({ siteName: config.siteName, tagline: config.tagline, logoUrl: config.logoUrl, primaryColor: config.primaryColor })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ الهوية', 'Save identity')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>{bi("قسم البطل (Hero)", "Hero section")}</CardTitle>
              <CardDescription>{bi("العنوان والوصف وأزرار الدعوة للتسجيل", "The heading, description, and sign-up call-to-action buttons")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{bi("العنوان الرئيسي", "Main heading")}</Label>
                <Input value={config.hero?.title || ''} onChange={e => setHero('title', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{bi("النص التوضيحي", "Description text")}</Label>
                <Textarea rows={3} value={config.hero?.subtitle || ''} onChange={e => setHero('subtitle', e.target.value)} className="resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{bi("نص الزر الرئيسي", "Primary button text")}</Label>
                  <Input value={config.hero?.ctaText || ''} onChange={e => setHero('ctaText', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("نص الزر الثانوي", "Secondary button text")}</Label>
                  <Input value={config.hero?.ctaSecondaryText || ''} onChange={e => setHero('ctaSecondaryText', e.target.value)} />
                </div>
              </div>
              <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
                <p className="text-sm font-semibold">{bi("بانر الدعوة للتسجيل (CTA Banner)", "Sign-up CTA banner")}</p>
                <div className="space-y-1.5">
                  <Label>{bi("العنوان", "Title")}</Label>
                  <Input value={config.ctaBanner?.title || ''} onChange={e => setCtaBanner('title', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("الوصف", "Description")}</Label>
                  <Input value={config.ctaBanner?.subtitle || ''} onChange={e => setCtaBanner('subtitle', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{bi("نص الزر الرئيسي", "Primary button text")}</Label>
                    <Input value={config.ctaBanner?.primaryText || ''} onChange={e => setCtaBanner('primaryText', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{bi("نص الزر الثانوي", "Secondary button text")}</Label>
                    <Input value={config.ctaBanner?.secondaryText || ''} onChange={e => setCtaBanner('secondaryText', e.target.value)} />
                  </div>
                </div>
              </div>
              <Button onClick={() => save({ hero: config.hero, ctaBanner: config.ctaBanner })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ قسم البطل', 'Save hero section')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>{bi("الإحصائيات", "Stats")}</CardTitle>
              <CardDescription>{bi("الأرقام التي تظهر في شريط الإنجازات", "The numbers shown in the achievements bar")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(config.stats || []).map((stat, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{bi("القيمة", "Value")}</Label>
                      <Input value={stat.value} onChange={e => {
                        const stats = [...(config.stats || [])];
                        stats[i] = { ...stats[i], value: e.target.value };
                        set('stats', stats);
                      }} placeholder="500+" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{bi("التسمية", "Label")}</Label>
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
                <Plus className="h-4 w-4 ml-1" />{bi("إضافة إحصائية", "Add stat")}
              </Button>
              <br />
              <Button onClick={() => save({ stats: config.stats })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ الإحصائيات', 'Save stats')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>{bi("المميزات", "Features")}</CardTitle>
              <CardDescription>{bi("ميزات المنصة الظاهرة في قسم المميزات", "The platform features shown in the features section")}</CardDescription>
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
                <Plus className="h-4 w-4 ml-1" />{bi("إضافة ميزة", "Add feature")}
              </Button>
              <br />
              <Button onClick={() => save({ features: config.features })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ المميزات', 'Save features')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="howitworks">
          <Card>
            <CardHeader>
              <CardTitle>{bi("كيف تعمل المنصة", "How the platform works")}</CardTitle>
              <CardDescription>{bi("الخطوات الإرشادية لاستخدام المنصة", "The guided steps for using the platform")}</CardDescription>
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
                <Plus className="h-4 w-4 ml-1" />{bi("إضافة خطوة", "Add step")}
              </Button>
              <br />
              <Button onClick={() => save({ howItWorks: config.howItWorks })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ الخطوات', 'Save steps')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />{bi("معلومات التواصل", "Contact information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{bi("رقم الهاتف", "Phone number")}</Label>
                  <Input value={config.contact?.phone || ''} onChange={e => setContact('phone', e.target.value)} dir="ltr" placeholder="+962XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("رقم واتساب", "WhatsApp number")}</Label>
                  <Input value={config.contact?.whatsapp || ''} onChange={e => setContact('whatsapp', e.target.value)} dir="ltr" placeholder="+962XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("رابط واتساب", "WhatsApp link")}</Label>
                  <Input value={config.contact?.whatsappLink || ''} onChange={e => setContact('whatsappLink', e.target.value)} dir="ltr" placeholder="https://wa.me/..." />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("البريد الإلكتروني", "Email")}</Label>
                  <Input value={config.contact?.email || ''} onChange={e => setContact('email', e.target.value)} dir="ltr" type="email" />
                </div>
              </div>
              <Button onClick={() => save({ contact: config.contact })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ التواصل', 'Save contact info')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer">
          <Card>
            <CardHeader><CardTitle>{bi("التذييل (Footer)", "Footer")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{bi("وصف المنصة", "Platform description")}</Label>
                <Textarea rows={2} value={config.footer?.description || ''} onChange={e => setFooter('description', e.target.value)} className="resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{bi("البريد الإلكتروني", "Email")}</Label>
                  <Input value={config.footer?.email || ''} onChange={e => setFooter('email', e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("رقم الهاتف", "Phone number")}</Label>
                  <Input value={config.footer?.phone || ''} onChange={e => setFooter('phone', e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>{bi("تويتر / X", "Twitter / X")}</Label>
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
                  <Label>{bi("حقوق النشر", "Copyright")}</Label>
                  <Input value={config.footer?.copyright || ''} onChange={e => setFooter('copyright', e.target.value)} />
                </div>
              </div>
              <Button onClick={() => save({ footer: config.footer })} disabled={saving}>
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ التذييل', 'Save footer')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Visibility Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" />{bi("إظهار أقسام الموقع", "Site section visibility")}</CardTitle>
              <CardDescription>{bi("تحكم في الأقسام التي تظهر في الصفحة الرئيسية", "Control which sections appear on the homepage")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(tSectionLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <Label className="cursor-pointer">{label}</Label>
                  <Switch
                    checked={config.sections?.[key as keyof typeof config.sections] !== false}
                    onCheckedChange={v => setSection(key, v)}
                  />
                </div>
              ))}
              <Button onClick={() => save({ sections: config.sections })} disabled={saving} className="mt-2">
                <Save className="h-4 w-4 ml-2" />{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ إعدادات الأقسام', 'Save section settings')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
