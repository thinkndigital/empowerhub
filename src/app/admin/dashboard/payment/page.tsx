"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, CreditCard, Banknote, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface GwConfig {
  enabled: boolean;
  label: string;
  [key: string]: any;
}

interface PaymentConfig {
  allowCOD: boolean;
  codLabel: string;
  currency: string;
  moyasar: GwConfig;
  stripe: GwConfig;
  paypal: GwConfig;
  paytabs: GwConfig;
  hyperpay: GwConfig;
  tamara: GwConfig;
  tabby: GwConfig;
}

const defaultConfig: PaymentConfig = {
  allowCOD: true,
  codLabel: 'الدفع عند الاستلام',
  currency: 'JOD',
  moyasar: { enabled: false, publishableKey: '', secretKey: '', label: 'موياسر (Mada / Visa / STC Pay)' },
  stripe: { enabled: false, publishableKey: '', secretKey: '', label: 'Stripe (بطاقة بنكية دولية)' },
  paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox', label: 'PayPal' },
  paytabs: { enabled: false, profileId: '', serverKey: '', clientKey: '', region: 'JOR', label: 'PayTabs' },
  hyperpay: { enabled: false, accessToken: '', entityIdVisa: '', entityIdMada: '', mode: 'test', label: 'HyperPay' },
  tamara: { enabled: false, apiKey: '', label: 'تمارا - اشتري الآن وادفع لاحقاً' },
  tabby: { enabled: false, apiKey: '', publicKey: '', label: 'تابي - قسّم المدفوعات' },
};

type GwKey = 'moyasar' | 'stripe' | 'paypal' | 'paytabs' | 'hyperpay' | 'tamara' | 'tabby';

