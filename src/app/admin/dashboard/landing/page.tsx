"use client";

import { useEffect, useState } from "react";
import { Globe, Save, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";

interface LandingConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  showMentors: boolean;
  showProducts: boolean;
  showTestimonials: boolean;
}

const defaultConfig: LandingConfig = {
  heroTitle: "منصة التمكين الرقمي",
  heroSubtitle: "تدريب، إرشاد، وتجارة إلكترونية في مكان واحد",
  heroCtaText: "ابدأ الآن",
  showMentors: true,
  showProducts: true,
  showTestimonials: true,
};

export default function LandingEditorPage() {
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);

  useEffect(() => {
    fetch("/api/admin-panel/landing").then(r => r.json()).then(d => {
      if (d.config) setConfig(d.config);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin-panel/landing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggle = (key: keyof LandingConfig) => setConfig(c => ({ ...c, [key]: !c[key] }));

  if (loading) return <div className="text-muted-foreground text-center py-12">{bi('جاري التحميل...', 'Loading...')}</div>;

  return (
    <div className="space-y-6 max-w-2xl" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bi('الصفحة الرئيسية', 'Homepage')}</h1>
          <p className="text-muted-foreground text-sm">{bi('تعديل محتوى الصفحة الرئيسية للموقع', "Edit the site's homepage content")}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4" />
          <span>{saving ? bi("جاري الحفظ...", "Saving...") : saved ? bi("تم الحفظ ✓", "Saved ✓") : bi("حفظ التغييرات", "Save changes")}</span>
        </Button>
      </div>

      {/* Hero Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base">{bi('قسم الترحيب (Hero)', 'Hero Section')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/90">{bi('العنوان الرئيسي', 'Main title')}</Label>
            <Input
              value={config.heroTitle}
              onChange={e => setConfig(c => ({ ...c, heroTitle: e.target.value }))}
              className="bg-muted border-border text-foreground"
              placeholder={bi('عنوان الصفحة...', 'Page title...')}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90">{bi('العنوان الفرعي', 'Subtitle')}</Label>
            <Textarea
              value={config.heroSubtitle}
              onChange={e => setConfig(c => ({ ...c, heroSubtitle: e.target.value }))}
              className="bg-muted border-border text-foreground resize-none"
              rows={3}
              placeholder={bi('وصف قصير...', 'Short description...')}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90">{bi('نص زر الدعوة للعمل', 'Call-to-action button text')}</Label>
            <Input
              value={config.heroCtaText}
              onChange={e => setConfig(c => ({ ...c, heroCtaText: e.target.value }))}
              className="bg-muted border-border text-foreground"
              placeholder={bi('ابدأ الآن', 'Get started')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections Toggles */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base">{bi('الأقسام المرئية', 'Visible Sections')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "showMentors" as const, label: bi("قسم المرشدون والمدربون", "Mentors & Coaches section"), desc: bi("عرض بطاقات المرشدين في الصفحة الرئيسية", "Show mentor cards on the homepage") },
            { key: "showProducts" as const, label: bi("قسم المنتجات والمتجر", "Products & Store section"), desc: bi("عرض منتجات المستفيدين", "Show beneficiary products") },
            { key: "showTestimonials" as const, label: bi("قسم آراء المستخدمين", "Testimonials section"), desc: bi("عرض شهادات المستفيدين", "Show beneficiary testimonials") },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
              <div>
                <p className="text-foreground text-sm font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {config[item.key] ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <Switch checked={config[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />{bi('معاينة', 'Preview')}</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 rounded-xl p-6 border border-border text-center">
            <h2 className="text-foreground text-2xl font-bold mb-2">{config.heroTitle || "..."}</h2>
            <p className="text-foreground/90 text-sm mb-4">{config.heroSubtitle || "..."}</p>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium">{config.heroCtaText || "..."}</button>
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {config.showMentors && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">✓ {bi('المرشدون', 'Mentors')}</span>}
              {config.showProducts && <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">✓ {bi('المنتجات', 'Products')}</span>}
              {config.showTestimonials && <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">✓ {bi('الآراء', 'Testimonials')}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
