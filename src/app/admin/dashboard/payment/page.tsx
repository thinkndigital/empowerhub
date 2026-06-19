"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, CreditCard, Banknote, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface PaymentConfig {
  enabled: boolean;
  provider: string;
  moyasarPublishableKey: string;
  moyasarSecretKey: string;
  currency: string;
  allowCOD: boolean;
  codLabel: string;
  onlineLabel: string;
}

const defaultConfig: PaymentConfig = {
  enabled: false,
  provider: 'moyasar',
  moyasarPublishableKey: '',
  moyasarSecretKey: '',
  currency: 'SAR',
  allowCOD: true,
  codLabel: 'الدفع عند الاستلام',
  onlineLabel: 'الدفع الإلكتروني (بطاقة بنكية)',
};

export default function PaymentConfigPage() {
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetch('/api/admin-panel/payment-config').then(r => r.json()).then(d => {
      if (d.config) setConfig({ ...defaultConfig, ...d.config });
      setLoading(false);
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await fetch('/api/admin-panel/payment-config', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [config]);

  const set = (k: keyof PaymentConfig, v: any) => setConfig(c => ({ ...c, [k]: v }));

  if (loading) return <div className="text-slate-400 text-center py-16">جاري التحميل...</div>;

  const hasKeys = config.moyasarPublishableKey && config.moyasarSecretKey;

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">إعدادات الدفع</h1>
        <p className="text-slate-400 text-sm">ربط بوابة الدفع الإلكتروني وتهيئة خيارات الدفع للمتاجر</p>
      </div>

      {/* Main toggle */}
      <Card className="bg-slate-800/50 border-white/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-white font-semibold">الدفع الإلكتروني</p>
                <p className="text-slate-400 text-xs">تفعيل الدفع الأونلاين في متاجر المستفيدين</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={config.enabled ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-slate-700/50 text-slate-500 border-0'}>
                {config.enabled ? 'مفعّل' : 'معطّل'}
              </Badge>
              <Switch checked={config.enabled} onCheckedChange={v => set('enabled', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COD toggle */}
      <Card className="bg-slate-800/50 border-white/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${config.allowCOD ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'}`}>
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-white font-semibold">الدفع عند الاستلام (COD)</p>
                <p className="text-slate-400 text-xs">السماح للعملاء بالدفع نقداً عند استلام الطلب</p>
              </div>
            </div>
            <Switch checked={config.allowCOD} onCheckedChange={v => set('allowCOD', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Moyasar config */}
      <Card className="bg-slate-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <img src="https://moyasar.com/favicon.ico" alt="" className="h-4 w-4" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            إعدادات Moyasar
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            احصل على المفاتيح من لوحة تحكم Moyasar — يدعم Mada، Visa، Mastercard، STC Pay، Apple Pay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config.enabled && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>فعّل الدفع الإلكتروني أعلاه لتطبيق هذه الإعدادات</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>المفتاح العلني (Publishable Key)</Label>
            <Input
              value={config.moyasarPublishableKey}
              onChange={e => set('moyasarPublishableKey', e.target.value)}
              placeholder="pk_live_..."
              dir="ltr"
              className="font-mono text-sm"
            />
            <p className="text-slate-500 text-xs">يبدأ بـ pk_live_ أو pk_test_</p>
          </div>

          <div className="space-y-2">
            <Label>المفتاح السري (Secret Key)</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={config.moyasarSecretKey}
                onChange={e => set('moyasarSecretKey', e.target.value)}
                placeholder="sk_live_..."
                dir="ltr"
                className="font-mono text-sm pl-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(s => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-slate-500 text-xs">يبدأ بـ sk_live_ أو sk_test_ — لا تشاركه مع أحد</p>
          </div>

          <div className="space-y-2">
            <Label>العملة</Label>
            <Input
              value={config.currency}
              onChange={e => set('currency', e.target.value.toUpperCase())}
              placeholder="SAR"
              dir="ltr"
              className="max-w-[100px] font-mono"
              maxLength={3}
            />
          </div>

          {hasKeys && config.enabled && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>المفاتيح محددة — الدفع الإلكتروني جاهز للعمل</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labels */}
      <Card className="bg-slate-800/50 border-white/10">
        <CardHeader><CardTitle className="text-white text-base">نصوص خيارات الدفع</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>نص الدفع عند الاستلام</Label>
            <Input value={config.codLabel} onChange={e => set('codLabel', e.target.value)} placeholder="الدفع عند الاستلام" />
          </div>
          <div className="space-y-2">
            <Label>نص الدفع الإلكتروني</Label>
            <Input value={config.onlineLabel} onChange={e => set('onlineLabel', e.target.value)} placeholder="الدفع الإلكتروني (بطاقة بنكية)" />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-slate-800/50 border-white/10">
        <CardHeader><CardTitle className="text-white text-base">معاينة خيارات الدفع</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {config.allowCOD && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <Banknote className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-white text-sm font-medium">{config.codLabel || 'الدفع عند الاستلام'}</p>
                <p className="text-slate-400 text-xs">ادفع عند استلام المنتج</p>
              </div>
            </div>
          )}
          {config.enabled && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
              <CreditCard className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-white text-sm font-medium">{config.onlineLabel || 'الدفع الإلكتروني'}</p>
                <p className="text-slate-400 text-xs">ادفع الآن ببطاقة أو STC Pay</p>
              </div>
              <Badge className="mr-auto text-xs bg-blue-500/10 text-blue-400 border-0">آمن</Badge>
            </div>
          )}
          {!config.allowCOD && !config.enabled && (
            <p className="text-slate-500 text-sm text-center py-3">لم يتم تفعيل أي وسيلة دفع بعد</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className={`w-full gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
        <Save className="h-4 w-4" />
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
