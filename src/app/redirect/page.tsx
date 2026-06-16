"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { Logo } from "@/components/logo";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { userProfile, loading } = useUser();
  const [waited, setWaited] = useState(false);

  // Give Firestore up to 6 seconds to load user profile before giving up
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading && !waited) return;

    if (!userProfile) {
      router.replace("/login");
      return;
    }

    switch (userProfile.role) {
      case "organization": router.replace("/organization-dashboard"); break;
      case "mentor":       router.replace("/mentor-dashboard"); break;
      case "coach":        router.replace("/coach-dashboard"); break;
      case "admin":        router.replace("/admin-dashboard"); break;
      default:             router.replace("/dashboard"); break;
    }
  }, [loading, userProfile, waited, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 animate-pulse" />
        <p className="text-muted-foreground">جاري تحميل حسابك...</p>
      </div>
    </div>
  );
}
