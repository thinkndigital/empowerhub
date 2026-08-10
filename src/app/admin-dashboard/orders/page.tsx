"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Wallet,
  CheckCircle,
  Clock,
  Download,
  Printer,
  Plus,
  Settings,
  RefreshCw,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { useLanguage } from "@/components/language-provider";

type Order = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  productName: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  paymentStatus: string;
  type: string;
  createdAt: string | null;
};

type Payout = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  amount: number;
  grossAmount: number;
  commissionAmount: number;
  orderIds: string[];
  status: "pending" | "paid";
  paidAt: string | null;
  transferReference: string;
  notes: string;
  createdAt: string | null;
};

type FinancialData = {
  orders: Order[];
  payouts: Payout[];
  commissionRate: number;
};

const roleLabel: Record<string, string> = {
  beneficiary: "مستفيد",
  mentor: "مرشد",
  coach: "مدرب",
  admin: "مدير",
};
const roleLabelEn: Record<string, string> = {
  beneficiary: "Beneficiary",
  mentor: "Mentor",
  coach: "Coach",
  admin: "Admin",
};

const statusLabel: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  rejected: "مرفوض",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
  paid: "مدفوع",
  unpaid: "غير مدفوع",
};
const statusLabelEn: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
  unpaid: "Unpaid",
};

