"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { usePlatformBrand } from "@/components/platform-brand-provider";
import { PaymentIframeDialog } from "@/components/payment-iframe-dialog";

interface PlanInfo {
  id: string;
  name: string;
  key: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: string[];
}

interface GatewayInfo { enabled: boolean; label: string; }
type GatewayKey = 'moyasar' | 'stripe' | 'paypal' | 'paytabs' | 'hyperpay' | 'tamara' | 'tabby';
const GATEWAY_ICONS: Record<GatewayKey, string> = {
  moyasar: '🏦', stripe: '💳', paypal: '🅿️', paytabs: '💰', hyperpay: '⚡', tamara: '🛍️', tabby: '📦',
};

function PaymentPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const planKey = searchParams.get("plan") || "";
  const orgId = searchParams.get("orgId") || "";
  const cycle = searchParams.get("cycle") === "annual" ? "annual" : "monthly";

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [gateways, setGateways] = useState<Record<GatewayKey, GatewayInfo>>({} as any);
  const [selectedGateway, setSelectedGateway] = useState<GatewayKey | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { logoUrl: platformLogo } = usePlatformBrand();

  useEffect(() => {
    async function load() {
      if (!planKey || !orgId) {
        setError("رابط الدفع غير صحيح. الرجاء إعادة التسجيل.");
        setLoading(false);
        return;
      }
      try {
        const [plansRes, configRes] = await Promise.all([
          fetch("/api/public/plans"),
          fetch("/api/public/payment-config"),
        ]);
        const plansData = await plansRes.json();
        const configData = await configRes.json();

        const matched = (plansData.plans || []).find((p: PlanInfo) => p.key === planKey);
        if (!matched) {
          setError("لم يتم العثور على هذه الخطة. تواصل مع الدعم الفني.");
          setLoading(false);
          return;
        }
        setPlan(matched);

        const cfg = configData.config || {};
        const enabledGateways: Record<GatewayKey, GatewayInfo> = {} as any;
        (Object.keys(GATEWAY_ICONS) as GatewayKey[]).forEach((k) => {
          if (cfg[k]?.enabled) enabledGateways[k] = cfg[k];
        });
        setGateways(enabledGateways);
        const firstEnabled = Object.keys(enabledGateways)[0] as GatewayKey | undefined;
        if (firstEnabled) setSelectedGateway(firstEnabled);
      } catch {
        setError("حدث خطأ أثناء تحميل بيانات الدفع.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [planKey, orgId]);

  const handlePay = async () => {
    if (!plan || !selectedGateway) return;
    setSubmitting(true);
    try {
      const checkoutRes = await fetch("/api/public/subscriptions/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId, planId: plan.id, billingCycle: cycle }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutData.ok) throw new Error(checkoutData.error || "فشل إنشاء طلب الدفع");

      const payRes = await fetch("/api/public/payment/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutData.orderId,
          amount: checkoutData.amount,
          description: `اشتراك خطة ${plan.name}`,
          gateway: selectedGateway,
        }),
      });
      const payData = await payRes.json();
      if (payData.paymentUrl) {
        setPaymentUrl(payData.paymentUrl);
        setSubmitting(false);
        return;
      }
      throw new Error(payData.error || "فشل في تهيئة الدفع");
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message || "حدث خطأ، حاول مرة أخرى." });
      setSubmitting(false);
    }
  };

  const handlePaymentResult = (status: "paid" | "failed") => {
    setPaymentUrl(null);
    if (status === "paid") {
      toast({ title: "تم الدفع بنجاح!", description: "تم تفعيل اشتراكك." });
      router.push("/organization-dashboard");
    } else {
      toast({ variant: "destructive", title: "لم تكتمل عملية الدفع", description: "يمكنك المحاولة مرة أخرى." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          {platformLogo
            ? <img src={platformLogo} alt="logo" className="h-10 w-10 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Logo className="h-10 w-10" />}
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">جاري تحميل بيانات الدفع...</p>
          </div>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button asChild variant="outline">
                <Link href="/register?role=organization">العودة للتسجيل</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && plan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">إتمام الاشتراك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold">{plan.name}</span>
                    <Badge variant="outline" className="mr-2 text-xs">{cycle === "annual" ? "سنوي" : "شهري"}</Badge>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {(cycle === "annual" ? plan.priceAnnual : plan.priceMonthly).toLocaleString()} {plan.currency} / {cycle === "annual" ? "سنة" : "شهر"}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {Object.keys(gateways).length === 0 ? (
                <p className="text-sm text-destructive text-center">
                  لا توجد وسيلة دفع مفعّلة حالياً. تواصل مع الدعم الفني.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label>وسيلة الدفع</Label>
                  <RadioGroup value={selectedGateway} onValueChange={(v) => setSelectedGateway(v as GatewayKey)} className="space-y-2">
                    {(Object.entries(gateways) as [GatewayKey, GatewayInfo][]).map(([key, gw]) => (
                      <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                        <RadioGroupItem value={key} id={`gw-${key}`} />
                        <Label htmlFor={`gw-${key}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <span>{GATEWAY_ICONS[key]}</span>
                          {gw.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={submitting || !selectedGateway}
                onClick={handlePay}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 ml-2" />
                )}
                الدفع الآن
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <PaymentIframeDialog
        paymentUrl={paymentUrl}
        onOpenChange={open => !open && setPaymentUrl(null)}
        onResult={handlePaymentResult}
      />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <PaymentPageInner />
    </Suspense>
  );
}
