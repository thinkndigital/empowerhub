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
import { UserX, Send, Eye, Save, Clock, DollarSign, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());

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
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل بيانات المحاسبة.' });
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
      toast({ title: 'تم الحفظ', description: 'تم تحديث معدل الساعة بنجاح.' });
      fetchBilling();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ معدل الساعة.' });
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
      toast({ title: "تمت الإزالة", description: "تم إزالة المدرب من المنظمة." });
      refetchOrg();
    } catch {
      toast({ title: "خطأ", description: "فشل في إزالة المدرب.", variant: "destructive" });
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
      toast({ title: "تم الإرسال", description: "تم إرسال الدعوة للمدرب." });
    } catch {
      toast({ title: "خطأ", description: "فشل في إرسال الدعوة.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const totalCost = billingCoaches.reduce((s, c) => s + c.totalCost, 0);
  const totalHours = billingCoaches.reduce((s, c) => s + c.totalHours, 0);

  return (
    <div className="space-y-6 animate-fade-in-up" dir="rtl">
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المدربين</h1>
          <p className="page-subtitle">استعرض مدربي منظمتك أو ادعُ مدربين جدد</p>
        </div>
      </div>

      <Tabs defaultValue="org-coaches" dir="rtl">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org-coaches">المدربون</TabsTrigger>
          <TabsTrigger value="billing" onClick={fetchBilling}>محاسبة المدربين</TabsTrigger>
          <TabsTrigger value="explore">استكشاف المدربين</TabsTrigger>
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
              <p className="empty-state-title">لا يوجد مدربون بعد</p>
              <p className="empty-state-desc">استكشف المدربين وادعُهم للانضمام لمنظمتك</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المدرب</TableHead>
                  <TableHead className="text-right hidden md:table-cell">التخصص</TableHead>
                  <TableHead className="text-right hidden md:table-cell">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
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
                          عرض
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={loadingAction === coach.id}
                          onClick={() => handleRemove(coach.id)}
                        >
                          <UserX className="h-4 w-4 ml-1" />
                          إزالة
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
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">إجمالي الساعات المنجزة</p>
                </CardContent>
              </Card>
              <Card className="stat-card border-0 bg-emerald-500/10">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center mb-3">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{totalCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">إجمالي التكلفة (د.أ)</p>
                </CardContent>
              </Card>
              <Card className="stat-card border-0 bg-purple-500/10">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center mb-3">
                    <UserX className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{billingCoaches.length}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">عدد المدربين</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>تفاصيل محاسبة المدربين</CardTitle>
                  <CardDescription>حدد معدل الساعة لكل مدرب واحتسب التكلفة بناءً على الجلسات المنجزة</CardDescription>
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
                ) : billingCoaches.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><UserX className="h-6 w-6" /></div>
                    <p className="empty-state-title">لا يوجد مدربون</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المدرب</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">الساعات المنجزة</TableHead>
                        <TableHead className="text-center">معدل الساعة (د.أ)</TableHead>
                        <TableHead className="text-center hidden md:table-cell">الساعات المتعاقدة</TableHead>
                        <TableHead className="text-center">التكلفة الإجمالية</TableHead>
                        <TableHead className="text-center">حفظ</TableHead>
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
                                {previewCost.toFixed(2)} د.أ
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
              <p className="empty-state-title">لا يوجد مدربون متاحون</p>
              <p className="empty-state-desc">جميع المدربين المتاحين أعضاء في منظمتك بالفعل</p>
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
                          {coach.expertise ?? "لا يوجد تخصص محدد"}
                        </p>
                      </div>
                      {isSent ? (
                        <Button variant="outline" size="sm" disabled>
                          تم الإرسال
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={loadingAction === coach.id}
                          onClick={() => handleInvite(coach)}
                        >
                          <Send className="h-4 w-4 ml-1" />
                          دعوة
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
