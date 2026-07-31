"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock, CheckCircle, RefreshCw, Search, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useUser } from "@/firebase/auth/use-user";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/export-button";

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

const statColors = [
  { bg: "bg-primary/10",    icon: "bg-primary" },
  { bg: "bg-amber-500/10",  icon: "bg-amber-500" },
  { bg: "bg-emerald-500/10",icon: "bg-emerald-500" },
  { bg: "bg-sky-500/10",    icon: "bg-sky-500" },
];

const orderStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
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
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue:   orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.totalAmount || 0), 0),
  };

  const statItems = [
    { label: "إجمالي الطلبات",   value: String(stats.total),      sub: "طلب مسجل",        icon: <ShoppingBag />, colorIdx: 0 },
    { label: "قيد الانتظار",     value: String(stats.pending),    sub: "بانتظار التأكيد", icon: <Clock />,       colorIdx: 1 },
    { label: "مكتملة",           value: String(stats.completed),  sub: "تم التسليم",      icon: <CheckCircle />, colorIdx: 2 },
    { label: "إيرادات مدفوعة",   value: `${stats.revenue.toFixed(0)} د.أ`, sub: "دفعات مؤكدة",  icon: <DollarSign />,  colorIdx: 3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up" dir="rtl">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">طلبات المتاجر</h1>
          <p className="page-subtitle">متابعة طلبات جميع متاجر المستفيدين في المنظمة</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            title="طلبات المتاجر"
            filename={`orders-${new Date().toISOString().slice(0,10)}`}
            headers={['المنتج', 'المشتري', 'الهاتف', 'المتجر', 'المبلغ (د.أ)', 'الحالة', 'طريقة الدفع', 'التاريخ']}
            rows={orders.map(o => [
              o.productName || '',
              o.buyerName || '',
              o.buyerPhone || '',
              o.storeName || '',
              (o.totalAmount || 0).toFixed(2),
              orderStatusLabels[o.status] || o.status,
              o.paymentMethod || '',
              o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '',
            ])}
            options={{ summary: { 'إجمالي الطلبات': String(stats.total), 'قيد الانتظار': String(stats.pending), 'مكتملة': String(stats.completed), 'إيرادات مدفوعة': `${stats.revenue.toFixed(0)} د.أ` } }}
          />
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2 h-fit">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            تحديث
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s, i) => {
          const c = statColors[s.colorIdx];
          return (
            <Card key={i} className={cn("stat-card border-0 overflow-hidden", c.bg)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white [&>svg]:h-5 [&>svg]:w-5", c.icon)}>
                  {s.icon}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {loading
                  ? <Skeleton className="h-8 w-20 mb-1" />
                  : <div className="text-3xl font-bold tracking-tight">{s.value}</div>
                }
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث عن طلب..."
            className="pr-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
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

      {/* ── Table / Empty / Loading ── */}
      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center px-5 py-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28 mr-auto" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package className="h-6 w-6" /></div>
          <p className="empty-state-title">لا توجد طلبات</p>
          <p className="empty-state-desc">
            {search || filterStatus !== 'all'
              ? 'لا توجد نتائج تطابق معايير البحث'
              : 'ستظهر طلبات متاجر المستفيدين هنا'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full text-sm premium-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>العميل</th>
                <th>المتجر</th>
                <th>المبلغ</th>
                <th>الدفع</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td className="font-medium max-w-[150px] truncate">{order.productName}</td>
                  <td>
                    <div className="font-medium">{order.buyerName}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{order.buyerPhone}</div>
                  </td>
                  <td className="text-muted-foreground">{order.storeName || '—'}</td>
                  <td className="font-bold text-primary tabular-nums">{(order.totalAmount || 0).toFixed(2)} د.أ</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">{order.paymentMethod === 'online' ? 'أونلاين' : 'استلام'}</span>
                      {order.paymentStatus === 'paid' && <StatusBadge status="paid" />}
                    </div>
                  </td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="text-xs text-muted-foreground tabular-nums">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
