"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase/provider";

// ─── Constants ────────────────────────────────────────────────────────────────

import { ORG_TYPES } from "@/lib/org-types";

const PLANS = [
  {
    id: "basic",
    label: "الخطة الأساسية",
    price: "مجاني",
    priceNum: 0,
    features: ["حتى 20 مستفيداً", "الدورات التدريبية", "دعم عبر البريد الإلكتروني"],
    badge: "",
  },
  {
    id: "pro",
    label: "الخطة الاحترافية",
    price: "299 ر.س / شهر",
    priceNum: 299,
    features: ["حتى 100 مستفيد", "الدورات + الإرشاد", "متجر إلكتروني", "دعم أولوية"],
    badge: "الأكثر شيوعاً",
  },
  {
    id: "enterprise",
    label: "الخطة المؤسسية",
    price: "999 ر.س / شهر",
    priceNum: 999,
    features: ["مستفيدون غير محدودين", "جميع الميزات", "تخصيص كامل", "مدير حساب مخصص"],
    badge: "الأفضل للمؤسسات",
  },
];

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

// ─── Steps ────────────────────────────────────────────────────────────────────

type Step = "form" | "plan";

function RegisterForm() {
  const registerImage = PlaceHolderImages.find((img) => img.id === "register-background");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);

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

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "organization": return "/organization-dashboard";
      case "admin": return "/admin-dashboard";
      case "mentor": return "/mentor-dashboard";
      case "coach": return "/coach-dashboard";
      default: return "/dashboard";
    }
  };

  // Step 1: validate form → if org → go to plan selection → else register
  async function onFormSubmit(values: z.infer<typeof formSchema>) {
    if (values.role === "organization") {
      setPendingValues(values);
      setStep("plan");
      return;
    }
    await doRegister(values, "");
  }

  // Step 2: plan selected → register
  async function onPlanConfirm() {
    if (!pendingValues) return;
    await doRegister(pendingValues, selectedPlan);
  }

  async function doRegister(values: z.infer<typeof formSchema>, plan: string) {
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
            plan: plan || undefined,
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
              id: signedInUid,
              name: values.name,
              email: values.email,
              role: values.role,
              status: "نشط",
              progress: 0,
              createdAt: new Date().toISOString(),
              ...(data.organizationId ? { organizationId: data.organizationId } : {}),
            },
            { merge: true }
          );
        } catch { /* non-fatal */ }
      }

      // Org with paid plan → pending payment
      const planObj = PLANS.find((p) => p.id === plan);
      if (values.role === "organization" && planObj && planObj.priceNum > 0) {
        toast({
          title: "تم إنشاء الحساب!",
          description: "يرجى إتمام الدفع لتفعيل منصتك.",
        });
        router.push(`/payment?plan=${plan}&orgId=${data.organizationId || ""}`);
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

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2" dir="rtl">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-[420px] gap-6">
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex justify-center items-center gap-2 mb-2">
              <Logo className="w-12 h-12 mx-auto" />
            </Link>
            <h1 className="text-3xl font-bold">
              {step === "plan" ? "اختر خطتك" : "إنشاء حساب جديد"}
            </h1>
            <p className="text-balance text-muted-foreground">
              {step === "plan"
                ? "اختر الخطة المناسبة للبدء"
                : "انضم إلى منصة EmpowerHub"}
            </p>
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
                        <FormDescription className="text-xs">اختر النوع الذي يمثل جهتك.</FormDescription>
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
                  {isLoading
                    ? "جاري إنشاء الحساب..."
                    : selectedRole === "organization"
                    ? "التالي — اختيار الخطة"
                    : "إنشاء حساب مجاناً"}
                </Button>
              </form>
            </Form>
          )}

          {/* ── Step 2: Plan Selection ── */}
          {step === "plan" && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`text-right w-full rounded-xl border-2 p-4 transition-all ${
                      selectedPlan === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{plan.label}</span>
                          {plan.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-primary font-bold mt-0.5">{plan.price}</p>
                        <ul className="mt-2 space-y-0.5">
                          {plan.features.map((f) => (
                            <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="text-primary">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div
                        className={`mt-1 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                          selectedPlan === plan.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>

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
                  onClick={onPlanConfirm}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "جاري الإنشاء..."
                    : PLANS.find((p) => p.id === selectedPlan)?.priceNum === 0
                    ? "إنشاء الحساب مجاناً"
                    : "إنشاء الحساب والانتقال للدفع"}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                الخطة الأساسية مجانية تماماً. الخطط المدفوعة تُفعَّل بعد إتمام الدفع.
              </p>
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
