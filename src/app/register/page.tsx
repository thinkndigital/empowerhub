import { Suspense } from "react";
import { getCachedSiteBranding } from "@/lib/site-branding-cache";
import { RegisterForm } from "./register-form";

// Same reasoning as the root layout's platform-brand cache: without this,
// this route can get fully static-prerendered at build time and never see a
// later branding update until the next deploy.
export const revalidate = 60;

export default async function RegisterPage() {
  const { registerBranding } = await getCachedSiteBranding();
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    }>
      <RegisterForm initialBranding={registerBranding} />
    </Suspense>
  );
}
