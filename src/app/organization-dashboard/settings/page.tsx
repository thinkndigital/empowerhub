"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, BookOpen, Users, Copy, Key, Loader2, CreditCard, CheckCircle2, ArrowUpCircle, Mail } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { useLanguage } from "@/components/language-provider";

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

const SUB_STATUS_LABELS_EN: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trial: { label: "Trial", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
  pending: { label: "Awaiting payment", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function formatDate(d?: string, locale: string = "ar-EG") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

const settingsSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  logo: z.any(),
  courseSessionPrice: z.coerce.number().min(0, { message: "يجب أن يكون السعر 0 أو أكثر." }),
  mentorshipSessionPrice: z.coerce.number().min(0, { message: "يجب أن يكون السعر 0 أو أكثر." }),
  orgCommissionPercent: z.coerce.number().min(0, { message: "يجب أن تكون النسبة 0 أو أكثر." }).max(100, { message: "لا يمكن أن تتجاوز النسبة 100%." }),
  emailReplyTo: z.union([z.string().email({ message: "بريد إلكتروني غير صحيح." }), z.literal("")]),
  emailSenderName: z.string(),
});

const NOTIF_CATEGORIES: { key: string; label: string; description: string }[] = [
  { key: "messages", label: "الرسائل", description: "إشعار بريدي عند استلام رسالة جديدة" },
  { key: "courses", label: "الدورات", description: "إشعار بريدي عند التسجيل أو تأكيد الاشتراك في دورة" },
  { key: "sessions", label: "الجلسات", description: "إشعار بريدي عند إنشاء جلسة أو دعوة لحضورها" },
  { key: "membership", label: "العضوية والدعوات", description: "إشعار بريدي عند دعوات الانضمام وتعيين المرشد/المدرب" },
  { key: "assessments", label: "نماذج التقييم", description: "إشعار بريدي عند إرسال نموذج تقييم جديد" },
];

const NOTIF_CATEGORIES_EN: { key: string; label: string; description: string }[] = [
  { key: "messages", label: "Messages", description: "Email notification when a new message is received" },
  { key: "courses", label: "Courses", description: "Email notification on course enrollment or subscription confirmation" },
  { key: "sessions", label: "Sessions", description: "Email notification when a session is created or you're invited to attend" },
  { key: "membership", label: "Membership & invitations", description: "Email notification for join invitations and mentor/coach assignment" },
  { key: "assessments", label: "Assessment forms", description: "Email notification when a new assessment form is sent" },
];

