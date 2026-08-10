"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, CreditCard, Banknote, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";

interface GwConfig {
  enabled: boolean;
  label: string;
  [key: string]: any;
}

interface PaymentConfig {
  allowCOD: boolean;
  codLabel: string;
  currency: string;
  commissionRate: number;
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
  commissionRate: 0,
  moyasar: { enabled: false, publishableKey: '', secretKey: '', label: 'موياسر (Mada / Visa / STC Pay)' },
  stripe: { enabled: false, publishableKey: '', secretKey: '', label: 'Stripe (بطاقة بنكية دولية)' },
  paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox', label: 'PayPal' },
  paytabs: { enabled: false, profileId: '', serverKey: '', clientKey: '', region: 'JOR', label: 'PayTabs' },
  hyperpay: { enabled: false, accessToken: '', entityIdVisa: '', entityIdMada: '', mode: 'test', label: 'HyperPay' },
  tamara: { enabled: false, apiKey: '', label: 'تمارا - اشتري الآن وادفع لاحقاً' },
  tabby: { enabled: false, apiKey: '', publicKey: '', label: 'تابي - قسّم المدفوعات' },
};

type GwKey = 'moyasar' | 'stripe' | 'paypal' | 'paytabs' | 'hyperpay' | 'tamara' | 'tabby';

