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
import { StatusBadge } from "@/components/status-badge";
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
import { useLanguage } from "@/components/language-provider";

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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const statusLabelEn = (s: string) => s === 'مكتمل' ? 'Completed' : s === 'نشط' ? 'Active' : 'New';
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
      toast({ title: bi("تمت الإزالة", "Removed"), description: bi(`تمت إزالة ${removeTarget.name}.`, `${removeTarget.name} was removed.`) });
      refetchOrg();
      refetchAll();
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشلت عملية الإزالة.", "The removal failed.") });
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
      toast({ title: bi("تمت الإضافة", "Added"), description: bi(`تمت إضافة ${u.name}.`, `${u.name} was added.`) });
      refetchOrg();
      refetchAll();
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل إضافة المستفيد.", "Failed to add the beneficiary.") });
    } finally {
      setAddingUserId(null);
    }
  }

  async function handleAssignGroup() {
    if (!user || !assignGroupTarget || !assignGroupId) return;
    setAssigningGroup(true);
    try {
      await apiAction(user, { action: "assignGroup", userId: assignGroupTarget.id, groupId: assignGroupId });
      toast({ title: bi("تم التعيين", "Assigned"), description: bi(`تم تعيين ${assignGroupTarget.name} للمجموعة.`, `${assignGroupTarget.name} was assigned to the group.`) });
      refetchOrg();
      refetchGroups();
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل تعيين المجموعة.", "Failed to assign the group.") });
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
      toast({ title: bi("تم إنشاء المجموعة", "Group created"), description: bi(`تم إنشاء مجموعة "${newGroupName}".`, `Group "${newGroupName}" was created.`) });
      setNewGroupName("");
      setIsCreateGroupOpen(false);
      refetchGroups();
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل إنشاء المجموعة.", "Failed to create the group.") });
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
      toast({ title: bi("تم إرسال الدعوة", "Invitation sent"), description: bi(`تم إرسال دعوة إلى ${inviteEmail}.`, `An invitation was sent to ${inviteEmail}.`) });
      setInviteEmail("");
      setInviteGroup("");
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل إرسال الدعوة.", "Failed to send the invitation.") });
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
      title: bi("اكتمل الاستيراد", "Import complete"),
      description: bi(`${success} دعوة ناجحة، ${error} فشلت.`, `${success} invitations succeeded, ${error} failed.`),
    });
  }

  async function handleAssignMentor() {
    if (!user || !assignMentorTarget || !assignMentorId) return;
    await apiAction(user, { action: 'assignMentor', userId: assignMentorTarget.id, mentorId: assignMentorId });
    toast({ title: bi('تم التعيين', 'Assigned'), description: bi('تم تعيين المرشد للمستفيد.', 'The mentor was assigned to the beneficiary.') });
    setAssignMentorTarget(null); setAssignMentorId('');
    refetchOrg();
  }

  async function handleAssignCoach() {
    if (!user || !assignCoachTarget || !assignCoachId) return;
    await apiAction(user, { action: 'assignCoach', userId: assignCoachTarget.id, coachId: assignCoachId });
    toast({ title: bi('تم التعيين', 'Assigned'), description: bi('تم تعيين المدرب للمستفيد.', 'The coach was assigned to the beneficiary.') });
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
    <div dir={dir} className="space-y-6 animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("إدارة المستفيدين", "Manage beneficiaries")}</h1>
          <p className="page-subtitle">{bi("عرض وإدارة المستفيدين وإضافتهم ودعوتهم لمنظمتك.", "View and manage beneficiaries, add and invite them to your organization.")}</p>
        </div>
      </div>

      <Tabs defaultValue="org" dir={dir}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="org">{bi("المستفيدون", "Beneficiaries")}</TabsTrigger>
          <TabsTrigger value="explore">{bi("استكشاف المستفيدين", "Explore beneficiaries")}</TabsTrigger>
          <TabsTrigger value="invite">{bi("دعوة ومجموعات", "Invite & groups")}</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Org Beneficiaries ── */}
        <TabsContent value="org">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> {bi("المستفيدون", "Beneficiaries")}
                  </CardTitle>
                  <CardDescription>{bi("قائمة بجميع المستفيدين المسجلين.", "A list of all registered beneficiaries.")}</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <ExportButton
                    title={bi("قائمة المستفيدين", "Beneficiaries list")}
                    filename={`beneficiaries-${new Date().toISOString().slice(0,10)}`}
                    headers={lang === 'en' ? ['Name', 'Email', 'Status', 'Progress %', 'Group'] : ['الاسم', 'البريد الإلكتروني', 'الحالة', 'التقدم %', 'المجموعة']}
                    rows={(orgUsers ?? []).map(u => {
                      const statusVal = u.status || derivedStatus(u.progress);
                      return [
                        u.name || '',
                        u.email || '',
                        lang === 'en' ? statusLabelEn(statusVal) : statusVal,
                        u.progress ?? 0,
                        (groups ?? []).find(g => g.id === u.groupId)?.name || '',
                      ];
                    })}
                    options={{ summary: { [bi('إجمالي المستفيدين', 'Total beneficiaries')]: String((orgUsers ?? []).length), [bi('نشطون', 'Active')]: String((orgUsers ?? []).filter(u => (u.progress ?? 0) > 0 && (u.progress ?? 0) < 100).length), [bi('أكملوا البرنامج', 'Completed the program')]: String((orgUsers ?? []).filter(u => (u.progress ?? 0) >= 100).length) } }}
                  />
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder={bi("تصفية بالمجموعة", "Filter by group")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">{bi("الكل", "All")}</SelectItem>
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
                    <TableHead>{bi("المستفيد", "Beneficiary")}</TableHead>
                    <TableHead className="hidden md:table-cell">{bi("البريد الإلكتروني", "Email")}</TableHead>
                    <TableHead>{bi("المجموعة", "Group")}</TableHead>
                    <TableHead>{bi("الحالة", "Status")}</TableHead>
                    <TableHead>{bi("التقدم", "Progress")}</TableHead>
                    <TableHead><span className="sr-only">{bi("إجراءات", "Actions")}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgLoading && <SkeletonRows cols={6} />}
                  {!orgLoading && filteredOrgUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon"><Users className="h-6 w-6" /></div>
                          <p className="empty-state-title">{bi("لا يوجد مستفيدون بعد", "No beneficiaries yet")}</p>
                          <p className="empty-state-desc">{bi("ابدأ بدعوة مستفيدين أو إضافتهم لمنظمتك", "Start by inviting or adding beneficiaries to your organization")}</p>
                        </div>
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
                            <Avatar className="h-9 w-9 rounded-xl shrink-0">
                              <AvatarImage src={u.avatarUrl || ""} alt={u.name || ""} />
                              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{(u.name || "م").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/organization-dashboard/beneficiaries/${u.id}`} className="font-medium hover:underline text-primary">
                                {u.name || bi("بلا اسم", "No name")}
                              </Link>
                              {(mentorName(u.mentorId) || coachName(u.coachId)) && (
                                <div className="flex gap-2 mt-0.5">
                                  {mentorName(u.mentorId) && (
                                    <Link href={`/organization-dashboard/mentors/${u.mentorId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">{bi("مرشد:", "Mentor:")} {mentorName(u.mentorId)}</Link>
                                  )}
                                  {coachName(u.coachId) && (
                                    <Link href={`/organization-dashboard/coaches/${u.coachId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">{bi("مدرب:", "Coach:")} {coachName(u.coachId)}</Link>
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
                            <span className="text-muted-foreground text-xs">{bi("غير محدد", "Unspecified")}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
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
                                <span className="sr-only">{bi("قائمة", "Menu")}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{bi("الإجراءات", "Actions")}</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setAssignGroupTarget(u);
                                  setAssignGroupId(u.groupId || "");
                                }}
                              >
                                {bi("تعيين لمجموعة", "Assign to group")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setAssignMentorTarget(u); setAssignMentorId(''); }}>
                                {bi("تعيين مرشد", "Assign mentor")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setAssignCoachTarget(u); setAssignCoachId(''); }}>
                                {bi("تعيين مدرب", "Assign coach")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onSelect={() => setRemoveTarget(u)}
                              >
                                {bi("إزالة", "Remove")}
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
                    <Search className="h-5 w-5" /> {bi("استكشاف المستفيدين", "Explore beneficiaries")}
                  </CardTitle>
                  <CardDescription>{bi("ابحث عن مستفيدين وأضفهم.", "Search for beneficiaries and add them.")}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pr-9 w-64"
                    placeholder={bi("ابحث بالاسم أو البريد...", "Search by name or email...")}
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
                    <TableHead>{bi("المستفيد", "Beneficiary")}</TableHead>
                    <TableHead className="hidden md:table-cell">{bi("البريد الإلكتروني", "Email")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLoading && <SkeletonRows cols={3} />}
                  {!allLoading && filteredExplorerUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <div className="empty-state">
                          <div className="empty-state-icon"><Search className="h-6 w-6" /></div>
                          <p className="empty-state-title">{bi("لا توجد نتائج", "No results")}</p>
                          <p className="empty-state-desc">{bi("جرّب كلمة بحث أخرى", "Try a different search term")}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!allLoading && filteredExplorerUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9 rounded-xl shrink-0">
                            <AvatarImage src={u.avatarUrl || ""} alt={u.name || ""} />
                            <AvatarFallback className="rounded-xl bg-muted text-foreground text-xs font-bold">{(u.name || "م").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name || bi("بلا اسم", "No name")}</span>
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
                              <UserPlus className="ml-1 h-4 w-4" /> {bi("إضافة للمنظمة", "Add to organization")}
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
                <Mail className="h-5 w-5" /> {bi("دعوة عبر البريد", "Invite by email")}
              </CardTitle>
              <CardDescription>{bi("أرسل دعوة بالبريد الإلكتروني لمستفيد جديد للانضمام.", "Send an email invitation for a new beneficiary to join.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label htmlFor="invite-email">{bi("البريد الإلكتروني", "Email")}</Label>
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
                  <Label htmlFor="invite-group">{bi("المجموعة (اختياري)", "Group (optional)")}</Label>
                  <Input
                    id="invite-group"
                    placeholder={bi("اسم المجموعة", "Group name")}
                    value={inviteGroup}
                    onChange={(e) => setInviteGroup(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSendingInvite}>
                  {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : bi("إرسال الدعوة", "Send invitation")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Section B: CSV Import */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> {bi("استيراد CSV", "Import CSV")}
              </CardTitle>
              <CardDescription>
                {bi("ارفع ملف CSV بأعمدة: name, email (الصف الأول عنوان).", "Upload a CSV file with columns: name, email (first row is the header).")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="csv-file">{bi("اختر ملف CSV", "Choose a CSV file")}</Label>
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
                    <p className="text-sm font-medium mb-2">{bi("معاينة", "Preview")} ({csvRows.length} {bi("سجل", "records")})</p>
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{bi("الاسم", "Name")}</TableHead>
                          <TableHead>{bi("البريد الإلكتروني", "Email")}</TableHead>
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
                              {bi(`و ${csvRows.length - 10} سجلات أخرى...`, `and ${csvRows.length - 10} more records...`)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                  <Button onClick={handleCsvImport} disabled={csvImporting}>
                    {csvImporting ? (
                      <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> {bi("جاري الاستيراد...", "Importing...")}</>
                    ) : (
                      bi("استيراد", "Import")
                    )}
                  </Button>
                </>
              )}

              {csvResult && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p className="text-green-600">{bi("نجحت:", "Succeeded:")} {csvResult.success} {bi("دعوة", "invitations")}</p>
                  {csvResult.error > 0 && (
                    <p className="text-red-500">{bi("فشلت:", "Failed:")} {csvResult.error} {bi("دعوة", "invitations")}</p>
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
                  <CardTitle>{bi("المجموعات", "Groups")}</CardTitle>
                  <CardDescription>{bi("إدارة مجموعات المستفيدين.", "Manage beneficiary groups.")}</CardDescription>
                </div>
                <Button onClick={() => setIsCreateGroupOpen(true)}>
                  <PlusCircle className="ml-2 h-4 w-4" /> {bi("إنشاء مجموعة", "Create group")}
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
                <div className="empty-state py-10">
                  <div className="empty-state-icon"><Users className="h-6 w-6" /></div>
                  <p className="empty-state-title">{bi("لا توجد مجموعات بعد", "No groups yet")}</p>
                  <p className="empty-state-desc">{bi("أنشئ مجموعتك الأولى لتنظيم المستفيدين", "Create your first group to organize beneficiaries")}</p>
                </div>
              )}
              {!groupsLoading && (groups ?? []).length > 0 && (
                <div className="space-y-3">
                  {(groups ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-medium">{g.name}</span>
                      <Badge variant="secondary">{g.memberIds.length} {bi("عضو", "members")}</Badge>
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
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi("هل أنت متأكد؟", "Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {bi(`سيتم إزالة "${removeTarget?.name}". يمكنه إعادة الانضمام لاحقاً.`, `"${removeTarget?.name}" will be removed. They can rejoin later.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removingUser}>
              {removingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : bi("نعم، إزالة", "Yes, remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign to group */}
      <Dialog
        open={!!assignGroupTarget}
        onOpenChange={(open) => !open && setAssignGroupTarget(null)}
      >
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi("تعيين لمجموعة", "Assign to group")}</DialogTitle>
            <DialogDescription>
              {bi("اختر مجموعة لتعيين", "Choose a group to assign")} {assignGroupTarget?.name} {bi("إليها.", "to.")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>{bi("المجموعة", "Group")}</Label>
            <Select value={assignGroupId} onValueChange={setAssignGroupId}>
              <SelectTrigger>
                <SelectValue placeholder={bi("اختر مجموعة", "Choose a group")} />
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
              <Button variant="ghost">{bi("إلغاء", "Cancel")}</Button>
            </DialogClose>
            <Button onClick={handleAssignGroup} disabled={!assignGroupId || assigningGroup}>
              {assigningGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : bi("حفظ", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create group */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi("إنشاء مجموعة جديدة", "Create a new group")}</DialogTitle>
            <DialogDescription>{bi("أدخل اسم المجموعة الجديدة.", "Enter the new group's name.")}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="group-name">{bi("اسم المجموعة", "Group name")}</Label>
            <Input
              id="group-name"
              placeholder={bi("مثال: مجموعة التدريب المهني", "e.g. Vocational training group")}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">{bi("إلغاء", "Cancel")}</Button>
            </DialogClose>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()}>
              {isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : bi("إنشاء", "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign mentor */}
      <Dialog open={!!assignMentorTarget} onOpenChange={(open) => !open && setAssignMentorTarget(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi("تعيين مرشد", "Assign mentor")}</DialogTitle>
            <DialogDescription>{bi("اختر مرشداً لتعيينه للمستفيد", "Choose a mentor to assign to beneficiary")} {assignMentorTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>{bi("المرشد", "Mentor")}</Label>
            <Select value={assignMentorId} onValueChange={setAssignMentorId}>
              <SelectTrigger>
                <SelectValue placeholder={bi("اختر مرشداً", "Choose a mentor")} />
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
              <Button variant="ghost">{bi("إلغاء", "Cancel")}</Button>
            </DialogClose>
            <Button onClick={handleAssignMentor} disabled={!assignMentorId}>
              {bi("تعيين", "Assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign coach */}
      <Dialog open={!!assignCoachTarget} onOpenChange={(open) => !open && setAssignCoachTarget(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi("تعيين مدرب", "Assign coach")}</DialogTitle>
            <DialogDescription>{bi("اختر مدرباً لتعيينه للمستفيد", "Choose a coach to assign to beneficiary")} {assignCoachTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>{bi("المدرب", "Coach")}</Label>
            <Select value={assignCoachId} onValueChange={setAssignCoachId}>
              <SelectTrigger>
                <SelectValue placeholder={bi("اختر مدرباً", "Choose a coach")} />
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
              <Button variant="ghost">{bi("إلغاء", "Cancel")}</Button>
            </DialogClose>
            <Button onClick={handleAssignCoach} disabled={!assignCoachId}>
              {bi("تعيين", "Assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
