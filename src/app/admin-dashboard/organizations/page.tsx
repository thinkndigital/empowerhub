
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MoreHorizontal, Download, Edit, Trash2, Eye, Plus, Check, X, Settings2, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

import { ORG_TYPES } from "@/lib/org-types";

type DashboardSections = {
  organization?: Record<string, boolean>;
  beneficiary?: Record<string, boolean>;
  mentor?: Record<string, boolean>;
  coach?: Record<string, boolean>;
};

type Organization = {
  id: string;
  name: string;
  orgType?: string;
  joined?: string;
  status?: "نشط" | "غير نشط";
  plan?: "basic" | "pro" | "enterprise";
  features?: { courses: boolean; mentorship: boolean };
  dashboardSections?: DashboardSections;
  primaryColor?: string;
};

const PLAN_LABELS: Record<string, string> = {
  basic: "أساسي", pro: "احترافي", enterprise: "مؤسسي",
};

const DEFAULT_SECTIONS: DashboardSections = {
  organization: {
    beneficiaries: true, team: true, mentors: true, coaches: true,
    courses: true, stores: true, orders: true, reports: true, messages: true, settings: true,
  },
  beneficiary: {
    progress: true, courses: true, sessions: true, messages: true,
    store: true, orders: true, settings: true,
  },
  mentor: {
    my_beneficiaries: true, sessions: true, analytics: true,
    messages: true, invitations: true, settings: true,
  },
  coach: {
    courses: true, sessions: true, analytics: true,
    messages: true, invitations: true, settings: true,
  },
};

const SECTION_LABELS: Record<string, Record<string, string>> = {
  organization: {
    beneficiaries: "المستفيدون", team: "الفريق", mentors: "المرشدون", coaches: "المدربون",
    courses: "الدورات", stores: "المتاجر", orders: "الطلبات", reports: "التقارير",
    messages: "الرسائل", settings: "الإعدادات",
  },
  beneficiary: {
    progress: "التقدم", courses: "الدورات", sessions: "الجلسات",
    messages: "الرسائل", store: "المتجر", orders: "الطلبات", settings: "الإعدادات",
  },
  mentor: {
    my_beneficiaries: "مستفيديّ", sessions: "الجلسات", analytics: "التحليلات",
    messages: "الرسائل", invitations: "الدعوات", settings: "الإعدادات",
  },
  coach: {
    courses: "الدورات", sessions: "الجلسات", analytics: "التحليلات",
    messages: "الرسائل", invitations: "الدعوات", settings: "الإعدادات",
  },
};

const DASHBOARD_TYPE_LABELS: Record<string, string> = {
  organization: "لوحة المنظمة",
  beneficiary: "لوحة المستفيد",
  mentor: "لوحة المرشد",
  coach: "لوحة المدرب",
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const orgFormSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  orgType: z.string().default("organization"),
  plan: z.enum(["basic", "pro", "enterprise"]).default("basic"),
  features: z.object({
    courses: z.boolean().default(false),
    mentorship: z.boolean().default(false),
  }).default({ courses: false, mentorship: false }),
});

