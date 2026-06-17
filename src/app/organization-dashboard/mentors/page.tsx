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

interface MentorUser {
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

export default function OrgMentorsPage() {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const orgId = userProfile?.organizationId ?? "";
  const orgName = userProfile?.name ?? "";

  // Tab 1: mentors in org
  const orgMentorsQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "users"),
      where("role", "==", "mentor"),
      where("organizationId", "==", orgId)
    );
  }, [firestore, orgId]);
  const { data: orgMentors, isLoading: loadingOrgMentors } =
    useCollection<MentorUser>(orgMentorsQuery);

  // Tab 2: all mentors (filter out org ones in render)
  const allMentorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "users"),
      where("role", "==", "mentor")
    );
  }, [firestore]);
  const { data: allMentors, isLoading: loadingAllMentors } =
    useCollection<MentorUser>(allMentorsQuery);

  // Pending invitations for this org
  const pendingInvitesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "orgInvitations"),
      where("orgId", "==", orgId),
      where("targetRole", "==", "mentor"),
      where("status", "==", "pending")
    );
  }, [firestore, orgId]);
  const { data: pendingInvites } =
    useCollection<OrgInvitation>(pendingInvitesQuery);

  const pendingUids = new Set((pendingInvites ?? []).map((inv) => inv.targetUid));
  const orgMentorIds = new Set((orgMentors ?? []).map((m) => m.id));
  const availableMentors = (allMentors ?? []).filter(
    (m) => !orgMentorIds.has(m.id)
  );

  const handleRemove = async (mentorId: string) => {
    if (!firestore) return;
    setLoadingAction(mentorId);
    try {
      await updateDoc(doc(firestore, "users", mentorId), {
        organizationId: null,
      });
      toast({ title: "تمت الإزالة", description: "تم إزالة المرشد من المنظمة." });
    } catch {
      toast({ title: "خطأ", description: "فشل في إزالة المرشد.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInvite = async (mentor: MentorUser) => {
    if (!firestore || !orgId) return;
    setLoadingAction(mentor.id);
    try {
      await addDoc(collection(firestore, "orgInvitations"), {
        orgId,
        orgName,
        targetUid: mentor.id,
        targetName: mentor.name,
        targetRole: "mentor",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(firestore, "notifications"), {
        userId: mentor.id,
        title: "دعوة من منظمة",
        body: `منظمة ${orgName} تدعوك للانضمام إليها`,
        read: false,
        createdAt: serverTimestamp(),
        link: "/mentor-dashboard/invitations",
      });
      toast({ title: "تم الإرسال", description: "تم إرسال الدعوة للمرشد." });
    } catch {
      toast({ title: "خطأ", description: "فشل في إرسال الدعوة.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">إدارة المرشدين</h1>
        <p className="text-muted-foreground">
          استعرض مرشدي منظمتك أو ادعُ مرشدين جدد
        </p>
      </div>

      <Tabs defaultValue="org-mentors">
        <TabsList className="mb-4">
          <TabsTrigger value="org-mentors">مرشدو منظمتي</TabsTrigger>
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
              <p>لا يوجد مرشدون في منظمتك بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المرشد</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
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
                          <AvatarFallback>
                            {mentor.name?.charAt(0) ?? "م"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{mentor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {mentor.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{mentor.expertise ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          mentor.status === "active" ? "default" : "secondary"
                        }
                      >
                        {mentor.status === "active" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={loadingAction === mentor.id}
                        onClick={() => handleRemove(mentor.id)}
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

        {/* Tab 2: explore mentors */}
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
                const isPending = pendingUids.has(mentor.id);
                return (
                  <Card key={mentor.id}>
                    <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={mentor.avatarUrl} />
                        <AvatarFallback>
                          {mentor.name?.charAt(0) ?? "م"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {mentor.expertise ?? "لا يوجد تخصص محدد"}
                        </p>
                      </div>
                      {isPending ? (
                        <Button variant="outline" size="sm" disabled>
                          تم الإرسال
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={loadingAction === mentor.id}
                          onClick={() => handleInvite(mentor)}
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
