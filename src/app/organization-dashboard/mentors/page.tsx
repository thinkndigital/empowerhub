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
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل بيانات المحاسبة.' });
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
      toast({ title: 'تم الحفظ', description: 'تم تحديث معدل الساعة بنجاح.' });
      fetchBilling();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ معدل الساعة.' });
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
      toast({ title: "تمت الإزالة", description: "تم إزالة المرشد." });
      refetchOrg();
    } catch {
      toast({ title: "خطأ", description: "فشل في إزالة المرشد.", variant: "destructive" });
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
      toast({ title: "تم الإرسال", description: "تم إرسال الدعوة للمرشد." });
    } catch {
      toast({ title: "خطأ", description: "فشل في إرسال الدعوة.", variant: "destructive" });
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
          contentTitle: 'خدمات الإرشاد',
          note: offerNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: 'تم الإرسال', description: 'تم إرسال العرض للمرشد.' });
      setOfferMentor(null);
      setOfferNote('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setSendingOffer(false);
    }
  };

  const totalCost = billingMentors.reduce((s, m) => s + m.totalCost, 0);
  const totalHours = billingMentors.reduce((s, m) => s + m.totalHours, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إدارة المرشدين</h1>
        <p className="text-sm text-muted-foreground">استعرض المرشدين أو ادعُ مرشدين جدد</p>
      </div>

      <Tabs defaultValue="org-mentors" dir="rtl">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org-mentors">المرشدون</TabsTrigger>
          <TabsTrigger value="billing" onClick={fetchBilling}>محاسبة المرشدين</TabsTrigger>
          <TabsTrigger value="explore">استكشاف المرشدين</TabsTrigger>
        </TabsList>

        {/* Tab 1: org mentors */}
        <TabsContent value="org-mentors">
          {loadingOrgMentors ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : !orgMentors || orgMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <UserX className="h-10 w-10" />
              <p>لا يوجد مرشدون بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المرشد</TableHead>
                    <TableHead className="text-right hidden md:table-cell">التخصص</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgMentors.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={mentor.avatarUrl} />
                            <AvatarFallback>{mentor.name?.charAt(0) ?? "م"}</AvatarFallback>
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
                        <Badge variant="default">نشط</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/organization-dashboard/mentors/${mentor.id}`)}>
                            <Eye className="h-4 w-4 ml-1" />عرض
                          </Button>
                          <Button variant="destructive" size="sm" disabled={loadingAction === mentor.id} onClick={() => handleRemove(mentor.id)}>
                            <UserX className="h-4 w-4 ml-1" />إزالة
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
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الساعات المنجزة</p>
                      <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي التكلفة (د.أ)</p>
                      <p className="text-2xl font-bold">{totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><Users className="h-5 w-5 text-purple-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">عدد المرشدين</p>
                      <p className="text-2xl font-bold">{billingMentors.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>تفاصيل محاسبة المرشدين</CardTitle>
                  <CardDescription>حدد معدل الساعة لكل مرشد واحتسب التكلفة بناءً على الجلسات المنجزة</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchBilling} disabled={billingLoading}>
                  <RefreshCw className={`h-4 w-4 ml-1 ${billingLoading ? 'animate-spin' : ''}`} />
                  تحديث
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
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <UserX className="h-10 w-10" />
                    <p>لا يوجد مرشدون بعد</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">المرشد</TableHead>
                          <TableHead className="text-center hidden sm:table-cell">الساعات المنجزة</TableHead>
                          <TableHead className="text-center">معدل الساعة (د.أ)</TableHead>
                          <TableHead className="text-center hidden md:table-cell">الساعات المتعاقدة</TableHead>
                          <TableHead className="text-center">التكلفة الإجمالية</TableHead>
                          <TableHead className="text-center">حفظ</TableHead>
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
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={mentor.avatarUrl} />
                                    <AvatarFallback>{mentor.name?.charAt(0) ?? 'م'}</AvatarFallback>
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
                                  {previewCost.toFixed(2)} د.أ
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
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : availableMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <p>لا يوجد مرشدون متاحون للدعوة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMentors.map((mentor) => {
                const isSent = sentInvites.has(mentor.id);
                return (
                  <Card key={mentor.id} className="border-0 shadow-sm">
                    <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={mentor.avatarUrl} />
                        <AvatarFallback>{mentor.name?.charAt(0) ?? "م"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {mentor.expertise ?? "لا يوجد تخصص محدد"}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {isSent ? (
                          <Button variant="outline" size="sm" disabled>تم الإرسال</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={loadingAction === mentor.id} onClick={() => handleInvite(mentor)}>
                            <Send className="h-4 w-4 ml-1" />دعوة
                          </Button>
                        )}
                        <Button size="sm" onClick={() => { setOfferMentor(mentor); setOfferNote(''); }}>
                          <Gift className="h-4 w-4 ml-1" />إرسال عرض
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
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال عرض للمرشد {offerMentor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              سيتلقى المرشد عرضاً لتقديم خدمات الإرشاد لمستفيدي منظمتك. عند القبول ستتمكنين من تعيين المستفيدين لجلساته.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="mentor-offer-note">ملاحظة (اختياري)</Label>
              <Textarea
                id="mentor-offer-note"
                value={offerNote}
                onChange={e => setOfferNote(e.target.value)}
                placeholder="رسالة للمرشد حول العرض..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOfferMentor(null)} disabled={sendingOffer}>إلغاء</Button>
            <Button onClick={handleSendMentorOffer} disabled={sendingOffer}>
              {sendingOffer ? 'جاري الإرسال...' : 'إرسال العرض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