const createOrgSchema = z.object({
  orgName: z.string().min(2, { message: "يجب أن يكون اسم المنظمة حرفين على الأقل." }),
  orgType: z.string().default("organization"),
  adminName: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  adminEmail: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  const [orgToView, setOrgToView] = useState<Organization | null>(null);
  const [orgToSettings, setOrgToSettings] = useState<Organization | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [settingsSections, setSettingsSections] = useState<DashboardSections>({});
  const [primaryColor, setPrimaryColor] = useState("#6366f1");

  const organizationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "organizations"));
  }, [firestore]);

  const { data: organizations, isLoading: loading } =
    useCollection<Organization>(organizationsQuery);

  const form = useForm<z.infer<typeof orgFormSchema>>({
    resolver: zodResolver(orgFormSchema),
  });

  const createForm = useForm<z.infer<typeof createOrgSchema>>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { orgName: "", orgType: "organization", adminName: "", adminEmail: "" },
  });

  useEffect(() => {
    if (orgToEdit) {
      form.reset({
        name: orgToEdit.name,
        orgType: orgToEdit.orgType || "organization",
        plan: orgToEdit.plan || "basic",
        features: {
          courses: orgToEdit.features?.courses ?? false,
          mentorship: orgToEdit.features?.mentorship ?? false,
        },
      });
    }
  }, [orgToEdit, form]);

  useEffect(() => {
    if (orgToSettings) {
      const merged: DashboardSections = {};
      for (const role of ["organization", "beneficiary", "mentor", "coach"] as const) {
        merged[role] = {
          ...DEFAULT_SECTIONS[role],
          ...(orgToSettings.dashboardSections?.[role] ?? {}),
        };
      }
      setSettingsSections(merged);
      setPrimaryColor(orgToSettings.primaryColor || "#6366f1");
    }
  }, [orgToSettings]);

  // ── handlers ──────────────────────────────────────────────────────────────

  async function handleToggleStatus(org: Organization) {
    if (!firestore) return;
    const newStatus = org.status === "نشط" ? "غير نشط" : "نشط";
    await updateDoc(doc(firestore, "organizations", org.id), { status: newStatus })
      .then(() =>
        toast({ title: "تم التحديث", description: `تم تغيير حالة "${org.name}" إلى ${newStatus}.` })
      )
      .catch(() =>
        toast({ variant: "destructive", title: "خطأ!", description: "فشل تغيير الحالة." })
      );
  }

  async function handleCreateOrg(values: z.infer<typeof createOrgSchema>) {
    setIsCreating(true);
    try {
      const res = await fetch("/api/create-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم الإنشاء بنجاح!", description: data.message });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ!", description: err.message });
    } finally {
      setIsCreating(false);
    }
  }

  async function onEditSubmit(values: z.infer<typeof orgFormSchema>) {
    if (!firestore || !orgToEdit) return;
    const orgRef = doc(firestore, "organizations", orgToEdit.id);
    await updateDoc(orgRef, values)
      .then(() => {
        toast({ title: "تم الحفظ!", description: `تم تحديث "${values.name}".` });
        setOrgToEdit(null);
      })
      .catch(() => {
        toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من تحديث المنظمة." });
        errorEmitter.emit("permission-error", new FirestorePermissionError({ path: orgRef.path, operation: "update", requestResourceData: values }));
      });
  }

  async function handleSaveSettings() {
    if (!firestore || !orgToSettings) return;
    const orgRef = doc(firestore, "organizations", orgToSettings.id);
    await updateDoc(orgRef, { dashboardSections: settingsSections, primaryColor })
      .then(() => {
        toast({ title: "تم الحفظ!", description: "تم حفظ إعدادات المنظمة." });
        setOrgToSettings(null);
      })
      .catch(() =>
        toast({ variant: "destructive", title: "خطأ!", description: "فشل حفظ الإعدادات." })
      );
  }

  function handleDelete() {
    if (!firestore || !orgToDelete) return;
    const orgRef = doc(firestore, "organizations", orgToDelete.id);
    deleteDoc(orgRef)
      .then(() => {
        toast({ variant: "destructive", title: "تم الحذف!", description: `تم حذف "${orgToDelete.name}".` });
        setOrgToDelete(null);
      })
      .catch(() => {
        toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من الحذف." });
        errorEmitter.emit("permission-error", new FirestorePermissionError({ path: orgRef.path, operation: "delete" }));
      });
  }

  function toggleSection(role: string, key: string) {
    setSettingsSections((prev) => ({
      ...prev,
      [role]: { ...(prev[role as keyof DashboardSections] ?? {}), [key]: !(prev[role as keyof DashboardSections]?.[key] ?? true) },
    }));
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div dir="rtl">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>الجهات المسجلة</CardTitle>
              <CardDescription>إدارة المنظمات والشركات والمؤسسات الشريكة وصلاحياتهم.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4" />
                تصدير
              </Button>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إنشاء منظمة جديدة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* ── Mobile card list ── */}
          <div className="block md:hidden space-y-3">
            {loading &&
              [1, 2, 3].map((i) => (
                <Card key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            {!loading && organizations?.map((org) => (
              <Card key={org.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ORG_TYPES[org.orgType || "organization"] || org.orgType || "منظمة"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant={org.status === "نشط" ? "default" : "secondary"} className="text-xs">
                        {org.status || "غير محدد"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {PLAN_LABELS[org.plan || "basic"] || "أساسي"}
                      </Badge>
                    </div>
                    {org.joined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(org.joined).toLocaleDateString("ar-SA")}
                      </p>
                    )}
                  </div>
                  <OrgDropdown
                    org={org}
                    onView={() => setOrgToView(org)}
                    onToggleStatus={() => handleToggleStatus(org)}
                    onEdit={() => setOrgToEdit(org)}
                    onSettings={() => setOrgToSettings(org)}
                    onDelete={() => setOrgToDelete(org)}
                  />
                </div>
              </Card>
            ))}
            {!loading && (!organizations || organizations.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">لا توجد منظمات لعرضها.</p>
            )}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الخطة</TableHead>
                  <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-[60px] mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                {!loading &&
                  organizations?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ORG_TYPES[org.orgType || "organization"] || org.orgType || "منظمة"}
                      </TableCell>
                      <TableCell>
                        {org.joined ? new Date(org.joined).toLocaleDateString("ar-SA") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={org.status === "نشط" ? "default" : "secondary"}>
                          {org.status || "غير محدد"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {PLAN_LABELS[org.plan || "basic"] || "أساسي"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <OrgDropdown
                          org={org}
                          onView={() => setOrgToView(org)}
                          onToggleStatus={() => handleToggleStatus(org)}
                          onEdit={() => setOrgToEdit(org)}
                          onSettings={() => setOrgToSettings(org)}
                          onDelete={() => setOrgToDelete(org)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && (!organizations || organizations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      لا توجد منظمات لعرضها.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── View Dialog ── */}
      <Dialog open={!!orgToView} onOpenChange={(o) => !o && setOrgToView(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل — {orgToView?.name}</DialogTitle>
            <DialogDescription>عرض تفاصيل وصلاحيات المنظمة.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p><strong>الاسم:</strong> {orgToView?.name}</p>
            <p>
              <strong>النوع:</strong>{" "}
              {ORG_TYPES[orgToView?.orgType || "organization"] || orgToView?.orgType || "منظمة"}
            </p>
            <p>
              <strong>تاريخ الانضمام:</strong>{" "}
              {orgToView?.joined ? new Date(orgToView.joined).toLocaleDateString("ar-SA") : "-"}
            </p>
            <p>
              <strong>الحالة:</strong>{" "}
              <Badge variant={orgToView?.status === "نشط" ? "default" : "secondary"}>
                {orgToView?.status}
              </Badge>
            </p>
            <p>
              <strong>خطة الاشتراك:</strong>{" "}
              <Badge variant="outline">{PLAN_LABELS[orgToView?.plan || "basic"] || "أساسي"}</Badge>
            </p>
            <div className="border-t pt-4 mt-4 space-y-2">
              <h4 className="font-semibold">الصلاحيات المتاحة</h4>
              <p>الدورات: <span className="font-medium">{orgToView?.features?.courses ? "مفعل" : "معطل"}</span></p>
              <p>الإرشاد: <span className="font-medium">{orgToView?.features?.mentorship ? "مفعل" : "معطل"}</span></p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!orgToEdit} onOpenChange={(o) => !o && setOrgToEdit(null)}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تحرير المنظمة</DialogTitle>
            <DialogDescription>تعديل بيانات منظمة "{orgToEdit?.name}".</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنظمة</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="orgType" render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المنظمة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ORG_TYPES).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem>
                  <FormLabel>خطة الاشتراك</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر الخطة" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">أساسي</SelectItem>
                      <SelectItem value="pro">احترافي</SelectItem>
                      <SelectItem value="enterprise">مؤسسي</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-3">
                <FormLabel>الصلاحيات المتاحة</FormLabel>
                <FormField control={form.control} name="features.courses" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>الدورات التدريبية</FormLabel>
                      <FormDescription>السماح للمنظمة بإدارة الدورات.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="features.mentorship" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>الإرشاد</FormLabel>
                      <FormDescription>السماح للمنظمة بإدارة المرشدين.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Per-Org Settings Dialog ── */}
      <Dialog open={!!orgToSettings} onOpenChange={(o) => !o && setOrgToSettings(null)}>
        <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              إعدادات — {orgToSettings?.name}
            </DialogTitle>
            <DialogDescription>
              تخصيص الأقسام المرئية والألوان لهذه المنظمة بشكل مستقل.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Color */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-28">اللون الرئيسي</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-8 w-16 cursor-pointer rounded border"
              />
              <span className="text-xs text-muted-foreground font-mono">{primaryColor}</span>
            </div>

            {/* Sections per dashboard */}
            {(["organization", "beneficiary", "mentor", "coach"] as const).map((role) => (
              <div key={role} className="space-y-2">
                <h4 className="text-sm font-semibold border-b pb-1">
                  {DASHBOARD_TYPE_LABELS[role]}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(DEFAULT_SECTIONS[role] ?? {}).map(([key]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{SECTION_LABELS[role]?.[key] || key}</span>
                      <Switch
                        checked={settingsSections[role]?.[key] ?? true}
                        onCheckedChange={() => toggleSection(role, key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
            <Button onClick={handleSaveSettings}>حفظ الإعدادات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء منظمة جديدة</DialogTitle>
            <DialogDescription>أدخل بيانات المنظمة وحساب المدير المسؤول.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateOrg)} className="space-y-4 pt-2">
              <FormField control={createForm.control} name="orgName" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنظمة / الجهة</FormLabel>
                  <FormControl><Input placeholder="مثال: مؤسسة الأمل" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={createForm.control} name="orgType" render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الجهة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ORG_TYPES).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={createForm.control} name="adminName" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم مدير الجهة</FormLabel>
                  <FormControl><Input placeholder="الاسم الكامل" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={createForm.control} name="adminEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني للمدير</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder="admin@org.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <p className="text-xs text-muted-foreground">
                كلمة المرور المؤقتة:{" "}
                <span className="font-mono font-medium">EmpowerHub@2024</span>
              </p>

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!orgToDelete} onOpenChange={(o) => !o && setOrgToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيؤدي هذا إلى حذف "{orgToDelete?.name}" وجميع بياناتها بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>نعم، احذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Shared dropdown component ─────────────────────────────────────────────────
function OrgDropdown({
  org, onView, onToggleStatus, onEdit, onSettings, onDelete,
}: {
  org: Organization;
  onView: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onSettings: () => void;
  onDelete: () => void;
}) {
  return (
    <div dir="rtl">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">قائمة</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onView}>
            <Eye className="ml-2 h-4 w-4" />
            عرض التفاصيل
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggleStatus}>
            {org.status === "نشط"
              ? <X className="ml-2 h-4 w-4" />
              : <Check className="ml-2 h-4 w-4" />}
            {org.status === "نشط" ? "تعطيل الاشتراك" : "تفعيل الاشتراك"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>
            <Edit className="ml-2 h-4 w-4" />
            تحرير البيانات والخطة
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSettings}>
            <Settings2 className="ml-2 h-4 w-4" />
            إعدادات الأقسام والتخصيص
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500"
            onSelect={(e) => { e.preventDefault(); onDelete(); }}
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
