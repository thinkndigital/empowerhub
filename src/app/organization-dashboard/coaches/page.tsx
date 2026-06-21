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
      toast({ title: "تمت الإزالة", description: "تم إزالة المدرب." });
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
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إدارة المدربين</h1>
        <p className="text-sm text-muted-foreground">استعرض المدربين أو ادعُ مدربين جدد</p>
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
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : !orgCoaches || orgCoaches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <UserX className="h-10 w-10" />
              <p>لا يوجد مدربون بعد</p>
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
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={coach.avatarUrl} />
                          <AvatarFallback>
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
                      <Badge variant="default">نشط</Badge>
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
                    <div className="p-2 bg-purple-100 rounded-lg"><UserX className="h-5 w-5 text-purple-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">عدد المدربين</p>
                      <p className="text-2xl font-bold">{billingCoaches.length}</p>
                    </div>
                  </div>
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
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <UserX className="h-10 w-10" />
                    <p>لا يوجد مدربون بعد</p>
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
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={coach.avatarUrl} />
                                  <AvatarFallback>{coach.name?.charAt(0) ?? 'م'}</AvatarFallback>
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
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : availableCoaches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <p>لا يوجد مدربون متاحون للدعوة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCoaches.map((coach) => {
                const isSent = sentInvites.has(coach.id);
                return (
                  <Card key={coach.id} className="border-0 shadow-sm">
                    <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={coach.avatarUrl} />
                        <AvatarFallback>
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
