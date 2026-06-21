"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, CheckCircle, XCircle, Clock, Phone, User, MessageCircle, Copy } from "lucide-react";

type Order = {
  id: string;
  courseId: string;
  courseName: string;
  buyerName: string;
  buyerPhone: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

type ConfirmResult = {
  courseUrl: string;
  courseTitle: string;
  isGuest: boolean;
  buyerPhone: string;
  buyerName: string;
};

const statusLabel: Record<string, { label: string; className: string }> = {
  pending:   { label: 'قيد الانتظار', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'مؤكد', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected:  { label: 'مرفوض', className: 'bg-red-100 text-red-700 border-red-200' },
};

const payMethodLabel: Record<string, string> = {
  cod: 'الدفع عند التأكيد',
  moyasar: 'موياسر',
  stripe: 'Stripe',
  paypal: 'PayPal',
  paytabs: 'PayTabs',
  hyperpay: 'HyperPay',
  tamara: 'تمارا',
  tabby: 'تابي',
};

function buildWhatsAppLink(phone: string, name: string, courseTitle: string, courseUrl: string) {
  const cleaned = phone.replace(/\s+/g, '').replace(/^00/, '+');
  const msg = encodeURIComponent(
    `مرحباً ${name}،\n\nتم تأكيد اشتراكك في دورة "${courseTitle}".\n\nرابط الدورة:\n${courseUrl}\n\nأهلاً وسهلاً بك!`
  );
  return `https://wa.me/${cleaned.replace('+', '')}?text=${msg}`;
}

export default function CoachOrdersPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [guestAlert, setGuestAlert] = useState<ConfirmResult | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/mentor/orders', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: 'confirmed' | 'rejected') => {
    if (!authUser) return;
    setUpdating(orderId);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/mentor/orders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل التحديث');

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

      if (status === 'confirmed') {
        if (data.isGuest) {
          // Guest: show WhatsApp prompt
          setGuestAlert(data as ConfirmResult);
        } else {
          toast({ title: 'تم تأكيد الطلب', description: 'تم إرسال إشعار للمشترك برابط الدورة.' });
        }
      } else {
        toast({ title: 'تم رفض الطلب' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setUpdating(null);
    }
  };

  const pending = orders.filter(o => o.status === 'pending');
  const others  = orders.filter(o => o.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلبات الدورات</h1>
        <p className="text-muted-foreground text-sm mt-1">طلبات الاشتراك في دوراتك التدريبية</p>
      </div>

      {/* Guest WhatsApp alert */}
      {guestAlert && (
        <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm text-emerald-800">تم تأكيد الطلب ✓</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  هذا المشترك زائر (غير مسجّل). أرسل له رابط الدورة عبر واتساب.
                </p>
                <p className="text-xs text-emerald-600 mt-1 font-mono break-all">{guestAlert.courseUrl}</p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#1ebe5d] text-white gap-1"
                  onClick={() => window.open(buildWhatsAppLink(
                    guestAlert.buyerPhone, guestAlert.buyerName,
                    guestAlert.courseTitle, guestAlert.courseUrl
                  ), '_blank')}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  إرسال واتساب
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(guestAlert.courseUrl);
                    toast({ title: 'تم نسخ الرابط' });
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  نسخ الرابط
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setGuestAlert(null)}>إغلاق</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الطلبات', value: orders.length, color: 'bg-primary/10 text-primary' },
          { label: 'قيد الانتظار', value: pending.length, color: 'bg-amber-100 text-amber-700' },
          { label: 'مؤكدة', value: orders.filter(o => o.status === 'confirmed').length, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'مرفوضة', value: orders.filter(o => o.status === 'rejected').length, color: 'bg-red-100 text-red-700' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold rounded px-2 py-0.5 w-fit ${s.color}`}>{loading ? '...' : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending orders */}
      {!loading && pending.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            تحتاج إلى تأكيد ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onConfirm={() => updateStatus(order.id, 'confirmed')}
                onReject={() => updateStatus(order.id, 'rejected')}
                updating={updating === order.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* All other orders */}
      <div>
        {!loading && pending.length > 0 && others.length > 0 && (
          <h2 className="text-base font-semibold mb-3">السجل</h2>
        )}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : others.length === 0 && pending.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">لا توجد طلبات بعد</p>
              <p className="text-xs text-muted-foreground">ستظهر هنا طلبات الاشتراك في دوراتك</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {others.map(order => (
              <OrderCard key={order.id} order={order} updating={updating === order.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order, onConfirm, onReject, updating,
}: {
  order: Order;
  onConfirm?: () => void;
  onReject?: () => void;
  updating?: boolean;
}) {
  const st = statusLabel[order.status] ?? { label: order.status, className: 'bg-muted text-muted-foreground' };
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : '';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{order.courseName || 'دورة'}</p>
              <Badge className={`text-xs border ${st.className}`}>{st.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{order.buyerName}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.buyerPhone}</span>
              <span>{payMethodLabel[order.paymentMethod] || order.paymentMethod}</span>
              {date && <span>{date}</span>}
            </div>
            {order.amount > 0 && (
              <p className="text-sm font-bold text-primary">{order.amount} د.أ</p>
            )}
          </div>
          {order.status === 'pending' && onConfirm && onReject && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {updating ? 'جاري...' : 'تأكيد'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={updating}
                className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                رفض
              </Button>
            </div>
          )}
          {order.status === 'confirmed' && (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
