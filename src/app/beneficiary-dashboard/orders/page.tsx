"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, Truck, RefreshCw,
  Phone, MapPin, MessageSquare, Download, Printer, TrendingUp,
  DollarSign, Wallet, Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/firebase/auth/use-user";
import { useCurrency } from "@/hooks/use-currency";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

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

interface FinancialOrder {
  id: string;
  productName: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string | null;
}

interface Payout {
  id: string;
  amount: number;
  grossAmount: number;
  commissionAmount: number;
  transferReference: string;
  notes: string;
  status: 'pending' | 'paid';
  paidAt: string | null;
  createdAt: string | null;
}

interface FinancialSummary {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  totalPaid: number;
  remaining: number;
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

  // Financial state
  const [financialOrders, setFinancialOrders] = useState<FinancialOrder[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'financial'>('orders');

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

  const loadFinancial = useCallback(async () => {
    if (!user) return;
    setFinancialLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/beneficiary/financial', { headers: { authorization: `Bearer ${token}` } });
      const d = await r.json();
      setFinancialOrders(d.orders || []);
      setPayouts(d.payouts || []);
      setSummary(d.summary || null);
      setCommissionRate(d.commissionRate ?? 10);
    } catch {}
    setFinancialLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeTab === 'financial') {
      loadFinancial();
    }
  }, [activeTab, loadFinancial]);

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

  const handleExportCSV = () => {
    const headers = ["التاريخ", "المنتج", "المبلغ الإجمالي", `العمولة (${commissionRate}%)`, "صافي المستحق", "حالة الطلب"];
    const rows = financialOrders.map(o => [
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '',
      o.productName || '',
      o.totalAmount,
      o.commissionAmount,
      o.netAmount,
      o.status === 'completed' ? 'مكتمل' : o.status === 'confirmed' ? 'مؤكد' : o.status === 'pending' ? 'قيد الانتظار' : o.status,
    ]);
    exportToExcel('كشف_مالي_متجري', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["التاريخ", "المنتج", "الإجمالي", "العمولة", "الصافي", "الحالة"];
    const rows = financialOrders.map(o => [
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '',
      o.productName || '',
      `${o.totalAmount} ${currencySymbol}`,
      `${o.commissionAmount} ${currencySymbol}`,
      `${o.netAmount} ${currencySymbol}`,
      o.status === 'completed' ? 'مكتمل' : o.status === 'confirmed' ? 'مؤكد' : o.status === 'pending' ? 'قيد الانتظار' : o.status,
    ]);
    exportToPDF('الكشف المالي - متجري', headers, rows, summary ? { summary: {
      'إجمالي المبيعات': `${summary.totalGross.toFixed(2)} ${currencySymbol}`,
      'عمولة EmpowerHub': `${summary.totalCommission.toFixed(2)} ${currencySymbol}`,
      'صافي المستحق': `${summary.totalNet.toFixed(2)} ${currencySymbol}`,
      'تم استلامه': `${summary.totalPaid.toFixed(2)} ${currencySymbol}`,
      'الرصيد المتبقي': `${summary.remaining.toFixed(2)} ${currencySymbol}`,
    } } : undefined);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">طلباتي</h1>
          <p className="text-muted-foreground text-sm">إدارة وتتبع طلبات العملاء والكشف المالي</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'orders' | 'financial')}>
        <TabsList className="mb-4">
          <TabsTrigger value="orders">طلباتي</TabsTrigger>
          <TabsTrigger value="financial">الكشف المالي</TabsTrigger>
        </TabsList>

        {/* ===== ORDERS TAB ===== */}
        <TabsContent value="orders" className="space-y-6">
          <div className="flex justify-end">
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
              { label: 'الإيرادات', value: `${stats.revenue.toFixed(0)} ${currencySymbol}`, icon: ShoppingBag, color: 'text-blue-500' },
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
        </TabsContent>

        {/* ===== FINANCIAL TAB ===== */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold">كشف مالي</h2>
              <p className="text-xs text-muted-foreground">نسبة عمولة EmpowerHub: {commissionRate}%</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadFinancial} disabled={financialLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${financialLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                تنزيل Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                <Printer className="h-4 w-4" />
                طباعة/PDF
              </Button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'إجمالي المبيعات', value: summary ? `${summary.totalGross.toFixed(2)} ${currencySymbol}` : '...', icon: TrendingUp, color: 'text-blue-500' },
              { label: 'عمولة EmpowerHub', value: summary ? `${summary.totalCommission.toFixed(2)} ${currencySymbol}` : '...', icon: DollarSign, color: 'text-amber-500' },
              { label: 'صافي المستحق', value: summary ? `${summary.totalNet.toFixed(2)} ${currencySymbol}` : '...', icon: Wallet, color: 'text-emerald-500' },
              { label: 'تم استلامه', value: summary ? `${summary.totalPaid.toFixed(2)} ${currencySymbol}` : '...', icon: CheckCircle, color: 'text-emerald-600' },
              { label: 'الرصيد المتبقي', value: summary ? `${summary.remaining.toFixed(2)} ${currencySymbol}` : '...', icon: Banknote, color: 'text-red-500' },
            ].map((s, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
                  <p className="text-lg font-bold">{financialLoading ? '...' : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Financial Orders Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">تفاصيل الطلبات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {financialLoading ? (
                <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>
              ) : financialOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">لا توجد طلبات مالية</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-right">العمولة ({commissionRate}%)</TableHead>
                        <TableHead className="text-right">صافي المستحق</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : '—'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{order.productName || '—'}</TableCell>
                          <TableCell className="text-sm">{order.totalAmount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell className="text-sm text-amber-600">{order.commissionAmount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell className="text-sm font-bold text-emerald-600">{order.netAmount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${
                              order.status === 'completed' || order.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : order.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {order.status === 'completed' ? 'مكتمل'
                                : order.status === 'confirmed' ? 'مؤكد'
                                : order.status === 'pending' ? 'قيد الانتظار'
                                : order.status === 'cancelled' ? 'ملغي'
                                : order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payouts History */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">التحويلات من EmpowerHub</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {financialLoading ? (
                <div className="py-8 text-center text-muted-foreground">جاري التحميل...</div>
              ) : payouts.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <p className="text-sm">لم يتم استلام أي تحويلات بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">مرجع التحويل</TableHead>
                        <TableHead className="text-right">ملاحظات</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ الدفع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map(payout => (
                        <TableRow key={payout.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString('ar-EG') : '—'}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">{payout.amount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{payout.transferReference || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{payout.notes || '—'}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${
                              payout.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {payout.status === 'paid' ? 'تم الدفع' : 'معلق'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString('ar-EG') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
