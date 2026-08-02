"use client";

import Link from "next/link";
import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function SubscriptionLockedScreen({ isAdmin, orgId, planKey }: { isAdmin: boolean; orgId: string; planKey: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo className="h-10 w-10" />
        </div>
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">انتهى اشتراك منظمتك</h1>
        {isAdmin ? (
          <>
            <p className="text-muted-foreground mb-6">
              انتهت مدة اشتراك منظمتك ولم يتم تجديده. الرجاء إتمام الدفع لإعادة تفعيل لوحة التحكم.
            </p>
            <Button asChild size="lg" className="w-full">
              <Link href={`/payment?plan=${planKey}&orgId=${orgId}`}>
                <CreditCard className="h-4 w-4 ml-2" />
                الذهاب لصفحة الدفع
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">
            انتهت مدة اشتراك منظمتك. الرجاء التواصل مع إدارة منظمتك لتجديد الاشتراك.
          </p>
        )}
      </div>
    </div>
  );
}
