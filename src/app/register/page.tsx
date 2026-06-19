"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, Star, Zap, Building2, Crown, Loader2, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase/provider";
import { ORG_TYPES } from "@/lib/org-types";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  limits: Record<string, number>;
}

interface GatewayInfo {
  enabled: boolean;
  label: string;
}

interface PaymentConfig {
  allowCOD: boolean;
  codLabel: string;
  currency: string;
  moyasar: GatewayInfo;
  stripe: GatewayInfo;
  paypal: GatewayInfo;
  paytabs: GatewayInfo;
  hyperpay: GatewayInfo;
  tamara: GatewayInfo;
  tabby: GatewayInfo;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, any> = { Star, Zap, Building2, Crown };

function PlanIcon({ icon, color }: { icon: string; color: string }) {
  const Comp = iconMap[icon] || Star;
  return <Comp className="h-5 w-5" style={{ color }} />;
}

function formatPrice(plan: Plan, period: "monthly" | "annual" = "monthly") {
  if (plan.priceMonthly === 0) return "مجاني";
  if (period === "annual" && plan.priceAnnual > 0) {
    return `${plan.priceAnnual.toLocaleString()} ${plan.currency} / سنة`;
  }
  return `${plan.priceMonthly.toLocaleString()} ${plan.currency} / شهر`;
}

function getSavingPercent(plan: Plan): number {
  if (!plan.priceAnnual || !plan.priceMonthly || plan.priceMonthly === 0) return 0;
  return Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100);
}

const LIMIT_LABELS: Record<string, string> = {
  maxUsers: "مستفيد",
  maxMentors: "مرشد",
  maxCourses: "دورة",
  maxProducts: "منتج",
  maxStorage: "GB تخزين",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
    role: z.string({ required_error: "الرجاء اختيار نوع الحساب." }),
    organizationName: z.string().optional(),
    orgType: z.string().optional(),
    orgInviteCode: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "organization") {
        return data.organizationName && data.organizationName.length >= 2;
      }
      return true;
    },
    { message: "يجب إدخال اسم الجهة (حرفان على الأقل).", path: ["organizationName"] }
  );

type Step = "form" | "plan" | "gateway";

// ─── Component ────────────────────────────────────────────────────────────────

