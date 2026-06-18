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

export default function OrgMentorsPage() {
  const { user, userProfile } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());

  const orgId = userProfile?.organizationId ?? "";

  const { data: orgMentors, isLoading: loadingOrgMentors, refetch: refetchOrg } =
    useOrgUsers("mentor", "org");

  const { data: allMentors, isLoading: loadingAllMentors } =
    useOrgUsers("mentor", "all");

  const orgMentorIds = new Set((orgMentors ?? []).map((m) => m.id));
  const availableMentors = (allMentors ?? []).filter(
    (m) => !orgMentorIds.has(m.id)
  );

  const handleRemove = async (mentorId: string) => {
    if (!user) return;
    setLoadingAction(mentorId);
    try {
      const result = await apiAction(user, { action: "removeFromOrg", userId: mentorId });
      if (result.error) throw new Error(result.error);
      toast({ title: "تمت الإزالة", description: "تم إزالة المرشد من المنظمة." });
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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">إدارة المرشدين</h1>
        <p className="text-muted-foreground">
          استعرض مرشدي منظمتك أو ادعُ مرشدين جدد
        </p>
      </div>

      <Tabs defaultValue="org-mentors" dir="rtl">
        <TabsList className="mb-4 w-full justify-start">
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
                          <Link href={`/organization-dashboard/mentors/${mentor.id}`} className="font-medium hover:underline text-primary">{mentor.name}</Link>
                          <p className="text-xs text-muted-foreground">
                            {mentor.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mentor.expertise ? (
                        <Badge variant="outline">{mentor.expertise}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (!mentor.status || mentor.status === "active") ? "default" : "secondary"
                        }
                      >
                        {(!mentor.status || mentor.status === "active") ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/organization-dashboard/mentors/${mentor.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={loadingAction === mentor.id}
                          onClick={() => handleRemove(mentor.id)}
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
                const isSent = sentInvites.has(mentor.id);
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
                      {isSent ? (
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
