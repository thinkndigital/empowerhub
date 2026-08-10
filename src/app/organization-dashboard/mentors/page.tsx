"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { useUser } from "@/firebase/auth/use-user";
import { useOrgUsers } from "@/hooks/use-org-users";
import type { OrgUser } from "@/hooks/use-org-users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserX, Send, Eye, Save, Clock, DollarSign, RefreshCw, Users, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/language-provider";

async function apiAction(user: User, body: object) {
  const token = await user.getIdToken();
  const res = await fetch("/api/org/action", {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

type BillingMentor = {
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

export default function OrgMentorsPage() {
  const { user, userProfile } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());

  // Content offer state
  const [offerMentor, setOfferMentor] = useState<OrgUser | null>(null);
  const [offerNote, setOfferNote] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  // Billing state
  const [billingMentors, setBillingMentors] = useState<BillingMentor[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, { hourlyRate: string; contractedHours: string }>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

  const orgId = userProfile?.organizationId ?? "";

  const { data: orgMentors, isLoading: loadingOrgMentors, refetch: refetchOrg } =
    useOrgUsers("mentor", "org");

  const { data: allMentors, isLoading: loadingAllMentors } =
    useOrgUsers("mentor", "all");

  const orgMentorIds = new Set((orgMentors ?? []).map((m) => m.id));
  const availableMentors = (allMentors ?? []).filter((m) => !orgMentorIds.has(m.id));

  const fetchBilling = useCallback(async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/mentors/billing', {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const mentors: BillingMentor[] = json.mentors || [];
      setBillingMentors(mentors);
      const rates: Record<string, { hourlyRate: string; contractedHours: string }> = {};
      mentors.forEach(m => {
        rates[m.id] = {
          hourlyRate: m.hourlyRate ? String(m.hourlyRate) : '',
          contractedHours: m.contractedHours != null ? String(m.contractedHours) : '',
        };
      });
      setEditingRates(rates);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل بيانات المحاسبة.', 'Failed to load billing data.') });
    } finally {
      setBillingLoading(false);
    }
  }, [user, toast]);

  const handleSaveRate = async (mentorId: string) => {
    if (!user) return;
    const rate = editingRates[mentorId];
    if (!rate) return;
    setSavingRate(mentorId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/mentors/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mentorId,
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

  const handleRemove = async (mentorId: string) => {
    if (!user) return;
    setLoadingAction(mentorId);
    try {
      const result = await apiAction(user, { action: "removeFromOrg", userId: mentorId });
      if (result.error) throw new Error(result.error);
      toast({ title: bi("تمت الإزالة", "Removed"), description: bi("تم إزالة المرشد.", "The mentor was removed.") });
      refetchOrg();
    } catch {
      toast({ title: bi("خطأ", "Error"), description: bi("فشل في إزالة المرشد.", "Failed to remove the mentor."), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInvite = async (mentor: OrgUser) => {
    if (!user || !orgId) return;
    setLoadingAction(mentor.id);
    try {
      const result = await apiAction(user, {
        action: "invite",
        targetUid: mentor.id,
        targetName: mentor.name ?? "",
        targetRole: "mentor",
      });
      if (result.error) throw new Error(result.error);
      setSentInvites((prev) => new Set(prev).add(mentor.id));
      toast({ title: bi("تم الإرسال", "Sent"), description: bi("تم إرسال الدعوة للمرشد.", "The invitation was sent to the mentor.") });
    } catch {
      toast({ title: bi("خطأ", "Error"), description: bi("فشل في إرسال الدعوة.", "Failed to send the invitation."), variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendMentorOffer = async () => {
    if (!user || !offerMentor) return;
    setSendingOffer(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/content-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetUid: offerMentor.id,
          targetName: offerMentor.name || '',
          targetRole: 'mentor',
          offerType: 'sessions',
          contentId: '',
          contentTitle: bi('خدمات الإرشاد', 'Mentoring services'),
          note: offerNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: bi('تم الإرسال', 'Sent'), description: bi('تم إرسال العرض للمرشد.', 'The offer was sent to the mentor.') });
      setOfferMentor(null);
      setOfferNote('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
    } finally {
      setSendingOffer(false);
    }
  };

  const totalCost = billingMentors.reduce((s, m) => s + m.totalCost, 0);
  const totalHours = billingMentors.reduce((s, m) => s + m.totalHours, 0);

  return (
    <div className="space-y-6 animate-fade-in-up" dir={dir}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("إدارة المرشدين", "Manage mentors")}</h1>
          <p className="page-subtitle">{bi("استعرض مرشدي منظمتك أو ادعُ مرشدين جدد", "Browse your organization's mentors or invite new ones")}</p>
        </div>
      </div>

      <Tabs defaultValue="org-mentors" dir={dir}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org-mentors">{bi("المرشدون", "Mentors")}</TabsTrigger>
          <TabsTrigger value="billing" onClick={fetchBilling}>{bi("محاسبة المرشدين", "Mentor billing")}</TabsTrigger>
          <TabsTrigger value="explore">{bi("استكشاف المرشدين", "Explore mentors")}</TabsTrigger>
        </TabsList>

        {/* Tab 1: org mentors */}
        <TabsContent value="org-mentors">
          {loadingOrgMentors ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : !orgMentors || orgMentors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
              <p className="empty-state-title">{bi("لا يوجد مرشدون بعد", "No mentors yet")}</p>
              <p className="empty-state-desc">{bi("استكشف المرشدين وادعُهم للانضمام لمنظمتك", "Explore mentors and invite them to join your organization")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{bi("المرشد", "Mentor")}</TableHead>
                    <TableHead className="text-right hidden md:table-cell">{bi("التخصص", "Specialization")}</TableHead>
                    <TableHead className="text-right hidden md:table-cell">{bi("الحالة", "Status")}</TableHead>
                    <TableHead className="text-right">{bi("الإجراءات", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgMentors.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-xl shrink-0">
                            <AvatarImage src={mentor.avatarUrl} />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{mentor.name?.charAt(0) ?? "م"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/organization-dashboard/mentors/${mentor.id}`} className="font-medium hover:underline text-primary">{mentor.name}</Link>
                            <p className="text-xs text-muted-foreground">{mentor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {mentor.expertise ? <Badge variant="outline">{mentor.expertise}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge status="active" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/organization-dashboard/mentors/${mentor.id}`)}>
                            <Eye className="h-4 w-4 ml-1" />{bi("عرض", "View")}
                          </Button>
                          <Button variant="destructive" size="sm" disabled={loadingAction === mentor.id} onClick={() => handleRemove(mentor.id)}>
                            <UserX className="h-4 w-4 ml-1" />{bi("إزالة", "Remove")}
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
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{billingMentors.length}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{bi("عدد المرشدين", "Number of mentors")}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{bi("تفاصيل محاسبة المرشدين", "Mentor billing details")}</CardTitle>
                  <CardDescription>{bi("حدد معدل الساعة لكل مرشد واحتسب التكلفة بناءً على الجلسات المنجزة", "Set an hourly rate for each mentor and calculate cost based on completed sessions")}</CardDescription>
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
                ) : billingMentors.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
                    <p className="empty-state-title">{bi("لا يوجد مرشدون", "No mentors")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">{bi("المرشد", "Mentor")}</TableHead>
                          <TableHead className="text-center hidden sm:table-cell">{bi("الساعات المنجزة", "Completed hours")}</TableHead>
                          <TableHead className="text-center">{bi("معدل الساعة (د.أ)", "Hourly rate (JOD)")}</TableHead>
                          <TableHead className="text-center hidden md:table-cell">{bi("الساعات المتعاقدة", "Contracted hours")}</TableHead>
                          <TableHead className="text-center">{bi("التكلفة الإجمالية", "Total cost")}</TableHead>
                          <TableHead className="text-center">{bi("حفظ", "Save")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingMentors.map((mentor) => {
                          const editing = editingRates[mentor.id] || { hourlyRate: '', contractedHours: '' };
                          const currentRate = Number(editing.hourlyRate) || 0;
                          const previewCost = Math.round(mentor.totalHours * currentRate * 100) / 100;
                          return (
                            <TableRow key={mentor.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-9 w-9 rounded-xl shrink-0">
                                    <AvatarImage src={mentor.avatarUrl} />
                                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{mentor.name?.charAt(0) ?? 'م'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{mentor.name}</p>
                                    <p className="text-xs text-muted-foreground hidden sm:block">{mentor.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center hidden sm:table-cell">
                                <Badge variant="secondary" className="text-sm">{mentor.totalHours}h</Badge>
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
                                    [mentor.id]: { ...prev[mentor.id], hourlyRate: e.target.value },
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
                                    [mentor.id]: { ...prev[mentor.id], contractedHours: e.target.value },
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
                                  disabled={savingRate === mentor.id}
                                  onClick={() => handleSaveRate(mentor.id)}
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

        {/* Tab 3: explore mentors */}
        <TabsContent value="explore">
          {loadingAllMentors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : availableMentors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
              <p className="empty-state-title">{bi("لا يوجد مرشدون متاحون", "No available mentors")}</p>
              <p className="empty-state-desc">{bi("جميع المرشدين المتاحين أعضاء في منظمتك بالفعل", "All available mentors are already members of your organization")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMentors.map((mentor) => {
                const isSent = sentInvites.has(mentor.id);
                return (
                  <Card key={mentor.id} className="border-0 shadow-sm card-hover">
                    <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                      <Avatar className="h-14 w-14 rounded-2xl">
                        <AvatarImage src={mentor.avatarUrl} />
                        <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">{mentor.name?.charAt(0) ?? "م"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {mentor.expertise ?? bi("لا يوجد تخصص محدد", "No specialization specified")}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {isSent ? (
                          <Button variant="outline" size="sm" disabled>{bi("تم الإرسال", "Sent")}</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={loadingAction === mentor.id} onClick={() => handleInvite(mentor)}>
                            <Send className="h-4 w-4 ml-1" />{bi("دعوة", "Invite")}
                          </Button>
                        )}
                        <Button size="sm" onClick={() => { setOfferMentor(mentor); setOfferNote(''); }}>
                          <Gift className="h-4 w-4 ml-1" />{bi("إرسال عرض", "Send offer")}
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

      {/* Mentor Offer Modal */}
      <Dialog open={!!offerMentor} onOpenChange={(open) => !open && setOfferMentor(null)}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bi("إرسال عرض للمرشد", "Send offer to mentor")} {offerMentor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {bi("سيتلقى المرشد عرضاً لتقديم خدمات الإرشاد لمستفيدي منظمتك. عند القبول ستتمكنين من تعيين المستفيدين لجلساته.", "The mentor will receive an offer to provide mentoring services to your organization's beneficiaries. Once accepted, you'll be able to assign beneficiaries to their sessions.")}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="mentor-offer-note">{bi("ملاحظة (اختياري)", "Note (optional)")}</Label>
              <Textarea
                id="mentor-offer-note"
                value={offerNote}
                onChange={e => setOfferNote(e.target.value)}
                placeholder={bi("رسالة للمرشد حول العرض...", "A message to the mentor about the offer...")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOfferMentor(null)} disabled={sendingOffer}>{bi("إلغاء", "Cancel")}</Button>
            <Button onClick={handleSendMentorOffer} disabled={sendingOffer}>
              {sendingOffer ? bi('جاري الإرسال...', 'Sending...') : bi('إرسال العرض', 'Send offer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