const GATEWAYS: { key: GwKey; name: string; desc: string; descEn: string; logo: string; disabled?: boolean; fields: { key: string; label: string; labelEn: string; hint?: string; hintEn?: string; type?: string; options?: string[] }[] }[] = [
  {
    key: 'moyasar', name: 'Moyasar', logo: '🏦',
    desc: 'بوابة الدفع السعودية — تدعم Mada، Visa، Mastercard، STC Pay، Apple Pay',
    descEn: 'The Saudi payment gateway — supports Mada, Visa, Mastercard, STC Pay, Apple Pay',
    fields: [
      { key: 'publishableKey', label: 'المفتاح العلني (Publishable Key)', labelEn: 'Publishable Key', hint: 'يبدأ بـ pk_live_ أو pk_test_', hintEn: 'Starts with pk_live_ or pk_test_' },
      { key: 'secretKey', label: 'المفتاح السري (Secret Key)', labelEn: 'Secret Key', hint: 'يبدأ بـ sk_live_ أو sk_test_ — لا تشاركه', hintEn: "Starts with sk_live_ or sk_test_ — don't share it", type: 'password' },
    ],
  },
  {
    key: 'stripe', name: 'Stripe', logo: '💳',
    desc: 'أشهر بوابة دفع دولية — تدعم جميع البطاقات البنكية والمحافظ الرقمية',
    descEn: 'The most popular international payment gateway — supports all bank cards and digital wallets',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', labelEn: 'Publishable Key', hint: 'يبدأ بـ pk_live_ أو pk_test_', hintEn: 'Starts with pk_live_ or pk_test_' },
      { key: 'secretKey', label: 'Secret Key', labelEn: 'Secret Key', hint: 'يبدأ بـ sk_live_ أو sk_test_', hintEn: 'Starts with sk_live_ or sk_test_', type: 'password' },
    ],
  },
  {
    key: 'paypal', name: 'PayPal', logo: '🅿️',
    desc: 'بوابة PayPal — تدعم الدفع ببطاقة أو رصيد PayPal',
    descEn: 'PayPal gateway — supports payment by card or PayPal balance',
    fields: [
      { key: 'clientId', label: 'Client ID', labelEn: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', labelEn: 'Client Secret', type: 'password' },
      { key: 'mode', label: 'البيئة', labelEn: 'Environment', options: ['sandbox', 'live'] },
    ],
  },
  {
    key: 'paytabs', name: 'PayTabs', logo: '💰',
    desc: 'بوابة PayTabs للسوق السعودي والخليجي — تدعم Mada، Visa، Mastercard',
    descEn: 'PayTabs gateway for the Saudi and Gulf market — supports Mada, Visa, Mastercard',
    fields: [
      { key: 'profileId', label: 'Profile ID', labelEn: 'Profile ID' },
      { key: 'serverKey', label: 'Server Key', labelEn: 'Server Key', type: 'password' },
      { key: 'clientKey', label: 'Client Key', labelEn: 'Client Key', type: 'password' },
      { key: 'region', label: 'المنطقة (Region)', labelEn: 'Region', hint: 'JOR للأردن | SAU للسعودية | ARE للإمارات | EGY لمصر | OMN لعُمان | IRQ للعراق', hintEn: 'JOR for Jordan | SAU for Saudi Arabia | ARE for UAE | EGY for Egypt | OMN for Oman | IRQ for Iraq' },
    ],
  },
  {
    key: 'hyperpay', name: 'HyperPay', logo: '⚡', disabled: true,
    desc: 'HyperPay — غير مدعومة بعد على المنصة (قيد التطوير)، لا يمكن تفعيلها حالياً',
    descEn: 'HyperPay — not yet supported on the platform (in development), cannot be enabled currently',
    fields: [
      { key: 'accessToken', label: 'Access Token', labelEn: 'Access Token', type: 'password' },
      { key: 'entityIdVisa', label: 'Entity ID (Visa/Mastercard)', labelEn: 'Entity ID (Visa/Mastercard)' },
      { key: 'entityIdMada', label: 'Entity ID (Mada)', labelEn: 'Entity ID (Mada)' },
      { key: 'mode', label: 'البيئة', labelEn: 'Environment', options: ['test', 'live'] },
    ],
  },
  {
    key: 'tamara', name: 'تمارا', logo: '🛍️',
    desc: 'تمارا — اشتري الآن وادفع لاحقاً (BNPL) للسوق السعودي والخليجي',
    descEn: 'Tamara — buy now, pay later (BNPL) for the Saudi and Gulf market',
    fields: [
      { key: 'apiKey', label: 'API Token', labelEn: 'API Token', type: 'password' },
    ],
  },
  {
    key: 'tabby', name: 'تابي', logo: '📦',
    desc: 'تابي — قسّم مدفوعاتك على 4 أقساط بدون فوائد',
    descEn: 'Tabby — split your payments into 4 interest-free installments',
    fields: [
      { key: 'apiKey', label: 'Secret API Key', labelEn: 'Secret API Key', type: 'password' },
      { key: 'publicKey', label: 'Public Key', labelEn: 'Public Key' },
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
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <span className="text-2xl">{gwDef.logo}</span>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm">{gwDef.name}</p>
            <p className="text-muted-foreground text-xs truncate">{bi(gwDef.desc, gwDef.descEn)}</p>
          </div>
          <Badge className={gwDef.disabled ? 'bg-muted/60 text-muted-foreground border-0' : value.enabled ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-muted/60 text-muted-foreground border-0'}>
            {gwDef.disabled ? bi('قيد التطوير', 'In development') : value.enabled ? bi('مفعّل', 'Enabled') : bi('معطّل', 'Disabled')}
          </Badge>
          <Switch checked={!gwDef.disabled && value.enabled} disabled={gwDef.disabled} onCheckedChange={v => set('enabled', v)} onClick={e => e.stopPropagation()} />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>

        {open && gwDef.disabled && (
          <div className="px-4 pb-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 p-3 bg-muted/40 border border-border rounded-xl text-muted-foreground text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{bi('هذه البوابة قيد التطوير على المنصة ولا يمكن تفعيلها بعد — اختر بوابة أخرى.', "This gateway is still in development on the platform and can't be enabled yet — choose another gateway.")}</span>
            </div>
          </div>
        )}
        {open && !gwDef.disabled && (
          <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
            <div className="space-y-2">
              <Label>{bi('التسمية في نموذج الطلب', 'Label in the order form')}</Label>
              <Input value={value.label || ''} onChange={e => set('label', e.target.value)} placeholder={gwDef.name} />
            </div>
            {gwDef.fields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label>{bi(f.label, f.labelEn)}</Label>
                {f.options ? (
                  <select
                    value={value[f.key] || f.options[0]}
                    onChange={e => set(f.key, e.target.value)}
                    className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                    dir="ltr"
                  >
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'password' ? (
                  <SecretInput value={value[f.key] || ''} onChange={v => set(f.key, v)} />
                ) : (
                  <Input value={value[f.key] || ''} onChange={e => set(f.key, e.target.value)} dir="ltr" className="font-mono text-sm" />
                )}
                {f.hint && <p className="text-muted-foreground text-xs">{bi(f.hint, f.hintEn || f.hint)}</p>}
              </div>
            ))}
            {!value.enabled && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{bi('فعّل هذه البوابة لإظهارها في نموذج الطلب', 'Enable this gateway to show it in the order form')}</span>
              </div>
            )}
            {value.enabled && Object.keys(value).filter(k => k !== 'enabled' && k !== 'label' && value[k]).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{bi('البيانات محددة — البوابة جاهزة للعمل', 'Credentials set — the gateway is ready to work')}</span>
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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);

  useEffect(() => {
    fetch('/api/admin-panel/payment-config').then(r => r.json()).then(d => {
      if (d.config) {
        setConfig({
          allowCOD: d.config.allowCOD ?? defaultConfig.allowCOD,
          codLabel: d.config.codLabel ?? defaultConfig.codLabel,
          currency: d.config.currency ?? defaultConfig.currency,
          commissionRate: d.config.commissionRate ?? defaultConfig.commissionRate,
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

  if (loading) return <div className="text-muted-foreground text-center py-16">{bi('جاري التحميل...', 'Loading...')}</div>;

  const enabledCount = GATEWAYS.filter(g => config[g.key]?.enabled).length + (config.allowCOD ? 1 : 0);

  return (
    <div className="space-y-6 max-w-2xl" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{bi('بوابات الدفع', 'Payment Gateways')}</h1>
        <p className="text-muted-foreground text-sm">{bi('تهيئة وسائل الدفع المتاحة لمتاجر المستفيدين', 'Configure the payment methods available to beneficiary stores')}</p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 p-4 bg-muted/60 border border-border rounded-xl">
        <CreditCard className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">{bi('وسائل الدفع المفعّلة', 'Enabled payment methods')}</p>
          <p className="text-muted-foreground text-xs">{enabledCount === 0 ? bi('لم يتم تفعيل أي وسيلة دفع بعد', 'No payment method enabled yet') : bi(`${enabledCount} وسيلة مفعّلة`, `${enabledCount} method${enabledCount === 1 ? '' : 's'} enabled`)}</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-0">{enabledCount}</Badge>
      </div>

      {/* Platform commission */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div className="flex-1">
              <p className="text-foreground font-semibold text-sm">{bi('عمولة المنصة من مبيعات المتاجر', 'Platform commission on store sales')}</p>
              <p className="text-muted-foreground text-xs">{bi('نسبة مئوية تُحتسب على مبيعات متاجر التجار والمستفيدين لأغراض التقارير', 'A percentage calculated on merchant and beneficiary store sales for reporting purposes')}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="space-y-1.5 max-w-[160px]">
              <Label>{bi('النسبة (%)', 'Rate (%)')}</Label>
              <div className="relative">
                <Input
                  type="number" min={0} max={100} step={0.5}
                  value={config.commissionRate}
                  onChange={e => setConfig(c => ({ ...c, commissionRate: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COD */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💵</span>
            <div className="flex-1">
              <p className="text-foreground font-semibold text-sm">{bi('الدفع عند الاستلام (COD)', 'Cash on Delivery (COD)')}</p>
              <p className="text-muted-foreground text-xs">{bi('الدفع نقداً عند استلام الطلب', 'Pay in cash when the order is received')}</p>
            </div>
            <Badge className={config.allowCOD ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-muted/60 text-muted-foreground border-0'}>
              {config.allowCOD ? bi('مفعّل', 'Enabled') : bi('معطّل', 'Disabled')}
            </Badge>
            <Switch checked={config.allowCOD} onCheckedChange={v => setConfig(c => ({ ...c, allowCOD: v }))} />
          </div>
          {config.allowCOD && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              <div className="space-y-1.5">
                <Label>{bi('نص الزر في نموذج الطلب', 'Button text in the order form')}</Label>
                <Input value={config.codLabel} onChange={e => setConfig(c => ({ ...c, codLabel: e.target.value }))} placeholder={bi('الدفع عند الاستلام', 'Cash on delivery')} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💱</span>
            <div className="flex-1">
              <p className="text-foreground font-semibold text-sm">{bi('العملة الافتراضية', 'Default currency')}</p>
              <p className="text-muted-foreground text-xs">{bi('تُستخدم في جميع بوابات الدفع', 'Used across all payment gateways')}</p>
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
        <h2 className="text-foreground font-semibold mb-3">{bi('بوابات الدفع الإلكتروني', 'Electronic Payment Gateways')}</h2>
        <div className="space-y-3">
          {GATEWAYS.map(gw => (
            <GatewayCard key={gw.key} gwDef={gw} value={config[gw.key]} onChange={v => setGw(gw.key, v)} />
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={saving} className={`w-full gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
        <Save className="h-4 w-4" />
        {saving ? bi('جاري الحفظ...', 'Saving...') : saved ? bi('تم الحفظ ✓', 'Saved ✓') : bi('حفظ الإعدادات', 'Save settings')}
      </Button>
    </div>
  );
}
