"use client";

import { useState } from "react";
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useUser } from "@/firebase/auth/use-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, XCircle } from "lucide-react";

interface OrgInvitation {
  id: string;
  orgId: string;
  orgName: string;
  targetUid: string;
  targetName: string;
  targetRole: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: { toDate?: () => Date } | null;
}

function formatDate(val: OrgInvitation["createdAt"]): string {
  if (!val) return "—";
  const d = typeof val.toDate === "function" ? val.toDate() : new Date();
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const statusLabel: Record<OrgInvitation["status"], string> = {
  pending: "قيد الانتظار",
  accepted: "مقبولة",
  rejected: "مرفوضة",
};

const statusVariant: Record<
  OrgInvitation["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
};

export default function CoachInvitationsPage() {
  const { user: authUser, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const uid = authUser?.uid ?? "";

  const invitationsQuery = useMemoFirebase(() => {
    if (!firestore || !uid) return null;
    return query(
      collection(firestore, "orgInvitations"),
      where("targetUid", "==", uid)
    );
  }, [firestore, uid]);

  const { data: invitations, isLoading } =
    useCollection<OrgInvitation>(invitationsQuery);

  const pending = (invitations ?? []).filter((i) => i.status === "pending");
  const history = (invitations ?? []).filter((i) => i.status !== "pending");

  const handleAccept = async (inv: OrgInvitation) => {
    if (!firestore || !uid) return;
    setLoadingAction(inv.id);
    try {
      await updateDoc(doc(firestore, "orgInvitations", inv.id), {
        status: "accepted",
      });
      if (uid) {
        await updateDoc(doc(firestore, "users", uid), {
          organizationId: inv.orgId,
        });
      }
      await addDoc(collection(firestore, "notifications"), {
        userId: inv.orgId,
        title: "قبول دعوة",
        body: `${userProfile?.name ?? "مدرب"} قبل دعوتك للانضمام إلى المنظمة`,
        read: false,
        createdAt: serverTimestamp(),
        link: "/organization-dashboard/coaches",
      });
      toast({ title: "تم القبول", description: "انضممت إلى المنظمة بنجاح." });
    } catch {
      toast({ title: "خطأ", description: "فشل في قبول الدعوة.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (inv: OrgInvitation) => {
    if (!firestore) return;
    setLoadingAction(inv.id);
    try {
      await updateDoc(doc(firestore, "orgInvitations", inv.id), {
        status: "rejected",
      });
      await addDoc(collection(firestore, "notifications"), {
        userId: inv.orgId,
        title: "رفض دعوة",
        body: `${userProfile?.name ?? "مدرب"} رفض دعوتك للانضمام إلى المنظمة`,
        read: false,
        createdAt: serverTimestamp(),
        link: "/organization-dashboard/coaches",
      });
      toast({ title: "تم الرفض", description: "تم رفض الدعوة." });
    } catch {
      toast({ title: "خطأ", description: "فشل في رفض الدعوة.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">الدعوات</h1>
        <p className="text-muted-foreground">
          دعوات المنظمات لانضمامك كمدرب
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          الدعوات المعلقة
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              لا توجد دعوات معلقة
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((inv) => (
              <Card key={inv.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{inv.orgName}</CardTitle>
                    <Badge variant="secondary">قيد الانتظار</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    تاريخ الإرسال: {formatDate(inv.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={loadingAction === inv.id}
                      onClick={() => handleAccept(inv)}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" />
                      قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={loadingAction === inv.id}
                      onClick={() => handleReject(inv)}
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">سجل الدعوات</h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              لا يوجد سجل دعوات
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((inv) => (
              <Card key={inv.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{inv.orgName}</CardTitle>
                    <Badge variant={statusVariant[inv.status]}>
                      {statusLabel[inv.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    تاريخ الإرسال: {formatDate(inv.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
