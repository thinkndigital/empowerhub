"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import {
  ShoppingBag, CheckCircle, XCircle, Clock, Phone, User,
  MessageCircle, Copy, Download, Printer, TrendingUp, DollarSign,
  Wallet, Banknote, RefreshCw,
} from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";

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

interface FinancialOrder {
  id: string;
  productName: string;
  courseName: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  createdAt: string | null;
}

interface Payout {
  id: string;
  amount: number;
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
  const { symbol: currencySymbol } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [guestAlert, setGuestAlert] = useState<ConfirmResult | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'financial'>('orders');

  // Financial state
  const [financialOrders, setFinancialOrders] = useState<FinancialOrder[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [financialLoading, setFinancialLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/coach/orders', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  const loadFinancial = useCallback(async () => {
    if (!authUser) return;
    setFinancialLoading(true);
    try {
      const token = await authUser.getIdToken();
      const r = await fetch('/api/coach/financial', { headers: { authorization: `Bearer ${token}` } });
      const d = await r.json();
      setFinancialOrders(d.orders || []);
      setPayouts(d.payouts || []);
      setSummary(d.summary || null);
      setCommissionRate(d.commissionRate ?? 10);
    } catch {}
    setFinancialLoading(false);
  }, [authUser]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (activeTab === 'financial') {
      loadFinancial();
    }
  }, [activeTab, loadFinancial]);

  const updateStatus = async (orderId: string, status: 'confirmed' | 'rejected') => {
    if (!authUser) return;
    setUpdating(orderId);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/coach/orders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل التحديث');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (status === 'confirmed') {
        if (data.isGuest) {
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

  const handleExportCSV = () => {
    const headers = ["التاريخ", "الدورة", "المبلغ الإجمالي", `العمولة (${commissionRate}%)`, "صافي المستحق", "الحالة"];
    const rows = financialOrders.map(o => [
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '',
      o.courseName || o.productName || '',
      o.totalAmount,
      o.commissionAmount,
      o.netAmount,
      o.status === 'confirmed' ? 'مؤكد' : o.status === 'pending' ? 'قيد الانتظار' : o.status === 'rejected' ? 'مرفوض' : o.status,
    ]);
    exportToCSV('كشف_مالي_دوراتي', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["التاريخ", "الدورة", "الإجمالي", "العمولة", "الصافي", "الحالة"];
    const rows = financialOrders.map(o => [
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '',
      o.courseName || o.productName || '',
      `${o.totalAmount} ${currencySymbol}`,
      `${o.commissionAmount} ${currencySymbol}`,
      `${o.netAmount} ${currencySymbol}`,
      o.status === 'confirmed' ? 'مؤكد' : o.status === 'pending' ? 'قيد الانتظار' : o.status === 'rejected' ? 'مرفوض' : o.status,
    ]);
    exportToPDF('الكشف المالي - دوراتي', headers, rows, summary ? {
      'إجمالي المبيعات': `${summary.totalGross.toFixed(2)} ${currencySymbol}`,
      'عمولة EmpowerHub': `${summary.totalCommission.toFixed(2)} ${currencySymbol}`,
      'صافي المستحق': `${summary.totalNet.toFixed(2)} ${currencySymbol}`,
      'تم استلامه': `${summary.totalPaid.toFixed(2)} ${currencySymbol}`,
      'الرصيد المتبقي': `${summary.remaining.toFixed(2)} ${currencySymbol}`,
    } : undefined);
  };

  const pending = orders.filter(o => o.status === 'pending');
  const others  = orders.filter(o => o.status !== 'pending');

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">طلبات الدورات</h1>
        <p className="text-muted-foreground text-sm mt-1">طلبات الاشتراك في دوراتك التدريبية</p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'orders' | 'financial')}>
        <TabsList className="mb-4">
          <TabsTrigger value="orders">طلباتي</TabsTrigger>
          <TabsTrigger value="financial">الكشف المالي</TabsTrigger>
        </TabsList>

        {/* ===== ORDERS TAB ===== */}
        <TabsContent value="orders" className="space-y-6">
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
        </TabsContent>

        {/* ===== FINANCIAL TAB ===== */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold">كشف مالي</h2>
              <p className="text-xs text-muted-foreground">نسبة عمولة EmpowerHub: {commissionRate}%</p>
            </div>
            <div className="flex gap-2 flex-wrap">
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
                        <TableHead className="text-right">الدورة</TableHead>
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
                          <TableCell className="text-sm font-medium">{order.courseName || order.productName || '—'}</TableCell>
                          <TableCell className="text-sm">{order.totalAmount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell className="text-sm text-amber-600">{order.commissionAmount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell className="text-sm font-bold text-emerald-600">{order.netAmount.toFixed(2)} {currencySymbol}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${
                              order.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : order.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {order.status === 'confirmed' ? 'مؤكد'
                                : order.status === 'pending' ? 'قيد الانتظار'
                                : order.status === 'rejected' ? 'مرفوض'
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

function OrderCard({
  order, onConfirm, onReject, updating,
}: {
  order: Order;
  onConfirm?: () => void;
  onReject?: () => void;
  updating?: boolean;
}) {
  const st = statusLabel[order.status] ?? { label: order.status, className: 'bg-muted text-muted-foreground' };
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : '';

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
