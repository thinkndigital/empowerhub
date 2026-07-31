"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, XCircle, BookOpen, Video, Users } from "lucide-react";

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

interface ContentOffer {
  id: string;
  orgId: string;
  orgName: string;
  targetUid: string;
  targetName: string;
  targetRole: string;
  offerType: 'course' | 'live_session' | 'sessions';
  contentId: string;
  contentTitle: string;
  note: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

const statusLabel = { pending: "قيد الانتظار", accepted: "مقبول", rejected: "مرفوض" };
const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary", accepted: "default", rejected: "destructive",
};

const offerTypeLabel: Record<string, string> = {
  course: 'دورة مسجلة',
  live_session: 'جلسة مباشرة',
  sessions: 'خدمات الإرشاد',
};

const offerTypeIcon: Record<string, React.ElementType> = {
  course: BookOpen,
  live_session: Video,
  sessions: Users,
};

export default function CoachInvitationsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [contentOffers, setContentOffers] = useState<ContentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [invRes, offRes] = await Promise.all([
        fetch("/api/org/invitations", { headers: { authorization: `Bearer ${token}` } }),
        fetch("/api/content-offers", { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const [invJson, offJson] = await Promise.all([invRes.json(), offRes.json()]);
      setInvitations(invJson.invitations || []);
      setContentOffers(offJson.offers || []);
    } catch {
      setInvitations([]);
      setContentOffers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleInvite(inviteId: string, action: "accept" | "reject") {
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
      toast({ title: action === "accept" ? "تم قبول الدعوة" : "تم رفض الدعوة" });
      fetchAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setActing(null);
    }
  }

  async function handleOffer(offerId: string, action: "accept" | "reject") {
    if (!user) return;
    setActing(offerId + action);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/content-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ offerId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({
        title: action === "accept" ? "تم قبول العرض" : "تم رفض العرض",
        description: action === "accept" ? "تم ربط حسابك بالمنظمة. ستظهر دوراتك وجلساتك للمنظمة الآن." : "تم رفض العرض.",
      });
      fetchAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setActing(null);
    }
  }

  const pendingInvites = invitations.filter(i => i.status === "pending");
  const pendingOffers = contentOffers.filter(o => o.status === "pending");
  const historyInvites = invitations.filter(i => i.status !== "pending");
  const historyOffers = contentOffers.filter(o => o.status !== "pending");
  const totalPending = pendingInvites.length + pendingOffers.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" /> الدعوات والعروض
        </h1>
        <p className="text-muted-foreground text-sm mt-1">دعوات المنظمات وعروض المحتوى</p>
      </div>

      {/* Pending section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المعلّقة ({loading ? "..." : totalPending})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : totalPending === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">لا توجد دعوات أو عروض معلّقة</p>
          ) : (
            <div className="space-y-3">
              {/* Content offers */}
              {pendingOffers.map(offer => {
                const Icon = offerTypeIcon[offer.offerType] || BookOpen;
                return (
                  <div key={offer.id} className="p-4 border rounded-lg bg-card space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-lg p-2 shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{offer.orgName || "منظمة"}</p>
                          <Badge variant="outline" className="text-xs">{offerTypeLabel[offer.offerType]}</Badge>
                        </div>
                        {offer.contentTitle && (
                          <p className="text-sm text-primary font-medium mt-0.5">{offer.contentTitle}</p>
                        )}
                        {offer.note && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("ar-SA") : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleOffer(offer.id, "accept")} disabled={!!acting} className="flex-1">
                        <CheckCircle className="h-4 w-4 ml-1" /> قبول
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleOffer(offer.id, "reject")} disabled={!!acting}>
                        <XCircle className="h-4 w-4 ml-1" /> رفض
                      </Button>
                    </div>
                  </div>
                );
              })}
              {/* Membership invitations */}
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <p className="font-semibold">{inv.orgName || "منظمة"}</p>
                    <p className="text-xs text-muted-foreground">دعوة للانضمام</p>
                    <p className="text-xs text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("ar-SA") : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleInvite(inv.id, "accept")} disabled={!!acting}>
                      <CheckCircle className="h-4 w-4 ml-1" /> قبول
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleInvite(inv.id, "reject")} disabled={!!acting}>
                      <XCircle className="h-4 w-4 ml-1" /> رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {(historyInvites.length > 0 || historyOffers.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">السجل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyOffers.map(offer => {
                const Icon = offerTypeIcon[offer.offerType] || BookOpen;
                return (
                  <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{offer.orgName}</p>
                        {offer.contentTitle && <p className="text-xs text-muted-foreground truncate">{offer.contentTitle}</p>}
                      </div>
                    </div>
                    <Badge variant={statusVariant[offer.status]}>{statusLabel[offer.status]}</Badge>
                  </div>
                );
              })}
              {historyInvites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="font-medium text-sm">{inv.orgName || "منظمة"}</p>
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
