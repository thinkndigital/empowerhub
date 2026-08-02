"use client";

import { useEffect, useState } from "react";
import { Globe, Save, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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

  if (loading) return <div className="text-muted-foreground text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الصفحة الرئيسية</h1>
          <p className="text-muted-foreground text-sm">تعديل محتوى الصفحة الرئيسية للموقع</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4" />
          <span>{saving ? "جاري الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التغييرات"}</span>
        </Button>
      </div>

      {/* Hero Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base">قسم الترحيب (Hero)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/90">العنوان الرئيسي</Label>
            <Input
              value={config.heroTitle}
              onChange={e => setConfig(c => ({ ...c, heroTitle: e.target.value }))}
              className="bg-muted border-border text-foreground"
              placeholder="عنوان الصفحة..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90">العنوان الفرعي</Label>
            <Textarea
              value={config.heroSubtitle}
              onChange={e => setConfig(c => ({ ...c, heroSubtitle: e.target.value }))}
              className="bg-muted border-border text-foreground resize-none"
              rows={3}
              placeholder="وصف قصير..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90">نص زر الدعوة للعمل</Label>
            <Input
              value={config.heroCtaText}
              onChange={e => setConfig(c => ({ ...c, heroCtaText: e.target.value }))}
              className="bg-muted border-border text-foreground"
              placeholder="ابدأ الآن"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections Toggles */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base">الأقسام المرئية</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "showMentors" as const, label: "قسم المرشدون والمدربون", desc: "عرض بطاقات المرشدين في الصفحة الرئيسية" },
            { key: "showProducts" as const, label: "قسم المنتجات والمتجر", desc: "عرض منتجات المستفيدين" },
            { key: "showTestimonials" as const, label: "قسم آراء المستخدمين", desc: "عرض شهادات المستفيدين" },
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
        <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />معاينة</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 rounded-xl p-6 border border-border text-center">
            <h2 className="text-foreground text-2xl font-bold mb-2">{config.heroTitle || "..."}</h2>
            <p className="text-foreground/90 text-sm mb-4">{config.heroSubtitle || "..."}</p>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium">{config.heroCtaText || "..."}</button>
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {config.showMentors && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">✓ المرشدون</span>}
              {config.showProducts && <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">✓ المنتجات</span>}
              {config.showTestimonials && <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">✓ الآراء</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
