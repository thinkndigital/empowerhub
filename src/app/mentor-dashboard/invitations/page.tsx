"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, XCircle, Users } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface OrgInvitation {
  id: string;
  orgId: string;
  orgName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface ContentOffer {
  id: string;
  orgId: string;
  orgName: string;
  offerType: string;
  contentTitle: string;
  note: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

const statusLabel = { pending: "قيد الانتظار", accepted: "مقبول", rejected: "مرفوض" };
const statusLabelEn = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };
const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary", accepted: "default", rejected: "destructive",
};

export default function MentorInvitationsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
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
      toast({ title: action === "accept" ? bi("تم قبول الدعوة", "Invitation accepted") : bi("تم رفض الدعوة", "Invitation rejected") });
      fetchAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
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
        title: action === "accept" ? bi("تم قبول العرض", "Offer accepted") : bi("تم رفض العرض", "Offer rejected"),
        description: action === "accept" ? bi("تم ربط حسابك بالمنظمة. ستظهر جلساتك للمنظمة الآن.", "Your account was linked to the organization. Your sessions will now be visible to the organization.") : bi("تم رفض العرض.", "The offer was rejected."),
      });
      fetchAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
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
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" /> {bi("الدعوات والعروض", "Invitations & offers")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{bi("دعوات المنظمات وعروض الإرشاد", "Organization invitations and mentoring offers")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{bi("المعلّقة", "Pending")} ({loading ? "..." : totalPending})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : totalPending === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">{bi("لا توجد دعوات أو عروض معلّقة", "No pending invitations or offers")}</p>
          ) : (
            <div className="space-y-3">
              {pendingOffers.map(offer => (
                <div key={offer.id} className="p-4 border rounded-lg bg-card space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-lg p-2 shrink-0 mt-0.5">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{offer.orgName || bi("منظمة", "Organization")}</p>
                        <Badge variant="outline" className="text-xs">{bi("خدمات الإرشاد", "Mentoring services")}</Badge>
                      </div>
                      {offer.note && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString(locale) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleOffer(offer.id, "accept")} disabled={!!acting} className="flex-1">
                      <CheckCircle className="h-4 w-4 ml-1" /> {bi("قبول", "Accept")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOffer(offer.id, "reject")} disabled={!!acting}>
                      <XCircle className="h-4 w-4 ml-1" /> {bi("رفض", "Reject")}
                    </Button>
                  </div>
                </div>
              ))}
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <p className="font-semibold">{inv.orgName || bi("منظمة", "Organization")}</p>
                    <p className="text-xs text-muted-foreground">{bi("دعوة للانضمام", "Invitation to join")}</p>
                    <p className="text-xs text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString(locale) : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleInvite(inv.id, "accept")} disabled={!!acting}>
                      <CheckCircle className="h-4 w-4 ml-1" /> {bi("قبول", "Accept")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleInvite(inv.id, "reject")} disabled={!!acting}>
                      <XCircle className="h-4 w-4 ml-1" /> {bi("رفض", "Reject")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(historyInvites.length > 0 || historyOffers.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">{bi("السجل", "History")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyOffers.map(offer => (
                <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="font-medium text-sm">{offer.orgName}</p>
                  <Badge variant={statusVariant[offer.status]}>{(lang === 'en' ? statusLabelEn : statusLabel)[offer.status]}</Badge>
                </div>
              ))}
              {historyInvites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="font-medium text-sm">{inv.orgName || bi("منظمة", "Organization")}</p>
                  <Badge variant={statusVariant[inv.status]}>{(lang === 'en' ? statusLabelEn : statusLabel)[inv.status]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
