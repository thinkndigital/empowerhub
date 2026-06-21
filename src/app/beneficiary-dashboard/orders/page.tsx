"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck, RefreshCw, Phone, MapPin, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/firebase/auth/use-user";
import { useCurrency } from "@/hooks/use-currency";

interface Order {
  id: string;
  productName: string;
  productPrice: number;
  totalAmount: number;
  quantity: number;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'unpaid' | 'paid';
  createdAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'قيد الانتظار', color: 'bg-amber-500/20 text-amber-400 border-0', icon: Clock },
  confirmed: { label: 'مؤكد',         color: 'bg-blue-500/20 text-blue-400 border-0',  icon: CheckCircle },
  shipped:   { label: 'تم الشحن',     color: 'bg-purple-500/20 text-purple-400 border-0', icon: Truck },
  completed: { label: 'مكتمل',        color: 'bg-emerald-500/20 text-emerald-400 border-0', icon: CheckCircle },
  cancelled: { label: 'ملغي',         color: 'bg-red-500/20 text-red-400 border-0', icon: XCircle },
};

const nextStatus: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'completed',
};

export default function BeneficiaryOrdersPage() {
  const { user } = useUser();
  const { symbol: currencySymbol } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/beneficiary/orders', { headers: { authorization: `Bearer ${token}` } });
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!user) return;
    setUpdatingId(orderId);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/beneficiary/orders/${orderId}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrders(o => o.map(x => x.id === orderId ? { ...x, status: status as Order['status'] } : x));
    } catch {}
    setUpdatingId(null);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.paymentStatus === 'paid' || o.paymentMethod === 'cod').reduce((s, o) => s + (o.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">طلبات متجري</h1>
          <p className="text-muted-foreground text-sm">إدارة وتتبع طلبات العملاء</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, icon: ShoppingBag, color: 'text-primary' },
          { label: 'قيد الانتظار', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'مكتملة', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'الإيرادات', value: `${stats.revenue.toFixed(0)} ر.س`, icon: ShoppingBag, color: 'text-blue-500' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className={`${s.color} mb-1`}><s.icon className="h-5 w-5" /></div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد طلبات بعد</p>
          <p className="text-sm">ستظهر طلبات العملاء هنا عند ورودها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const next = nextStatus[order.status];
            return (
              <Card key={order.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold">{order.productName}</h3>
                        <Badge className={sc.color}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {sc.label}
                        </Badge>
                        {order.paymentStatus === 'paid' && (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-0 text-xs">مدفوع</Badge>
                        )}
                        {order.paymentMethod === 'online' && order.paymentStatus === 'unpaid' && (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">دفع أونلاين - لم يدفع</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{order.buyerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <a href={`tel:${order.buyerPhone}`} className="hover:text-primary">{order.buyerPhone}</a>
                        </div>
                        {order.buyerAddress && (
                          <div className="flex items-center gap-1.5 sm:col-span-2">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{order.buyerAddress}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="flex items-start gap-1.5 sm:col-span-2">
                            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span>{order.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary">{(order.totalAmount || order.productPrice || 0).toFixed(2)} {currencySymbol}</p>
                      {order.createdAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'دفع أونلاين'}</p>
                    </div>
                  </div>

                  {next && order.status !== 'cancelled' && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, next)}
                        disabled={updatingId === order.id}
                        className="flex-1 text-xs h-8"
                      >
                        {updatingId === order.id ? 'جاري التحديث...' : `تحديث إلى: ${statusConfig[next]?.label}`}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="text-xs h-8 text-red-500 hover:text-red-600 hover:border-red-300"
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
