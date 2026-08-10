"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock, CheckCircle, RefreshCw, Search, DollarSign, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useUser } from "@/firebase/auth/use-user";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { ExportButton } from "@/components/export-button";
import { useLanguage } from "@/components/language-provider";

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

const orderStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const orderStatusLabelsEn: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrgOrdersPage() {
  const { user } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
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
    { label: bi("إجمالي الطلبات", "Total orders"),  value: String(stats.total),               description: bi("طلب مسجل", "registered"),        icon: ShoppingBag },
    { label: bi("قيد الانتظار", "Pending"),    value: String(stats.pending),             description: bi("بانتظار التأكيد", "awaiting confirmation"), icon: Clock },
    { label: bi("مكتملة", "Completed"),          value: String(stats.completed),           description: bi("تم التسليم", "delivered"),      icon: CheckCircle },
    { label: bi("إيرادات مدفوعة", "Paid revenue"),  value: `${stats.revenue.toFixed(0)} ${bi("د.أ", "JOD")}`, description: bi("دفعات مؤكدة", "confirmed payments"),     icon: DollarSign },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      <PageHeader
        title={bi("طلبات المتاجر", "Store orders")}
        description={bi("متابعة طلبات جميع متاجر المستفيدين في المنظمة", "Track orders from all beneficiary stores in the organization")}
        actions={
          <>
            <ExportButton
              title={bi("طلبات المتاجر", "Store orders")}
              filename={`orders-${new Date().toISOString().slice(0,10)}`}
              headers={lang === 'en'
                ? ['Product', 'Buyer', 'Phone', 'Store', 'Amount (JOD)', 'Status', 'Payment method', 'Date']
                : ['المنتج', 'المشتري', 'الهاتف', 'المتجر', 'المبلغ (د.أ)', 'الحالة', 'طريقة الدفع', 'التاريخ']}
              rows={orders.map(o => [
                o.productName || '',
                o.buyerName || '',
                o.buyerPhone || '',
                o.storeName || '',
                (o.totalAmount || 0).toFixed(2),
                (lang === 'en' ? orderStatusLabelsEn[o.status] : orderStatusLabels[o.status]) || o.status,
                o.paymentMethod || '',
                o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : '',
              ])}
              options={{ summary: { [bi('إجمالي الطلبات', 'Total orders')]: String(stats.total), [bi('قيد الانتظار', 'Pending')]: String(stats.pending), [bi('مكتملة', 'Completed')]: String(stats.completed), [bi('إيرادات مدفوعة', 'Paid revenue')]: `${stats.revenue.toFixed(0)} ${bi("د.أ", "JOD")}` } }}
            />
            <Button variant="outline" onClick={load} disabled={loading} className="gap-2 h-fit">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              {bi("تحديث", "Refresh")}
            </Button>
          </>
        }
      />

      {/* ── KPI Cards ── */}
      <StatGrid>
        {statItems.map((s, i) => (
          <StatCard
            key={i}
            title={s.label}
            value={s.value}
            description={s.description}
            icon={s.icon}
            active={i === 0}
            loading={loading}
          />
        ))}
      </StatGrid>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={bi("بحث عن طلب...", "Search for an order...")}
            className="pr-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={bi("الحالة", "Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{bi("جميع الحالات", "All statuses")}</SelectItem>
            <SelectItem value="pending">{bi("قيد الانتظار", "Pending")}</SelectItem>
            <SelectItem value="confirmed">{bi("مؤكد", "Confirmed")}</SelectItem>
            <SelectItem value="shipped">{bi("تم الشحن", "Shipped")}</SelectItem>
            <SelectItem value="completed">{bi("مكتمل", "Completed")}</SelectItem>
            <SelectItem value="cancelled">{bi("ملغي", "Cancelled")}</SelectItem>
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
          <p className="empty-state-title">{bi("لا توجد طلبات", "No orders")}</p>
          <p className="empty-state-desc">
            {search || filterStatus !== 'all'
              ? bi('لا توجد نتائج تطابق معايير البحث', 'No results match your search criteria')
              : bi('ستظهر طلبات متاجر المستفيدين هنا', 'Beneficiary store orders will appear here')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full text-sm premium-table">
            <thead>
              <tr>
                <th>{bi("المنتج", "Product")}</th>
                <th>{bi("العميل", "Customer")}</th>
                <th>{bi("المتجر", "Store")}</th>
                <th>{bi("المبلغ", "Amount")}</th>
                <th>{bi("الدفع", "Payment")}</th>
                <th>{bi("الحالة", "Status")}</th>
                <th>{bi("التاريخ", "Date")}</th>
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
                  <td className="font-bold text-primary tabular-nums">{(order.totalAmount || 0).toFixed(2)} {bi("د.أ", "JOD")}</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">{order.paymentMethod === 'online' ? bi('أونلاين', 'Online') : bi('استلام', 'Cash on delivery')}</span>
                      {order.paymentStatus === 'paid' && <StatusBadge status="paid" />}
                    </div>
                  </td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="text-xs text-muted-foreground tabular-nums">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString(locale) : '—'}
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
