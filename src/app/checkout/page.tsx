"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useUser } from "@/firebase/auth/use-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CreditCard, Banknote, ShoppingCart, CheckCircle, Loader2 } from "lucide-react";

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

const GATEWAY_KEYS: GatewayKey[] = ['moyasar', 'stripe', 'paypal', 'paytabs', 'hyperpay', 'tamara', 'tabby'];
const BNPL_GATEWAYS: GatewayKey[] = ['tamara', 'tabby'];

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, total, clear } = useCart();
  const { user: authUser } = useUser();
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
    if (items.length === 0 && !done) router.replace('/cart');
  }, [items.length, done, router]);

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
            type: i.type,
          })),
          buyerName: name,
          buyerPhone: phone,
          buyerAddress: address,
          notes,
          paymentMethod,
          buyerUid: authUser?.uid || '',
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
          // Card entry has to happen on the gateway's own hosted page —
          // every gateway blocks that step from being embedded in-site.
          window.location.href = payData.paymentUrl;
          return;
        } else {
          throw new Error(payData.error || 'فشل في تهيئة الدفع');
        }
      }

      // COD success — for logged-in buyers, enroll them in any purchased
      // courses immediately (mirrors the single-course COD enrollment flow).
      const purchasedCourseIds: string[] = cartData.courseIds || [];
      if (purchasedCourseIds.length && authUser) {
        try {
          const token = await authUser.getIdToken();
          await Promise.all(purchasedCourseIds.map((cId: string) =>
            fetch(`/api/courses/${cId}/enroll`, {
              method: 'POST',
              headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
              body: JSON.stringify({}),
            }).catch(() => {})
          ));
        } catch { /* non-fatal */ }
      }

      clear();
      setDone(true);
      toast({ title: 'تم استلام طلبك بنجاح!', description: `سيتم التواصل معك على ${phone} قريباً.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message || 'حدث خطأ، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <SiteHeader />
        <div className="container py-16 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-bold text-xl mb-1">تم استلام طلبك!</h1>
              <p className="text-muted-foreground text-sm">سيتم التواصل معك على <span dir="ltr">{phone}</span> قريباً لتأكيد الطلب.</p>
            </div>
            <Button asChild className="w-full"><Link href="/market">متابعة التسوق</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const enabledGateways = GATEWAY_KEYS.filter(k => paymentConfig[k]?.enabled);
  const hasAnyMethod = paymentConfig.allowCOD || enabledGateways.length > 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />

      <div className="container py-8 sm:py-10 max-w-3xl">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <span className="text-border/80 select-none">/</span>
          <Link href="/cart" className="hover:text-primary transition-colors">السلة</Link>
          <span className="text-border/80 select-none">/</span>
          <span className="text-foreground font-medium">إتمام الشراء</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 flex items-center gap-2.5">
          <ShoppingCart className="h-6 w-6 text-primary" />إتمام الشراء
        </h1>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {/* Buyer info */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-semibold text-foreground">معلومات التوصيل</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-name">الاسم الكامل <span className="text-red-500">*</span></Label>
                  <Input id="buyer-name" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكريم" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-phone">رقم الهاتف <span className="text-red-500">*</span></Label>
                  <Input id="buyer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" dir="ltr" required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="buyer-address">عنوان التوصيل</Label>
                  <Input id="buyer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="المدينة، الحي، الشارع..." />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="buyer-notes">ملاحظات (اختياري)</Label>
                  <Textarea id="buyer-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." rows={2} className="resize-none" />
                </div>
              </div>
            </div>

            {/* Payment method */}
            {hasAnyMethod && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h2 className="font-semibold text-foreground">طريقة الدفع</h2>
                <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)} className="space-y-2">
                  {paymentConfig.allowCOD && (
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <RadioGroupItem value="cod" id="pm-cod" />
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
                        <RadioGroupItem value={gk} id={`pm-${gk}`} />
                        <CreditCard className={`h-5 w-5 ${isBNPL ? 'text-purple-600' : 'text-blue-600'}`} />
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
                {paymentMethod !== 'cod' && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                    سيتم تحويلك لصفحة الدفع الآمنة الخاصة بمزوّد الدفع لإدخال بيانات البطاقة.
                  </p>
                )}
              </div>
            )}

            <Button variant="ghost" asChild className="gap-1.5 text-muted-foreground">
              <Link href="/cart"><ArrowRight className="h-4 w-4" />العودة للسلة</Link>
            </Button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 sticky top-20">
              <h2 className="font-semibold text-foreground">ملخص الطلب</h2>
              <div className="space-y-1.5 text-sm max-h-52 overflow-y-auto">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                    <span className="font-medium flex-shrink-0">{(item.price * item.quantity + (item.deliveryCost || 0)).toFixed(2)} {currency}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>الإجمالي</span>
                <span className="text-primary">{total.toFixed(2)} {currency}</span>
              </div>
              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !name.trim() || !phone.trim()}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'جاري المعالجة...' : paymentMethod === 'cod' ? 'تأكيد الطلب' : `الدفع الآن — ${total.toFixed(2)} ${currency}`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
