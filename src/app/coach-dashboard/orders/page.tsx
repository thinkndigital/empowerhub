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
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { useLanguage } from "@/components/language-provider";

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
  type?: 'course' | 'session';
  productName: string;
  courseName: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  createdAt: string | null;
  hours?: number;
  organizationName?: string;
}

const sessionStatusLabel: Record<string, { label: string; className: string }> = {
  completed: { label: 'مكتملة', className: 'bg-emerald-100 text-emerald-700' },
  scheduled: { label: 'مجدولة', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'ملغاة', className: 'bg-red-100 text-red-700' },
};

const sessionStatusLabelEn: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

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

const statusLabelEn: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected:  { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
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

const payMethodLabelEn: Record<string, string> = {
  cod: 'Cash on confirmation',
  moyasar: 'Moyasar',
  stripe: 'Stripe',
  paypal: 'PayPal',
  paytabs: 'PayTabs',
  hyperpay: 'HyperPay',
  tamara: 'Tamara',
  tabby: 'Tabby',
};

function buildWhatsAppLink(phone: string, name: string, courseTitle: string, courseUrl: string, bi: (ar: string, en: string) => string) {
  const cleaned = phone.replace(/\s+/g, '').replace(/^00/, '+');
  const msg = encodeURIComponent(
    bi(
      `مرحباً ${name}،\n\nتم تأكيد اشتراكك في دورة "${courseTitle}".\n\nرابط الدورة:\n${courseUrl}\n\nأهلاً وسهلاً بك!`,
      `Hello ${name},\n\nYour enrollment in the course "${courseTitle}" has been confirmed.\n\nCourse link:\n${courseUrl}\n\nWelcome!`
    )
  );
  return `https://wa.me/${cleaned.replace('+', '')}?text=${msg}`;
}

export default function CoachOrdersPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const tSessionStatus = lang === 'en' ? sessionStatusLabelEn : sessionStatusLabel;
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
      if (!data.ok) throw new Error(data.error || bi('فشل التحديث', 'Update failed'));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (status === 'confirmed') {
        if (data.isGuest) {
          setGuestAlert(data as ConfirmResult);
        } else {
          toast({ title: bi('تم تأكيد الطلب', 'Order confirmed'), description: bi('تم إرسال إشعار للمشترك برابط الدورة.', 'A notification with the course link has been sent to the buyer.') });
        }
      } else {
        toast({ title: bi('تم رفض الطلب', 'Order rejected') });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
    } finally {
      setUpdating(null);
    }
  };

  const exportStatusLabel = (o: FinancialOrder) =>
    o.type === 'session'
      ? (tSessionStatus[o.status]?.label ?? o.status)
      : o.status === 'confirmed' ? bi('مؤكد', 'Confirmed') : o.status === 'pending' ? bi('قيد الانتظار', 'Pending') : o.status === 'rejected' ? bi('مرفوض', 'Rejected') : o.status;

  const handleExportCSV = () => {
    const headers = lang === 'en'
      ? ["Type", "Date", "Item", "Organization", "Total Amount", "Deduction", "Net Due", "Status"]
      : ["النوع", "التاريخ", "البند", "المنظمة", "المبلغ الإجمالي", "الخصم", "صافي المستحق", "الحالة"];
    const rows = financialOrders.map(o => [
      o.type === 'session' ? bi('جلسة', 'Session') : bi('دورة', 'Course'),
      o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : '',
      o.courseName || o.productName || '',
      o.organizationName || '',
      o.totalAmount,
      o.commissionAmount,
      o.netAmount,
      exportStatusLabel(o),
    ]);
    exportToExcel(bi('كشف_مالي', 'financial_statement'), headers, rows);
  };

  const handleExportPDF = () => {
    const headers = lang === 'en'
      ? ["Type", "Date", "Item", "Organization", "Total", "Deduction", "Net", "Status"]
      : ["النوع", "التاريخ", "البند", "المنظمة", "الإجمالي", "الخصم", "الصافي", "الحالة"];
    const rows = financialOrders.map(o => [
      o.type === 'session' ? bi('جلسة', 'Session') : bi('دورة', 'Course'),
      o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : '',
      o.courseName || o.productName || '',
      o.organizationName || '',
      `${o.totalAmount} ${currencySymbol}`,
      `${o.commissionAmount} ${currencySymbol}`,
      `${o.netAmount} ${currencySymbol}`,
      exportStatusLabel(o),
    ]);
    exportToPDF(bi('الكشف المالي', 'Financial Statement'), headers, rows, summary ? { summary: {
      [bi('إجمالي المبيعات والجلسات', 'Total sales & sessions')]: `${summary.totalGross.toFixed(2)} ${currencySymbol}`,
      [bi('إجمالي الخصومات', 'Total deductions')]: `${summary.totalCommission.toFixed(2)} ${currencySymbol}`,
      [bi('صافي المستحق', 'Net due')]: `${summary.totalNet.toFixed(2)} ${currencySymbol}`,
      [bi('تم استلامه', 'Received')]: `${summary.totalPaid.toFixed(2)} ${currencySymbol}`,
      [bi('الرصيد المتبقي', 'Remaining balance')]: `${summary.remaining.toFixed(2)} ${currencySymbol}`,
    } } : undefined);
  };

  const pending = orders.filter(o => o.status === 'pending');
  const others  = orders.filter(o => o.status !== 'pending');

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi('طلبات الدورات', 'Course Orders')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{bi('طلبات الاشتراك في دوراتك التدريبية', 'Enrollment requests for your training courses')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'orders' | 'financial')}>
        <TabsList className="mb-4">
          <TabsTrigger value="orders">{bi('طلباتي', 'My Orders')}</TabsTrigger>
          <TabsTrigger value="financial">{bi('الكشف المالي', 'Financial Statement')}</TabsTrigger>
        </TabsList>

        {/* ===== ORDERS TAB ===== */}
        <TabsContent value="orders" className="space-y-6">
          {/* Guest WhatsApp alert */}
          {guestAlert && (
            <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-emerald-800">{bi('تم تأكيد الطلب ✓', 'Order confirmed ✓')}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      {bi('هذا المشترك زائر (غير مسجّل). أرسل له رابط الدورة عبر واتساب.', 'This buyer is a guest (not registered). Send them the course link via WhatsApp.')}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1 font-mono break-all">{guestAlert.courseUrl}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      className="bg-[#25D366] hover:bg-[#1ebe5d] text-white gap-1"
                      onClick={() => window.open(buildWhatsAppLink(
                        guestAlert.buyerPhone, guestAlert.buyerName,
                        guestAlert.courseTitle, guestAlert.courseUrl, bi
                      ), '_blank')}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {bi('إرسال واتساب', 'Send WhatsApp')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(guestAlert.courseUrl);
                        toast({ title: bi('تم نسخ الرابط', 'Link copied') });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {bi('نسخ الرابط', 'Copy Link')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setGuestAlert(null)}>{bi('إغلاق', 'Close')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: bi('إجمالي الطلبات', 'Total Orders'), value: orders.length, color: 'bg-primary/10 text-primary' },
              { label: bi('قيد الانتظار', 'Pending'), value: pending.length, color: 'bg-amber-100 text-amber-700' },
              { label: bi('مؤكدة', 'Confirmed'), value: orders.filter(o => o.status === 'confirmed').length, color: 'bg-emerald-100 text-emerald-700' },
              { label: bi('مرفوضة', 'Rejected'), value: orders.filter(o => o.status === 'rejected').length, color: 'bg-red-100 text-red-700' },
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
                {bi('تحتاج إلى تأكيد', 'Needs Confirmation')} ({pending.length})
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
              <h2 className="text-base font-semibold mb-3">{bi('السجل', 'History')}</h2>
            )}
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : others.length === 0 && pending.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground">{bi('لا توجد طلبات بعد', 'No orders yet')}</p>
                  <p className="text-xs text-muted-foreground">{bi('ستظهر هنا طلبات الاشتراك في دوراتك', 'Enrollment requests for your courses will appear here')}</p>
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
              <h2 className="text-lg font-semibold">{bi('كشف مالي', 'Financial Statement')}</h2>
              <p className="text-xs text-muted-foreground">
                {bi(`عمولة EmpowerHub على مبيعات الدورات: ${commissionRate}% — بالإضافة لمستحقات الجلسات التدريبية حسب سعر الساعة ونسبة المنظمة`, `EmpowerHub's commission on course sales: ${commissionRate}% — plus coaching session earnings based on hourly rate and organization share`)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={loadFinancial} disabled={financialLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${financialLoading ? 'animate-spin' : ''}`} />
                {bi('تحديث', 'Refresh')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                {bi('تنزيل Excel', 'Download Excel')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                <Printer className="h-4 w-4" />
                {bi('طباعة/PDF', 'Print/PDF')}
              </Button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: bi('إجمالي المبيعات والجلسات', 'Total sales & sessions'), value: summary ? `${summary.totalGross.toFixed(2)} ${currencySymbol}` : '...', icon: TrendingUp, color: 'text-blue-500' },
              { label: bi('إجمالي الخصومات', 'Total deductions'), value: summary ? `${summary.totalCommission.toFixed(2)} ${currencySymbol}` : '...', icon: DollarSign, color: 'text-amber-500' },
              { label: bi('صافي المستحق', 'Net due'), value: summary ? `${summary.totalNet.toFixed(2)} ${currencySymbol}` : '...', icon: Wallet, color: 'text-emerald-500' },
              { label: bi('تم استلامه', 'Received'), value: summary ? `${summary.totalPaid.toFixed(2)} ${currencySymbol}` : '...', icon: CheckCircle, color: 'text-emerald-600' },
              { label: bi('الرصيد المتبقي', 'Remaining balance'), value: summary ? `${summary.remaining.toFixed(2)} ${currencySymbol}` : '...', icon: Banknote, color: 'text-red-500' },
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
              <CardTitle className="text-base">{bi('تفاصيل المستحقات', 'Earnings Details')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {financialLoading ? (
                <div className="py-12 text-center text-muted-foreground">{bi('جاري التحميل...', 'Loading...')}</div>
              ) : financialOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{bi('لا توجد طلبات أو جلسات مالية بعد', 'No financial orders or sessions yet')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{bi('النوع', 'Type')}</TableHead>
                        <TableHead className="text-right">{bi('التاريخ', 'Date')}</TableHead>
                        <TableHead className="text-right">{bi('البند', 'Item')}</TableHead>
                        <TableHead className="text-right">{bi('المنظمة', 'Organization')}</TableHead>
                        <TableHead className="text-right">{bi('المبلغ الإجمالي', 'Total Amount')}</TableHead>
                        <TableHead className="text-right">{bi('الخصم', 'Deduction')}</TableHead>
                        <TableHead className="text-right">{bi('صافي المستحق', 'Net Due')}</TableHead>
                        <TableHead className="text-right">{bi('الحالة', 'Status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialOrders.map(order => {
                        const isSession = order.type === 'session';
                        const st = isSession
                          ? (tSessionStatus[order.status] ?? { label: order.status, className: 'bg-muted text-muted-foreground' })
                          : order.status === 'confirmed'
                          ? { label: bi('مؤكد', 'Confirmed'), className: 'bg-emerald-100 text-emerald-700' }
                          : order.status === 'pending'
                          ? { label: bi('قيد الانتظار', 'Pending'), className: 'bg-amber-100 text-amber-700' }
                          : { label: bi('مرفوض', 'Rejected'), className: 'bg-red-100 text-red-700' };
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{isSession ? bi('جلسة', 'Session') : bi('دورة', 'Course')}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString(locale) : '—'}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {order.courseName || order.productName || '—'}
                              {isSession && order.hours != null && (
                                <span className="text-xs text-muted-foreground mr-1">({order.hours} {bi('ساعة', 'hours')})</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{order.organizationName || '—'}</TableCell>
                            <TableCell className="text-sm">{order.totalAmount.toFixed(2)} {currencySymbol}</TableCell>
                            <TableCell className="text-sm text-amber-600">{order.commissionAmount.toFixed(2)} {currencySymbol}</TableCell>
                            <TableCell className="text-sm font-bold text-emerald-600">{order.netAmount.toFixed(2)} {currencySymbol}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs border-0 ${st.className}`}>{st.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payouts History */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{bi('التحويلات من EmpowerHub', 'Transfers from EmpowerHub')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {financialLoading ? (
                <div className="py-8 text-center text-muted-foreground">{bi('جاري التحميل...', 'Loading...')}</div>
              ) : payouts.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <p className="text-sm">{bi('لم يتم استلام أي تحويلات بعد', 'No transfers received yet')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{bi('التاريخ', 'Date')}</TableHead>
                        <TableHead className="text-right">{bi('المبلغ', 'Amount')}</TableHead>
                        <TableHead className="text-right">{bi('مرجع التحويل', 'Transfer Reference')}</TableHead>
                        <TableHead className="text-right">{bi('ملاحظات', 'Notes')}</TableHead>
                        <TableHead className="text-right">{bi('الحالة', 'Status')}</TableHead>
                        <TableHead className="text-right">{bi('تاريخ الدفع', 'Payment Date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map(payout => (
                        <TableRow key={payout.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString(locale) : '—'}
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
                              {payout.status === 'paid' ? bi('تم الدفع', 'Paid') : bi('معلق', 'Pending')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString(locale) : '—'}
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
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const tStatus = lang === 'en' ? statusLabelEn : statusLabel;
  const tPayMethod = lang === 'en' ? payMethodLabelEn : payMethodLabel;
  const st = tStatus[order.status] ?? { label: order.status, className: 'bg-muted text-muted-foreground' };
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG') : '';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{order.courseName || bi('دورة', 'Course')}</p>
              <Badge className={`text-xs border ${st.className}`}>{st.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{order.buyerName}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.buyerPhone}</span>
              <span>{tPayMethod[order.paymentMethod] || order.paymentMethod}</span>
              {date && <span>{date}</span>}
            </div>
            {order.amount > 0 && (
              <p className="text-sm font-bold text-primary">{order.amount} {bi('د.أ', 'JOD')}</p>
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
                {updating ? bi('جاري...', 'Processing...') : bi('تأكيد', 'Confirm')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={updating}
                className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                {bi('رفض', 'Reject')}
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
