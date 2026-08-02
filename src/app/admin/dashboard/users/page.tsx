"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, Pencil, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface User {
  id: string; name: string; email: string; role: string;
  organizationId?: string; status?: string; avatarUrl?: string;
}

const roleBadge: Record<string, string> = {
  admin: "bg-red-500/20 text-red-300 border-red-500/30",
  organization: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  mentor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  coach: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  beneficiary: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};
const roleLabel: Record<string, string> = {
  admin: "مشرف", organization: "منظمة", mentor: "مرشد", coach: "مدرب", beneficiary: "مستفيد",
};
const statusBadge: Record<string, string> = {
  active: "text-emerald-400", suspended: "text-red-400", pending: "text-yellow-400",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState({ role: "", status: "" });
  const [saving, setSaving] = useState(false);

  const load = (role?: string) => {
    setLoading(true);
    const q = role && role !== "all" ? `?role=${role}` : "";
    fetch(`/api/admin-panel/users${q}`).then(r => r.json()).then(d => {
      setUsers(d.users || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(roleFilter); }, [roleFilter]);

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ role: u.role, status: u.status || "active" });
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    await fetch(`/api/admin-panel/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditUser(null);
    load(roleFilter);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    await fetch(`/api/admin-panel/users/${deleteUser.id}`, { method: "DELETE" });
    setDeleteUser(null);
    load(roleFilter);
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المستخدمون</h1>
        <p className="text-muted-foreground text-sm">إدارة جميع المستخدمين في المنصة</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="bg-muted border-border text-foreground pr-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-muted border-border text-foreground/90">
            <SelectValue placeholder="كل الأدوار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            <SelectItem value="beneficiary">المستفيدون</SelectItem>
            <SelectItem value="mentor">المرشدون</SelectItem>
            <SelectItem value="coach">المدربون</SelectItem>
            <SelectItem value="organization">المنظمات</SelectItem>
            <SelectItem value="admin">المشرفون</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border shadow-lg shadow-black/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-muted-foreground text-center py-12">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground text-center py-12">لا يوجد مستخدمون</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right text-muted-foreground text-xs font-medium px-4 py-3">المستخدم</th>
                    <th className="text-right text-muted-foreground text-xs font-medium px-4 py-3 hidden md:table-cell">البريد</th>
                    <th className="text-right text-muted-foreground text-xs font-medium px-4 py-3">الدور</th>
                    <th className="text-right text-muted-foreground text-xs font-medium px-4 py-3 hidden sm:table-cell">الحالة</th>
                    <th className="text-right text-muted-foreground text-xs font-medium px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="bg-muted text-foreground/90 text-xs">{user.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-sm font-medium truncate max-w-[120px]">{user.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-muted-foreground text-sm">{user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadge[user.role] || roleBadge.beneficiary}`}>
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-medium ${statusBadge[user.status || 'active']}`}>
                          ● {user.status === 'suspended' ? 'موقوف' : user.status === 'pending' ? 'معلق' : 'نشط'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(user)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteUser(user)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={o => !o && setEditUser(null)}>
        <DialogContent dir="rtl" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تعديل: {editUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beneficiary">مستفيد</SelectItem>
                  <SelectItem value="mentor">مرشد</SelectItem>
                  <SelectItem value="coach">مدرب</SelectItem>
                  <SelectItem value="organization">منظمة</SelectItem>
                  <SelectItem value="admin">مشرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteUser} onOpenChange={o => !o && setDeleteUser(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف "{deleteUser?.name}"؟ سيُحذف من Firebase Auth وقاعدة البيانات.</AlertDialogDescription>
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
