"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, BookOpen, CreditCard, Banknote, Loader2 } from "lucide-react";
import Link from "next/link";

export type CourseEnrollDialogProps = {
  courseId: string;
  courseTitle: string;
  coursePrice: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled?: () => void;
};

type GatewayKey = 'moyasar' | 'stripe' | 'paypal' | 'paytabs' | 'hyperpay' | 'tamara' | 'tabby';

interface PaymentConfig {
  allowCOD: boolean;
  codLabel: string;
  currency: string;
  moyasar: { enabled: boolean; label: string };
  stripe: { enabled: boolean; label: string };
  paypal: { enabled: boolean; label: string };
  paytabs: { enabled: boolean; label: string };
  hyperpay: { enabled: boolean; label: string };
  tamara: { enabled: boolean; label: string };
  tabby: { enabled: boolean; label: string };
}

const defaultConfig: PaymentConfig = {
  allowCOD: true, codLabel: 'الدفع عند التأكيد', currency: 'JOD',
  moyasar: { enabled: false, label: 'موياسر' },
  stripe: { enabled: false, label: 'Stripe' },
  paypal: { enabled: false, label: 'PayPal' },
  paytabs: { enabled: false, label: 'PayTabs' },
  hyperpay: { enabled: false, label: 'HyperPay' },
  tamara: { enabled: false, label: 'تمارا' },
  tabby: { enabled: false, label: 'تابي' },
};

const BNPL: GatewayKey[] = ['tamara', 'tabby'];
const ALL_GW: GatewayKey[] = ['moyasar', 'stripe', 'paypal', 'paytabs', 'hyperpay', 'tamara', 'tabby'];

export function CourseEnrollDialog({
  courseId, courseTitle, coursePrice, isOpen, onOpenChange, onEnrolled,
}: CourseEnrollDialogProps) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'cod' | GatewayKey>('cod');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isFree = coursePrice === null || coursePrice === 0;
  const currency = config.currency || 'JOD';

  useEffect(() => {
    fetch('/api/public/payment-config').then(r => r.json()).then(d => {
      if (d.config) setConfig({ ...defaultConfig, ...d.config });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) { setDone(false); setName(''); setPhone(''); }
  }, [isOpen]);

  // Direct enrollment for free courses (logged-in users)
  const directEnroll = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل التسجيل');
      }
      setDone(true);
      onEnrolled?.();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      const uid = authUser?.uid || '';
      const orderRes = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'course',
          courseId,
          userId: uid,
          productId: courseId,
          productName: courseTitle,
          productPrice: coursePrice || 0,
          storeId: '',
          storeName: '',
          beneficiaryId: uid,
          buyerName: name,
          buyerPhone: phone,
          buyerAddress: '',
          notes: '',
          quantity: 1,
          paymentMethod: method,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.ok) throw new Error(orderData.error || 'فشل في إنشاء الطلب');
      const orderId = orderData.orderId;

      if (method !== 'cod') {
        const payRes = await fetch('/api/public/payment/initiate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: coursePrice || 0,
            description: `دورة: ${courseTitle}`,
            gateway: method,
          }),
        });
        const payData = await payRes.json();
        if (payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
          return;
        }
        throw new Error(payData.error || 'فشل في تهيئة الدفع');
      }

      // COD + logged in: enroll immediately
      if (authUser) {
        const token = await authUser.getIdToken();
        await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        onEnrolled?.();
      }

      setDone(true);
      toast({ title: 'تم الطلب!', description: authUser ? 'تم التسجيل في الدورة.' : 'سيتم التواصل معك للتأكيد.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message || 'حدث خطأ.' });
    } finally {
      setLoading(false);
    }
  };

  const enabledGateways = ALL_GW.filter(k => config[k]?.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isFree ? 'التسجيل في الدورة' : 'شراء الدورة'}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">
                {isFree ? 'تم التسجيل بنجاح!' : 'تم الطلب بنجاح!'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {authUser
                  ? 'يمكنك الوصول إلى الدورة من قسم الدورات في لوحة التحكم.'
                  : 'سيتم التواصل معك قريباً. سجّل في المنصة للوصول الفوري.'}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              {authUser && (
                <Button asChild className="flex-1">
                  <Link href={`/dashboard/training/${courseId}`}>ابدأ الدورة</Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">إغلاق</Button>
            </div>
          </div>
        ) : isFree && authUser ? (
          /* Free + logged in: one-click enrollment */
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <p className="font-semibold text-sm">{courseTitle}</p>
              <Badge className="mt-1 bg-emerald-500 border-0 text-white">مجاني</Badge>
            </div>
            <p className="text-sm text-muted-foreground text-center">اضغط الزر للتسجيل الفوري في الدورة.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button onClick={directEnroll} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <BookOpen className="h-4 w-4 ml-2" />}
                التسجيل مجاناً
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Paid course OR free + not logged in */
          <form onSubmit={handlePaidSubmit} id="course-pay-form" className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="font-semibold text-sm">{courseTitle}</p>
              <p className="text-primary font-bold text-lg mt-1">
                {isFree
                  ? <Badge className="bg-emerald-500 border-0 text-white">مجاني</Badge>
                  : `${coursePrice} ${currency}`}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل <span className="text-red-500">*</span></Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكريم" required />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف <span className="text-red-500">*</span></Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+962 7X XXX XXXX" dir="ltr" required />
              </div>
            </div>

            {!isFree && (config.allowCOD || enabledGateways.length > 0) && (
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <RadioGroup value={method} onValueChange={v => setMethod(v as any)} className="space-y-2">
                  {config.allowCOD && (
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${method === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <RadioGroupItem value="cod" id="ce-cod" />
                      <Banknote className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium">{config.codLabel}</p>
                        <p className="text-xs text-muted-foreground">سيتم التواصل معك للتأكيد</p>
                      </div>
                    </label>
                  )}
                  {enabledGateways.map(gk => (
                    <label key={gk} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${method === gk ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <RadioGroupItem value={gk} id={`ce-${gk}`} />
                      <CreditCard className={`h-5 w-5 ${BNPL.includes(gk) ? 'text-purple-600' : 'text-blue-600'}`} />
                      <div>
                        <p className="text-sm font-medium">{config[gk]?.label}</p>
                        <p className="text-xs text-muted-foreground">{BNPL.includes(gk) ? 'اشتري الآن وادفع لاحقاً' : 'ادفع الآن ببطاقة بنكية'}</p>
                      </div>
                      {BNPL.includes(gk) && <Badge className="mr-auto text-xs border-0 bg-purple-500/10 text-purple-600">تقسيط</Badge>}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" form="course-pay-form" disabled={loading || !name.trim() || !phone.trim()}>
                {loading
                  ? 'جاري المعالجة...'
                  : isFree
                    ? 'تأكيد الطلب'
                    : method === 'cod'
                      ? 'تأكيد الطلب'
                      : `ادفع ${coursePrice} ${currency}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
