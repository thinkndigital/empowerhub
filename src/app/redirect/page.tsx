"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { Logo } from "@/components/logo";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useUser();
  const [waited, setWaited] = useState(false);

  // Wait up to 6 seconds for Firestore profile to load
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Still waiting for auth to initialize
    if (loading && !waited) return;

    // Not authenticated at all
    if (!user) {
      router.replace("/login");
      return;
    }

    // Authenticated but profile still loading — wait for timeout
    if (!userProfile && !waited) return;

    // Route based on role (fall back to /dashboard if role unknown)
    const role = userProfile?.role;
    switch (role) {
      case "organization": router.replace("/organization-dashboard"); break;
      case "mentor":       router.replace("/mentor-dashboard"); break;
      case "coach":        router.replace("/coach-dashboard"); break;
      case "admin":        router.replace("/admin-dashboard"); break;
      default:             router.replace("/dashboard"); break;
    }
  }, [loading, user, userProfile, waited, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 animate-pulse" />
        <p className="text-muted-foreground">جاري تحميل حسابك...</p>
      </div>
    </div>
  );
}
