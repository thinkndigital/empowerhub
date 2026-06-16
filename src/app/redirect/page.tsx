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

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading && !waited) return;
    if (!user) { router.replace("/login"); return; }

    const pendingRole = sessionStorage.getItem("pending_role");
    const pendingUid  = sessionStorage.getItem("pending_uid");

    if (pendingRole && pendingUid && pendingUid === user.uid) {
      if (firestore) {
        const data: Record<string, any> = {
          id: user.uid,
          name:  sessionStorage.getItem("pending_name")  || "",
          email: sessionStorage.getItem("pending_email") || "",
          role:  pendingRole,
          status: "نشط", progress: 0,
          createdAt: new Date().toISOString(),
        };
        const orgId = sessionStorage.getItem("pending_org_id");
        if (orgId) data.organizationId = orgId;
        setDoc(doc(firestore, "users", user.uid), data, { merge: true }).catch(console.error);
      }
      ["pending_role","pending_uid","pending_name","pending_email","pending_org_id"]
        .forEach(k => sessionStorage.removeItem(k));
      router.replace(getRoleDashboard(pendingRole));
      return;
    }

    if (!userProfile && !waited) return;
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
