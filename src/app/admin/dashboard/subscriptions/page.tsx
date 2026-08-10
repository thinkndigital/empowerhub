"use client";

import { useEffect, useState } from "react";
import { CreditCard, Calendar, CheckCircle, XCircle, Clock, Pencil, Trash2 } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { useLanguage } from "@/components/language-provider";

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
    permanentFree?: boolean;
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

const statusConfigEn: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: CheckCircle },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
  trial: { label: 'Trial', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground bg-muted-foreground/20 border-muted-foreground/30', icon: XCircle },
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: Clock },
};

function formatDate(d?: string, locale: string = 'ar-EG') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const tStatus = lang === 'en' ? statusConfigEn : statusConfig;
  const [editItem, setEditItem] = useState<OrgSub | null>(null);
  const [cancelItem, setCancelItem] = useState<OrgSub | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    planId: '', status: 'active', billingCycle: 'monthly',
    startDate: '', endDate: '', price: 0, currency: 'JOD', notes: '', permanentFree: false,
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
      permanentFree: sub?.permanentFree || false,
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
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bi('الاشتراكات', 'Subscriptions')}</h1>
          <p className="text-muted-foreground text-sm">{bi('إدارة اشتراكات المنظمات وتتبع حالتها', 'Manage organization subscriptions and track their status')}</p>
        </div>
        <ExportButton
          title={bi('اشتراكات المنظمات', 'Organization Subscriptions')}
          filename={`subscriptions-${new Date().toISOString().slice(0,10)}`}
          headers={lang === 'en'
            ? ['Organization', 'Plan', 'Status', 'Billing Cycle', 'Price', 'Currency', 'Start Date', 'End Date']
            : ['المنظمة', 'الخطة', 'الحالة', 'دورة الفوترة', 'السعر', 'العملة', 'تاريخ البداية', 'تاريخ الانتهاء']}
          rows={data.map(d => [
            d.org.name || '',
            d.subscription?.planName || '—',
            tStatus[d.subscription?.status || '']?.label || d.subscription?.status || bi('بدون اشتراك', 'No subscription'),
            d.subscription?.billingCycle === 'annual' ? bi('سنوي', 'Annual') : d.subscription?.billingCycle === 'monthly' ? bi('شهري', 'Monthly') : '—',
            d.subscription?.price ?? '—',
            d.subscription?.currency || '—',
            d.subscription?.startDate ? formatDate(d.subscription.startDate, locale) : '—',
            d.subscription?.endDate ? formatDate(d.subscription.endDate, locale) : '—',
          ])}
          options={{ summary: lang === 'en'
            ? { 'Total Organizations': String(stats.total), 'Active': String(stats.active), 'Expired': String(stats.expired), 'No Subscription': String(stats.noSub) }
            : { 'إجمالي المنظمات': String(stats.total), 'نشطة': String(stats.active), 'منتهية': String(stats.expired), 'بدون اشتراك': String(stats.noSub) } }}
          variant="outline"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: bi('إجمالي المنظمات', 'Total Organizations'), value: stats.total, color: 'text-foreground', bg: 'bg-muted/40' },
          { label: bi('اشتراكات نشطة', 'Active Subscriptions'), value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: bi('منتهية الصلاحية', 'Expired'), value: stats.expired, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: bi('بدون اشتراك', 'No Subscription'), value: stats.noSub, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
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
        <p className="text-muted-foreground text-center py-12">{bi('جاري التحميل...', 'Loading...')}</p>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('المنظمة', 'Organization')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden sm:table-cell">{bi('الخطة', 'Plan')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('الحالة', 'Status')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden md:table-cell">{bi('تاريخ الانتهاء', 'End Date')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden lg:table-cell">{bi('السعر', 'Price')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('إجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => {
                    const sub = item.subscription;
                    const statusInfo = tStatus[sub?.status || 'pending'] || tStatus.pending;
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
                            <span className="text-foreground/90 text-sm">{formatDate(sub?.endDate, locale)}</span>
                            {days !== null && days >= 0 && days <= 30 && (
                              <p className={`text-xs mt-0.5 ${days <= 7 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {days === 0 ? bi('ينتهي اليوم', 'Expires today') : bi(`${days} يوم`, `${days} days`)}
                              </p>
                            )}
                            {days !== null && days < 0 && <p className="text-xs text-red-400 mt-0.5">{bi(`انتهى منذ ${Math.abs(days)} يوم`, `Expired ${Math.abs(days)} days ago`)}</p>}
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
                              <span className="hidden sm:inline">{bi('تعديل', 'Edit')}</span>
                            </Button>
                            {sub && sub.status === 'active' && (
                              <Button size="sm" variant="ghost" onClick={() => setCancelItem(item)} className="h-8 px-2 text-red-400 hover:text-red-300 text-xs">
                                {bi('إلغاء', 'Cancel')}
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
        <DialogContent dir={dir} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{bi('اشتراك:', 'Subscription:')} {editItem?.org.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan */}
            <div className="space-y-2">
              <Label>{bi('الخطة', 'Plan')}</Label>
              <Select value={form.planId} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue placeholder={bi('اختر الخطة...', 'Choose plan...')} /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.priceMonthly} {p.currency}{bi('/شهر', '/mo')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status & Billing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{bi('الحالة', 'Status')}</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{bi('نشط', 'Active')}</SelectItem>
                    <SelectItem value="trial">{bi('تجريبي', 'Trial')}</SelectItem>
                    <SelectItem value="expired">{bi('منتهي', 'Expired')}</SelectItem>
                    <SelectItem value="cancelled">{bi('ملغي', 'Cancelled')}</SelectItem>
                    <SelectItem value="pending">{bi('معلق', 'Pending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{bi('دورة الفوترة', 'Billing Cycle')}</Label>
                <Select value={form.billingCycle} onValueChange={v => {
                  const plan = plans.find(p => p.id === form.planId);
                  setForm(f => ({
                    ...f, billingCycle: v,
                    price: plan ? (v === 'annual' ? plan.priceAnnual : plan.priceMonthly) : f.price,
                  }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{bi('شهري', 'Monthly')}</SelectItem>
                    <SelectItem value="annual">{bi('سنوي', 'Annual')}</SelectItem>
                    <SelectItem value="lifetime">{bi('مدى الحياة', 'Lifetime')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{bi('تاريخ البدء', 'Start Date')}</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{bi('تاريخ الانتهاء', 'End Date')}</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} dir="ltr" />
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>{bi('السعر الفعلي', 'Actual Price')}</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{bi('العملة', 'Currency')}</Label>
                <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} dir="ltr" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{bi('ملاحظات', 'Notes')}</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={bi('ملاحظات إضافية...', 'Additional notes...')} />
            </div>

            {/* Permanent free access */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{bi('منح اشتراك مجاني دائم', 'Grant permanent free access')}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bi('تتجاهل هذه المنظمة انتهاء الفترة التجريبية أو الاشتراك ولا تُقفل أبدًا.', 'This organization ignores trial/subscription expiry and is never locked.')}
                </p>
              </div>
              <Switch checked={form.permanentFree} onCheckedChange={v => setForm(f => ({ ...f, permanentFree: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ الاشتراك', 'Save subscription')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <AlertDialog open={!!cancelItem} onOpenChange={o => !o && setCancelItem(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi('إلغاء الاشتراك', 'Cancel Subscription')}</AlertDialogTitle>
            <AlertDialogDescription>{bi(`هل تريد إلغاء اشتراك "${cancelItem?.org.name}"؟`, `Do you want to cancel "${cancelItem?.org.name}"'s subscription?`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi('تراجع', 'Back')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">{bi('إلغاء الاشتراك', 'Cancel Subscription')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
