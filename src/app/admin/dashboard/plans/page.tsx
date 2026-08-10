"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, Star, Zap, Building2, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/components/language-provider";

interface Plan {
  id: string;
  name: string;
  nameEn: string;
  key: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  color: string;
  icon: string;
  highlighted: boolean;
  features: string[];
  limits: {
    maxUsers: number;
    maxMentors: number;
    maxCourses: number;
    maxProducts: number;
    maxStorage: number;
  };
}

type PlanForm = Omit<Plan, 'id'> & { featuresText: string };

const emptyForm: PlanForm = {
  name: '', nameEn: '', key: '', description: '',
  priceMonthly: 0, priceAnnual: 0, currency: 'JOD',
  color: '#6366f1', icon: 'Star', highlighted: false,
  features: [], featuresText: '',
  limits: { maxUsers: 50, maxMentors: 5, maxCourses: 10, maxProducts: 20, maxStorage: 5 },
};

const iconOptions = ['Star', 'Zap', 'Building2', 'Crown'];
const iconMap: Record<string, any> = { Star, Zap, Building2, Crown };

const planColors = [
  { label: 'أزرق', labelEn: 'Blue', value: '#3b82f6' },
  { label: 'بنفسجي', labelEn: 'Purple', value: '#8b5cf6' },
  { label: 'ذهبي', labelEn: 'Gold', value: '#f59e0b' },
  { label: 'أخضر', labelEn: 'Green', value: '#10b981' },
  { label: 'وردي', labelEn: 'Pink', value: '#ec4899' },
  { label: 'رمادي', labelEn: 'Gray', value: '#6b7280' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [trialDays, setTrialDays] = useState('30');
  const [savingTrial, setSavingTrial] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin-panel/plans').then(r => r.json()).then(d => {
      setPlans(d.plans || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    fetch('/api/admin-panel/trial-config').then(r => r.json()).then(d => {
      if (d.days) setTrialDays(String(d.days));
    });
  }, []);

  const handleSaveTrial = async (value: string) => {
    setTrialDays(value);
    setSavingTrial(true);
    await fetch('/api/admin-panel/trial-config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ days: Number(value) }),
    });
    setSavingTrial(false);
  };

  const openAdd = () => {
    setEditPlan(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({
      ...plan,
      featuresText: (plan.features || []).join('\n'),
      limits: { ...emptyForm.limits, ...plan.limits },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const features = form.featuresText.split('\n').map(s => s.trim()).filter(Boolean);
    const payload = { ...form, features };
    delete (payload as any).featuresText;

    if (editPlan) {
      await fetch(`/api/admin-panel/plans/${editPlan.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin-panel/plans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    await fetch(`/api/admin-panel/plans/${deletePlan.id}`, { method: 'DELETE' });
    setDeletePlan(null);
    load();
  };

  const setLimit = (key: keyof Plan['limits'], val: number) =>
    setForm(f => ({ ...f, limits: { ...f.limits, [key]: val } }));

  const IconComp = iconMap[form.icon] || Star;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bi('خطط الاشتراك', 'Subscription Plans')}</h1>
          <p className="text-muted-foreground text-sm">{bi('إدارة خطط التسعير والميزات لكل خطة', 'Manage pricing plans and features for each plan')}</p>
        </div>
        <Button onClick={openAdd} className="bg-primary gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {bi('إضافة خطة جديدة', 'Add new plan')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{bi('الفترة التجريبية المجانية', 'Free Trial Period')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Label className="shrink-0">{bi('مدة التجربة لكل منظمة جديدة تختار خطة مجانية', 'Trial duration for each new organization choosing a free plan')}</Label>
          <Select value={trialDays} onValueChange={handleSaveTrial} disabled={savingTrial}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{bi('7 أيام', '7 days')}</SelectItem>
              <SelectItem value="14">{bi('14 يوماً', '14 days')}</SelectItem>
              <SelectItem value="30">{bi('30 يوماً (شهر)', '30 days (1 month)')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-center py-16">{bi('جاري التحميل...', 'Loading...')}</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">{bi('لا توجد خطط. أضف خطتك الأولى!', 'No plans. Add your first plan!')}</p>
          <Button onClick={openAdd} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {bi('إضافة خطة', 'Add plan')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map(plan => {
            const PlanIcon = iconMap[plan.icon] || Star;
            return (
              <Card
                key={plan.id}
                className={`relative bg-muted/70 border transition-all ${plan.highlighted ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-border'}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">{bi('الأكثر شعبية', 'Most Popular')}</span>
                  </div>
                )}
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: `${plan.color}25` }}>
                        <PlanIcon className="h-6 w-6" style={{ color: plan.color }} />
                      </div>
                      <div>
                        <h3 className="text-foreground font-bold text-lg">{plan.name}</h3>
                        {plan.nameEn && <p className="text-muted-foreground text-xs">{plan.nameEn}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeletePlan(plan)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{plan.priceMonthly.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm">{plan.currency}{bi('/شهر', '/mo')}</span>
                    </div>
                    {plan.priceAnnual > 0 && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {bi('أو', 'or')} {plan.priceAnnual.toLocaleString()} {plan.currency}{bi('/سنة', '/yr')}
                        {' '}
                        <span className="text-emerald-400">
                          ({bi('وفر', 'save')} {Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)}%)
                        </span>
                      </p>
                    )}
                    {plan.priceMonthly === 0 && <p className="text-emerald-400 text-sm font-medium mt-1">{bi('مجاني', 'Free')}</p>}
                  </div>

                  {/* Description */}
                  {plan.description && <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>}

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/40 rounded-xl">
                    {[
                      { label: bi('مستخدم', 'Users'), val: plan.limits?.maxUsers },
                      { label: bi('مرشد', 'Mentors'), val: plan.limits?.maxMentors },
                      { label: bi('دورة', 'Courses'), val: plan.limits?.maxCourses },
                      { label: bi('GB تخزين', 'GB Storage'), val: plan.limits?.maxStorage },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <p className="text-foreground font-bold text-sm">{item.val === -1 ? '∞' : item.val}</p>
                        <p className="text-muted-foreground text-xs">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {(plan.features || []).slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-foreground/90 text-sm">
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.color }} />
                        {f}
                      </li>
                    ))}
                    {(plan.features || []).length > 4 && (
                      <li className="text-muted-foreground text-xs pr-5">{bi(`+${plan.features.length - 4} ميزات أخرى`, `+${plan.features.length - 4} more features`)}</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => !open && setDialogOpen(false)}>
        <DialogContent dir={dir} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? bi(`تعديل: ${editPlan.name}`, `Edit: ${editPlan.name}`) : bi('إضافة خطة جديدة', 'Add New Plan')}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>{bi('اسم الخطة (عربي)', 'Plan name (Arabic)')}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={bi('مثال: الخطة الاحترافية', 'e.g. Pro Plan')} />
            </div>
            <div className="space-y-2">
              <Label>{bi('الاسم (إنجليزي)', 'Name (English)')}</Label>
              <Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="Pro Plan" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{bi('المفتاح (key)', 'Key')}</Label>
              <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="pro" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{bi('العملة', 'Currency')}</Label>
              <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="JOD" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{bi('السعر الشهري', 'Monthly price')}</Label>
              <Input type="number" value={form.priceMonthly} onChange={e => setForm(f => ({ ...f, priceMonthly: +e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{bi('السعر السنوي', 'Annual price')}</Label>
              <Input type="number" value={form.priceAnnual} onChange={e => setForm(f => ({ ...f, priceAnnual: +e.target.value }))} />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>{bi('اللون', 'Color')}</Label>
              <div className="flex gap-2 flex-wrap">
                {planColors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`h-8 w-8 rounded-lg border-2 transition-all ${form.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                    title={bi(c.label, c.labelEn)}
                  />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-8 w-8 rounded-lg cursor-pointer border-0" />
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>{bi('الأيقونة', 'Icon')}</Label>
              <div className="flex gap-2">
                {iconOptions.map(ic => {
                  const Ic = iconMap[ic];
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${form.icon === ic ? 'border-primary bg-primary/20' : 'border-border hover:border-border'}`}
                    >
                      <Ic className="h-5 w-5 text-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Highlighted */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
              <div>
                <p className="text-foreground text-sm font-medium">{bi('خطة مميزة', 'Highlighted plan')}</p>
                <p className="text-muted-foreground text-xs">{bi('يظهر عليها "الأكثر شعبية"', 'Shows "Most Popular" on it')}</p>
              </div>
              <Switch checked={form.highlighted} onCheckedChange={v => setForm(f => ({ ...f, highlighted: v }))} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-2">
              <Label>{bi('الوصف', 'Description')}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={bi('وصف مختصر للخطة...', 'A brief description of the plan...')} className="resize-none" />
            </div>

            {/* Features */}
            <div className="sm:col-span-2 space-y-2">
              <Label>{bi('الميزات (سطر لكل ميزة)', 'Features (one per line)')}</Label>
              <Textarea
                value={form.featuresText}
                onChange={e => setForm(f => ({ ...f, featuresText: e.target.value }))}
                rows={5}
                placeholder={bi('وصول كامل لجميع الدورات\nدعم فني 24/7\nتقارير تفصيلية\n...', 'Full access to all courses\n24/7 support\nDetailed reports\n...')}
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* Limits */}
            <div className="sm:col-span-2 space-y-3">
              <Label>{bi('الحدود والقيود (-1 = غير محدود)', 'Limits (-1 = unlimited)')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { key: 'maxUsers' as const, label: bi('مستخدمون', 'Users') },
                  { key: 'maxMentors' as const, label: bi('مرشدون', 'Mentors') },
                  { key: 'maxCourses' as const, label: bi('دورات', 'Courses') },
                  { key: 'maxProducts' as const, label: bi('منتجات', 'Products') },
                  { key: 'maxStorage' as const, label: bi('تخزين (GB)', 'Storage (GB)') },
                ].map(item => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{item.label}</Label>
                    <Input
                      type="number"
                      value={form.limits[item.key]}
                      onChange={e => setLimit(item.key, +e.target.value)}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name || saving} className="gap-2">
              {saving ? bi('جاري الحفظ...', 'Saving...') : editPlan ? bi('حفظ التغييرات', 'Save changes') : bi('إضافة الخطة', 'Add plan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deletePlan} onOpenChange={o => !o && setDeletePlan(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi('حذف الخطة', 'Delete Plan')}</AlertDialogTitle>
            <AlertDialogDescription>{bi(`هل أنت متأكد من حذف خطة "${deletePlan?.name}"؟`, `Are you sure you want to delete the "${deletePlan?.name}" plan?`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{bi('حذف', 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
