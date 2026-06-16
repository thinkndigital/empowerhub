"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { Logo } from "@/components/logo";

function getRoleDashboard(role: string) {
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
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    // Check sessionStorage first (set right after registration — instant)
    const pendingRole = sessionStorage.getItem("pending_role");
    const pendingUid  = sessionStorage.getItem("pending_uid");
    if (pendingRole && pendingUid && pendingUid === user.uid) {
      ["pending_role","pending_uid","pending_name","pending_email","pending_org_id"]
        .forEach(k => sessionStorage.removeItem(k));
      router.replace(getRoleDashboard(pendingRole));
      return;
    }

    // Ask the server for the role (uses Admin SDK — always reliable)
    user.getIdToken().then(token =>
      fetch("/api/my-role", { headers: { authorization: `Bearer ${token}` } })
    ).then(r => r.json()).then(data => {
      router.replace(getRoleDashboard(data.role || "beneficiary"));
    }).catch(() => {
      router.replace("/dashboard");
    });
  }, [loading, user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 animate-pulse" />
        <p className="text-muted-foreground">جاري تحميل حسابك...</p>
      </div>
    </div>
  );
}