export default function OrgSettingsPage() {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    messages: true, courses: true, sessions: true, membership: true, assessments: true,
  });
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "EmpowerHub",
      courseSessionPrice: 50,
      mentorshipSessionPrice: 30,
      orgCommissionPercent: 0,
      emailReplyTo: "",
      emailSenderName: "",
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
      if (data.emailReplyTo) form.setValue('emailReplyTo', data.emailReplyTo);
      if (data.emailSenderName) form.setValue('emailSenderName', data.emailSenderName);
      if (data.emailNotificationPrefs) setNotifPrefs(prev => ({ ...prev, ...data.emailNotificationPrefs }));
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
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("لم يتم تحديد الحساب.", "No account was identified.") });
      return;
    }

    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const updateData: Record<string, any> = {
        name: values.name,
        courseSessionPrice: values.courseSessionPrice,
        mentorshipSessionPrice: values.mentorshipSessionPrice,
        orgCommissionPercent: values.orgCommissionPercent,
        emailReplyTo: values.emailReplyTo,
        emailSenderName: values.emailSenderName,
        emailNotificationPrefs: notifPrefs,
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
        title: bi("تم حفظ الإعدادات", "Settings saved"),
        description: bi("تم تحديث الإعدادات وستنعكس على جميع الأقسام.", "Settings updated and will reflect across all sections."),
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: bi("فشل الحفظ", "Save failed"), description: err.message });
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
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("الإعدادات", "Settings")}</h1>
        <p className="text-sm text-muted-foreground">{bi("إدارة التفاصيل والمظهر وإعدادات الحساب.", "Manage details, appearance, and account settings.")}</p>
      </div>

      {subscription && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {bi("الاشتراك", "Subscription")}
            </CardTitle>
            <CardDescription>{bi("خطة اشتراكك الحالية وتفاصيلها.", "Your current subscription plan and its details.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={subscription.isFree ? "secondary" : "default"} className="text-sm">
                  {subscription.isFree ? bi("خطة مجانية", "Free plan") : subscription.currentPlan?.name || bi("خطة مدفوعة", "Paid plan")}
                </Badge>
                {subscription.permanentFree ? (
                  <Badge variant="secondary">{bi("منظمة مجانية دائمًا", "Permanently free organization")}</Badge>
                ) : (
                  subscription.status && (lang === 'en' ? SUB_STATUS_LABELS_EN : SUB_STATUS_LABELS)[subscription.status] && (
                    <Badge variant={(lang === 'en' ? SUB_STATUS_LABELS_EN : SUB_STATUS_LABELS)[subscription.status].variant}>
                      {(lang === 'en' ? SUB_STATUS_LABELS_EN : SUB_STATUS_LABELS)[subscription.status].label}
                    </Badge>
                  )
                )}
                {!subscription.isFree && (
                  <Badge variant="outline">{subscription.billingCycle === "annual" ? bi("سنوي", "Annual") : bi("شهري", "Monthly")}</Badge>
                )}
                {(subscription.status === "expired" || subscription.status === "pending") && !subscription.permanentFree && (
                  <Button asChild size="sm" className="mr-auto">
                    <Link href={`/payment?plan=${subscription.currentPlan?.key || ""}&orgId=${subscription.orgId}&cycle=${subscription.billingCycle}`}>
                      {subscription.status === "pending" ? bi("إتمام الدفع الآن", "Complete payment now") : bi("تجديد الاشتراك الآن", "Renew subscription now")}
                    </Link>
                  </Button>
                )}
              </div>

              {subscription.permanentFree ? (
                <p className="text-sm text-muted-foreground">{bi("منح المشرف العام منظمتك وصولاً مجانيًا دائمًا — لا حاجة للدفع.", "The platform admin granted your organization permanent free access — no payment needed.")}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{bi("تاريخ البدء", "Start date")}</p>
                    <p className="font-medium">{formatDate(subscription.startDate, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {subscription.status === "trial" ? bi("نهاية الفترة التجريبية", "Trial period end") : bi("تاريخ الانتهاء", "Expiration date")}
                    </p>
                    <p className="font-medium">{formatDate(subscription.endDate, locale)}</p>
                  </div>
                  {subscription.daysLeft != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">{bi("الأيام المتبقية", "Days remaining")}</p>
                      <p className={`font-medium ${subscription.daysLeft <= 7 ? "text-destructive" : ""}`}>
                        {subscription.daysLeft > 0 ? bi(`${subscription.daysLeft} يوم`, `${subscription.daysLeft} days`) : bi("منتهية", "Expired")}
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
                  {bi("ترقية الخطة لفتح مزايا إضافية", "Upgrade your plan to unlock more features")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subscription.upgradablePlans.map((plan) => (
                    <div key={plan.id} className="rounded-lg border p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="text-primary font-bold">
                          {plan.priceMonthly.toLocaleString()} {plan.currency}/{bi("شهر", "mo")}
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
                          {bi("الترقية لهذه الخطة", "Upgrade to this plan")}
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
                {bi("تخصيص المظهر", "Customize appearance")}
              </CardTitle>
              <CardDescription>
                {bi("قم بتخصيص مظهر المنصة ليتناسب مع هويتك — ستنعكس التغييرات على جميع الأقسام.", "Customize the platform's appearance to match your brand — changes reflect across all sections.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("اسم المنصة", "Platform name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={bi("اسم المنصة", "Platform name")} {...field} />
                    </FormControl>
                    <FormDescription>
                      {bi("سيظهر هذا الاسم في رأس الشريط الجانبي لجميع الأعضاء.", "This name will appear in the sidebar header for all members.")}
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
                    <FormLabel>{bi("الشعار", "Logo")}</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                    </FormControl>
                    {logoPreview && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{bi("معاينة الشعار:", "Logo preview:")}</p>
                        <Image src={logoPreview} alt={bi("معاينة الشعار", "Logo preview")} width={80} height={80} className="rounded-md border p-2 mt-2 object-contain" />
                      </div>
                    )}
                    <FormDescription>
                      {bi("ارفع الشعار (يفضل أن يكون بصيغة SVG أو PNG). سيظهر في الشريط الجانبي.", "Upload the logo (SVG or PNG preferred). It will appear in the sidebar.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>{bi("تسعير الخدمات والمحاسبة", "Service pricing & billing")}</CardTitle>
              <CardDescription>
                {bi("تحديد أسعار الساعة بالدينار الأردني (د.أ) للجلسات التي يقدمها المدربون والمرشدون، ونسبة المنظمة من هذه الجلسات — تُحتسب مستحقاتهم تلقائياً وتظهر في لوحاتهم الخاصة.", "Set hourly rates in Jordanian dinar (JOD) for sessions provided by coaches and mentors, and the organization's cut of those sessions — their earnings are calculated automatically and shown on their own dashboards.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="courseSessionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {bi("سعر ساعة التدريب", "Coaching hourly rate")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" placeholder="50" {...field} />
                    </FormControl>
                    <FormDescription>
                      {bi("المبلغ المحتسب لكل ساعة من جلسات التدريب التي يقدمها المدرب (يُحسب حسب مدة الجلسة الفعلية).", "The amount charged per hour of coaching sessions provided by the coach (calculated by the session's actual duration).")}
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
                    <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> {bi("سعر ساعة الإرشاد", "Mentoring hourly rate")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" placeholder="30" {...field} />
                    </FormControl>
                    <FormDescription>
                      {bi("المبلغ المحتسب لكل ساعة من جلسات الإرشاد التي يقدمها المرشد (يُحسب حسب مدة الجلسة الفعلية).", "The amount charged per hour of mentoring sessions provided by the mentor (calculated by the session's actual duration).")}
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
                    <FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> {bi("نسبة المنظمة من الجلسات (%)", "Organization's cut of sessions (%)")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" max="100" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      {bi("النسبة التي تخصمها المنظمة من مستحقات المدربين والمرشدين قبل صرفها — الباقي هو صافي مستحقاتهم.", "The percentage the organization deducts from coach/mentor earnings before payout — the remainder is their net earnings.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {bi("البريد الإلكتروني والإشعارات", "Email & notifications")}
              </CardTitle>
              <CardDescription>
                {bi("عند الرد على إيميلات الإشعارات الصادرة من منظمتك، سيصل الرد إلى بريدك أدناه بدل بريد المنصة. يمكنك أيضاً التحكم بأي نوع إشعارات يصل بريدياً لأعضاء منظمتك.", "When someone replies to notification emails sent from your organization, the reply will go to the email below instead of the platform's email. You can also control which notification types are sent by email to your organization's members.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="emailReplyTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("بريد الرد (Reply-To)", "Reply-to email")}</FormLabel>
                    <FormControl>
                      <Input type="email" dir="ltr" placeholder="info@yourorg.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      {bi("عندما يرد أحد على إيميل صادر عن منظمتك، سيصل الرد لهذا البريد مباشرة.", "When someone replies to an email from your organization, the reply goes directly to this address.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailSenderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("اسم المرسل الظاهر", "Displayed sender name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={bi("اسم منظمتك", "Your organization's name")} {...field} />
                    </FormControl>
                    <FormDescription>
                      {bi("يظهر كاسم المرسل في الإيميلات الصادرة عن منظمتك بدلاً من الاسم الافتراضي للمنصة (يتطلب أن يكون المشرف العام قد فعّل بريد المنصة).", "Appears as the sender name on emails from your organization instead of the platform's default name (requires the platform admin to have enabled platform email).")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <Label className="text-sm font-medium">{bi("أنواع الإشعارات المرسلة بالبريد لأعضاء منظمتك", "Notification types sent by email to your organization's members")}</Label>
                <div className="space-y-1 rounded-lg border divide-y">
                  {(lang === 'en' ? NOTIF_CATEGORIES_EN : NOTIF_CATEGORIES).map(cat => (
                    <div key={cat.key} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[cat.key] !== false}
                        onCheckedChange={(checked) => setNotifPrefs(prev => ({ ...prev, [cat.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <Button type="submit" disabled={isSaving}>
              <Save className="ml-2 h-4 w-4" />
              {isSaving ? bi("جاري الحفظ...", "Saving...") : bi("حفظ الإعدادات", "Save settings")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Invite Code */}
      {inviteCode && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary"><Key className="h-5 w-5" /> {bi("كود دعوة المرشدين والمدربين", "Mentor & coach invite code")}</CardTitle>
            <CardDescription>{bi("شارك هذا الكود مع المرشدين والمدربين حتى يتمكنوا من التسجيل وربط حساباتهم.", "Share this code with mentors and coaches so they can register and link their accounts.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-mono font-bold tracking-widest bg-card border rounded-lg px-6 py-3">{inviteCode}</div>
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(inviteCode); toast({ title: bi("تم النسخ!", "Copied!"), description: bi("تم نسخ كود الدعوة.", "The invite code was copied.") }); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
