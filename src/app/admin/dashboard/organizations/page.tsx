"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Org {
  id: string; name: string; plan: string; primaryColor: string;
  logoUrl?: string; inviteCode?: string;
}

interface OrgForm {
  name: string; plan: string; primaryColor: string; logoUrl: string;
}

const planColors: Record<string, string> = {
  free: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  pro: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  enterprise: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};
const planLabels: Record<string, string> = { free: "مجاني", pro: "احترافي", enterprise: "مؤسسي" };

function OrgFormFields({ form, onChange }: { form: OrgForm; onChange: (f: OrgForm) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>اسم المنظمة</Label>
        <Input
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="اسم المنظمة"
        />
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
          <input
            type="color"
            value={form.primaryColor}
            onChange={e => onChange({ ...form, primaryColor: e.target.value })}
            className="h-10 w-12 rounded cursor-pointer border border-white/20 bg-transparent"
          />
          <div className="h-10 w-10 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: form.primaryColor }} />
          <Input
            value={form.primaryColor}
            onChange={e => onChange({ ...form, primaryColor: e.target.value })}
            className="flex-1 font-mono text-sm"
            dir="ltr"
            placeholder="#6366f1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>رابط الشعار (اختياري)</Label>
        <Input
          value={form.logoUrl}
          onChange={e => onChange({ ...form, logoUrl: e.target.value })}
          placeholder="https://..."
          dir="ltr"
        />
      </div>
    </div>
  );
}

const emptyForm: OrgForm = { name: "", plan: "free", primaryColor: "#6366f1", logoUrl: "" };

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Org | null>(null);
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
    await fetch("/api/admin-panel/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(addForm),
    });
    setSaving(false);
    setAddOpen(false);
    setAddForm(emptyForm);
    load();
  };

  const handleEdit = async () => {
    if (!editOrg) return;
    setSaving(true);
    await fetch(`/api/admin-panel/organizations/${editOrg.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editForm),
    });
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

  const filtered = orgs.filter(o =>
    (o.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">المنظمات</h1>
          <p className="text-slate-400 text-sm">إدارة جميع المنظمات المسجلة — {orgs.length} منظمة</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          إضافة منظمة
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث عن منظمة..."
          className="bg-slate-800 border-white/10 text-white pr-10"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-slate-400 text-center py-16">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-16">لا توجد منظمات</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(org => {
            const color = org.primaryColor || "#6366f1";
            const initial = (org.name || "م")[0];
            return (
              <Card key={org.id} className="bg-slate-800/50 border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-5">
                  {/* Org info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="h-14 w-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: color }}
                    >
                      {org.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={org.logoUrl}
                          alt=""
                          className="h-full w-full object-contain rounded-xl"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate text-base">{org.name || "—"}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${planColors[org.plan] || planColors.free}`}>
                          {planLabels[org.plan] || "مجاني"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="h-3 w-3 rounded-full inline-block border border-white/20" style={{ backgroundColor: color }} />
                          {color}
                        </span>
                      </div>
                      {org.inviteCode && (
                        <p className="text-slate-500 text-xs mt-1 font-mono">كود: {org.inviteCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(org)}
                      className="flex-1 border-white/20 text-slate-300 hover:text-white hover:bg-white/10 gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteOrg(org)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { if (!open) { setAddOpen(false); setAddForm(emptyForm); } }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle>إضافة منظمة جديدة</DialogTitle></DialogHeader>
          <OrgFormFields form={addForm} onChange={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddForm(emptyForm); }}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={!addForm.name.trim() || saving}>
              {saving ? "جاري الحفظ..." : "إضافة"}
            </Button>
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
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteOrg} onOpenChange={open => { if (!open) setDeleteOrg(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف منظمة "{deleteOrg?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
