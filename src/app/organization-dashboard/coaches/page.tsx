"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { useUser } from "@/firebase/auth/use-user";
import { useOrgUsers } from "@/hooks/use-org-users";
import type { OrgUser } from "@/hooks/use-org-users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserX, Send, Eye, Save, Clock, DollarSign, RefreshCw, BookOpen, Video, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";

async function apiAction(user: User, body: object) {
  const token = await user.getIdToken();
  const res = await fetch("/api/org/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

type BillingCoach = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  hourlyRate: number;
  currency: string;
  contractedHours?: number;
  totalHours: number;
  totalCost: number;
};

export default function OrgCoachesPage() {
  const { user, userProfile } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());

  // Content offer state
  const [offerCoach, setOfferCoach] = useState<OrgUser | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [coachContent, setCoachContent] = useState<{ courses: {id:string;title:string}[]; liveSessions: {id:string;title:string}[] }>({ courses: [], liveSessions: [] });
  const [offerForm, setOfferForm] = useState({ offerType: 'course' as 'course'|'live_session', contentId: '', note: '' });
  const [sendingOffer, setSendingOffer] = useState(false);

  // Billing state
  const [billingCoaches, setBillingCoaches] = useState<BillingCoach[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, { hourlyRate: string; contractedHours: string }>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

  const orgId = userProfile?.organizationId ?? "";

  const { data: orgCoaches, isLoading: loadingOrgCoaches, refetch: refetchOrg } =
    useOrgUsers("coach", "org");

  const { data: allCoaches, isLoading: loadingAllCoaches } =
    useOrgUsers("coach", "all");

  const orgCoachIds = new Set((orgCoaches ?? []).map((c) => c.id));
  const availableCoaches = (allCoaches ?? []).filter(
    (c) => !orgCoachIds.has(c.id)
  );

  const fetchBilling = useCallback(async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/coaches/billing', {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const coaches: BillingCoach[] = json.coaches || [];
      setBillingCoaches(coaches);
      // Initialize editing state
      const rates: Record<string, { hourlyRate: string; contractedHours: string }> = {};
      coaches.forEach(c => {
        rates[c.id] = {
          hourlyRate: c.hourlyRate ? String(c.hourlyRate) : '',
          contractedHours: c.contractedHours != null ? String(c.contractedHours) : '',
        };
      });
      setEditingRates(rates);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل بيانات المحاسبة.', 'Failed to load billing data.') });
    } finally {
      setBillingLoading(false);
    }
  }, [user, toast]);

  const handleSaveRate = async (coachId: string) => {
    if (!user) return;
    const rate = editingRates[coachId];
    if (!rate) return;
    setSavingRate(coachId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/coaches/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          coachId,
          hourlyRate: Number(rate.hourlyRate) || 0,
          contractedHours: rate.contractedHours ? Number(rate.contractedHours) : null,
          currency: 'JOD',
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: bi('تم الحفظ', 'Saved'), description: bi('تم تحديث معدل الساعة بنجاح.', 'Hourly rate updated successfully.') });
      fetchBilling();
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل حفظ معدل الساعة.', 'Failed to save hourly rate.') });
    } finally {
      setSavingRate(null);
    }
  };

  const handleRemove = async (coachId: string) => {
    if (!user) return;
    setLoadingAction(coachId);
    try {
      const result = await apiAction(user, { action: "removeFromOrg", userId: coachId });
      if (result.error) throw new Error(result.error);
      toast({ title: bi("تمت الإزالة", "Removed"), description: bi("تم إزالة المدرب.", "The coach was removed.") });
      refetchOrg();
    } catch {
      toast({ title: bi("خطأ", "Error"), description: bi("فشل في إزالة المدرب.", "Failed to remove the coach."), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInvite = async (coach: OrgUser) => {
    if (!user || !orgId) return;
    setLoadingAction(coach.id);
    try {
      const result = await apiAction(user, {
        action: "invite",
        targetUid: coach.id,
        targetName: coach.name ?? "",
        targetRole: "coach",
      });
      if (result.error) throw new Error(result.error);
      setSentInvites((prev) => new Set(prev).add(coach.id));
      toast({ title: bi("تم الإرسال", "Sent"), description: bi("تم إرسال الدعوة للمدرب.", "The invitation was sent to the coach.") });
    } catch {
      toast({ title: bi("خطأ", "Error"), description: bi("فشل في إرسال الدعوة.", "Failed to send the invitation."), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const openOfferModal = async (coach: OrgUser) => {
    setOfferCoach(coach);
    setOfferForm({ offerType: 'course', contentId: '', note: '' });
    setOfferLoading(true);
    try {
      const res = await fetch(`/api/public/coach-content/${coach.id}`);
      const json = await res.json();
      setCoachContent({ courses: json.courses || [], liveSessions: json.liveSessions || [] });
    } catch {
      setCoachContent({ courses: [], liveSessions: [] });
    } finally {
      setOfferLoading(false);
    }
  };

  const handleSendOffer = async () => {
    if (!user || !offerCoach) return;
    const items = offerForm.offerType === 'course' ? coachContent.courses : coachContent.liveSessions;
    const selected = items.find(i => i.id === offerForm.contentId);
    if (!selected) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('اختر المحتوى أولاً', 'Choose content first') });
      return;
    }
    setSendingOffer(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/content-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetUid: offerCoach.id,
          targetName: offerCoach.name || '',
          targetRole: 'coach',
          offerType: offerForm.offerType,
          contentId: selected.id,
          contentTitle: selected.title,
          note: offerForm.note,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: bi('تم الإرسال', 'Sent'), description: bi('تم إرسال العرض للمدرب.', 'The offer was sent to the coach.') });
      setOfferCoach(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
    } finally {
      setSendingOffer(false);
    }
  };

  const totalCost = billingCoaches.reduce((s, c) => s + c.totalCost, 0);
  const totalHours = billingCoaches.reduce((s, c) => s + c.totalHours, 0);

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("إدارة المدربين", "Manage coaches")}</h1>
          <p className="page-subtitle">{bi("استعرض مدربي منظمتك أو ادعُ مدربين جدد", "Browse your organization's coaches or invite new ones")}</p>
        </div>
      </div>

      <Tabs defaultValue="org-coaches" dir={dir}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org-coaches">{bi("المدربون", "Coaches")}</TabsTrigger>
          <TabsTrigger value="billing" onClick={fetchBilling}>{bi("محاسبة المدربين", "Coach billing")}</TabsTrigger>
          <TabsTrigger value="explore">{bi("استكشاف المدربين", "Explore coaches")}</TabsTrigger>
        </TabsList>

        {/* Tab 1: org coaches */}
        <TabsContent value="org-coaches">
          {loadingOrgCoaches ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : !orgCoaches || orgCoaches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
              <p className="empty-state-title">{bi("لا يوجد مدربون بعد", "No coaches yet")}</p>
              <p className="empty-state-desc">{bi("استكشف المدربين وادعُهم للانضمام لمنظمتك", "Explore coaches and invite them to join your organization")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{bi("المدرب", "Coach")}</TableHead>
                  <TableHead className="text-right hidden md:table-cell">{bi("التخصص", "Specialization")}</TableHead>
                  <TableHead className="text-right hidden md:table-cell">{bi("الحالة", "Status")}</TableHead>
                  <TableHead className="text-right">{bi("الإجراءات", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgCoaches.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-xl shrink-0">
                          <AvatarImage src={coach.avatarUrl} />
                          <AvatarFallback className="rounded-xl bg-purple-500/10 text-purple-600 text-xs font-bold">
                            {coach.name?.charAt(0) ?? "م"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/organization-dashboard/coaches/${coach.id}`} className="font-medium hover:underline text-primary">{coach.name}</Link>
                          <p className="text-xs text-muted-foreground">
                            {coach.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {coach.expertise ? (
                        <Badge variant="outline">{coach.expertise}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status="active" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/organization-dashboard/coaches/${coach.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          {bi("عرض", "View")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={loadingAction === coach.id}
                          onClick={() => handleRemove(coach.id)}
                        >
                          <UserX className="h-4 w-4 ml-1" />
                          {bi("إزالة", "Remove")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: billing */}
        <TabsContent value="billing">
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="stat-card border-0 bg-sky-500/10">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{totalHours.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("إجمالي الساعات المنجزة", "Total completed hours")}</p>
                </CardContent>
              </Card>
              <Card className="stat-card border-0 bg-emerald-500/10">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center mb-3">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{totalCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("إجمالي التكلفة (د.أ)", "Total cost (JOD)")}</p>
                </CardContent>
              </Card>
              <Card className="stat-card border-0 bg-purple-500/10">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center mb-3">
                    <UserX className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{billingCoaches.length}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("عدد المدربين", "Number of coaches")}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{bi("تفاصيل محاسبة المدربين", "Coach billing details")}</CardTitle>
                  <CardDescription>{bi("حدد معدل الساعة لكل مدرب واحتسب التكلفة بناءً على الجلسات المنجزة", "Set an hourly rate for each coach and calculate cost based on completed sessions")}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchBilling} disabled={billingLoading}>
                  <RefreshCw className={`h-4 w-4 ml-1 ${billingLoading ? 'animate-spin' : ''}`} />
                  {bi("تحديث", "Refresh")}
                </Button>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                  </div>
                ) : billingCoaches.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
                    <p className="empty-state-title">{bi("لا يوجد مدربون", "No coaches")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{bi("المدرب", "Coach")}</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">{bi("الساعات المنجزة", "Completed hours")}</TableHead>
                        <TableHead className="text-center">{bi("معدل الساعة (د.أ)", "Hourly rate (JOD)")}</TableHead>
                        <TableHead className="text-center hidden md:table-cell">{bi("الساعات المتعاقدة", "Contracted hours")}</TableHead>
                        <TableHead className="text-center">{bi("التكلفة الإجمالية", "Total cost")}</TableHead>
                        <TableHead className="text-center">{bi("حفظ", "Save")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingCoaches.map((coach) => {
                        const editing = editingRates[coach.id] || { hourlyRate: '', contractedHours: '' };
                        const currentRate = Number(editing.hourlyRate) || 0;
                        const previewCost = Math.round(coach.totalHours * currentRate * 100) / 100;
                        return (
                          <TableRow key={coach.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-9 w-9 rounded-xl shrink-0">
                                  <AvatarImage src={coach.avatarUrl} />
                                  <AvatarFallback className="rounded-xl bg-purple-500/10 text-purple-600 text-xs font-bold">{coach.name?.charAt(0) ?? 'م'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{coach.name}</p>
                                  <p className="text-xs text-muted-foreground hidden sm:block">{coach.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <Badge variant="secondary" className="text-sm">{coach.totalHours}h</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                className="w-24 text-center mx-auto"
                                value={editing.hourlyRate}
                                onChange={e => setEditingRates(prev => ({
                                  ...prev,
                                  [coach.id]: { ...prev[coach.id], hourlyRate: e.target.value },
                                }))}
                              />
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                className="w-24 text-center mx-auto"
                                placeholder="—"
                                value={editing.contractedHours}
                                onChange={e => setEditingRates(prev => ({
                                  ...prev,
                                  [coach.id]: { ...prev[coach.id], contractedHours: e.target.value },
                                }))}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-primary">
                                {previewCost.toFixed(2)} {bi("د.أ", "JOD")}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingRate === coach.id}
                                onClick={() => handleSaveRate(coach.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: explore coaches */}
        <TabsContent value="explore">
          {loadingAllCoaches ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : availableCoaches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
              <p className="empty-state-title">{bi("لا يوجد مدربون متاحون", "No available coaches")}</p>
              <p className="empty-state-desc">{bi("جميع المدربين المتاحين أعضاء في منظمتك بالفعل", "All available coaches are already members of your organization")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCoaches.map((coach) => {
                const isSent = sentInvites.has(coach.id);
                return (
                  <Card key={coach.id} className="border-0 shadow-sm card-hover">
                    <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                      <Avatar className="h-14 w-14 rounded-2xl">
                        <AvatarImage src={coach.avatarUrl} />
                        <AvatarFallback className="rounded-2xl bg-purple-500/10 text-purple-600 font-bold text-lg">
                          {coach.name?.charAt(0) ?? "م"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{coach.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {coach.expertise ?? bi("لا يوجد تخصص محدد", "No specialization specified")}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {isSent ? (
                          <Button variant="outline" size="sm" disabled>{bi("تم الإرسال", "Sent")}</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={loadingAction === coach.id} onClick={() => handleInvite(coach)}>
                            <Send className="h-4 w-4 ml-1" />
                            {bi("دعوة", "Invite")}
                          </Button>
                        )}
                        <Button size="sm" onClick={() => openOfferModal(coach)}>
                          <Gift className="h-4 w-4 ml-1" />
                          {bi("إرسال عرض", "Send offer")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Content Offer Modal */}
      <Dialog open={!!offerCoach} onOpenChange={(open) => !open && setOfferCoach(null)}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bi("إرسال عرض للمدرب", "Send offer to coach")} {offerCoach?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{bi("نوع المحتوى", "Content type")}</Label>
              <Select
                value={offerForm.offerType}
                onValueChange={(v) => setOfferForm(f => ({ ...f, offerType: v as 'course'|'live_session', contentId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">
                    <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {bi("دورة مسجلة", "Recorded course")}</span>
                  </SelectItem>
                  <SelectItem value="live_session">
                    <span className="flex items-center gap-2"><Video className="h-4 w-4" /> {bi("جلسة مباشرة", "Live session")}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{bi("المحتوى", "Content")}</Label>
              {offerLoading ? (
                <div className="h-10 rounded-md bg-muted animate-pulse" />
              ) : (
                <Select
                  value={offerForm.contentId}
                  onValueChange={(v) => setOfferForm(f => ({ ...f, contentId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={bi("اختر...", "Choose...")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(offerForm.offerType === 'course' ? coachContent.courses : coachContent.liveSessions).length === 0 ? (
                      <SelectItem value="__none" disabled>
                        {offerForm.offerType === 'course' ? bi('لا توجد دورات منشورة', 'No published courses') : bi('لا توجد جلسات مباشرة منشورة', 'No published live sessions')}
                      </SelectItem>
                    ) : (
                      (offerForm.offerType === 'course' ? coachContent.courses : coachContent.liveSessions).map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-note">{bi("ملاحظة (اختياري)", "Note (optional)")}</Label>
              <Textarea
                id="offer-note"
                value={offerForm.note}
                onChange={e => setOfferForm(f => ({ ...f, note: e.target.value }))}
                placeholder={bi("رسالة للمدرب حول العرض...", "A message to the coach about the offer...")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOfferCoach(null)} disabled={sendingOffer}>{bi("إلغاء", "Cancel")}</Button>
            <Button onClick={handleSendOffer} disabled={sendingOffer || !offerForm.contentId}>
              {sendingOffer ? bi('جاري الإرسال...', 'Sending...') : bi('إرسال العرض', 'Send offer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
