"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserX, Send, Eye } from "lucide-react";
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

export default function OrgCoachesPage() {
  const { user, userProfile } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());

  const orgId = userProfile?.organizationId ?? "";

  const { data: orgCoaches, isLoading: loadingOrgCoaches, refetch: refetchOrg } =
    useOrgUsers("coach", "org");

  const { data: allCoaches, isLoading: loadingAllCoaches } =
    useOrgUsers("coach", "all");

  const orgCoachIds = new Set((orgCoaches ?? []).map((c) => c.id));
  const availableCoaches = (allCoaches ?? []).filter(
    (c) => !orgCoachIds.has(c.id)
  );

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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إدارة المدربين</h1>
        <p className="text-sm text-muted-foreground">استعرض مدربي منظمتك أو ادعُ مدربين جدد</p>
      </div>

      <Tabs defaultValue="org-coaches" dir="rtl">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org-coaches">المدربون</TabsTrigger>
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
              <p>لا يوجد مدربون في منظمتك بعد</p>
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

        {/* Tab 2: explore coaches */}
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
                  <Card key={coach.id}>
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
