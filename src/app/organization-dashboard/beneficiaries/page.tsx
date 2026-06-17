"use client";

import { useState, useMemo, useRef } from "react";
import {
  MoreHorizontal, PlusCircle, Users, Search, UserPlus, Mail, Upload, Loader2,
} from "lucide-react";

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
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import {
  collection, query, where, doc, updateDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import type { UserProfile } from "@/firebase/auth/use-user";

// ─── Types ───────────────────────────────────────────────────────────────────

type RawBeneficiary = UserProfile & {
  progress?: number;
  groupId?: string;
};

type Beneficiary = RawBeneficiary & {
  status: "نشط" | "مكتمل" | "جديد";
};

type Group = {
  id: string;
  orgId: string;
  name: string;
  memberIds: string[];
  createdAt: unknown;
};

type OrgInvitation = {
  id: string;
  orgId: string;
  targetEmail: string;
  targetRole: string;
  groupName?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: unknown;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function derivedStatus(progress = 0): Beneficiary["status"] {
  if (progress >= 100) return "مكتمل";
  if (progress > 0) return "نشط";
  return "جديد";
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
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const orgId = userProfile?.organizationId || "";

  // ── Tab 1: org beneficiaries ──
  const orgBeneficiariesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "users"),
      where("role", "==", "beneficiary"),
      where("organizationId", "==", orgId),
    );
  }, [firestore, orgId]);
  const { data: rawOrgBeneficiaries, isLoading: orgLoading } =
    useCollection<RawBeneficiary>(orgBeneficiariesQuery);

  // ── Tab 2: all beneficiaries ──
  const allBeneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "beneficiary"));
  }, [firestore]);
  const { data: allBeneficiaries, isLoading: allLoading } =
    useCollection<RawBeneficiary>(allBeneficiariesQuery);

  // ── Tab 3: invitations ──
  const invitationsQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(
      collection(firestore, "orgInvitations"),
      where("orgId", "==", orgId),
      where("targetRole", "==", "beneficiary"),
      where("status", "==", "pending"),
    );
  }, [firestore, orgId]);
  const { data: invitations, isLoading: invitationsLoading } =
    useCollection<OrgInvitation>(invitationsQuery);

  // ── Groups ──
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(collection(firestore, "groups"), where("orgId", "==", orgId));
  }, [firestore, orgId]);
  const { data: groups, isLoading: groupsLoading } =
    useCollection<Group>(groupsQuery);

  // ── Derived data ──
  const orgBeneficiaries: Beneficiary[] = useMemo(() => {
    if (!rawOrgBeneficiaries) return [];
    return rawOrgBeneficiaries.map((u) => ({
      ...u,
      progress: u.progress ?? 0,
      status: derivedStatus(u.progress),
    }));
  }, [rawOrgBeneficiaries]);

  const explorerBeneficiaries: Beneficiary[] = useMemo(() => {
    if (!allBeneficiaries) return [];
    const orgIds = new Set(rawOrgBeneficiaries?.map((u) => u.id) ?? []);
    return allBeneficiaries
      .filter((u) => !orgIds.has(u.id))
      .map((u) => ({ ...u, progress: u.progress ?? 0, status: derivedStatus(u.progress) }));
  }, [allBeneficiaries, rawOrgBeneficiaries]);

  // ── UI state ──
  const [groupFilter, setGroupFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [removeBeneficiary, setRemoveBeneficiary] = useState<Beneficiary | null>(null);
  const [assignGroupTarget, setAssignGroupTarget] = useState<Beneficiary | null>(null);
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
  const [addingBeneficiary, setAddingBeneficiary] = useState<string | null>(null);

  // ── Filtered org beneficiaries ──
  const filteredOrgBeneficiaries = useMemo(() => {
    if (groupFilter === "الكل") return orgBeneficiaries;
    const group = groups?.find((g) => g.id === groupFilter);
    if (!group) return orgBeneficiaries;
    return orgBeneficiaries.filter((b) => group.memberIds.includes(b.id));
  }, [orgBeneficiaries, groupFilter, groups]);

  // ── Filtered explorer beneficiaries ──
  const filteredExplorerBeneficiaries = useMemo(() => {
    if (!searchQuery.trim()) return explorerBeneficiaries;
    const q = searchQuery.toLowerCase();
    return explorerBeneficiaries.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q),
    );
  }, [explorerBeneficiaries, searchQuery]);

  // ── Actions ──
  async function handleRemove() {
    if (!firestore || !removeBeneficiary) return;
    try {
      await updateDoc(doc(firestore, "users", removeBeneficiary.id), {
        organizationId: "",
        groupId: "",
      });
      toast({ title: "تمت الإزالة", description: `تمت إزالة ${removeBeneficiary.name} من المنظمة.` });
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشلت عملية الإزالة." });
    } finally {
      setRemoveBeneficiary(null);
    }
  }

  async function handleAddToOrg(beneficiary: Beneficiary) {
    if (!firestore) return;
    setAddingBeneficiary(beneficiary.id);
    try {
      await updateDoc(doc(firestore, "users", beneficiary.id), { organizationId: orgId });
      toast({ title: "تمت الإضافة", description: `تم إضافة ${beneficiary.name} إلى منظمتك.` });
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة المستفيد." });
    } finally {
      setAddingBeneficiary(null);
    }
  }

  async function handleAssignGroup() {
    if (!firestore || !assignGroupTarget || !assignGroupId) return;
    try {
      // Update user's groupId
      await updateDoc(doc(firestore, "users", assignGroupTarget.id), { groupId: assignGroupId });
      // Update group's memberIds
      const group = groups?.find((g) => g.id === assignGroupId);
      if (group) {
        const newMemberIds = Array.from(new Set([...group.memberIds, assignGroupTarget.id]));
        await updateDoc(doc(firestore, "groups", assignGroupId), { memberIds: newMemberIds });
      }
      toast({ title: "تم التعيين", description: `تم تعيين ${assignGroupTarget.name} للمجموعة.` });
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تعيين المجموعة." });
    } finally {
      setAssignGroupTarget(null);
      setAssignGroupId("");
    }
  }

  async function handleCreateGroup() {
    if (!firestore || !newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      await addDoc(collection(firestore, "groups"), {
        orgId,
        name: newGroupName.trim(),
        memberIds: [],
        createdAt: serverTimestamp(),
      });
      toast({ title: "تم إنشاء المجموعة", description: `تم إنشاء مجموعة "${newGroupName}".` });
      setNewGroupName("");
      setIsCreateGroupOpen(false);
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
      // Skip header
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
          body: JSON.stringify({ email: row.email, orgId, groupName: undefined }),
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

  const groupName = (id?: string) => {
    if (!id) return null;
    return groups?.find((g) => g.id === id)?.name ?? null;
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستفيدين</h1>
        <p className="text-muted-foreground">عرض وإدارة المستفيدين وإضافتهم ودعوتهم لمنظمتك.</p>
      </div>

      <Tabs defaultValue="org" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="org">مستفيدو منظمتي</TabsTrigger>
          <TabsTrigger value="explore">استكشاف المستفيدين</TabsTrigger>
          <TabsTrigger value="invite">دعوة ومجموعات</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Org Beneficiaries ── */}
        <TabsContent value="org">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> مستفيدو منظمتي
                  </CardTitle>
                  <CardDescription>قائمة بجميع المستفيدين المنتسبين لمنظمتك.</CardDescription>
                </div>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="تصفية بالمجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">الكل</SelectItem>
                    {groups?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
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
                  {!orgLoading && filteredOrgBeneficiaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        لا يوجد مستفيدون في منظمتك حتى الآن.
                      </TableCell>
                    </TableRow>
                  )}
                  {!orgLoading && filteredOrgBeneficiaries.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={b.avatarUrl || ""} alt={b.name || ""} />
                            <AvatarFallback>{(b.name || "م").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{b.name || "بلا اسم"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{b.email || "-"}</TableCell>
                      <TableCell>
                        {groupName(b.groupId) ? (
                          <Badge variant="outline">{groupName(b.groupId)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">غير محدد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === "نشط" ? "default"
                            : b.status === "مكتمل" ? "outline"
                            : "secondary"
                          }
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={b.progress} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">{b.progress}%</span>
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
                                setAssignGroupTarget(b);
                                setAssignGroupId(b.groupId || "");
                              }}
                            >
                              تعيين لمجموعة
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500"
                              onSelect={() => setRemoveBeneficiary(b)}
                            >
                              إزالة من المنظمة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Explore ── */}
        <TabsContent value="explore">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" /> استكشاف المستفيدين
                  </CardTitle>
                  <CardDescription>ابحث عن مستفيدين وأضفهم إلى منظمتك.</CardDescription>
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
                  {!allLoading && filteredExplorerBeneficiaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        لا توجد نتائج. جرّب كلمة بحث أخرى.
                      </TableCell>
                    </TableRow>
                  )}
                  {!allLoading && filteredExplorerBeneficiaries.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={b.avatarUrl || ""} alt={b.name || ""} />
                            <AvatarFallback>{(b.name || "م").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{b.name || "بلا اسم"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{b.email || "-"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={addingBeneficiary === b.id}
                          onClick={() => handleAddToOrg(b)}
                        >
                          {addingBeneficiary === b.id ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Invite & Groups ── */}
        <TabsContent value="invite" className="space-y-6">

          {/* Section A: Email Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> دعوة عبر البريد
              </CardTitle>
              <CardDescription>أرسل دعوة بالبريد الإلكتروني لمستفيد جديد للانضمام لمنظمتك.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="mt-6">
                <h3 className="font-medium mb-2">الدعوات المعلقة</h3>
                {invitationsLoading && (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                )}
                {!invitationsLoading && (!invitations || invitations.length === 0) && (
                  <p className="text-muted-foreground text-sm">لا توجد دعوات معلقة.</p>
                )}
                {!invitationsLoading && invitations && invitations.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>المجموعة</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell dir="ltr">{inv.targetEmail}</TableCell>
                          <TableCell>{inv.groupName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">معلقة</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section B: CSV Import */}
          <Card>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>المجموعات</CardTitle>
                  <CardDescription>إدارة مجموعات المستفيدين في منظمتك.</CardDescription>
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
              {!groupsLoading && (!groups || groups.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-6">
                  لا توجد مجموعات حتى الآن. أنشئ مجموعتك الأولى.
                </p>
              )}
              {!groupsLoading && groups && groups.length > 0 && (
                <div className="space-y-3">
                  {groups.map((g) => (
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
        open={!!removeBeneficiary}
        onOpenChange={(open) => !open && setRemoveBeneficiary(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إزالة "{removeBeneficiary?.name}" من منظمتك. يمكنه إعادة الانضمام لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>نعم، إزالة</AlertDialogAction>
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
                {groups?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAssignGroup} disabled={!assignGroupId}>
              حفظ
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
    </div>
  );
}
