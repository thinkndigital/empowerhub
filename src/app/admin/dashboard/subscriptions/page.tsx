"use client";

import { useEffect, useState } from "react";
import { CreditCard, Calendar, CheckCircle, XCircle, Clock, Pencil, Trash2 } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrgSub {
  org: { id: string; name: string; plan: string };
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: string;
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
    billingCycle: string;
    price: number;
    currency: string;
    notes?: string;
  } | null;
}

interface Plan { id: string; name: string; key: string; priceMonthly: number; priceAnnual: number; currency: string; }

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'نشط', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: CheckCircle },
  expired: { label: 'منتهي', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
  trial: { label: 'تجريبي', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: Clock },
  cancelled: { label: 'ملغي', color: 'text-muted-foreground bg-muted-foreground/20 border-muted-foreground/30', icon: XCircle },
  pending: { label: 'معلق', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: Clock },
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysLeft(endDate?: string) {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<OrgSub[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<OrgSub | null>(null);
  const [cancelItem, setCancelItem] = useState<OrgSub | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    planId: '', status: 'active', billingCycle: 'monthly',
    startDate: '', endDate: '', price: 0, currency: 'JOD', notes: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin-panel/subscriptions').then(r => r.json()),
      fetch('/api/admin-panel/plans').then(r => r.json()),
    ]).then(([subData, planData]) => {
      setData(subData.subscriptions || []);
      setPlans(planData.plans || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item: OrgSub) => {
    setEditItem(item);
    const sub = item.subscription;
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    setForm({
      planId: sub?.planId || '',
      status: sub?.status || 'active',
      billingCycle: sub?.billingCycle || 'monthly',
      startDate: sub?.startDate?.split('T')[0] || today,
      endDate: sub?.endDate?.split('T')[0] || nextYear,
      price: sub?.price || 0,
      currency: sub?.currency || 'JOD',
      notes: sub?.notes || '',
    });
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setForm(f => ({
        ...f, planId,
        price: f.billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly,
        currency: plan.currency || 'JOD',
      }));
    }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    const plan = plans.find(p => p.id === form.planId);
    await fetch(`/api/admin-panel/subscriptions/${editItem.org.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, planName: plan?.name || '' }),
    });
    setSaving(false);
    setEditItem(null);
    load();
  };

  const handleCancel = async () => {
    if (!cancelItem) return;
    await fetch(`/api/admin-panel/subscriptions/${cancelItem.org.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setCancelItem(null);
    load();
  };

  const stats = {
    total: data.length,
    active: data.filter(d => d.subscription?.status === 'active').length,
    expired: data.filter(d => d.subscription?.status === 'expired').length,
    noSub: data.filter(d => !d.subscription).length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الاشتراكات</h1>
          <p className="text-muted-foreground text-sm">إدارة اشتراكات المنظمات وتتبع حالتها</p>
        </div>
        <ExportButton
          title="اشتراكات المنظمات"
          filename={`subscriptions-${new Date().toISOString().slice(0,10)}`}
          headers={['المنظمة', 'الخطة', 'الحالة', 'دورة الفوترة', 'السعر', 'العملة', 'تاريخ البداية', 'تاريخ الانتهاء']}
          rows={data.map(d => [
            d.org.name || '',
            d.subscription?.planName || '—',
            statusConfig[d.subscription?.status || '']?.label || d.subscription?.status || 'بدون اشتراك',
            d.subscription?.billingCycle === 'annual' ? 'سنوي' : d.subscription?.billingCycle === 'monthly' ? 'شهري' : '—',
            d.subscription?.price ?? '—',
            d.subscription?.currency || '—',
            d.subscription?.startDate ? formatDate(d.subscription.startDate) : '—',
            d.subscription?.endDate ? formatDate(d.subscription.endDate) : '—',
          ])}
          options={{ summary: { 'إجمالي المنظمات': String(stats.total), 'نشطة': String(stats.active), 'منتهية': String(stats.expired), 'بدون اشتراك': String(stats.noSub) } }}
          variant="outline"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المنظمات', value: stats.total, color: 'text-foreground', bg: 'bg-muted/40' },
          { label: 'اشتراكات نشطة', value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'منتهية الصلاحية', value: stats.expired, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'بدون اشتراك', value: stats.noSub, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-border`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">جاري التحميل...</p>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">المنظمة</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden sm:table-cell">الخطة</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">الحالة</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden md:table-cell">تاريخ الانتهاء</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden lg:table-cell">السعر</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => {
                    const sub = item.subscription;
                    const statusInfo = statusConfig[sub?.status || 'pending'] || statusConfig.pending;
                    const StatusIcon = statusInfo.icon;
                    const days = daysLeft(sub?.endDate);

                    return (
                      <tr key={item.org.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                              {item.org.name?.[0] || '?'}
                            </div>
                            <span className="text-foreground text-sm font-medium">{item.org.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-foreground/90 text-sm">{sub?.planName || item.org.plan || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {sub ? (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div>
                            <span className="text-foreground/90 text-sm">{formatDate(sub?.endDate)}</span>
                            {days !== null && days >= 0 && days <= 30 && (
                              <p className={`text-xs mt-0.5 ${days <= 7 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {days === 0 ? 'ينتهي اليوم' : `${days} يوم`}
                              </p>
                            )}
                            {days !== null && days < 0 && <p className="text-xs text-red-400 mt-0.5">انتهى منذ {Math.abs(days)} يوم</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {sub?.price ? (
                            <span className="text-foreground text-sm font-medium">{sub.price.toLocaleString()} {sub.currency}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs gap-1">
                              <Pencil className="h-3 w-3" />
                              <span className="hidden sm:inline">تعديل</span>
                            </Button>
                            {sub && sub.status === 'active' && (
                              <Button size="sm" variant="ghost" onClick={() => setCancelItem(item)} className="h-8 px-2 text-red-400 hover:text-red-300 text-xs">
                                إلغاء
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={o => !o && setEditItem(null)}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>اشتراك: {editItem?.org.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan */}
            <div className="space-y-2">
              <Label>الخطة</Label>
              <Select value={form.planId} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue placeholder="اختر الخطة..." /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.priceMonthly} {p.currency}/شهر
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status & Billing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="trial">تجريبي</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>دورة الفوترة</Label>
                <Select value={form.billingCycle} onValueChange={v => {
                  const plan = plans.find(p => p.id === form.planId);
                  setForm(f => ({
                    ...f, billingCycle: v,
                    price: plan ? (v === 'annual' ? plan.priceAnnual : plan.priceMonthly) : f.price,
                  }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="annual">سنوي</SelectItem>
                    <SelectItem value="lifetime">مدى الحياة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} dir="ltr" />
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>السعر الفعلي</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} dir="ltr" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الاشتراك'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <AlertDialog open={!!cancelItem} onOpenChange={o => !o && setCancelItem(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الاشتراك</AlertDialogTitle>
            <AlertDialogDescription>هل تريد إلغاء اشتراك "{cancelItem?.org.name}"؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">إلغاء الاشتراك</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
