"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { Logo } from "@/components/logo";
import { usePlatformBrand } from "@/components/platform-brand-provider";

const ROLE_PATHS: Record<string, string> = {
  admin: "/admin-dashboard/messages",
  organization: "/organization-dashboard/messages",
  mentor: "/mentor-dashboard/messages",
  coach: "/coach-dashboard/messages",
  beneficiary: "/beneficiary-dashboard/messages",
};

export default function MessagesRedirectPage() {
  const { user, userProfile, loading } = useUser();
  const router = useRouter();
  const { logoUrl: platformLogo } = usePlatformBrand();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    const role = userProfile?.role || "beneficiary";
    router.replace(ROLE_PATHS[role] || "/beneficiary-dashboard/messages");
  }, [user, userProfile, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      {platformLogo
        ? <img src={platformLogo} alt="logo" className="h-16 w-16 object-contain animate-pulse" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : <Logo className="h-16 w-16 animate-pulse" />}
    </div>
  );
}
