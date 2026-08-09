"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote, ShoppingCart, CheckCircle } from "lucide-react";

type CheckoutDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

interface GatewayInfo { enabled: boolean; label: string; }
interface PaymentConfig {
  allowCOD: boolean;
  codLabel: string;
  currency: string;
  moyasar: GatewayInfo;
  stripe: GatewayInfo;
  paypal: GatewayInfo;
  paytabs: GatewayInfo;
  hyperpay: GatewayInfo;
  tamara: GatewayInfo;
  tabby: GatewayInfo;
}

const defaultPaymentConfig: PaymentConfig = {
  allowCOD: true, codLabel: 'الدفع عند الاستلام', currency: 'JOD',
  moyasar: { enabled: false, label: 'موياسر' },
  stripe: { enabled: false, label: 'Stripe' },
  paypal: { enabled: false, label: 'PayPal' },
  paytabs: { enabled: false, label: 'PayTabs' },
  hyperpay: { enabled: false, label: 'HyperPay' },
  tamara: { enabled: false, label: 'تمارا' },
  tabby: { enabled: false, label: 'تابي' },
};

type GatewayKey = 'moyasar' | 'stripe' | 'paypal' | 'paytabs' | 'hyperpay' | 'tamara' | 'tabby';

const GATEWAY_ICONS: Record<GatewayKey, string> = {
  moyasar: '🏦', stripe: '💳', paypal: '🅿️', paytabs: '💰', hyperpay: '⚡', tamara: '🛍️', tabby: '📦',
};

const BNPL_GATEWAYS: GatewayKey[] = ['tamara', 'tabby'];

export function CartCheckoutDialog({ isOpen, onOpenChange }: CheckoutDialogProps) {
  const { toast } = useToast();
  const { items, total, clear } = useCart();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(defaultPaymentConfig);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | GatewayKey>('cod');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/public/payment-config').then(r => r.json()).then(d => {
      if (d.config) setPaymentConfig({ ...defaultPaymentConfig, ...d.config });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) { setDone(false); setName(''); setPhone(''); setAddress(''); setNotes(''); }
  }, [isOpen]);

  const currency = paymentConfig.currency || 'JOD';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !name.trim() || !phone.trim()) return;
    setLoading(true);

    try {
      const cartRes = await fetch('/api/public/orders/cart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            productName: i.name,
            productPrice: i.price,
            deliveryCost: i.deliveryCost || 0,
            storeId: i.storeId || '',
            storeName: i.storeName || '',
            beneficiaryId: i.beneficiaryId,
            organizationId: i.organizationId || '',
            quantity: i.quantity,
          })),
          buyerName: name,
          buyerPhone: phone,
          buyerAddress: address,
          notes,
          paymentMethod,
        }),
      });

      const cartData = await cartRes.json();
      if (!cartData.ok) throw new Error(cartData.error || 'فشل في إنشاء الطلب');

      if (paymentMethod !== 'cod') {
        const payRes = await fetch('/api/public/payment/initiate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderId: cartData.batchOrderId,
            amount: cartData.total,
            description: 'سلة مشتريات',
            gateway: paymentMethod,
          }),
        });
        const payData = await payRes.json();
        if (payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
          return;
        } else {
          throw new Error(payData.error || 'فشل في تهيئة الدفع');
        }
      }

      // COD success
      clear();
      setDone(true);
      toast({ title: 'تم استلام طلبك بنجاح!', description: `سيتم التواصل معك على ${phone} قريباً.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message || 'حدث خطأ، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !done) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            إتمام الشراء
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">تم استلام طلبك!</h3>
              <p className="text-muted-foreground text-sm">سيتم التواصل معك على <span dir="ltr">{phone}</span> قريباً لتأكيد الطلب.</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">حسناً</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="cart-checkout-form" className="space-y-4">
            {/* Cart summary */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                  <span className="font-medium flex-shrink-0">{(item.price * item.quantity + (item.deliveryCost || 0)).toFixed(2)} {currency}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-bold pt-1.5 border-t">
                <span>الإجمالي</span>
                <span className="text-primary">{total.toFixed(2)} {currency}</span>
              </div>
            </div>

            {/* Buyer info */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cart-buyer-name">الاسم الكامل <span className="text-red-500">*</span></Label>
                <Input id="cart-buyer-name" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكريم" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cart-buyer-phone">رقم الهاتف <span className="text-red-500">*</span></Label>
                <Input id="cart-buyer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cart-buyer-address">عنوان التوصيل</Label>
                <Input id="cart-buyer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="المدينة، الحي، الشارع..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cart-buyer-notes">ملاحظات (اختياري)</Label>
                <Textarea id="cart-buyer-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." rows={2} className="resize-none" />
              </div>
            </div>

            {/* Payment method */}
            {(() => {
              const enabledGateways = (Object.keys(GATEWAY_ICONS) as GatewayKey[]).filter(k => paymentConfig[k]?.enabled);
              const hasAny = paymentConfig.allowCOD || enabledGateways.length > 0;
              if (!hasAny) return null;
              return (
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)} className="space-y-2">
                    {paymentConfig.allowCOD && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                        <RadioGroupItem value="cod" id="cart-pm-cod" />
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">{paymentConfig.codLabel}</p>
                          <p className="text-xs text-muted-foreground">ادفع عند استلام المنتج</p>
                        </div>
                      </label>
                    )}
                    {enabledGateways.map(gk => {
                      const isBNPL = BNPL_GATEWAYS.includes(gk);
                      return (
                        <label key={gk} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === gk ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          <RadioGroupItem value={gk} id={`cart-pm-${gk}`} />
                          {isBNPL ? <CreditCard className="h-5 w-5 text-purple-600" /> : <CreditCard className="h-5 w-5 text-blue-600" />}
                          <div>
                            <p className="text-sm font-medium">{paymentConfig[gk]?.label}</p>
                            <p className="text-xs text-muted-foreground">{isBNPL ? 'اشتري الآن وادفع لاحقاً' : 'ادفع الآن ببطاقة بنكية'}</p>
                          </div>
                          <Badge className={`mr-auto text-xs border-0 ${isBNPL ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {isBNPL ? 'تقسيط' : 'آمن'}
                          </Badge>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>
              );
            })()}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" form="cart-checkout-form" disabled={loading || !name.trim() || !phone.trim()}>
                {loading ? 'جاري المعالجة...' : paymentMethod === 'cod' ? 'تأكيد الطلب' : `ادفع ${total.toFixed(2)} ${currency}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
