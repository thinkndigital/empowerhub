"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, BookOpen, Users, Copy, Key, Loader2, CreditCard, CheckCircle2, ArrowUpCircle } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";

interface SubscriptionPlan {
  id: string;
  key: string;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

interface SubscriptionInfo {
  orgId: string;
  isFree: boolean;
  currentPlan: SubscriptionPlan | null;
  status: string | null;
  billingCycle: string;
  startDate?: string;
  endDate?: string;
  daysLeft: number | null;
  permanentFree: boolean;
  upgradablePlans: SubscriptionPlan[];
}

const SUB_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trial: { label: "تجريبية", variant: "secondary" },
  active: { label: "نشط", variant: "default" },
  expired: { label: "منتهي", variant: "destructive" },
  pending: { label: "بانتظار الدفع", variant: "outline" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

const settingsSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  logo: z.any(),
  courseSessionPrice: z.coerce.number().min(0, { message: "يجب أن يكون السعر 0 أو أكثر." }),
  mentorshipSessionPrice: z.coerce.number().min(0, { message: "يجب أن يكون السعر 0 أو أكثر." }),
  orgCommissionPercent: z.coerce.number().min(0, { message: "يجب أن تكون النسبة 0 أو أكثر." }).max(100, { message: "لا يمكن أن تتجاوز النسبة 100%." }),
});

