"use client";

import { useState, useEffect, useCallback } from "react";
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
  createdAt: string;
}

const statusLabel = { pending: "قيد الانتظار", accepted: "مقبولة", rejected: "مرفوضة" };
const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary", accepted: "default", rejected: "destructive",
};

export default function CoachInvitationsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<OrgInvitation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/org/invitations", {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setInvitations(json.invitations || []);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  async function handleAction(inviteId: string, action: "accept" | "reject") {
    if (!user) return;
    setActing(inviteId + action);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/org/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({
        title: action === "accept" ? "تم قبول الدعوة" : "تم رفض الدعوة",
        description: action === "accept" ? "تم ربط حسابك بالمنظمة بنجاح." : "تم رفض الدعوة.",
      });
      fetchInvitations();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setActing(null);
    }
  }

  const pending = invitations?.filter(i => i.status === "pending") ?? [];
  const history = invitations?.filter(i => i.status !== "pending") ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> الدعوات
        </h1>
        <p className="text-muted-foreground text-sm mt-1">دعوات المنظمات للانضمام إليها</p>
      </div>

      {/* Pending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الدعوات المعلّقة ({loading ? "..." : pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">لا توجد دعوات معلّقة</p>
          ) : (
            <div className="space-y-3">
              {pending.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <p className="font-semibold">{inv.orgName || "منظمة"}</p>
                    <p className="text-xs text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("ar-SA") : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(inv.id, "accept")}
                      disabled={!!acting}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" />
                      قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(inv.id, "reject")}
                      disabled={!!acting}
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">السجل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="font-medium">{inv.orgName || "منظمة"}</p>
                  <Badge variant={statusVariant[inv.status]}>{statusLabel[inv.status]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
