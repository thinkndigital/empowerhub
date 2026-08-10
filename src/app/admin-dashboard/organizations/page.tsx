
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
import { ExportButton } from "@/components/export-button";
import { useLanguage } from "@/components/language-provider";

const ORG_TYPES_EN: Record<string, string> = {
  organization: "Organization",
  company: "Company",
  institution: "Institution",
  center: "Center",
  training_center: "Training center",
  educational: "Educational institution",
};

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
const PLAN_LABELS_EN: Record<string, string> = {
  basic: "Basic", pro: "Pro", enterprise: "Enterprise",
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
const SECTION_LABELS_EN: Record<string, Record<string, string>> = {
  organization: {
    beneficiaries: "Beneficiaries", team: "Team", mentors: "Mentors", coaches: "Coaches",
    courses: "Courses", stores: "Stores", orders: "Orders", reports: "Reports",
    messages: "Messages", settings: "Settings",
  },
  beneficiary: {
    progress: "Progress", courses: "Courses", sessions: "Sessions",
    messages: "Messages", store: "Store", orders: "Orders", settings: "Settings",
  },
  mentor: {
    my_beneficiaries: "My beneficiaries", sessions: "Sessions", analytics: "Analytics",
    messages: "Messages", invitations: "Invitations", settings: "Settings",
  },
  coach: {
    courses: "Courses", sessions: "Sessions", analytics: "Analytics",
    messages: "Messages", invitations: "Invitations", settings: "Settings",
  },
};

const DASHBOARD_TYPE_LABELS: Record<string, string> = {
  organization: "لوحة المنظمة",
  beneficiary: "لوحة المستفيد",
  mentor: "لوحة المرشد",
  coach: "لوحة المدرب",
};
const DASHBOARD_TYPE_LABELS_EN: Record<string, string> = {
  organization: "Organization dashboard",
  beneficiary: "Beneficiary dashboard",
  mentor: "Mentor dashboard",
  coach: "Coach dashboard",
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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
  const tOrgTypes = lang === 'en' ? ORG_TYPES_EN : ORG_TYPES;
  const tPlanLabels = lang === 'en' ? PLAN_LABELS_EN : PLAN_LABELS;
  const tSectionLabels = lang === 'en' ? SECTION_LABELS_EN : SECTION_LABELS;
  const tDashboardTypeLabels = lang === 'en' ? DASHBOARD_TYPE_LABELS_EN : DASHBOARD_TYPE_LABELS;

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
        toast({ title: bi("تم التحديث", "Updated"), description: bi(`تم تغيير حالة "${org.name}" إلى ${newStatus}.`, `"${org.name}"'s status was changed to ${newStatus === 'نشط' ? bi('نشط','Active') : bi('غير نشط','Inactive')}.`) })
      )
      .catch(() =>
        toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل تغيير الحالة.", "Failed to change the status.") })
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
      toast({ title: bi("تم الإنشاء بنجاح!", "Created successfully!"), description: data.message });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: err.message });
    } finally {
      setIsCreating(false);
    }
  }

  async function onEditSubmit(values: z.infer<typeof orgFormSchema>) {
    if (!firestore || !orgToEdit) return;
    const orgRef = doc(firestore, "organizations", orgToEdit.id);
    await updateDoc(orgRef, values)
      .then(() => {
        toast({ title: bi("تم الحفظ!", "Saved!"), description: bi(`تم تحديث "${values.name}".`, `"${values.name}" was updated.`) });
        setOrgToEdit(null);
      })
      .catch(() => {
        toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: bi("لم نتمكن من تحديث المنظمة.", "We couldn't update the organization.") });
        errorEmitter.emit("permission-error", new FirestorePermissionError({ path: orgRef.path, operation: "update", requestResourceData: values }));
      });
  }

  async function handleSaveSettings() {
    if (!firestore || !orgToSettings) return;
    const orgRef = doc(firestore, "organizations", orgToSettings.id);
    await updateDoc(orgRef, { dashboardSections: settingsSections, primaryColor })
      .then(() => {
        toast({ title: bi("تم الحفظ!", "Saved!"), description: bi("تم حفظ إعدادات المنظمة.", "The organization's settings were saved.") });
        setOrgToSettings(null);
      })
      .catch(() =>
        toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل حفظ الإعدادات.", "Failed to save the settings.") })
      );
  }

  function handleDelete() {
    if (!firestore || !orgToDelete) return;
    const orgRef = doc(firestore, "organizations", orgToDelete.id);
    deleteDoc(orgRef)
      .then(() => {
        toast({ variant: "destructive", title: bi("تم الحذف!", "Deleted!"), description: bi(`تم حذف "${orgToDelete.name}".`, `"${orgToDelete.name}" was deleted.`) });
        setOrgToDelete(null);
      })
      .catch(() => {
        toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: bi("لم نتمكن من الحذف.", "We couldn't delete it.") });
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
    <div className="space-y-6" dir={dir}>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{bi("الجهات المسجلة", "Registered organizations")}</CardTitle>
              <CardDescription>{bi("إدارة المنظمات والشركات والمؤسسات الشريكة وصلاحياتهم.", "Manage partner organizations, companies, and institutions and their permissions.")}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ExportButton
                title={bi("الجهات المسجلة", "Registered organizations")}
                filename={`organizations-${new Date().toISOString().slice(0,10)}`}
                headers={lang === 'en' ? ['Name', 'Type', 'Plan', 'Status', 'Join date'] : ['الاسم', 'النوع', 'الخطة', 'الحالة', 'تاريخ الانضمام']}
                rows={(organizations ?? []).map(org => [
                  org.name || '',
                  tOrgTypes[org.orgType || 'organization'] || org.orgType || bi('منظمة', 'Organization'),
                  tPlanLabels[org.plan || 'basic'] || bi('أساسي', 'Basic'),
                  org.status || bi('غير محدد', 'Not specified'),
                  org.joined ? new Date(org.joined).toLocaleDateString(locale) : '',
                ])}
                options={{ summary: { [bi('إجمالي الجهات', 'Total organizations')]: String((organizations ?? []).length), [bi('نشطة', 'Active')]: String((organizations ?? []).filter(o => o.status === 'نشط').length) } }}
              />
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                {bi("إنشاء منظمة جديدة", "Create new organization")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* ── Mobile card list ── */}
          <div className="block md:hidden space-y-3">
            {loading &&
              [1, 2, 3].map((i) => (
                <Card key={i} className="p-4 space-y-2 border-0 shadow-sm">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            {!loading && organizations?.map((org) => (
              <Card key={org.id} className="p-4 border-0 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tOrgTypes[org.orgType || "organization"] || org.orgType || bi("منظمة", "Organization")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant={org.status === "نشط" ? "default" : "secondary"} className="text-xs">
                        {org.status || bi("غير محدد", "Not specified")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tPlanLabels[org.plan || "basic"] || bi("أساسي", "Basic")}
                      </Badge>
                    </div>
                    {org.joined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(org.joined).toLocaleDateString(locale)}
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
              <p className="text-center text-sm text-muted-foreground py-8">{bi("لا توجد منظمات لعرضها.", "No organizations to display.")}</p>
            )}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{bi("الاسم", "Name")}</TableHead>
                  <TableHead>{bi("النوع", "Type")}</TableHead>
                  <TableHead>{bi("تاريخ الانضمام", "Join date")}</TableHead>
                  <TableHead className="text-center">{bi("الحالة", "Status")}</TableHead>
                  <TableHead className="text-center">{bi("الخطة", "Plan")}</TableHead>
                  <TableHead><span className="sr-only">{bi("الإجراءات", "Actions")}</span></TableHead>
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
                        {tOrgTypes[org.orgType || "organization"] || org.orgType || bi("منظمة", "Organization")}
                      </TableCell>
                      <TableCell>
                        {org.joined ? new Date(org.joined).toLocaleDateString(locale) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={org.status === "نشط" ? "default" : "secondary"}>
                          {org.status || bi("غير محدد", "Not specified")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {tPlanLabels[org.plan || "basic"] || bi("أساسي", "Basic")}
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
                      {bi("لا توجد منظمات لعرضها.", "No organizations to display.")}
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
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi("تفاصيل", "Details")} — {orgToView?.name}</DialogTitle>
            <DialogDescription>{bi("عرض تفاصيل وصلاحيات المنظمة.", "View the organization's details and permissions.")}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p><strong>{bi("الاسم:", "Name:")}</strong> {orgToView?.name}</p>
            <p>
              <strong>{bi("النوع:", "Type:")}</strong>{" "}
              {tOrgTypes[orgToView?.orgType || "organization"] || orgToView?.orgType || bi("منظمة", "Organization")}
            </p>
            <p>
              <strong>{bi("تاريخ الانضمام:", "Join date:")}</strong>{" "}
              {orgToView?.joined ? new Date(orgToView.joined).toLocaleDateString(locale) : "-"}
            </p>
            <p>
              <strong>{bi("الحالة:", "Status:")}</strong>{" "}
              <Badge variant={orgToView?.status === "نشط" ? "default" : "secondary"}>
                {orgToView?.status}
              </Badge>
            </p>
            <p>
              <strong>{bi("خطة الاشتراك:", "Subscription plan:")}</strong>{" "}
              <Badge variant="outline">{tPlanLabels[orgToView?.plan || "basic"] || bi("أساسي", "Basic")}</Badge>
            </p>
            <div className="border-t pt-4 mt-4 space-y-2">
              <h4 className="font-semibold">{bi("الصلاحيات المتاحة", "Available permissions")}</h4>
              <p>{bi("الدورات:", "Courses:")} <span className="font-medium">{orgToView?.features?.courses ? bi("مفعل", "Enabled") : bi("معطل", "Disabled")}</span></p>
              <p>{bi("الإرشاد:", "Mentorship:")} <span className="font-medium">{orgToView?.features?.mentorship ? bi("مفعل", "Enabled") : bi("معطل", "Disabled")}</span></p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{bi("إغلاق", "Close")}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!orgToEdit} onOpenChange={(o) => !o && setOrgToEdit(null)}>
        <DialogContent dir={dir} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{bi("تحرير المنظمة", "Edit organization")}</DialogTitle>
            <DialogDescription>{bi("تعديل بيانات منظمة", "Edit the details of organization")} "{orgToEdit?.name}".</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("اسم المنظمة", "Organization name")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="orgType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("نوع المنظمة", "Organization type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={bi("اختر النوع", "Select type")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(tOrgTypes).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("خطة الاشتراك", "Subscription plan")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={bi("اختر الخطة", "Select plan")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">{bi("أساسي", "Basic")}</SelectItem>
                      <SelectItem value="pro">{bi("احترافي", "Pro")}</SelectItem>
                      <SelectItem value="enterprise">{bi("مؤسسي", "Enterprise")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-3">
                <FormLabel>{bi("الصلاحيات المتاحة", "Available permissions")}</FormLabel>
                <FormField control={form.control} name="features.courses" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{bi("الدورات التدريبية", "Training courses")}</FormLabel>
                      <FormDescription>{bi("السماح للمنظمة بإدارة الدورات.", "Allow the organization to manage courses.")}</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="features.mentorship" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{bi("الإرشاد", "Mentorship")}</FormLabel>
                      <FormDescription>{bi("السماح للمنظمة بإدارة المرشدين.", "Allow the organization to manage mentors.")}</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
                <Button type="submit">{bi("حفظ التغييرات", "Save changes")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Per-Org Settings Dialog ── */}
      <Dialog open={!!orgToSettings} onOpenChange={(o) => !o && setOrgToSettings(null)}>
        <DialogContent dir={dir} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {bi("إعدادات", "Settings")} — {orgToSettings?.name}
            </DialogTitle>
            <DialogDescription>
              {bi("تخصيص الأقسام المرئية والألوان لهذه المنظمة بشكل مستقل.", "Customize the visible sections and colors for this organization independently.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Color */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-28">{bi("اللون الرئيسي", "Primary color")}</label>
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
                  {tDashboardTypeLabels[role]}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(DEFAULT_SECTIONS[role] ?? {}).map(([key]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{tSectionLabels[role]?.[key] || key}</span>
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
            <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
            <Button onClick={handleSaveSettings}>{bi("حفظ الإعدادات", "Save settings")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent dir={dir} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{bi("إنشاء منظمة جديدة", "Create new organization")}</DialogTitle>
            <DialogDescription>{bi("أدخل بيانات المنظمة وحساب المدير المسؤول.", "Enter the organization's details and the responsible admin's account.")}</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateOrg)} className="space-y-4 pt-2">
              <FormField control={createForm.control} name="orgName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("اسم المنظمة / الجهة", "Organization name")}</FormLabel>
                  <FormControl><Input placeholder={bi("مثال: مؤسسة الأمل", "e.g. Al-Amal Foundation")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={createForm.control} name="orgType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("نوع الجهة", "Organization type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={bi("اختر النوع", "Select type")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(tOrgTypes).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={createForm.control} name="adminName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("اسم مدير الجهة", "Admin's name")}</FormLabel>
                  <FormControl><Input placeholder={bi("الاسم الكامل", "Full name")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={createForm.control} name="adminEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("البريد الإلكتروني للمدير", "Admin's email")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder="admin@org.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <p className="text-xs text-muted-foreground">
                {bi("كلمة المرور المؤقتة:", "Temporary password:")}{" "}
                <span className="font-mono font-medium">EmpowerHub@2024</span>
              </p>

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? bi("جاري الإنشاء...", "Creating...") : bi("إنشاء", "Create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!orgToDelete} onOpenChange={(o) => !o && setOrgToDelete(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi("هل أنت متأكد؟", "Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {bi(`سيؤدي هذا إلى حذف "${orgToDelete?.name}" وجميع بياناتها بشكل نهائي.`, `This will permanently delete "${orgToDelete?.name}" and all its data.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{bi("نعم، احذف", "Yes, delete it")}</AlertDialogAction>
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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  return (
    <div dir={dir}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{bi("قائمة", "Menu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{bi("الإجراءات", "Actions")}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onView}>
            <Eye className="ml-2 h-4 w-4" />
            {bi("عرض التفاصيل", "View details")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggleStatus}>
            {org.status === "نشط"
              ? <X className="ml-2 h-4 w-4" />
              : <Check className="ml-2 h-4 w-4" />}
            {org.status === "نشط" ? bi("تعطيل الاشتراك", "Deactivate subscription") : bi("تفعيل الاشتراك", "Activate subscription")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>
            <Edit className="ml-2 h-4 w-4" />
            {bi("تحرير البيانات والخطة", "Edit details & plan")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSettings}>
            <Settings2 className="ml-2 h-4 w-4" />
            {bi("إعدادات الأقسام والتخصيص", "Sections & customization settings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500"
            onSelect={(e) => { e.preventDefault(); onDelete(); }}
          >
            <Trash2 className="ml-2 h-4 w-4" />
            {bi("حذف", "Delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
