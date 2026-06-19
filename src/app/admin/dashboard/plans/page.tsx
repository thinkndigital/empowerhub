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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  priceMonthly: 0, priceAnnual: 0, currency: 'SAR',
  color: '#6366f1', icon: 'Star', highlighted: false,
  features: [], featuresText: '',
  limits: { maxUsers: 50, maxMentors: 5, maxCourses: 10, maxProducts: 20, maxStorage: 5 },
};

const iconOptions = ['Star', 'Zap', 'Building2', 'Crown'];
const iconMap: Record<string, any> = { Star, Zap, Building2, Crown };

const planColors = [
  { label: 'أزرق', value: '#3b82f6' },
  { label: 'بنفسجي', value: '#8b5cf6' },
  { label: 'ذهبي', value: '#f59e0b' },
  { label: 'أخضر', value: '#10b981' },
  { label: 'وردي', value: '#ec4899' },
  { label: 'رمادي', value: '#6b7280' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin-panel/plans').then(r => r.json()).then(d => {
      setPlans(d.plans || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

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
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">خطط الاشتراك</h1>
          <p className="text-slate-400 text-sm">إدارة خطط التسعير والميزات لكل خطة</p>
        </div>
        <Button onClick={openAdd} className="bg-primary gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          إضافة خطة جديدة
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-16">جاري التحميل...</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-slate-500">لا توجد خطط. أضف خطتك الأولى!</p>
          <Button onClick={openAdd} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة خطة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map(plan => {
            const PlanIcon = iconMap[plan.icon] || Star;
            return (
              <Card
                key={plan.id}
                className={`relative bg-slate-800/60 border transition-all ${plan.highlighted ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10 hover:border-white/20'}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">الأكثر شعبية</span>
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
                        <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                        {plan.nameEn && <p className="text-slate-500 text-xs">{plan.nameEn}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeletePlan(plan)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{plan.priceMonthly.toLocaleString()}</span>
                      <span className="text-slate-400 text-sm">{plan.currency}/شهر</span>
                    </div>
                    {plan.priceAnnual > 0 && (
                      <p className="text-slate-500 text-xs mt-1">
                        أو {plan.priceAnnual.toLocaleString()} {plan.currency}/سنة
                        {' '}
                        <span className="text-emerald-400">
                          (وفر {Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)}%)
                        </span>
                      </p>
                    )}
                    {plan.priceMonthly === 0 && <p className="text-emerald-400 text-sm font-medium mt-1">مجاني</p>}
                  </div>

                  {/* Description */}
                  {plan.description && <p className="text-slate-400 text-sm mb-4">{plan.description}</p>}

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-700/30 rounded-xl">
                    {[
                      { label: 'مستخدم', val: plan.limits?.maxUsers },
                      { label: 'مرشد', val: plan.limits?.maxMentors },
                      { label: 'دورة', val: plan.limits?.maxCourses },
                      { label: 'GB تخزين', val: plan.limits?.maxStorage },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <p className="text-white font-bold text-sm">{item.val === -1 ? '∞' : item.val}</p>
                        <p className="text-slate-500 text-xs">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {(plan.features || []).slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.color }} />
                        {f}
                      </li>
                    ))}
                    {(plan.features || []).length > 4 && (
                      <li className="text-slate-500 text-xs pr-5">+{plan.features.length - 4} ميزات أخرى</li>
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
        <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? `تعديل: ${editPlan.name}` : 'إضافة خطة جديدة'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>اسم الخطة (عربي)</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: الخطة الاحترافية" />
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي)</Label>
              <Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="Pro Plan" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>المفتاح (key)</Label>
              <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="pro" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>العملة</Label>
              <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="SAR" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>السعر الشهري</Label>
              <Input type="number" value={form.priceMonthly} onChange={e => setForm(f => ({ ...f, priceMonthly: +e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>السعر السنوي</Label>
              <Input type="number" value={form.priceAnnual} onChange={e => setForm(f => ({ ...f, priceAnnual: +e.target.value }))} />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>اللون</Label>
              <div className="flex gap-2 flex-wrap">
                {planColors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`h-8 w-8 rounded-lg border-2 transition-all ${form.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-8 w-8 rounded-lg cursor-pointer border-0" />
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>الأيقونة</Label>
              <div className="flex gap-2">
                {iconOptions.map(ic => {
                  const Ic = iconMap[ic];
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${form.icon === ic ? 'border-primary bg-primary/20' : 'border-white/20 hover:border-white/40'}`}
                    >
                      <Ic className="h-5 w-5 text-white" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Highlighted */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-white/10">
              <div>
                <p className="text-white text-sm font-medium">خطة مميزة</p>
                <p className="text-slate-400 text-xs">يظهر عليها "الأكثر شعبية"</p>
              </div>
              <Switch checked={form.highlighted} onCheckedChange={v => setForm(f => ({ ...f, highlighted: v }))} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="وصف مختصر للخطة..." className="resize-none" />
            </div>

            {/* Features */}
            <div className="sm:col-span-2 space-y-2">
              <Label>الميزات (سطر لكل ميزة)</Label>
              <Textarea
                value={form.featuresText}
                onChange={e => setForm(f => ({ ...f, featuresText: e.target.value }))}
                rows={5}
                placeholder="وصول كامل لجميع الدورات&#10;دعم فني 24/7&#10;تقارير تفصيلية&#10;..."
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* Limits */}
            <div className="sm:col-span-2 space-y-3">
              <Label>الحدود والقيود (-1 = غير محدود)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { key: 'maxUsers' as const, label: 'مستخدمون' },
                  { key: 'maxMentors' as const, label: 'مرشدون' },
                  { key: 'maxCourses' as const, label: 'دورات' },
                  { key: 'maxProducts' as const, label: 'منتجات' },
                  { key: 'maxStorage' as const, label: 'تخزين (GB)' },
                ].map(item => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-xs text-slate-400">{item.label}</Label>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={!form.name || saving} className="gap-2">
              {saving ? 'جاري الحفظ...' : editPlan ? 'حفظ التغييرات' : 'إضافة الخطة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deletePlan} onOpenChange={o => !o && setDeletePlan(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الخطة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف خطة "{deletePlan?.name}"؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