export default function OrgSettingsPage() {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "EmpowerHub",
      courseSessionPrice: 50,
      mentorshipSessionPrice: 30,
      orgCommissionPercent: 0,
    },
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const json = await res.json();
      const data = json.org;
      if (!data) return;
      if (data.name) form.setValue('name', data.name);
      if (data.logoUrl) setLogoPreview(data.logoUrl);
      if (data.courseSessionPrice != null) form.setValue('courseSessionPrice', data.courseSessionPrice);
      if (data.mentorshipSessionPrice != null) form.setValue('mentorshipSessionPrice', data.mentorshipSessionPrice);
      if (data.orgCommissionPercent != null) form.setValue('orgCommissionPercent', data.orgCommissionPercent);
      if (data.inviteCode) setInviteCode(data.inviteCode);
    } catch {
      // Fallback to localStorage
      const savedName = localStorage.getItem('orgName');
      const savedLogo = localStorage.getItem('orgLogo');
      if (savedName) form.setValue('name', savedName);
      if (savedLogo) setLogoPreview(savedLogo);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(token => {
      fetch('/api/org/subscription', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (!d.error) setSubscription(d); })
        .catch(() => {});
    });
  }, [user]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "خطأ", description: "لم يتم تحديد الحساب." });
      return;
    }

    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const updateData: Record<string, any> = {
        name: values.name,
        courseSessionPrice: values.courseSessionPrice,
        mentorshipSessionPrice: values.mentorshipSessionPrice,
      };

      if (values.logo && values.logo.length > 0) {
        const file = values.logo[0] as File;
        const logoUrl = await uploadToStorage(file, 'org-logos', token);
        updateData.logoUrl = logoUrl;
        setLogoPreview(logoUrl);
        localStorage.removeItem('orgLogo');
      }

      const res = await fetch('/api/org/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      // Also save to localStorage as cache
      localStorage.setItem('orgName', values.name);

      window.dispatchEvent(new Event('org-settings-change'));

      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث الإعدادات وستنعكس على جميع الأقسام.",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الحفظ", description: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      form.setValue('logo', files);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-sm text-muted-foreground">إدارة التفاصيل والمظهر وإعدادات الحساب.</p>
      </div>

      {subscription && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              الاشتراك
            </CardTitle>
            <CardDescription>خطة اشتراكك الحالية وتفاصيلها.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={subscription.isFree ? "secondary" : "default"} className="text-sm">
                  {subscription.isFree ? "خطة مجانية" : subscription.currentPlan?.name || "خطة مدفوعة"}
                </Badge>
                {subscription.permanentFree ? (
                  <Badge variant="secondary">منظمة مجانية دائمًا</Badge>
                ) : (
                  subscription.status && SUB_STATUS_LABELS[subscription.status] && (
                    <Badge variant={SUB_STATUS_LABELS[subscription.status].variant}>
                      {SUB_STATUS_LABELS[subscription.status].label}
                    </Badge>
                  )
                )}
                {!subscription.isFree && (
                  <Badge variant="outline">{subscription.billingCycle === "annual" ? "سنوي" : "شهري"}</Badge>
                )}
                {(subscription.status === "expired" || subscription.status === "pending") && !subscription.permanentFree && (
                  <Button asChild size="sm" className="mr-auto">
                    <Link href={`/payment?plan=${subscription.currentPlan?.key || ""}&orgId=${subscription.orgId}&cycle=${subscription.billingCycle}`}>
                      {subscription.status === "pending" ? "إتمام الدفع الآن" : "تجديد الاشتراك الآن"}
                    </Link>
                  </Button>
                )}
              </div>

              {subscription.permanentFree ? (
                <p className="text-sm text-muted-foreground">منح المشرف العام منظمتك وصولاً مجانيًا دائمًا — لا حاجة للدفع.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">تاريخ البدء</p>
                    <p className="font-medium">{formatDate(subscription.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {subscription.status === "trial" ? "نهاية الفترة التجريبية" : "تاريخ الانتهاء"}
                    </p>
                    <p className="font-medium">{formatDate(subscription.endDate)}</p>
                  </div>
                  {subscription.daysLeft != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">الأيام المتبقية</p>
                      <p className={`font-medium ${subscription.daysLeft <= 7 ? "text-destructive" : ""}`}>
                        {subscription.daysLeft > 0 ? `${subscription.daysLeft} يوم` : "منتهية"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {subscription.upgradablePlans.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  ترقية الخطة لفتح مزايا إضافية
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subscription.upgradablePlans.map((plan) => (
                    <div key={plan.id} className="rounded-lg border p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="text-primary font-bold">
                          {plan.priceMonthly.toLocaleString()} {plan.currency}/شهر
                        </span>
                      </div>
                      {plan.features.length > 0 && (
                        <ul className="space-y-1">
                          {plan.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/payment?plan=${plan.key}&orgId=${subscription.orgId}`}>
                          الترقية لهذه الخطة
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                تخصيص المظهر
              </CardTitle>
              <CardDescription>
                قم بتخصيص مظهر المنصة ليتناسب مع هويتك — ستنعكس التغييرات على جميع الأقسام.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المنصة</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم المنصة" {...field} />
                    </FormControl>
                    <FormDescription>
                      سيظهر هذا الاسم في رأس الشريط الجانبي لجميع الأعضاء.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الشعار</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                    </FormControl>
                    {logoPreview && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">معاينة الشعار:</p>
                        <Image src={logoPreview} alt="معاينة الشعار" width={80} height={80} className="rounded-md border p-2 mt-2 object-contain" />
                      </div>
                    )}
                    <FormDescription>
                      ارفع الشعار (يفضل أن يكون بصيغة SVG أو PNG). سيظهر في الشريط الجانبي.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>تسعير الخدمات والمحاسبة</CardTitle>
              <CardDescription>
                تحديد أسعار الساعة بالدينار الأردني (د.أ) للجلسات التي يقدمها المدربون والمرشدون، ونسبة المنظمة من هذه الجلسات — تُحتسب مستحقاتهم تلقائياً وتظهر في لوحاتهم الخاصة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="courseSessionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> سعر ساعة التدريب</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" placeholder="50" {...field} />
                    </FormControl>
                    <FormDescription>
                      المبلغ المحتسب لكل ساعة من جلسات التدريب التي يقدمها المدرب (يُحسب حسب مدة الجلسة الفعلية).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentorshipSessionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> سعر ساعة الإرشاد</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" placeholder="30" {...field} />
                    </FormControl>
                    <FormDescription>
                      المبلغ المحتسب لكل ساعة من جلسات الإرشاد التي يقدمها المرشد (يُحسب حسب مدة الجلسة الفعلية).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orgCommissionPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> نسبة المنظمة من الجلسات (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" max="100" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      النسبة التي تخصمها المنظمة من مستحقات المدربين والمرشدين قبل صرفها — الباقي هو صافي مستحقاتهم.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div>
            <Button type="submit" disabled={isSaving}>
              <Save className="ml-2 h-4 w-4" />
              {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Invite Code */}
      {inviteCode && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary"><Key className="h-5 w-5" /> كود دعوة المرشدين والمدربين</CardTitle>
            <CardDescription>شارك هذا الكود مع المرشدين والمدربين حتى يتمكنوا من التسجيل وربط حساباتهم.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-mono font-bold tracking-widest bg-card border rounded-lg px-6 py-3">{inviteCode}</div>
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(inviteCode); toast({ title: "تم النسخ!", description: "تم نسخ كود الدعوة." }); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
