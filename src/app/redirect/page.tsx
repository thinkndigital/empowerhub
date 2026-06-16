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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 animate-pulse" />
        <p className="text-muted-foreground">جاري تحميل حسابك...</p>
      </div>
    </div>
  );
}
