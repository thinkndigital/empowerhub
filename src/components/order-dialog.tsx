"use client";

import { useState, useEffect } from "react";
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
import { type Product as LibProduct } from "@/lib/products-data";

type Product = LibProduct & {
  storeId?: string;
  storeName?: string;
  organizationId?: string;
};
import { CreditCard, Banknote, ShoppingCart, CheckCircle } from "lucide-react";

type OrderDialogProps = {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

interface PaymentConfig {
  enabled: boolean;
  allowCOD: boolean;
  codLabel: string;
  onlineLabel: string;
  currency: string;
}

export function OrderDialog({ product, isOpen, onOpenChange }: OrderDialogProps) {
  const { toast } = useToast();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    enabled: false, allowCOD: true,
    codLabel: 'الدفع عند الاستلام',
    onlineLabel: 'الدفع الإلكتروني',
    currency: 'SAR',
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/public/payment-config').then(r => r.json()).then(d => {
      if (d.config) setPaymentConfig(d.config);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) { setDone(false); setName(''); setPhone(''); setAddress(''); setNotes(''); }
  }, [isOpen]);

  const total = (product?.price || 0) + (product?.deliveryCost || 0);
  const currency = paymentConfig.currency || 'SAR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !name.trim() || !phone.trim()) return;
    setLoading(true);

    try {
      // Create order
      const orderRes = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          storeId: (product as any).storeId || '',
          storeName: (product as any).storeName || '',
          beneficiaryId: product.beneficiaryId,
          organizationId: (product as any).organizationId || '',
          buyerName: name,
          buyerPhone: phone,
          buyerAddress: address,
          notes,
          quantity: 1,
          paymentMethod,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.ok) throw new Error(orderData.error || 'فشل في إنشاء الطلب');

      const orderId = orderData.orderId;

      if (paymentMethod === 'online' && paymentConfig.enabled) {
        // Initiate Moyasar payment
        const payRes = await fetch('/api/public/payment/initiate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: total,
            description: `طلب: ${product.name}`,
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
      setDone(true);
      toast({ title: 'تم استلام طلبك بنجاح!', description: `سيتم التواصل معك على ${phone} قريباً.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message || 'حدث خطأ، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            طلب المنتج
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
          <form onSubmit={handleSubmit} id="order-form" className="space-y-4">
            {/* Product summary */}
            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                <p className="text-primary font-bold">{total.toFixed(2)} {currency}</p>
                {product.deliveryCost && product.deliveryCost > 0 && (
                  <p className="text-xs text-muted-foreground">شامل توصيل {product.deliveryCost} {currency}</p>
                )}
              </div>
            </div>

            {/* Buyer info */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buyer-name">الاسم الكامل <span className="text-red-500">*</span></Label>
                <Input id="buyer-name" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكريم" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-phone">رقم الهاتف <span className="text-red-500">*</span></Label>
                <Input id="buyer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-address">عنوان التوصيل</Label>
                <Input id="buyer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="المدينة، الحي، الشارع..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-notes">ملاحظات (اختياري)</Label>
                <Textarea id="buyer-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." rows={2} className="resize-none" />
              </div>
            </div>

            {/* Payment method */}
            {(paymentConfig.allowCOD || paymentConfig.enabled) && (
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as 'cod' | 'online')} className="space-y-2">
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
                  {paymentConfig.enabled && (
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <RadioGroupItem value="online" id="pm-online" />
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{paymentConfig.onlineLabel}</p>
                        <p className="text-xs text-muted-foreground">ادفع الآن ببطاقة أو STC Pay</p>
                      </div>
                      <Badge className="mr-auto text-xs bg-blue-500/10 text-blue-600 border-0">آمن</Badge>
                    </label>
                  )}
                </RadioGroup>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" form="order-form" disabled={loading || !name.trim() || !phone.trim()}>
                {loading ? 'جاري المعالجة...' : paymentMethod === 'online' ? `ادفع ${total.toFixed(2)} ${currency}` : 'تأكيد الطلب'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
