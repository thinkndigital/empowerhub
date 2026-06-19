"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck, RefreshCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/firebase/auth/use-user";

interface Order {
  id: string;
  productName: string;
  totalAmount: number;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  storeName: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'قيد الانتظار', color: 'bg-amber-500/20 text-amber-400 border-0' },
  confirmed: { label: 'مؤكد',         color: 'bg-blue-500/20 text-blue-400 border-0' },
  shipped:   { label: 'تم الشحن',     color: 'bg-purple-500/20 text-purple-400 border-0' },
  completed: { label: 'مكتمل',        color: 'bg-emerald-500/20 text-emerald-400 border-0' },
  cancelled: { label: 'ملغي',         color: 'bg-red-500/20 text-red-400 border-0' },
};

export default function OrgOrdersPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/org/orders', { headers: { authorization: `Bearer ${token}` } });
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.productName?.toLowerCase().includes(search.toLowerCase()) ||
      o.storeName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">طلبات المتاجر</h1>
          <p className="text-muted-foreground text-sm">متابعة طلبات جميع متاجر المستفيدين في المنظمة</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, color: 'text-primary' },
          { label: 'قيد الانتظار', value: stats.pending, color: 'text-amber-500' },
          { label: 'مكتملة', value: stats.completed, color: 'text-emerald-500' },
          { label: 'إيرادات مدفوعة', value: `${stats.revenue.toFixed(0)} ر.س`, color: 'text-blue-500' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن طلب..." className="pr-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="confirmed">مؤكد</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>لا توجد طلبات</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-right p-3 font-medium">المنتج</th>
                <th className="text-right p-3 font-medium">العميل</th>
                <th className="text-right p-3 font-medium">المتجر</th>
                <th className="text-right p-3 font-medium">المبلغ</th>
                <th className="text-right p-3 font-medium">الدفع</th>
                <th className="text-right p-3 font-medium">الحالة</th>
                <th className="text-right p-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(order => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium max-w-[150px] truncate">{order.productName}</td>
                    <td className="p-3">
                      <div className="font-medium">{order.buyerName}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{order.buyerPhone}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{order.storeName || '—'}</td>
                    <td className="p-3 font-bold text-primary">{(order.totalAmount || 0).toFixed(2)} ر.س</td>
                    <td className="p-3">
                      <span className="text-xs text-muted-foreground">{order.paymentMethod === 'online' ? 'أونلاين' : 'استلام'}</span>
                      {order.paymentStatus === 'paid' && <Badge className="mr-1 bg-emerald-500/20 text-emerald-600 border-0 text-xs">مدفوع</Badge>}
                    </td>
                    <td className="p-3"><Badge className={sc.color + ' text-xs'}>{sc.label}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