function RegisterForm() {
  const registerImage = PlaceHolderImages.find((img) => img.id === "register-background");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [expandedPlanId, setExpandedPlanId] = useState<string>("");

  // live data from API
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  const roleFromQuery = searchParams.get("role");
  const orgInviteParam = searchParams.get("orgInvite");
  const emailFromQuery = searchParams.get("email");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: emailFromQuery || "",
      password: "",
      role:
        roleFromQuery && ["beneficiary", "organization", "mentor", "coach"].includes(roleFromQuery)
          ? roleFromQuery
          : "beneficiary",
      organizationName: "",
      orgType: "organization",
      orgInviteCode: "",
    },
  });

  const selectedRole = form.watch("role");

  useEffect(() => {
    const role = searchParams.get("role");
    if (role && ["beneficiary", "organization", "mentor", "coach"].includes(role)) {
      form.setValue("role", role);
    }
  }, [searchParams, form]);

  // Load plans + payment config when user reaches plan step
  useEffect(() => {
    if (step !== "plan") return;
    setPlansLoading(true);
    Promise.all([
      fetch("/api/public/plans").then((r) => r.json()),
      fetch("/api/public/payment-config").then((r) => r.json()),
    ]).then(([plansData, payData]) => {
      const loadedPlans: Plan[] = plansData.plans || [];
      setPlans(loadedPlans);
      setPaymentConfig(payData.config || null);
      // pre-select highlighted or first plan
      const highlighted = loadedPlans.find((p) => p.highlighted) || loadedPlans[0];
      if (highlighted) setSelectedPlanId(highlighted.id);
    }).catch(() => {
      // fallback to empty — user can still proceed
    }).finally(() => setPlansLoading(false));
  }, [step]);

  // ── handlers ──────────────────────────────────────────────────────────────

  async function onFormSubmit(values: z.infer<typeof formSchema>) {
    if (values.role === "organization") {
      setPendingValues(values);
      setStep("plan");
      return;
    }
    await doRegister(values, "", "");
  }

  function onPlanNext() {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;
    const effectivePrice = billingPeriod === "annual" && plan.priceAnnual > 0
      ? plan.priceAnnual
      : plan.priceMonthly;
    if (effectivePrice > 0) {
      const enabledGateways = getEnabledGateways();
      if (enabledGateways.length > 0) {
        setSelectedGateway(enabledGateways[0].key);
        setStep("gateway");
        return;
      }
    }
    onGatewayConfirm(selectedPlanId, "");
  }

  async function onGatewayConfirm(planId: string, gateway: string) {
    if (!pendingValues) return;
    await doRegister(pendingValues, planId, gateway);
  }

  function getEnabledGateways() {
    if (!paymentConfig) return [];
    const keys = ["moyasar", "stripe", "paypal", "paytabs", "hyperpay", "tamara", "tabby"] as const;
    return keys
      .filter((k) => paymentConfig[k]?.enabled)
      .map((k) => ({ key: k, label: paymentConfig[k].label || k }));
  }

  async function doRegister(
    values: z.infer<typeof formSchema>,
    planId: string,
    gateway: string
  ) {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let res: Response;
      try {
        res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
            organizationName: values.organizationName,
            orgType: values.orgType,
            orgInviteCode: values.orgInviteCode,
            plan: planId || undefined,
            billingPeriod: planId ? billingPeriod : undefined,
          }),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error("انتهت مهلة الطلب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      let data: any = {};
      try { data = await res.json(); } catch { if (!res.ok) throw new Error(`فشل الطلب (${res.status})`); }
      if (!res.ok) throw new Error(data.error || "فشل إنشاء الحساب.");

      let signedInUid: string | null = data.uid || null;
      if (auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, values.email, values.password);
          signedInUid = cred.user.uid;
        } catch { /* non-fatal */ }
      }

      if (orgInviteParam && signedInUid) {
        try {
          await fetch("/api/accept-org-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteCode: orgInviteParam, uid: signedInUid, email: values.email }),
          });
        } catch { /* non-fatal */ }
      }

      if (signedInUid) {
        sessionStorage.setItem("pending_role", values.role);
        sessionStorage.setItem("pending_uid", signedInUid);
        sessionStorage.setItem("pending_name", values.name);
        sessionStorage.setItem("pending_email", values.email);
        if (data.organizationId) sessionStorage.setItem("pending_org_id", data.organizationId);
      }

      if (firestore && signedInUid) {
        try {
          await setDoc(
            doc(firestore, "users", signedInUid),
            {
              id: signedInUid, name: values.name, email: values.email,
              role: values.role, status: "نشط", progress: 0,
              createdAt: new Date().toISOString(),
              ...(data.organizationId ? { organizationId: data.organizationId } : {}),
            },
            { merge: true }
          );
        } catch { /* non-fatal */ }
      }

      const plan = plans.find((p) => p.id === planId);
      if (values.role === "organization" && plan && plan.priceMonthly > 0) {
        toast({ title: "تم إنشاء الحساب!", description: "سيتم توجيهك لإتمام الدفع وتفعيل منصتك." });
        const params = new URLSearchParams({
          plan: planId,
          billing: billingPeriod,
          gateway,
          orgId: data.organizationId || "",
        });
        router.push(`/payment?${params.toString()}`);
        return;
      }

      toast({ title: "تم إنشاء الحساب بنجاح!", description: "مرحباً بك في EmpowerHub!" });
      router.push("/redirect");
    } catch (error: any) {
      let msg = error.message || "فشل إنشاء الحساب.";
      if (error.code === "auth/email-already-in-use") msg = "هذا البريد الإلكتروني مستخدم بالفعل.";
      else if (error.code === "auth/weak-password") msg = "كلمة المرور ضعيفة جدًا (6 أحرف على الأقل).";
      toast({ variant: "destructive", title: "حدث خطأ", description: msg });
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const enabledGateways = getEnabledGateways();

  const stepTitle = step === "form"
    ? "إنشاء حساب جديد"
    : step === "plan"
    ? "اختر خطتك"
    : "طريقة الدفع";

  const stepSub = step === "form"
    ? "انضم إلى منصة EmpowerHub"
    : step === "plan"
    ? "اختر الخطة المناسبة لجهتك"
    : `الخطة: ${selectedPlan?.name || ""} — ${formatPrice(selectedPlan!, billingPeriod)}`;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2" dir="rtl">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-[440px] gap-6">

          {/* Header */}
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex justify-center mb-2">
              <Logo className="w-12 h-12 mx-auto" />
            </Link>
            <h1 className="text-3xl font-bold">{stepTitle}</h1>
            <p className="text-balance text-muted-foreground text-sm">{stepSub}</p>

            {/* Progress dots */}
            {selectedRole === "organization" && (
              <div className="flex justify-center gap-2 mt-1">
                {(["form", "plan", "gateway"] as Step[]).map((s, i) => (
                  <span
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      step === s ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Step 1: Registration Form ── */}
          {step === "form" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="grid gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl><Input placeholder="محمد أحمد" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" dir="ltr" placeholder="mail@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" placeholder="6 أحرف على الأقل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>نوع الحساب</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!roleFromQuery}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر نوع حسابك" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beneficiary">مستفيد</SelectItem>
                        <SelectItem value="organization">مدير منظمة / جهة</SelectItem>
                        <SelectItem value="mentor">مرشد</SelectItem>
                        <SelectItem value="coach">مدرب / مدربة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {selectedRole === "organization" && (
                  <>
                    <FormField control={form.control} name="orgType" render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel>تصنيف الجهة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "organization"}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر تصنيف جهتك" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ORG_TYPES).map(([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="organizationName" render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel>اسم الجهة</FormLabel>
                        <FormControl><Input placeholder="مثال: مؤسسة الأمل" {...field} /></FormControl>
                        <FormDescription className="text-xs">سيتم إنشاء حساب جهتك تلقائياً.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {(selectedRole === "mentor" || selectedRole === "coach") && (
                  <FormField control={form.control} name="orgInviteCode" render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>كود دعوة المنظمة <span className="text-muted-foreground font-normal">(اختياري)</span></FormLabel>
                      <FormControl>
                        <Input dir="ltr" placeholder="أدخل كود الدعوة إن وجد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <Button type="submit" className="w-full shadow-md" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري المعالجة...</>
                  ) : selectedRole === "organization" ? (
                    "التالي — اختيار الخطة ←"
                  ) : (
                    "إنشاء حساب مجاناً"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* ── Step 2: Plan Selection ── */}
          {step === "plan" && (
            <div className="space-y-4">
              {plansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground text-sm">لا توجد خطط متاحة حالياً.</p>
                  <Button onClick={() => onGatewayConfirm("", "")} disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    إنشاء حساب والمتابعة
                  </Button>
                </div>
              ) : (
                <>
                  {/* ── Billing period toggle ── */}
                  {plans.some((p) => p.priceAnnual > 0 && p.priceMonthly > 0) && (
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-1 rounded-xl border p-1 bg-muted/40">
                        <button
                          type="button"
                          onClick={() => setBillingPeriod("monthly")}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            billingPeriod === "monthly"
                              ? "bg-background shadow text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          شهري
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingPeriod("annual")}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                            billingPeriod === "annual"
                              ? "bg-background shadow text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          سنوي
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                            وفّر حتى {Math.max(...plans.map(getSavingPercent))}%
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Plan cards ── */}
                  <div className="grid gap-3">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const isExpanded = expandedPlanId === plan.id;
                      const savingPct = getSavingPercent(plan);
                      const hasAnnual = plan.priceAnnual > 0 && plan.priceMonthly > 0;
                      const limits = plan.limits || {};
                      const limitEntries = Object.entries(LIMIT_LABELS).filter(
                        ([key]) => limits[key] !== undefined
                      );

                      return (
                        <div
                          key={plan.id}
                          className={`rounded-xl border-2 transition-all relative ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          {/* Highlighted badge */}
                          {plan.highlighted && (
                            <span
                              className="absolute -top-2.5 right-4 text-xs px-2.5 py-0.5 rounded-full text-white font-medium"
                              style={{ backgroundColor: plan.color }}
                            >
                              الأكثر شعبية
                            </span>
                          )}

                          {/* Main row — click to select */}
                          <button
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className="w-full text-right p-4"
                          >
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div
                                className="p-2 rounded-xl flex-shrink-0"
                                style={{ backgroundColor: `${plan.color}18` }}
                              >
                                <PlanIcon icon={plan.icon} color={plan.color} />
                              </div>

                              {/* Name + price */}
                              <div className="flex-1 min-w-0 text-right">
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                  <span className="font-bold text-base">{plan.name}</span>
                                  <div className="text-left">
                                    <span className="font-bold text-lg" style={{ color: plan.color }}>
                                      {plan.priceMonthly === 0
                                        ? "مجاني"
                                        : billingPeriod === "annual" && hasAnnual
                                        ? plan.priceAnnual.toLocaleString()
                                        : plan.priceMonthly.toLocaleString()}
                                    </span>
                                    {plan.priceMonthly > 0 && (
                                      <span className="text-xs text-muted-foreground mr-1">
                                        {plan.currency} / {billingPeriod === "annual" ? "سنة" : "شهر"}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Annual saving note */}
                                {billingPeriod === "annual" && hasAnnual && savingPct > 0 && (
                                  <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                    ✓ توفير {savingPct}% مقارنة بالاشتراك الشهري
                                  </p>
                                )}
                                {billingPeriod === "monthly" && hasAnnual && savingPct > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    اشترك سنوياً ووفّر {savingPct}%
                                  </p>
                                )}

                                {/* Description */}
                                {plan.description && (
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {plan.description}
                                  </p>
                                )}
                              </div>

                              {/* Radio dot */}
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex-shrink-0 transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/40"
                                }`}
                              />
                            </div>
                          </button>

                          {/* Specs section (always visible when selected, toggle-able otherwise) */}
                          {(isSelected || isExpanded) && (
                            <div className="px-4 pb-4 space-y-3 border-t pt-3">
                              {/* Limits grid */}
                              {limitEntries.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {limitEntries.map(([key, label]) => (
                                    <div
                                      key={key}
                                      className="text-center rounded-lg bg-background border py-2 px-1"
                                    >
                                      <p
                                        className="font-bold text-sm"
                                        style={{ color: plan.color }}
                                      >
                                        {limits[key] === -1 ? "∞" : limits[key]?.toLocaleString?.() ?? limits[key]}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Features list */}
                              {plan.features.length > 0 && (
                                <ul className="space-y-1.5">
                                  {plan.features.map((f, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-2 text-xs text-muted-foreground"
                                    >
                                      <Check
                                        className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
                                        style={{ color: plan.color }}
                                      />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {/* "Show specs" toggle for non-selected plans */}
                          {!isSelected && (plan.features.length > 0 || Object.keys(limits).length > 0) && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPlanId(isExpanded ? "" : plan.id)
                              }
                              className="w-full text-center text-xs text-muted-foreground hover:text-primary py-2 border-t transition-colors"
                            >
                              {isExpanded ? "إخفاء المواصفات ▲" : "عرض المواصفات ▼"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("form")}
                      disabled={isLoading}
                    >
                      رجوع
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={onPlanNext}
                      disabled={isLoading || !selectedPlanId}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      {(() => {
                        if (!selectedPlan) return "التالي";
                        const price = billingPeriod === "annual" && selectedPlan.priceAnnual > 0
                          ? selectedPlan.priceAnnual
                          : selectedPlan.priceMonthly;
                        if (price === 0) return "إنشاء الحساب مجاناً";
                        if (enabledGateways.length > 0) return "التالي — طريقة الدفع ←";
                        return "إنشاء الحساب";
                      })()}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    الخطط المدفوعة تُفعَّل تلقائياً بعد إتمام الدفع.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Gateway Selection ── */}
          {step === "gateway" && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 bg-muted/30 text-sm space-y-1">
                <p className="font-medium">ملخص الطلب</p>
                <p className="text-muted-foreground">
                  الخطة: <span className="font-semibold text-foreground">{selectedPlan?.name}</span>
                </p>
                <p className="text-muted-foreground">
                  المبلغ:{" "}
                  <span className="font-bold text-foreground" style={{ color: selectedPlan?.color }}>
                    {selectedPlan ? formatPrice(selectedPlan) : ""}
                  </span>
                </p>
              </div>

              <p className="text-sm font-medium">اختر طريقة الدفع:</p>

              <div className="grid gap-2">
                {enabledGateways.map((gw) => (
                  <button
                    key={gw.key}
                    type="button"
                    onClick={() => setSelectedGateway(gw.key)}
                    className={`flex items-center gap-3 w-full rounded-xl border-2 p-3.5 text-right transition-all ${
                      selectedGateway === gw.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">{gw.label}</span>
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                        selectedGateway === gw.key
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}

                {paymentConfig?.allowCOD && (
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("cod")}
                    className={`flex items-center gap-3 w-full rounded-xl border-2 p-3.5 text-right transition-all ${
                      selectedGateway === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">
                      {paymentConfig.codLabel || "الدفع لاحقاً"}
                    </span>
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                        selectedGateway === "cod"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      }`}
                    />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("plan")} disabled={isLoading}>
                  رجوع
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => onGatewayConfirm(selectedPlanId, selectedGateway)}
                  disabled={isLoading || !selectedGateway}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري المعالجة...</>
                  ) : (
                    "تأكيد وإنشاء الحساب"
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            بالتسجيل أنت توافق على{" "}
            <Link href="#" className="underline hover:text-primary">شروط الاستخدام</Link>
            {" "}و{" "}
            <Link href="#" className="underline hover:text-primary">سياسة الخصوصية</Link>
          </p>

          <div className="text-center text-sm">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="underline font-medium text-primary">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden bg-muted lg:block relative overflow-hidden">
        {registerImage && (
          <Image
            src={registerImage.imageUrl}
            alt={registerImage.description}
            fill
            className="object-cover"
            data-ai-hint={registerImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-10 right-10 text-white max-w-xs">
          <h2 className="text-2xl font-bold mb-2">ابدأ رحلتك نحو النجاح</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            انضم إلى منصة EmpowerHub وابدأ التغيير اليوم
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
