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

export default function AdminFinancialOrdersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { symbol } = useCurrency();

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
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setLoading(false);
    }
  }, [user, roleFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveCommission = async () => {
    if (!user) return;
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ variant: "destructive", title: "قيمة غير صالحة", description: "يجب أن تكون النسبة بين 0 و 100" });
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
      toast({ title: "تم الحفظ", description: `تم تحديث نسبة العمولة إلى ${rate}%` });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setSavingCommission(false);
    }
  };

  const submitPayout = async () => {
    if (!user) return;
    if (!payoutForm.userId || !payoutForm.amount) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة معرف المستخدم والمبلغ" });
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
      toast({ title: "تم تسجيل التحويل بنجاح" });
      setShowPayoutDialog(false);
      setPayoutForm({ userId: "", userName: "", userRole: "", amount: "", grossAmount: "", commissionAmount: "", transferReference: "", notes: "" });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
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
      toast({ title: "تم تحديث حالة التحويل إلى مدفوع" });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
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

  const exportHeaders = ["#", "اسم المستخدم", "الدور", "المنتج/الدورة", "التاريخ", "المبلغ الإجمالي", `العمولة (${data?.commissionRate}%)`, "صافي المستحق", "حالة الطلب", "حالة الدفع"];
  const exportRows = orders.map((o, i) => [
    i + 1,
    o.userName,
    roleLabel[o.userRole] || o.userRole,
    o.productName,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString("ar-EG") : "",
    o.totalAmount,
    o.commissionAmount,
    o.netAmount,
    statusLabel[o.status] || o.status,
    statusLabel[o.paymentStatus] || o.paymentStatus,
  ]);
  const exportSummary = {
    "إجمالي المبيعات": `${totalGross.toFixed(2)} ${symbol}`,
    "إجمالي العمولات": `${totalCommission.toFixed(2)} ${symbol}`,
    "إجمالي الصافي": `${totalNet.toFixed(2)} ${symbol}`,
    "تم صرفه": `${totalPaid.toFixed(2)} ${symbol}`,
    "الرصيد المتبقي": `${remaining.toFixed(2)} ${symbol}`,
  };

  const handleExportCSV = () => exportToExcel("كشف_الطلبات_المالي", exportHeaders, exportRows);
  const handleExportPDF = () => exportToPDF("كشف الطلبات المالي - EmpowerHub", exportHeaders, exportRows, { summary: exportSummary });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">كشف الطلبات المالي</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة العمولات والمدفوعات لجميع المستخدمين</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <Printer className="h-4 w-4" />
            تصدير PDF
          </Button>
          <Button size="sm" onClick={() => setShowPayoutDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            تسجيل تحويل جديد
          </Button>
        </div>
      </div>

      {/* Commission rate setting */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            إعداد نسبة عمولة EmpowerHub
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
              {savingCommission ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">النسبة الحالية: {data?.commissionRate ?? "..."}%</p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "إجمالي الطلبات", value: loading ? "..." : orders.length, icon: ShoppingBag, color: "text-primary" },
          { label: "إجمالي المبيعات", value: loading ? "..." : `${totalGross.toFixed(2)} ${symbol}`, icon: TrendingUp, color: "text-blue-500" },
          { label: "إجمالي العمولات", value: loading ? "..." : `${totalCommission.toFixed(2)} ${symbol}`, icon: DollarSign, color: "text-amber-500" },
          { label: "إجمالي الصافي", value: loading ? "..." : `${totalNet.toFixed(2)} ${symbol}`, icon: Wallet, color: "text-emerald-500" },
          { label: "تم صرفه", value: loading ? "..." : `${totalPaid.toFixed(2)} ${symbol}`, icon: CheckCircle, color: "text-emerald-600" },
          { label: "الرصيد المتبقي", value: loading ? "..." : `${remaining.toFixed(2)} ${symbol}`, icon: Clock, color: "text-red-500" },
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
          { key: "all", label: "الكل" },
          { key: "beneficiary", label: "مستفيدون" },
          { key: "mentor", label: "مرشدون" },
          { key: "coach", label: "مدربون" },
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
          <CardTitle className="text-base">الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">المنتج/الدورة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right">العمولة</TableHead>
                    <TableHead className="text-right">صافي المستحق</TableHead>
                    <TableHead className="text-right">حالة الطلب</TableHead>
                    <TableHead className="text-right">حالة الدفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, i) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{order.userName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {roleLabel[order.userRole] || order.userRole || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{order.productName || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : "—"}
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
                          {statusLabel[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${
                          order.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {statusLabel[order.paymentStatus] || order.paymentStatus}
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
          <CardTitle className="text-base">سجل التحويلات</CardTitle>
          <Button size="sm" onClick={() => setShowPayoutDialog(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            تحويل جديد
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">لا توجد تحويلات مسجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">المبلغ الصافي</TableHead>
                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right">العمولة</TableHead>
                    <TableHead className="text-right">المرجع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map(payout => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium text-sm">{payout.userName || payout.userId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {roleLabel[payout.userRole] || payout.userRole || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">{payout.amount.toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-sm">{(payout.grossAmount || 0).toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-sm text-amber-600">{(payout.commissionAmount || 0).toFixed(2)} {symbol}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{payout.transferReference || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString("ar-EG") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${
                          payout.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {payout.status === "paid" ? "مدفوع" : "معلق"}
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
                            {markingPaid === payout.id ? "..." : "تأكيد الدفع"}
                          </Button>
                        )}
                        {payout.status === "paid" && payout.paidAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(payout.paidAt).toLocaleDateString("ar-EG")}
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
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل تحويل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="userId">معرف المستخدم (UID)</Label>
                <Input
                  id="userId"
                  value={payoutForm.userId}
                  onChange={e => setPayoutForm(f => ({ ...f, userId: e.target.value }))}
                  placeholder="uid..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="userName">اسم المستخدم</Label>
                <Input
                  id="userName"
                  value={payoutForm.userName}
                  onChange={e => setPayoutForm(f => ({ ...f, userName: e.target.value }))}
                  placeholder="الاسم"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="userRole">الدور</Label>
              <select
                id="userRole"
                value={payoutForm.userRole}
                onChange={e => setPayoutForm(f => ({ ...f, userRole: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">اختر الدور</option>
                <option value="beneficiary">مستفيد</option>
                <option value="mentor">مرشد</option>
                <option value="coach">مدرب</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="grossAmount">الإجمالي</Label>
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
                <Label htmlFor="commissionAmount">العمولة</Label>
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
                <Label htmlFor="amount">الصافي</Label>
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
              <Label htmlFor="transferReference">مرجع التحويل البنكي</Label>
              <Input
                id="transferReference"
                value={payoutForm.transferReference}
                onChange={e => setPayoutForm(f => ({ ...f, transferReference: e.target.value }))}
                placeholder="REF-..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={payoutForm.notes}
                onChange={e => setPayoutForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات اختيارية..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>إلغاء</Button>
            <Button onClick={submitPayout} disabled={submittingPayout}>
              {submittingPayout ? "جاري الحفظ..." : "تسجيل التحويل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