const GATEWAYS: { key: GwKey; name: string; desc: string; logo: string; fields: { key: string; label: string; hint?: string; type?: string; options?: string[] }[] }[] = [
  {
    key: 'moyasar', name: 'Moyasar', logo: '🏦',
    desc: 'بوابة الدفع السعودية — تدعم Mada، Visa، Mastercard، STC Pay، Apple Pay',
    fields: [
      { key: 'publishableKey', label: 'المفتاح العلني (Publishable Key)', hint: 'يبدأ بـ pk_live_ أو pk_test_' },
      { key: 'secretKey', label: 'المفتاح السري (Secret Key)', hint: 'يبدأ بـ sk_live_ أو sk_test_ — لا تشاركه', type: 'password' },
    ],
  },
  {
    key: 'stripe', name: 'Stripe', logo: '💳',
    desc: 'أشهر بوابة دفع دولية — تدعم جميع البطاقات البنكية والمحافظ الرقمية',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', hint: 'يبدأ بـ pk_live_ أو pk_test_' },
      { key: 'secretKey', label: 'Secret Key', hint: 'يبدأ بـ sk_live_ أو sk_test_', type: 'password' },
    ],
  },
  {
    key: 'paypal', name: 'PayPal', logo: '🅿️',
    desc: 'بوابة PayPal — تدعم الدفع ببطاقة أو رصيد PayPal',
    fields: [
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'mode', label: 'البيئة', options: ['sandbox', 'live'] },
    ],
  },
  {
    key: 'paytabs', name: 'PayTabs', logo: '💰',
    desc: 'بوابة PayTabs للسوق السعودي والخليجي — تدعم Mada، Visa، Mastercard',
    fields: [
      { key: 'profileId', label: 'Profile ID' },
      { key: 'serverKey', label: 'Server Key', type: 'password' },
      { key: 'clientKey', label: 'Client Key', type: 'password' },
      { key: 'region', label: 'المنطقة (Region)', hint: 'JOR للأردن | SAU للسعودية | ARE للإمارات | EGY لمصر | OMN لعُمان | IRQ للعراق' },
    ],
  },
  {
    key: 'hyperpay', name: 'HyperPay', logo: '⚡',
    desc: 'HyperPay — تدعم Mada، Visa، Mastercard في السوق السعودي',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password' },
      { key: 'entityIdVisa', label: 'Entity ID (Visa/Mastercard)' },
      { key: 'entityIdMada', label: 'Entity ID (Mada)' },
      { key: 'mode', label: 'البيئة', options: ['test', 'live'] },
    ],
  },
  {
    key: 'tamara', name: 'تمارا', logo: '🛍️',
    desc: 'تمارا — اشتري الآن وادفع لاحقاً (BNPL) للسوق السعودي والخليجي',
    fields: [
      { key: 'apiKey', label: 'API Token', type: 'password' },
    ],
  },
  {
    key: 'tabby', name: 'تابي', logo: '📦',
    desc: 'تابي — قسّم مدفوعاتك على 4 أقساط بدون فوائد',
    fields: [
      { key: 'apiKey', label: 'Secret API Key', type: 'password' },
      { key: 'publicKey', label: 'Public Key' },
    ],
  },
];

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
        dir="ltr"
        className="font-mono text-sm pr-10"
      />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function GatewayCard({ gwDef, value, onChange }: {
  gwDef: typeof GATEWAYS[0];
  value: GwConfig;
  onChange: (v: GwConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });

  return (
    <Card className="bg-slate-900/60 border-white/[0.08] shadow-lg shadow-black/20">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <span className="text-2xl">{gwDef.logo}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{gwDef.name}</p>
            <p className="text-slate-400 text-xs truncate">{gwDef.desc}</p>
          </div>
          <Badge className={value.enabled ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-slate-700/50 text-slate-500 border-0'}>
            {value.enabled ? 'مفعّل' : 'معطّل'}
          </Badge>
          <Switch checked={value.enabled} onCheckedChange={v => set('enabled', v)} onClick={e => e.stopPropagation()} />
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>

        {open && (
          <div className="px-4 pb-4 border-t border-white/[0.08] pt-4 space-y-4">
            <div className="space-y-2">
              <Label>التسمية في نموذج الطلب</Label>
              <Input value={value.label || ''} onChange={e => set('label', e.target.value)} placeholder={gwDef.name} />
            </div>
            {gwDef.fields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                {f.options ? (
                  <select
                    value={value[f.key] || f.options[0]}
                    onChange={e => set(f.key, e.target.value)}
                    className="w-full rounded-md border border-white/[0.08] bg-slate-900 text-white px-3 py-2 text-sm"
                    dir="ltr"
                  >
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'password' ? (
                  <SecretInput value={value[f.key] || ''} onChange={v => set(f.key, v)} />
                ) : (
                  <Input value={value[f.key] || ''} onChange={e => set(f.key, e.target.value)} dir="ltr" className="font-mono text-sm" />
                )}
                {f.hint && <p className="text-slate-500 text-xs">{f.hint}</p>}
              </div>
            ))}
            {!value.enabled && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>فعّل هذه البوابة لإظهارها في نموذج الطلب</span>
              </div>
            )}
            {value.enabled && Object.keys(value).filter(k => k !== 'enabled' && k !== 'label' && value[k]).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>البيانات محددة — البوابة جاهزة للعمل</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PaymentConfigPage() {
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin-panel/payment-config').then(r => r.json()).then(d => {
      if (d.config) {
        setConfig({
          allowCOD: d.config.allowCOD ?? defaultConfig.allowCOD,
          codLabel: d.config.codLabel ?? defaultConfig.codLabel,
          currency: d.config.currency ?? defaultConfig.currency,
          moyasar: { ...defaultConfig.moyasar, ...(d.config.moyasar || {}) },
          stripe: { ...defaultConfig.stripe, ...(d.config.stripe || {}) },
          paypal: { ...defaultConfig.paypal, ...(d.config.paypal || {}) },
          paytabs: { ...defaultConfig.paytabs, ...(d.config.paytabs || {}) },
          hyperpay: { ...defaultConfig.hyperpay, ...(d.config.hyperpay || {}) },
          tamara: { ...defaultConfig.tamara, ...(d.config.tamara || {}) },
          tabby: { ...defaultConfig.tabby, ...(d.config.tabby || {}) },
        });
      }
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

  const setGw = (key: GwKey, v: GwConfig) => setConfig(c => ({ ...c, [key]: v }));

  if (loading) return <div className="text-slate-400 text-center py-16">جاري التحميل...</div>;

  const enabledCount = GATEWAYS.filter(g => config[g.key]?.enabled).length + (config.allowCOD ? 1 : 0);

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">بوابات الدفع</h1>
        <p className="text-slate-400 text-sm">تهيئة وسائل الدفع المتاحة لمتاجر المستفيدين</p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-white/[0.08] rounded-xl">
        <CreditCard className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">وسائل الدفع المفعّلة</p>
          <p className="text-slate-400 text-xs">{enabledCount === 0 ? 'لم يتم تفعيل أي وسيلة دفع بعد' : `${enabledCount} وسيل${enabledCount === 1 ? 'ة' : 'ة'} مفعّلة`}</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-0">{enabledCount}</Badge>
      </div>

      {/* COD */}
      <Card className="bg-slate-900/60 border-white/[0.08] shadow-lg shadow-black/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💵</span>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">الدفع عند الاستلام (COD)</p>
              <p className="text-slate-400 text-xs">الدفع نقداً عند استلام الطلب</p>
            </div>
            <Badge className={config.allowCOD ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-slate-700/50 text-slate-500 border-0'}>
              {config.allowCOD ? 'مفعّل' : 'معطّل'}
            </Badge>
            <Switch checked={config.allowCOD} onCheckedChange={v => setConfig(c => ({ ...c, allowCOD: v }))} />
          </div>
          {config.allowCOD && (
            <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-3">
              <div className="space-y-1.5">
                <Label>نص الزر في نموذج الطلب</Label>
                <Input value={config.codLabel} onChange={e => setConfig(c => ({ ...c, codLabel: e.target.value }))} placeholder="الدفع عند الاستلام" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="bg-slate-900/60 border-white/[0.08] shadow-lg shadow-black/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💱</span>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">العملة الافتراضية</p>
              <p className="text-slate-400 text-xs">تُستخدم في جميع بوابات الدفع</p>
            </div>
            <Input
              value={config.currency}
              onChange={e => setConfig(c => ({ ...c, currency: e.target.value.toUpperCase() }))}
              placeholder="JOD"
              dir="ltr"
              className="max-w-[80px] font-mono text-center"
              maxLength={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gateway cards */}
      <div>
        <h2 className="text-white font-semibold mb-3">بوابات الدفع الإلكتروني</h2>
        <div className="space-y-3">
          {GATEWAYS.map(gw => (
            <GatewayCard key={gw.key} gwDef={gw} value={config[gw.key]} onChange={v => setGw(gw.key, v)} />
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={saving} className={`w-full gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
        <Save className="h-4 w-4" />
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