export default function AdminFinancialOrdersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { symbol } = useCurrency();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const tRoleLabel = lang === 'en' ? roleLabelEn : roleLabel;
  const tStatusLabel = lang === 'en' ? statusLabelEn : statusLabel;

  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [commissionInput, setCommissionInput] = useState<string>("10");
  const [savingCommission, setSavingCommission] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    userId: "",
    userName: "",
    userRole: "",
    amount: "",
    grossAmount: "",
    commissionAmount: "",
    transferReference: "",
    notes: "",
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/financial-report?${params}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
      setCommissionInput(String(json.commissionRate ?? 10));
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
    } finally {
      setLoading(false);
    }
  }, [user, roleFilter, toast, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveCommission = async () => {
    if (!user) return;
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ variant: "destructive", title: bi("قيمة غير صالحة", "Invalid value"), description: bi("يجب أن تكون النسبة بين 0 و 100", "The rate must be between 0 and 100") });
      return;
    }
    setSavingCommission(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/admin/platform-config", {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ commissionRate: rate }),
      });
      toast({ title: bi("تم الحفظ", "Saved"), description: bi(`تم تحديث نسبة العمولة إلى ${rate}%`, `Commission rate updated to ${rate}%`) });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
    } finally {
      setSavingCommission(false);
    }
  };

  const submitPayout = async () => {
    if (!user) return;
    if (!payoutForm.userId || !payoutForm.amount) {
      toast({ variant: "destructive", title: bi("بيانات ناقصة", "Missing data"), description: bi("يرجى تعبئة معرف المستخدم والمبلغ", "Please fill in the user ID and amount") });
      return;
    }
    setSubmittingPayout(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          userId: payoutForm.userId,
          userName: payoutForm.userName,
          userRole: payoutForm.userRole,
          amount: parseFloat(payoutForm.amount),
          grossAmount: parseFloat(payoutForm.grossAmount || payoutForm.amount),
          commissionAmount: parseFloat(payoutForm.commissionAmount || "0"),
          transferReference: payoutForm.transferReference,
          notes: payoutForm.notes,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast({ title: bi("تم تسجيل التحويل بنجاح", "Payout recorded successfully") });
      setShowPayoutDialog(false);
      setPayoutForm({ userId: "", userName: "", userRole: "", amount: "", grossAmount: "", commissionAmount: "", transferReference: "", notes: "" });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
    } finally {
      setSubmittingPayout(false);
    }
  };

  const markAsPaid = async (payoutId: string) => {
    if (!user) return;
    setMarkingPaid(payoutId);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ id: payoutId, status: "paid" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast({ title: bi("تم تحديث حالة التحويل إلى مدفوع", "Payout status updated to paid") });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
    } finally {
      setMarkingPaid(null);
    }
  };

  const orders = data?.orders ?? [];
  const payouts = data?.payouts ?? [];

  const totalGross = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCommission = orders.reduce((s, o) => s + o.commissionAmount, 0);
  const totalNet = orders.reduce((s, o) => s + o.netAmount, 0);
  const totalPaid = payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalNet - totalPaid);

  const exportHeaders = lang === 'en'
    ? ["#", "User name", "Role", "Product/Course", "Date", "Total amount", `Commission (${data?.commissionRate}%)`, "Net due", "Order status", "Payment status"]
    : ["#", "اسم المستخدم", "الدور", "المنتج/الدورة", "التاريخ", "المبلغ الإجمالي", `العمولة (${data?.commissionRate}%)`, "صافي المستحق", "حالة الطلب", "حالة الدفع"];
  const exportRows = orders.map((o, i) => [
    i + 1,
    o.userName,
    tRoleLabel[o.userRole] || o.userRole,
    o.productName,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : "",
    o.totalAmount,
    o.commissionAmount,
    o.netAmount,
    tStatusLabel[o.status] || o.status,
    tStatusLabel[o.paymentStatus] || o.paymentStatus,
  ]);
  const exportSummary = {
    [bi("إجمالي المبيعات", "Total sales")]: `${totalGross.toFixed(2)} ${symbol}`,
    [bi("إجمالي العمولات", "Total commissions")]: `${totalCommission.toFixed(2)} ${symbol}`,
    [bi("إجمالي الصافي", "Total net")]: `${totalNet.toFixed(2)} ${symbol}`,
    [bi("تم صرفه", "Paid out")]: `${totalPaid.toFixed(2)} ${symbol}`,
    [bi("الرصيد المتبقي", "Remaining balance")]: `${remaining.toFixed(2)} ${symbol}`,
  };

  const handleExportCSV = () => exportToExcel(bi("كشف_الطلبات_المالي", "financial_orders_report"), exportHeaders, exportRows);
  const handleExportPDF = () => exportToPDF(bi("كشف الطلبات المالي - EmpowerHub", "Financial Orders Report - EmpowerHub"), exportHeaders, exportRows, { summary: exportSummary });

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("كشف الطلبات المالي", "Financial Orders Report")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{bi("إدارة العمولات والمدفوعات لجميع المستخدمين", "Manage commissions and payouts for all users")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {bi("تحديث", "Refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            {bi("تصدير Excel", "Export Excel")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <Printer className="h-4 w-4" />
            {bi("تصدير PDF", "Export PDF")}
          </Button>
          <Button size="sm" onClick={() => setShowPayoutDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {bi("تسجيل تحويل جديد", "Record new payout")}
          </Button>
        </div>
      </div>

      {/* Commission rate setting */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {bi("إعداد نسبة عمولة EmpowerHub", "EmpowerHub commission rate setting")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-xs">
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionInput}
                onChange={e => setCommissionInput(e.target.value)}
                className="text-center"
                placeholder="10"
              />
            </div>
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="sm" onClick={saveCommission} disabled={savingCommission}>
              {savingCommission ? bi("جاري الحفظ...", "Saving...") : bi("حفظ", "Save")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{bi("النسبة الحالية:", "Current rate:")} {data?.commissionRate ?? "..."}%</p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: bi("إجمالي الطلبات", "Total orders"), value: loading ? "..." : orders.length, icon: ShoppingBag, color: "text-primary" },
          { label: bi("إجمالي المبيعات", "Total sales"), value: loading ? "..." : `${totalGross.toFixed(2)} ${symbol}`, icon: TrendingUp, color: "text-blue-500" },
          { label: bi("إجمالي العمولات", "Total commissions"), value: loading ? "..." : `${totalCommission.toFixed(2)} ${symbol}`, icon: DollarSign, color: "text-amber-500" },
          { label: bi("إجمالي الصافي", "Total net"), value: loading ? "..." : `${totalNet.toFixed(2)} ${symbol}`, icon: Wallet, color: "text-emerald-500" },
          { label: bi("تم صرفه", "Paid out"), value: loading ? "..." : `${totalPaid.toFixed(2)} ${symbol}`, icon: CheckCircle, color: "text-emerald-600" },
          { label: bi("الرصيد المتبقي", "Remaining balance"), value: loading ? "..." : `${remaining.toFixed(2)} ${symbol}`, icon: Clock, color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: bi("الكل", "All") },
          { key: "beneficiary", label: bi("مستفيدون", "Beneficiaries") },
          { key: "mentor", label: bi("مرشدون", "Mentors") },
          { key: "coach", label: bi("مدربون", "Coaches") },
        ].map(tab => (
          <Button
            key={tab.key}
            variant={roleFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{bi("الطلبات", "Orders")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>{bi("لا توجد طلبات", "No orders")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">{bi("اسم المستخدم", "User name")}</TableHead>
                    <TableHead className="text-right">{bi("الدور", "Role")}</TableHead>
                    <TableHead className="text-right">{bi("المنتج/الدورة", "Product/Course")}</TableHead>
                    <TableHead className="text-right">{bi("التاريخ", "Date")}</TableHead>
                    <TableHead className="text-right">{bi("المبلغ الإجمالي", "Total amount")}</TableHead>
                    <TableHead className="text-right">{bi("العمولة", "Commission")}</TableHead>
                    <TableHead className="text-right">{bi("صافي المستحق", "Net due")}</TableHead>
                    <TableHead className="text-right">{bi("حالة الطلب", "Order status")}</TableHead>
                    <TableHead className="text-right">{bi("حالة الدفع", "Payment status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, i) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{order.userName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tRoleLabel[order.userRole] || order.userRole || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{order.productName || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString(locale) : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{order.totalAmount.toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-sm text-amber-600">
                        {order.commissionAmount.toFixed(2)} {symbol}
                        <span className="text-xs text-muted-foreground mr-1">({order.commissionRate}%)</span>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-emerald-600">{order.netAmount.toFixed(2)} {symbol}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${
                          order.status === "completed" || order.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {tStatusLabel[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${
                          order.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {tStatusLabel[order.paymentStatus] || order.paymentStatus}
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

      {/* Payouts Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">{bi("سجل التحويلات", "Payout history")}</CardTitle>
          <Button size="sm" onClick={() => setShowPayoutDialog(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            {bi("تحويل جديد", "New payout")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">{bi("لا توجد تحويلات مسجلة", "No payouts recorded")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{bi("المستخدم", "User")}</TableHead>
                    <TableHead className="text-right">{bi("الدور", "Role")}</TableHead>
                    <TableHead className="text-right">{bi("المبلغ الصافي", "Net amount")}</TableHead>
                    <TableHead className="text-right">{bi("المبلغ الإجمالي", "Total amount")}</TableHead>
                    <TableHead className="text-right">{bi("العمولة", "Commission")}</TableHead>
                    <TableHead className="text-right">{bi("المرجع", "Reference")}</TableHead>
                    <TableHead className="text-right">{bi("التاريخ", "Date")}</TableHead>
                    <TableHead className="text-right">{bi("الحالة", "Status")}</TableHead>
                    <TableHead className="text-right">{bi("إجراء", "Action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map(payout => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium text-sm">{payout.userName || payout.userId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tRoleLabel[payout.userRole] || payout.userRole || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">{payout.amount.toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-sm">{(payout.grossAmount || 0).toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-sm text-amber-600">{(payout.commissionAmount || 0).toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{payout.transferReference || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString(locale) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${
                          payout.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {payout.status === "paid" ? bi("مدفوع", "Paid") : bi("معلق", "Pending")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsPaid(payout.id)}
                            disabled={markingPaid === payout.id}
                            className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            {markingPaid === payout.id ? "..." : bi("تأكيد الدفع", "Confirm payment")}
                          </Button>
                        )}
                        {payout.status === "paid" && payout.paidAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(payout.paidAt).toLocaleDateString(locale)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi("تسجيل تحويل جديد", "Record new payout")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="userId">{bi("معرف المستخدم (UID)", "User ID (UID)")}</Label>
                <Input
                  id="userId"
                  value={payoutForm.userId}
                  onChange={e => setPayoutForm(f => ({ ...f, userId: e.target.value }))}
                  placeholder="uid..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="userName">{bi("اسم المستخدم", "User name")}</Label>
                <Input
                  id="userName"
                  value={payoutForm.userName}
                  onChange={e => setPayoutForm(f => ({ ...f, userName: e.target.value }))}
                  placeholder={bi("الاسم", "Name")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="userRole">{bi("الدور", "Role")}</Label>
              <select
                id="userRole"
                value={payoutForm.userRole}
                onChange={e => setPayoutForm(f => ({ ...f, userRole: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">{bi("اختر الدور", "Select role")}</option>
                <option value="beneficiary">{bi("مستفيد", "Beneficiary")}</option>
                <option value="mentor">{bi("مرشد", "Mentor")}</option>
                <option value="coach">{bi("مدرب", "Coach")}</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="grossAmount">{bi("الإجمالي", "Total")}</Label>
                <Input
                  id="grossAmount"
                  type="number"
                  step="0.01"
                  value={payoutForm.grossAmount}
                  onChange={e => setPayoutForm(f => ({ ...f, grossAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commissionAmount">{bi("العمولة", "Commission")}</Label>
                <Input
                  id="commissionAmount"
                  type="number"
                  step="0.01"
                  value={payoutForm.commissionAmount}
                  onChange={e => setPayoutForm(f => ({ ...f, commissionAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">{bi("الصافي", "Net")}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transferReference">{bi("مرجع التحويل البنكي", "Bank transfer reference")}</Label>
              <Input
                id="transferReference"
                value={payoutForm.transferReference}
                onChange={e => setPayoutForm(f => ({ ...f, transferReference: e.target.value }))}
                placeholder="REF-..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">{bi("ملاحظات", "Notes")}</Label>
              <Textarea
                id="notes"
                value={payoutForm.notes}
                onChange={e => setPayoutForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={bi("ملاحظات اختيارية...", "Optional notes...")}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>{bi("إلغاء", "Cancel")}</Button>
            <Button onClick={submitPayout} disabled={submittingPayout}>
              {submittingPayout ? bi("جاري الحفظ...", "Saving...") : bi("تسجيل التحويل", "Record payout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
