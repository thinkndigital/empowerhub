"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PaymentIframeDialog } from "@/components/payment-iframe-dialog";
import { Calendar, CreditCard, Banknote, CheckCircle } from "lucide-react";

interface GatewayInfo { enabled: boolean; label: string; }
interface PaymentConfig {
  allowCOD: boolean; codLabel: string; currency: string;
  moyasar: GatewayInfo; stripe: GatewayInfo; paypal: GatewayInfo;
  paytabs: GatewayInfo; hyperpay: GatewayInfo; tamara: GatewayInfo; tabby: GatewayInfo;
}

type GatewayKey = 'moyasar' | 'stripe' | 'paypal' | 'paytabs' | 'hyperpay' | 'tamara' | 'tabby';
const GATEWAY_ICONS: Record<GatewayKey, string> = {
  moyasar: '🏦', stripe: '💳', paypal: '🅿️', paytabs: '💰', hyperpay: '⚡', tamara: '🛍️', tabby: '📦',
};
const BNPL: GatewayKey[] = ['tamara', 'tabby'];

const defaultConfig: PaymentConfig = {
  allowCOD: true, codLabel: 'الدفع عند التأكيد', currency: 'JOD',
  moyasar: { enabled: false, label: 'موياسر' }, stripe: { enabled: false, label: 'Stripe' },
  paypal: { enabled: false, label: 'PayPal' }, paytabs: { enabled: false, label: 'PayTabs' },
  hyperpay: { enabled: false, label: 'HyperPay' }, tamara: { enabled: false, label: 'تمارا' },
  tabby: { enabled: false, label: 'تابي' },
};

export type SessionBookingDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hostId: string;
  hostName: string;
  hostRole: 'mentor' | 'coach';
  sessionPrice: number;
};

export function SessionBookingDialog({ isOpen, onOpenChange, hostId, hostName, hostRole, sessionPrice }: SessionBookingDialogProps) {
  const { toast } = useToast();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(defaultConfig);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | GatewayKey>('cod');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/payment-config').then(r => r.json()).then(d => {
      if (d.config) setPaymentConfig({ ...defaultConfig, ...d.config });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) { setDone(false); setName(''); setPhone(''); setPreferredTime(''); setNotes(''); setPaymentMethod('cod'); }
  }, [isOpen]);

  const currency = paymentConfig.currency || 'JOD';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/public/sessions/book', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hostId, hostName, hostRole, sessionPrice, buyerName: name, buyerPhone: phone, preferredTime, notes, paymentMethod }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل في إنشاء الحجز');
      const orderId = data.orderId;

      if (paymentMethod !== 'cod') {
        const sessionType = hostRole === 'coach' ? 'تدريب' : 'إرشاد';
        const payRes = await fetch('/api/public/payment/initiate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: sessionPrice,
            description: `جلسة ${sessionType} مع ${hostName}`,
            gateway: paymentMethod,
          }),
        });
        const payData = await payRes.json();
        if (payData.paymentUrl) { setPaymentUrl(payData.paymentUrl); setLoading(false); return; }
        throw new Error(payData.error || 'فشل في تهيئة الدفع');
      }

      setDone(true);
      toast({ title: 'تم الحجز بنجاح!', description: `سيتواصل معك ${hostName} قريباً على ${phone}.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message || 'حدث خطأ، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const sessionLabel = hostRole === 'coach' ? 'جلسة تدريب' : 'جلسة إرشاد';

  const handlePaymentResult = (status: 'paid' | 'failed') => {
    setPaymentUrl(null);
    if (status === 'paid') {
      setDone(true);
      toast({ title: 'تم الدفع والحجز بنجاح!', description: `سيتواصل معك ${hostName} قريباً على ${phone}.` });
    } else {
      toast({ variant: 'destructive', title: 'لم تكتمل عملية الدفع', description: 'يمكنك المحاولة مرة أخرى.' });
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {`حجز ${sessionLabel}`}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">تم الحجز بنجاح!</h3>
              <p className="text-muted-foreground text-sm">سيتواصل معك <span className="font-semibold">{hostName}</span> على <span dir="ltr">{phone}</span> لتأكيد الموعد.</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">حسناً</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="session-form" className="space-y-4">
            {/* Session summary */}
            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                {hostName[0]}
              </div>
              <div>
                <p className="font-semibold text-sm">{sessionLabel} مع {hostName}</p>
                <p className="text-primary font-bold text-lg">{sessionPrice} {currency}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">الاسم الكامل <span className="text-red-500">*</span></Label>
                <Input id="s-name" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكريم" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">رقم الهاتف <span className="text-red-500">*</span></Label>
                <Input id="s-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+962 7X XXX XXXX" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-time">الوقت المفضل للجلسة</Label>
                <Input id="s-time" type="datetime-local" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-notes">ملاحظات (اختياري)</Label>
                <Textarea id="s-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="أذكر ما تريد التركيز عليه في الجلسة..." rows={2} className="resize-none" />
              </div>
            </div>

            {/* Payment method */}
            {(() => {
              const enabledGateways = (Object.keys(GATEWAY_ICONS) as GatewayKey[]).filter(k => paymentConfig[k]?.enabled);
              if (!paymentConfig.allowCOD && enabledGateways.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)} className="space-y-2">
                    {paymentConfig.allowCOD && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                        <RadioGroupItem value="cod" id="sp-cod" />
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">{paymentConfig.codLabel}</p>
                          <p className="text-xs text-muted-foreground">ادفع للمدرب/المرشد مباشرةً</p>
                        </div>
                      </label>
                    )}
                    {enabledGateways.map(gk => (
                      <label key={gk} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === gk ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                        <RadioGroupItem value={gk} id={`sp-${gk}`} />
                        <CreditCard className={`h-5 w-5 ${BNPL.includes(gk) ? 'text-purple-600' : 'text-blue-600'}`} />
                        <div>
                          <p className="text-sm font-medium">{paymentConfig[gk]?.label}</p>
                          <p className="text-xs text-muted-foreground">{BNPL.includes(gk) ? 'اشتري الآن وادفع لاحقاً' : 'ادفع الآن ببطاقة بنكية'}</p>
                        </div>
                        <Badge className={`mr-auto text-xs border-0 ${BNPL.includes(gk) ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {BNPL.includes(gk) ? 'تقسيط' : 'آمن'}
                        </Badge>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              );
            })()}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" form="session-form" disabled={loading || !name.trim() || !phone.trim()}>
                {loading ? 'جاري المعالجة...' : paymentMethod === 'cod' ? 'تأكيد الحجز' : `ادفع ${sessionPrice} ${currency}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
    <PaymentIframeDialog
      paymentUrl={paymentUrl}
      onOpenChange={open => !open && setPaymentUrl(null)}
      onResult={handlePaymentResult}
    />
    </>
  );
}
