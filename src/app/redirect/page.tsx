"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { doc, setDoc } from "firebase/firestore";
import { Logo } from "@/components/logo";

function getRoleDashboard(role: string | undefined) {
  switch (role) {
    case "organization": return "/organization-dashboard";
    case "mentor":       return "/mentor-dashboard";
    case "coach":        return "/coach-dashboard";
    case "admin":        return "/admin-dashboard";
    default:             return "/dashboard";
  }
}

export default function AuthRedirectPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useUser();
  const firestore = useFirestore();
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

    // Check sessionStorage for pending registration data
    const pendingRole = sessionStorage.getItem("pending_role");
    const pendingUid = sessionStorage.getItem("pending_uid");

    if (pendingRole && pendingUid && pendingUid === user.uid) {
      // We have fresh registration data — write to Firestore if not already done
      if (firestore) {
        const pendingName = sessionStorage.getItem("pending_name") || "";
        const pendingEmail = sessionStorage.getItem("pending_email") || "";
        const pendingOrgId = sessionStorage.getItem("pending_org_id");
        const profileData: Record<string, any> = {
          id: user.uid,
          name: pendingName,
          email: pendingEmail,
          role: pendingRole,
          status: "نشط",
          progress: 0,
          createdAt: new Date().toISOString(),
        };
        if (pendingOrgId) profileData.organizationId = pendingOrgId;

        setDoc(doc(firestore, "users", user.uid), profileData, { merge: true })
          .catch(console.error);
      }

      // Clear sessionStorage and redirect
      sessionStorage.removeItem("pending_role");
      sessionStorage.removeItem("pending_uid");
      sessionStorage.removeItem("pending_name");
      sessionStorage.removeItem("pending_email");
      sessionStorage.removeItem("pending_org_id");

      router.replace(getRoleDashboard(pendingRole));
      return;
    }

    // Authenticated but Firestore profile still loading — wait for timeout
    if (!userProfile && !waited) return;

    // Route based on Firestore role
    router.replace(getRoleDashboard(userProfile?.role));
  }, [loading, user, userProfile, waited, firestore, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 animate-pulse" />
        <p className="text-muted-foreground">جاري تحميل حسابك...</p>
      </div>
    </div>
  );
}
