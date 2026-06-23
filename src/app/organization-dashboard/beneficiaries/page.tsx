"use client";

import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import {
  MoreHorizontal, PlusCircle, Users, Search, UserPlus, Mail, Upload, Loader2,
} from "lucide-react";
import { ExportButton } from "@/components/export-button";
import type { User } from "firebase/auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { useOrgUsers } from "@/hooks/use-org-users";
import { useOrgGroups } from "@/hooks/use-org-groups";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrgUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  avatarUrl?: string;
  status?: string;
  progress?: number;
  groupId?: string;
  mentorId?: string;
  coachId?: string;
};

type OrgGroup = {
  id: string;
  name: string;
  orgId: string;
  memberIds: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function derivedStatus(progress = 0): string {
  if (progress >= 100) return "مكتمل";
  if (progress > 0) return "نشط";
  return "جديد";
}

async function apiAction(user: User, body: object) {
  const token = await user.getIdToken();
  const res = await fetch("/api/org/action", {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(cols)].map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BeneficiariesPage() {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const orgId = userProfile?.organizationId || "";

  // ── Data hooks ──
  const {
    data: orgUsers,
    isLoading: orgLoading,
    refetch: refetchOrg,
  } = useOrgUsers("beneficiary", "org");

  const {
    data: allUsers,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useOrgUsers("beneficiary", "all");

  const {
    data: groups,
    isLoading: groupsLoading,
    refetch: refetchGroups,
  } = useOrgGroups();

  const { data: orgMentors } = useOrgUsers('mentor', 'org');
  const { data: orgCoaches } = useOrgUsers('coach', 'org');

  // ── Derived data ──
  const orgUserIds = useMemo(() => new Set((orgUsers ?? []).map((u) => u.id)), [orgUsers]);

  const explorerUsers = useMemo(
    () => (allUsers ?? []).filter((u) => !orgUserIds.has(u.id)),
    [allUsers, orgUserIds],
  );

  // ── UI state ──
  const [groupFilter, setGroupFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<OrgUser | null>(null);
  const [assignGroupTarget, setAssignGroupTarget] = useState<OrgUser | null>(null);
  const [assignGroupId, setAssignGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteGroup, setInviteGroup] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [csvRows, setCsvRows] = useState<{ name: string; email: string }[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: number; error: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [assigningGroup, setAssigningGroup] = useState(false);
  const [removingUser, setRemovingUser] = useState(false);
  const [assignMentorTarget, setAssignMentorTarget] = useState<OrgUser | null>(null);
  const [assignMentorId, setAssignMentorId] = useState('');
  const [assignCoachTarget, setAssignCoachTarget] = useState<OrgUser | null>(null);
  const [assignCoachId, setAssignCoachId] = useState('');

  // ── Filtered org users ──
  const filteredOrgUsers = useMemo(() => {
    const list = orgUsers ?? [];
    if (groupFilter === "الكل") return list;
    const group = (groups ?? []).find((g) => g.id === groupFilter);
    if (!group) return list;
    return list.filter((u) => group.memberIds.includes(u.id));
  }, [orgUsers, groupFilter, groups]);

  // ── Filtered explorer users ──
  const filteredExplorerUsers = useMemo(() => {
    if (!searchQuery.trim()) return explorerUsers;
    const q = searchQuery.toLowerCase();
    return explorerUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [explorerUsers, searchQuery]);

  // ── Actions ──
  async function handleRemove() {
    if (!user || !removeTarget) return;
    setRemovingUser(true);
    try {
      await apiAction(user, { action: "removeFromOrg", userId: removeTarget.id });
      toast({ title: "تمت الإزالة", description: `تمت إزالة ${removeTarget.name}.` });
      refetchOrg();
      refetchAll();
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشلت عملية الإزالة." });
    } finally {
      setRemovingUser(false);
      setRemoveTarget(null);
    }
  }

  async function handleAddToOrg(u: OrgUser) {
    if (!user) return;
    setAddingUserId(u.id);
    try {
      await apiAction(user, { action: "addToOrg", userId: u.id });
      toast({ title: "تمت الإضافة", description: `تمت إضافة ${u.name}.` });
      refetchOrg();
      refetchAll();
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة المستفيد." });
    } finally {
      setAddingUserId(null);
    }
  }

  async function handleAssignGroup() {
    if (!user || !assignGroupTarget || !assignGroupId) return;
    setAssigningGroup(true);
    try {
      await apiAction(user, { action: "assignGroup", userId: assignGroupTarget.id, groupId: assignGroupId });
      toast({ title: "تم التعيين", description: `تم تعيين ${assignGroupTarget.name} للمجموعة.` });
      refetchOrg();
      refetchGroups();
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تعيين المجموعة." });
    } finally {
      setAssigningGroup(false);
      setAssignGroupTarget(null);
      setAssignGroupId("");
    }
  }

  async function handleCreateGroup() {
    if (!user || !newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      await apiAction(user, { action: "createGroup", name: newGroupName.trim() });
      toast({ title: "تم إنشاء المجموعة", description: `تم إنشاء مجموعة "${newGroupName}".` });
      setNewGroupName("");
      setIsCreateGroupOpen(false);
      refetchGroups();
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء المجموعة." });
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsSendingInvite(true);
    try {
      const res = await fetch("/api/invite-beneficiary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, orgId, groupName: inviteGroup || undefined }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم إرسال الدعوة", description: `تم إرسال دعوة إلى ${inviteEmail}.` });
      setInviteEmail("");
      setInviteGroup("");
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الدعوة." });
    } finally {
      setIsSendingInvite(false);
    }
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const rows: { name: string; email: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols[0] && cols[1]) {
          rows.push({ name: cols[0], email: cols[1] });
        }
      }
      setCsvRows(rows);
      setCsvResult(null);
    };
    reader.readAsText(file);
  }

  async function handleCsvImport() {
    if (!csvRows.length) return;
    setCsvImporting(true);
    let success = 0;
    let error = 0;
    for (const row of csvRows) {
      try {
        const res = await fetch("/api/invite-beneficiary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: row.email, orgId }),
        });
        if (res.ok) success++;
        else error++;
      } catch {
        error++;
      }
    }
    setCsvResult({ success, error });
    setCsvImporting(false);
    toast({
      title: "اكتمل الاستيراد",
      description: `${success} دعوة ناجحة، ${error} فشلت.`,
    });
  }

  async function handleAssignMentor() {
    if (!user || !assignMentorTarget || !assignMentorId) return;
    await apiAction(user, { action: 'assignMentor', userId: assignMentorTarget.id, mentorId: assignMentorId });
    toast({ title: 'تم التعيين', description: 'تم تعيين المرشد للمستفيد.' });
    setAssignMentorTarget(null); setAssignMentorId('');
    refetchOrg();
  }

  async function handleAssignCoach() {
    if (!user || !assignCoachTarget || !assignCoachId) return;
    await apiAction(user, { action: 'assignCoach', userId: assignCoachTarget.id, coachId: assignCoachId });
    toast({ title: 'تم التعيين', description: 'تم تعيين المدرب للمستفيد.' });
    setAssignCoachTarget(null); setAssignCoachId('');
    refetchOrg();
  }

  const groupName = (id?: string) => {
    if (!id) return null;
    return (groups ?? []).find((g) => g.id === id)?.name ?? null;
  };

  const mentorName = (id?: string) => {
    if (!id) return null;
    return (orgMentors ?? []).find((m) => m.id === id)?.name ?? null;
  };

  const coachName = (id?: string) => {
    if (!id) return null;
    return (orgCoaches ?? []).find((c) => c.id === id)?.name ?? null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إدارة المستفيدين</h1>
        <p className="text-sm text-muted-foreground">عرض وإدارة المستفيدين وإضافتهم ودعوتهم.</p>
      </div>

      <Tabs defaultValue="org" dir="rtl">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org">المستفيدون</TabsTrigger>
          <TabsTrigger value="explore">استكشاف المستفيدين</TabsTrigger>
          <TabsTrigger value="invite">دعوة ومجموعات</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Org Beneficiaries ── */}
        <TabsContent value="org">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> المستفيدون
                  </CardTitle>
                  <CardDescription>قائمة بجميع المستفيدين المسجلين.</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <ExportButton
                    title="قائمة المستفيدين"
                    filename={`beneficiaries-${new Date().toISOString().slice(0,10)}`}
                    headers={['الاسم', 'البريد الإلكتروني', 'الحالة', 'التقدم %', 'المجموعة']}
                    rows={(orgUsers ?? []).map(u => [
                      u.name || '',
                      u.email || '',
                      u.status || derivedStatus(u.progress),
                      u.progress ?? 0,
                      (groups ?? []).find(g => g.id === u.groupId)?.name || '',
                    ])}
                    options={{ summary: { 'إجمالي المستفيدين': String((orgUsers ?? []).length), 'نشطون': String((orgUsers ?? []).filter(u => (u.progress ?? 0) > 0 && (u.progress ?? 0) < 100).length), 'أكملوا البرنامج': String((orgUsers ?? []).filter(u => (u.progress ?? 0) >= 100).length) } }}
                  />
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="تصفية بالمجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">الكل</SelectItem>
                    {(groups ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستفيد</TableHead>
                    <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                    <TableHead>المجموعة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التقدم</TableHead>
                    <TableHead><span className="sr-only">إجراءات</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgLoading && <SkeletonRows cols={6} />}
                  {!orgLoading && filteredOrgUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        لا يوجد مستفيدون مسجلون حتى الآن.
                      </TableCell>
                    </TableRow>
                  )}
                  {!orgLoading && filteredOrgUsers.map((u) => {
                    const progress = u.progress ?? 0;
                    const status = derivedStatus(progress);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatarUrl || ""} alt={u.name || ""} />
                              <AvatarFallback>{(u.name || "م").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/organization-dashboard/beneficiaries/${u.id}`} className="font-medium hover:underline text-primary">
                                {u.name || "بلا اسم"}
                              </Link>
                              {(mentorName(u.mentorId) || coachName(u.coachId)) && (
                                <div className="flex gap-2 mt-0.5">
                                  {mentorName(u.mentorId) && (
                                    <Link href={`/organization-dashboard/mentors/${u.mentorId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">مرشد: {mentorName(u.mentorId)}</Link>
                                  )}
                                  {coachName(u.coachId) && (
                                    <Link href={`/organization-dashboard/coaches/${u.coachId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">مدرب: {coachName(u.coachId)}</Link>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{u.email || "-"}</TableCell>
                        <TableCell>
                          {groupName(u.groupId) ? (
                            <Badge variant="outline">{groupName(u.groupId)}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "نشط" ? "default"
                              : status === "مكتمل" ? "outline"
                              : "secondary"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">قائمة</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setAssignGroupTarget(u);
                                  setAssignGroupId(u.groupId || "");
                                }}
                              >
                                تعيين لمجموعة
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setAssignMentorTarget(u); setAssignMentorId(''); }}>
                                تعيين مرشد
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setAssignCoachTarget(u); setAssignCoachId(''); }}>
                                تعيين مدرب
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onSelect={() => setRemoveTarget(u)}
                              >
                                إزالة
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Explore ── */}
        <TabsContent value="explore">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" /> استكشاف المستفيدين
                  </CardTitle>
                  <CardDescription>ابحث عن مستفيدين وأضفهم.</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pr-9 w-64"
                    placeholder="ابحث بالاسم أو البريد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستفيد</TableHead>
                    <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLoading && <SkeletonRows cols={3} />}
                  {!allLoading && filteredExplorerUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        لا توجد نتائج. جرّب كلمة بحث أخرى.
                      </TableCell>
                    </TableRow>
                  )}
                  {!allLoading && filteredExplorerUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatarUrl || ""} alt={u.name || ""} />
                            <AvatarFallback>{(u.name || "م").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name || "بلا اسم"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{u.email || "-"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={addingUserId === u.id}
                          onClick={() => handleAddToOrg(u)}
                        >
                          {addingUserId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="ml-1 h-4 w-4" /> إضافة للمنظمة
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Invite & Groups ── */}
        <TabsContent value="invite" className="space-y-6">

          {/* Section A: Email Invite */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> دعوة عبر البريد
              </CardTitle>
              <CardDescription>أرسل دعوة بالبريد الإلكتروني لمستفيد جديد للانضمام.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label htmlFor="invite-email">البريد الإلكتروني</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    dir="ltr"
                    placeholder="example@mail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[160px]">
                  <Label htmlFor="invite-group">المجموعة (اختياري)</Label>
                  <Input
                    id="invite-group"
                    placeholder="اسم المجموعة"
                    value={inviteGroup}
                    onChange={(e) => setInviteGroup(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSendingInvite}>
                  {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الدعوة"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Section B: CSV Import */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> استيراد CSV
              </CardTitle>
              <CardDescription>
                ارفع ملف CSV بأعمدة: name, email (الصف الأول عنوان).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="csv-file">اختر ملف CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCsvFile}
                />
              </div>

              {csvRows.length > 0 && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">معاينة ({csvRows.length} سجل)</p>
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>البريد الإلكتروني</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvRows.slice(0, 10).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell dir="ltr">{row.email}</TableCell>
                          </TableRow>
                        ))}
                        {csvRows.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-muted-foreground text-center">
                              و {csvRows.length - 10} سجلات أخرى...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                  <Button onClick={handleCsvImport} disabled={csvImporting}>
                    {csvImporting ? (
                      <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الاستيراد...</>
                    ) : (
                      "استيراد"
                    )}
                  </Button>
                </>
              )}

              {csvResult && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p className="text-green-600">نجحت: {csvResult.success} دعوة</p>
                  {csvResult.error > 0 && (
                    <p className="text-red-500">فشلت: {csvResult.error} دعوة</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section C: Groups */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>المجموعات</CardTitle>
                  <CardDescription>إدارة مجموعات المستفيدين.</CardDescription>
                </div>
                <Button onClick={() => setIsCreateGroupOpen(true)}>
                  <PlusCircle className="ml-2 h-4 w-4" /> إنشاء مجموعة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupsLoading && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}
              {!groupsLoading && (groups ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">
                  لا توجد مجموعات حتى الآن. أنشئ مجموعتك الأولى.
                </p>
              )}
              {!groupsLoading && (groups ?? []).length > 0 && (
                <div className="space-y-3">
                  {(groups ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="font-medium">{g.name}</span>
                      <Badge variant="secondary">{g.memberIds.length} عضو</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}

      {/* Remove beneficiary */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إزالة "{removeTarget?.name}". يمكنه إعادة الانضمام لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removingUser}>
              {removingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : "نعم، إزالة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign to group */}
      <Dialog
        open={!!assignGroupTarget}
        onOpenChange={(open) => !open && setAssignGroupTarget(null)}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعيين لمجموعة</DialogTitle>
            <DialogDescription>
              اختر مجموعة لتعيين {assignGroupTarget?.name} إليها.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>المجموعة</Label>
            <Select value={assignGroupId} onValueChange={setAssignGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مجموعة" />
              </SelectTrigger>
              <SelectContent>
                {(groups ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAssignGroup} disabled={!assignGroupId || assigningGroup}>
              {assigningGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create group */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
            <DialogDescription>أدخل اسم المجموعة الجديدة.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="group-name">اسم المجموعة</Label>
            <Input
              id="group-name"
              placeholder="مثال: مجموعة التدريب المهني"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()}>
              {isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign mentor */}
      <Dialog open={!!assignMentorTarget} onOpenChange={(open) => !open && setAssignMentorTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعيين مرشد</DialogTitle>
            <DialogDescription>اختر مرشداً لتعيينه للمستفيد {assignMentorTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>المرشد</Label>
            <Select value={assignMentorId} onValueChange={setAssignMentorId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مرشداً" />
              </SelectTrigger>
              <SelectContent>
                {(orgMentors ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name || m.email || m.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAssignMentor} disabled={!assignMentorId}>
              تعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign coach */}
      <Dialog open={!!assignCoachTarget} onOpenChange={(open) => !open && setAssignCoachTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعيين مدرب</DialogTitle>
            <DialogDescription>اختر مدرباً لتعيينه للمستفيد {assignCoachTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>المدرب</Label>
            <Select value={assignCoachId} onValueChange={setAssignCoachId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مدرباً" />
              </SelectTrigger>
              <SelectContent>
                {(orgCoaches ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name || c.email || c.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAssignCoach} disabled={!assignCoachId}>
              تعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
