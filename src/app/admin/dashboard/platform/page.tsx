"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Upload, Building2, Users, GraduationCap, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";

interface DashSections {
  organization: Record<string, boolean>;
  beneficiary: Record<string, boolean>;
  mentor: Record<string, boolean>;
  coach: Record<string, boolean>;
}

interface PlatformConfig {
  platformName: string;
  platformTagline: string;
  logoUrl: string;
  faviconUrl: string;
  dashboardSections: DashSections;
}

const sectionLabels: Record<string, Record<string, string>> = {
  organization: {
    beneficiaries: 'المستفيدون', team: 'فريق العمل', mentors: 'المرشدون',
    coaches: 'المدربون', courses: 'الدورات', stores: 'المتاجر',
    orders: 'الطلبات', reports: 'التقارير', messages: 'الرسائل', settings: 'الإعدادات',
  },
  beneficiary: {
    progress: 'تقدمي', courses: 'دوراتي', sessions: 'جلساتي',
    messages: 'الرسائل', store: 'متجري', orders: 'طلباتي', settings: 'الإعدادات',
  },
  mentor: {
    my_beneficiaries: 'المستفيدون', sessions: 'الجلسات', analytics: 'التحليلات',
    messages: 'الرسائل', invitations: 'الدعوات', settings: 'الإعدادات',
  },
  coach: {
    courses: 'الدورات', sessions: 'الجلسات', analytics: 'التحليلات',
    messages: 'الرسائل', invitations: 'الدعوات', settings: 'الإعدادات',
  },
};

const dashboardMeta = [
  { key: 'organization' as const, label: 'لوحة المنظمة', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'beneficiary' as const, label: 'لوحة المستفيد', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'mentor' as const, label: 'لوحة المرشد', icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'coach' as const, label: 'لوحة المدرب', icon: BookOpen, color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

const defaultSections: DashSections = {
  organization: { beneficiaries: true, team: true, mentors: true, coaches: true, courses: true, stores: true, orders: true, reports: true, messages: true, settings: true },
  beneficiary: { progress: true, courses: true, sessions: true, messages: true, store: true, orders: true, settings: true },
  mentor: { my_beneficiaries: true, sessions: true, analytics: true, messages: true, invitations: true, settings: true },
  coach: { courses: true, sessions: true, analytics: true, messages: true, invitations: true, settings: true },
};

const defaultConfig: PlatformConfig = {
  platformName: 'EmpowerHub',
  platformTagline: 'منصة التمكين الرقمي',
  logoUrl: '',
  faviconUrl: '',
  dashboardSections: defaultSections,
};

function ImageUploadField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const token = await user.getIdToken();
      onChange(await uploadToStorage(file, 'platform', token));
    } catch {}
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." dir="ltr" className="font-mono text-sm" />
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        <label className="cursor-pointer flex-shrink-0">
          <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
            <span className="border-border text-foreground/90 hover:text-foreground hover:bg-accent">
              {uploading ? <span className="text-xs">⏳</span> : <Upload className="h-4 w-4" />}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {value && (
          <div className="h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted/60 flex-shrink-0">
            <img src={value} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlatformConfigPage() {
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin-panel/platform-config').then(r => r.json()).then(d => {
      if (d.config) {
        setConfig({
          platformName: d.config.platformName ?? defaultConfig.platformName,
          platformTagline: d.config.platformTagline ?? defaultConfig.platformTagline,
          logoUrl: d.config.logoUrl ?? '',
          faviconUrl: d.config.faviconUrl ?? '',
          dashboardSections: {
            organization: { ...defaultSections.organization, ...(d.config.dashboardSections?.organization || {}) },
            beneficiary: { ...defaultSections.beneficiary, ...(d.config.dashboardSections?.beneficiary || {}) },
            mentor: { ...defaultSections.mentor, ...(d.config.dashboardSections?.mentor || {}) },
            coach: { ...defaultSections.coach, ...(d.config.dashboardSections?.coach || {}) },
          },
        });
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await fetch('/api/admin-panel/platform-config', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [config]);

  const setSection = (dash: keyof DashSections, key: string, val: boolean) => {
    setConfig(c => ({
      ...c,
      dashboardSections: {
        ...c.dashboardSections,
        [dash]: { ...c.dashboardSections[dash], [key]: val },
      },
    }));
  };

  if (loading) return <div className="text-muted-foreground text-center py-16">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تخصيص المنصة</h1>
        <p className="text-muted-foreground text-sm">تعديل الشعار والنصوص وتفعيل أو إيقاف أقسام لوحات التحكم</p>
      </div>

      {/* Identity */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base">هوية المنصة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المنصة</Label>
              <Input value={config.platformName} onChange={e => setConfig(c => ({ ...c, platformName: e.target.value }))} placeholder="EmpowerHub" />
            </div>
            <div className="space-y-2">
              <Label>الشعار النصي (Tagline)</Label>
              <Input value={config.platformTagline} onChange={e => setConfig(c => ({ ...c, platformTagline: e.target.value }))} placeholder="منصة التمكين الرقمي" />
            </div>
          </div>
          <ImageUploadField
            label="شعار المنصة (Logo)"
            value={config.logoUrl}
            onChange={v => setConfig(c => ({ ...c, logoUrl: v }))}
            hint="يظهر في جميع لوحات التحكم والسايدبار"
          />
          <ImageUploadField
            label="أيقونة المتصفح (Favicon)"
            value={config.faviconUrl}
            onChange={v => setConfig(c => ({ ...c, faviconUrl: v }))}
            hint="مثالي: 32×32 أو 64×64 بكسل"
          />
        </CardContent>
      </Card>

      {/* Dashboard section toggles */}
      {dashboardMeta.map(dash => {
        const sections = sectionLabels[dash.key] || {};
        const current = config.dashboardSections[dash.key] || {};
        const DashIcon = dash.icon;
        const enabledCount = Object.values(current).filter(Boolean).length;
        const total = Object.keys(sections).length;
        return (
          <Card key={dash.key} className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${dash.bg}`}>
                  <DashIcon className={`h-5 w-5 ${dash.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-foreground text-base">{dash.label}</CardTitle>
                  <p className="text-muted-foreground text-xs">{enabledCount} من {total} قسم مفعّل</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => {
                    const allEnabled = Object.keys(sections).every(k => current[k]);
                    Object.keys(sections).forEach(k => setSection(dash.key, k, !allEnabled));
                  }}
                >
                  {Object.keys(sections).every(k => current[k]) ? 'إيقاف الكل' : 'تفعيل الكل'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(sections).map(([key, label]) => (
                  <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${current[key] ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/50'}`}>
                    <span className="text-sm text-foreground/90">{label}</span>
                    <Switch
                      checked={current[key] ?? true}
                      onCheckedChange={v => setSection(dash.key, key, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button onClick={save} disabled={saving} className={`w-full gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
        <Save className="h-4 w-4" />
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
