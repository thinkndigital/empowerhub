"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, Eye, Users, GraduationCap,
  Store, UserCheck, RefreshCw, Upload, MoreVertical, Sliders, Building2,
} from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Org {
  id: string; name: string; plan: string; primaryColor: string;
  logoUrl?: string; inviteCode?: string;
  dashboardSections?: OrgSections;
}
interface OrgForm { name: string; plan: string; primaryColor: string; logoUrl: string; }
interface Person { id: string; name: string; email: string; role: string; status?: string; avatarUrl?: string; }
interface OrgStore { id: string; name: string; beneficiaryId: string; hidden: boolean; }
interface OrgOverview { beneficiaries: Person[]; mentors: Person[]; coaches: Person[]; team: Person[]; stores: OrgStore[]; }

interface OrgSections {
  organization: Record<string, boolean>;
  beneficiary: Record<string, boolean>;
  mentor: Record<string, boolean>;
  coach: Record<string, boolean>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const planColors: Record<string, string> = {
  free: "bg-muted-foreground/20 text-foreground/90 border-muted-foreground/30",
  pro: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  enterprise: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};
const planLabels: Record<string, string> = { free: "مجاني", pro: "احترافي", enterprise: "مؤسسي" };
const statusBadge: Record<string, string> = { active: "bg-emerald-500/20 text-emerald-400", suspended: "bg-red-500/20 text-red-400", pending: "bg-yellow-500/20 text-yellow-400" };
const statusLabel: Record<string, string> = { active: "نشط", suspended: "موقوف", pending: "معلق" };

const sectionLabels: Record<string, Record<string, string>> = {
  organization: {
    beneficiaries: 'المستفيدون', team: 'فريق العمل', mentors: 'المرشدون',
    coaches: 'المدربون', courses: 'الدورات', stores: 'المتاجر',
    orders: 'الطلبات', reports: 'التقارير', messages: 'الرسائل',
  },
  beneficiary: {
    progress: 'تقدمي', courses: 'دوراتي', sessions: 'جلساتي',
    messages: 'الرسائل', store: 'متجري', orders: 'طلباتي',
  },
  mentor: {
    my_beneficiaries: 'المستفيدون', sessions: 'الجلسات', analytics: 'التحليلات',
    messages: 'الرسائل', invitations: 'الدعوات',
  },
  coach: {
    courses: 'الدورات', sessions: 'الجلسات', analytics: 'التحليلات',
    messages: 'الرسائل', invitations: 'الدعوات',
  },
};

const dashboardMeta = [
  { key: 'organization' as const, label: 'لوحة المنظمة', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'beneficiary' as const, label: 'لوحة المستفيد', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'mentor' as const, label: 'لوحة المرشد', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'coach' as const, label: 'لوحة المدرب', color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

const defaultSections: OrgSections = {
  organization: { beneficiaries: true, team: true, mentors: true, coaches: true, courses: true, stores: true, orders: true, reports: true, messages: true },
  beneficiary: { progress: true, courses: true, sessions: true, messages: true, store: true, orders: true },
  mentor: { my_beneficiaries: true, sessions: true, analytics: true, messages: true, invitations: true },
  coach: { courses: true, sessions: true, analytics: true, messages: true, invitations: true },
};

const emptyForm: OrgForm = { name: "", plan: "free", primaryColor: "#6366f1", logoUrl: "" };

// ─── Logo Upload ──────────────────────────────────────────────────────────────

function LogoUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const token = await user.getIdToken();
      onChange(await uploadToStorage(file, 'organizations', token));
    } catch {}
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>شعار المنظمة</Label>
      <div className="flex gap-3 items-center">
        <div className="h-16 w-16 rounded-xl border border-border overflow-hidden bg-muted/60 flex items-center justify-center flex-shrink-0">
          {value
            ? <img src={value} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <span className="text-muted-foreground text-xs text-center">لا شعار</span>}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." dir="ltr" className="font-mono text-sm" />
          <label className="cursor-pointer">
            <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
              <span className="border-border text-foreground/90 hover:text-foreground hover:bg-accent gap-2">
                {uploading ? <span className="text-xs">جاري الرفع...</span> : <><Upload className="h-3 w-3" />رفع صورة</>}
              </span>
            </Button>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} className="text-red-400 hover:text-red-300 flex-shrink-0 text-xs">
            حذف
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Org Form Fields ──────────────────────────────────────────────────────────

function OrgFormFields({ form, onChange }: { form: OrgForm; onChange: (f: OrgForm) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>اسم المنظمة</Label>
        <Input value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="اسم المنظمة" />
      </div>
      <div className="space-y-2">
        <Label>الخطة</Label>
        <Select value={form.plan} onValueChange={v => onChange({ ...form, plan: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="free">مجاني</SelectItem>
            <SelectItem value="pro">احترافي</SelectItem>
            <SelectItem value="enterprise">مؤسسي</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>اللون الرئيسي</Label>
        <div className="flex items-center gap-3">
          <input type="color" value={form.primaryColor || '#6366f1'} onChange={e => onChange({ ...form, primaryColor: e.target.value })} className="h-10 w-12 rounded cursor-pointer border border-border bg-transparent" />
          <div className="h-10 w-10 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: form.primaryColor || '#6366f1' }} />
          <Input value={form.primaryColor} onChange={e => onChange({ ...form, primaryColor: e.target.value })} className="flex-1 font-mono text-sm" dir="ltr" placeholder="#6366f1" />
        </div>
      </div>
      <LogoUploadField value={form.logoUrl} onChange={v => onChange({ ...form, logoUrl: v })} />
    </div>
  );
}

// ─── Person Row ───────────────────────────────────────────────────────────────

function PersonRow({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={person.avatarUrl} />
        <AvatarFallback className="bg-muted text-xs text-foreground/90">{(person.name || '?')[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium truncate">{person.name || '—'}</p>
        <p className="text-muted-foreground text-xs truncate">{person.email}</p>
      </div>
      <Badge className={`text-xs border-0 ${statusBadge[person.status || 'active']}`}>
        {statusLabel[person.status || 'active']}
      </Badge>
    </div>
  );
}

// ─── Overview Modal ───────────────────────────────────────────────────────────

function OrgOverviewModal({ org, onClose }: { org: Org; onClose: () => void }) {
  const [overview, setOverview] = useState<OrgOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin-panel/organizations/${org.id}/overview`);
    const d = await r.json();
    setOverview(d);
    setLoading(false);
  }, [org.id]);

  useEffect(() => { load(); }, [load]);

  const color = org.primaryColor || '#6366f1';

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-foreground font-bold text-xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: color }}>
              {org.logoUrl
                ? <img src={org.logoUrl} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : (org.name || 'م')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{org.name}</DialogTitle>
              <p className="text-muted-foreground text-sm">{planLabels[org.plan] || 'مجاني'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : !overview ? (
          <div className="text-center py-12 text-red-400">فشل تحميل البيانات</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'مستفيد', value: overview.beneficiaries.length, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'مرشد', value: overview.mentors.length, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { label: 'مدرب', value: overview.coaches.length, icon: UserCheck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'متجر', value: overview.stores.length, icon: Store, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map(s => {
                const SIcon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.bg} flex-shrink-0`}>
                      <SIcon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-muted-foreground text-xs">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Tabs defaultValue="beneficiaries">
              <TabsList className="w-full">
                <TabsTrigger value="beneficiaries" className="flex-1 text-xs">مستفيدون ({overview.beneficiaries.length})</TabsTrigger>
                <TabsTrigger value="mentors" className="flex-1 text-xs">مرشدون ({overview.mentors.length})</TabsTrigger>
                <TabsTrigger value="coaches" className="flex-1 text-xs">مدربون ({overview.coaches.length})</TabsTrigger>
                <TabsTrigger value="stores" className="flex-1 text-xs">متاجر ({overview.stores.length})</TabsTrigger>
              </TabsList>
              {(['beneficiaries', 'mentors', 'coaches'] as const).map(tab => (
                <TabsContent key={tab} value={tab} className="mt-3">
                  {overview[tab].length === 0
                    ? <p className="text-center text-muted-foreground py-8">لا يوجد بيانات</p>
                    : <div className="divide-y divide-border rounded-xl border border-border px-3">{overview[tab].map(p => <PersonRow key={p.id} person={p} />)}</div>}
                </TabsContent>
              ))}
              <TabsContent value="stores" className="mt-3">
                {overview.stores.length === 0
                  ? <p className="text-center text-muted-foreground py-8">لا توجد متاجر</p>
                  : (
                    <div className="divide-y divide-border rounded-xl border border-border px-3">
                      {overview.stores.map(s => (
                        <div key={s.id} className="flex items-center gap-3 py-2">
                          <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-blue-500/10 flex-shrink-0"><Store className="h-4 w-4 text-blue-400" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name || '—'}</p>
                          </div>
                          {s.hidden && <Badge variant="secondary" className="text-xs">مخفي</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Org Sections Modal ────────────────────────────────────────────────────────

function OrgSectionsModal({ org, onClose }: { org: Org; onClose: () => void }) {
  const [sections, setSections] = useState<OrgSections>(() => {
    const saved = org.dashboardSections;
    return {
      organization: { ...defaultSections.organization, ...(saved?.organization || {}) },
      beneficiary: { ...defaultSections.beneficiary, ...(saved?.beneficiary || {}) },
      mentor: { ...defaultSections.mentor, ...(saved?.mentor || {}) },
      coach: { ...defaultSections.coach, ...(saved?.coach || {}) },
    };
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (dash: keyof OrgSections, key: string) =>
    setSections(s => ({ ...s, [dash]: { ...s[dash], [key]: !s[dash][key] } }));

  const toggleAll = (dash: keyof OrgSections, val: boolean) =>
    setSections(s => ({ ...s, [dash]: Object.fromEntries(Object.keys(s[dash]).map(k => [k, val])) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin-panel/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dashboardSections: sections }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/20 flex-shrink-0">
              <Sliders className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>تخصيص أقسام: {org.name}</DialogTitle>
              <p className="text-muted-foreground text-xs mt-0.5">فعّل أو أوقف أقسام لوحات التحكم لهذه المنظمة</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {dashboardMeta.map(dash => {
            const keys = Object.keys(sectionLabels[dash.key]);
            const enabledCount = keys.filter(k => sections[dash.key][k] !== false).length;
            return (
              <div key={dash.key} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold text-sm ${dash.color}`}>{dash.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{enabledCount} من {keys.length}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => toggleAll(dash.key, true)}>تفعيل الكل</Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={() => toggleAll(dash.key, false)}>إيقاف الكل</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {keys.map(key => (
                    <div key={key} className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2">
                      <span className="text-xs">{sectionLabels[dash.key][key]}</span>
                      <Switch
                        checked={sections[dash.key][key] !== false}
                        onCheckedChange={() => toggle(dash.key, key)}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className={saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ الأقسام'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Org | null>(null);
  const [overviewOrg, setOverviewOrg] = useState<Org | null>(null);
  const [sectionsOrg, setSectionsOrg] = useState<Org | null>(null);
  const [addForm, setAddForm] = useState<OrgForm>(emptyForm);
  const [editForm, setEditForm] = useState<OrgForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin-panel/organizations")
      .then(r => r.json())
      .then(d => { setOrgs(d.orgs || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openEdit = (org: Org) => {
    setEditOrg(org);
    setEditForm({ name: org.name || "", plan: org.plan || "free", primaryColor: org.primaryColor || "#6366f1", logoUrl: org.logoUrl || "" });
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    await fetch("/api/admin-panel/organizations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(addForm) });
    setSaving(false);
    setAddOpen(false);
    setAddForm(emptyForm);
    load();
  };

  const handleEdit = async () => {
    if (!editOrg) return;
    setSaving(true);
    await fetch(`/api/admin-panel/organizations/${editOrg.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false);
    setEditOrg(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;
    await fetch(`/api/admin-panel/organizations/${deleteOrg.id}`, { method: "DELETE" });
    setDeleteOrg(null);
    load();
  };

  const filtered = orgs.filter(o => (o.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-full" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المنظمات</h1>
          <p className="text-muted-foreground text-sm">إدارة جميع المنظمات المسجلة — {orgs.length} منظمة</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />إضافة منظمة
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن منظمة..." className="bg-muted border-border text-foreground pr-10" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-16">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">لا توجد منظمات</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
          {filtered.map(org => {
            const color = org.primaryColor || "#6366f1";
            const initial = (org.name || "م")[0];
            return (
              <Card key={org.id} className="bg-card border-border shadow-lg shadow-black/20 hover:border-border transition-all w-full overflow-hidden">
                <CardContent className="p-4">
                  {/* Header: logo + info + dropdown */}
                  <div className="flex items-start gap-3 mb-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center text-foreground font-bold text-lg overflow-hidden" style={{ backgroundColor: color }}>
                      {org.logoUrl
                        ? <img src={org.logoUrl} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : initial}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-foreground font-semibold truncate text-sm">{org.name || "—"}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${planColors[org.plan] || planColors.free}`}>
                          {planLabels[org.plan] || "مجاني"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 border border-border" style={{ backgroundColor: color }} />
                          <span className="truncate font-mono">{color}</span>
                        </span>
                      </div>
                      {org.inviteCode && <p className="text-muted-foreground text-xs mt-0.5 font-mono truncate">كود: {org.inviteCode}</p>}
                    </div>

                    {/* Dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">خيارات المنظمة</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setOverviewOrg(org)} className="gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" />عرض الأعضاء
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(org)} className="gap-2 cursor-pointer">
                          <Pencil className="h-4 w-4" />تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSectionsOrg(org)} className="gap-2 cursor-pointer">
                          <Sliders className="h-4 w-4" />تخصيص الأقسام
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteOrg(org)} className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />حذف المنظمة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick action buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setOverviewOrg(org)} className="border-border text-foreground/90 hover:text-foreground hover:bg-accent gap-1 text-xs px-2">
                      <Eye className="h-3 w-3 flex-shrink-0" /><span className="truncate">عرض</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSectionsOrg(org)} className="border-border text-foreground/90 hover:text-foreground hover:bg-accent gap-1 text-xs px-2">
                      <Sliders className="h-3 w-3 flex-shrink-0" /><span className="truncate">الأقسام</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(org)} className="border-border text-foreground/90 hover:text-foreground hover:bg-accent gap-1 text-xs px-2">
                      <Pencil className="h-3 w-3 flex-shrink-0" /><span className="truncate">تعديل</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {overviewOrg && <OrgOverviewModal org={overviewOrg} onClose={() => setOverviewOrg(null)} />}
      {sectionsOrg && <OrgSectionsModal org={sectionsOrg} onClose={() => { setSectionsOrg(null); load(); }} />}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { if (!open) { setAddOpen(false); setAddForm(emptyForm); } }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle>إضافة منظمة جديدة</DialogTitle></DialogHeader>
          <OrgFormFields form={addForm} onChange={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddForm(emptyForm); }}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={!addForm.name.trim() || saving}>{saving ? "جاري الحفظ..." : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOrg} onOpenChange={open => { if (!open) setEditOrg(null); }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle>تعديل: {editOrg?.name}</DialogTitle></DialogHeader>
          <OrgFormFields form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrg(null)}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteOrg} onOpenChange={open => { if (!open) setDeleteOrg(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف منظمة "{deleteOrg?.name}"؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
