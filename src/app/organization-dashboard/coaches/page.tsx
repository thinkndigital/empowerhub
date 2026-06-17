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
import { UserX, Send } from "lucide-react";

interface CoachUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string;
  expertise?: string;
  avatarUrl?: string;
  status?: string;
}

interface OrgInvitation {
  id: string;
  orgId: string;
  orgName: string;
  targetUid: string;
  targetName: string;
  targetRole: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: unknown;
}

export default function OrgCoachesPage() {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const orgId = userProfile?.organizationId ?? "";
  const orgName = userProfile?.name ?? "";

  // Tab 1: coaches in org
  const orgCoachesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "users"),
      where("role", "==", "coach"),
      where("organizationId", "==", orgId)
    );
  }, [firestore, orgId]);
  const { data: orgCoaches, isLoading: loadingOrgCoaches } =
    useCollection<CoachUser>(orgCoachesQuery);

  // Tab 2: all coaches
  const allCoachesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "users"),
      where("role", "==", "coach")
    );
  }, [firestore]);
  const { data: allCoaches, isLoading: loadingAllCoaches } =
    useCollection<CoachUser>(allCoachesQuery);

  // Pending invitations for this org
  const pendingInvitesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "orgInvitations"),
      where("orgId", "==", orgId),
      where("targetRole", "==", "coach"),
      where("status", "==", "pending")
    );
  }, [firestore, orgId]);
  const { data: pendingInvites } =
    useCollection<OrgInvitation>(pendingInvitesQuery);

  const pendingUids = new Set((pendingInvites ?? []).map((inv) => inv.targetUid));
  const orgCoachIds = new Set((orgCoaches ?? []).map((c) => c.id));
  const availableCoaches = (allCoaches ?? []).filter(
    (c) => !orgCoachIds.has(c.id)
  );

  const handleRemove = async (coachId: string) => {
    if (!firestore) return;
    setLoadingAction(coachId);
    try {
      await updateDoc(doc(firestore, "users", coachId), {
        organizationId: null,
      });
      toast({ title: "تمت الإزالة", description: "تم إزالة المدرب من المنظمة." });
    } catch {
      toast({ title: "خطأ", description: "فشل في إزالة المدرب.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInvite = async (coach: CoachUser) => {
    if (!firestore || !orgId) return;
    setLoadingAction(coach.id);
    try {
      await addDoc(collection(firestore, "orgInvitations"), {
        orgId,
        orgName,
        targetUid: coach.id,
        targetName: coach.name,
        targetRole: "coach",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(firestore, "notifications"), {
        userId: coach.id,
        title: "دعوة من منظمة",
        body: `منظمة ${orgName} تدعوك للانضمام إليها`,
        read: false,
        createdAt: serverTimestamp(),
        link: "/coach-dashboard/invitations",
      });
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
        <h1 className="text-2xl font-bold">إدارة المدربين</h1>
        <p className="text-muted-foreground">
          استعرض مدربي منظمتك أو ادعُ مدربين جدد
        </p>
      </div>

      <Tabs defaultValue="org-coaches">
        <TabsList className="mb-4">
          <TabsTrigger value="org-coaches">مدربو منظمتي</TabsTrigger>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المدرب</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
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
                          <p className="font-medium">{coach.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {coach.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{coach.expertise ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          coach.status === "active" ? "default" : "secondary"
                        }
                      >
                        {coach.status === "active" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={loadingAction === coach.id}
                        onClick={() => handleRemove(coach.id)}
                      >
                        <UserX className="h-4 w-4 ml-1" />
                        إزالة
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                const isPending = pendingUids.has(coach.id);
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
                      {isPending ? (
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
