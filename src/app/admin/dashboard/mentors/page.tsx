"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Person { id: string; name: string; email: string; role: string; organizationId?: string; status?: string; avatarUrl?: string; specializations?: string[]; }

const statusBadge: Record<string, string> = { active: "text-emerald-400", suspended: "text-red-400", pending: "text-yellow-400" };
const statusLabel: Record<string, string> = { active: "نشط", suspended: "موقوف", pending: "معلق" };

function PeopleTable({ data, onEdit, onDelete }: { data: Person[]; onEdit: (p: Person) => void; onDelete: (p: Person) => void }) {
  const [search, setSearch] = useState("");
  const filtered = data.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="bg-slate-800 border-white/10 text-white pr-10" />
      </div>
      <Card className="bg-slate-800/50 border-white/10">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-10">لا يوجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-right text-slate-400 text-xs px-4 py-3">الاسم</th>
                    <th className="text-right text-slate-400 text-xs px-4 py-3 hidden md:table-cell">البريد</th>
                    <th className="text-right text-slate-400 text-xs px-4 py-3 hidden sm:table-cell">التخصصات</th>
                    <th className="text-right text-slate-400 text-xs px-4 py-3">الحالة</th>
                    <th className="text-right text-slate-400 text-xs px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.avatarUrl} />
                            <AvatarFallback className="bg-slate-700 text-xs text-slate-300">{p.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm">{p.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-slate-400 text-sm">{p.email}</span></td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-slate-400 text-xs">
                          {Array.isArray(p.specializations) ? p.specializations.join('، ') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${statusBadge[p.status || 'active']}`}>
                          ● {statusLabel[p.status || 'active']}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => onEdit(p)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onDelete(p)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-400">
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
    </div>
  );
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Person[]>([]);
  const [coaches, setCoaches] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin-panel/mentors").then(r => r.json()).then(d => {
      setMentors(d.mentors || []);
      setCoaches(d.coaches || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleEdit = async () => {
    if (!editPerson) return;
    setSaving(true);
    await fetch(`/api/admin-panel/users/${editPerson.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    setEditPerson(null);
    load();
  };

  const handleDelete = async () => {
    if (!deletePerson) return;
    await fetch(`/api/admin-panel/users/${deletePerson.id}`, { method: "DELETE" });
    setDeletePerson(null);
    load();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">المرشدون والمدربون</h1>
        <p className="text-slate-400 text-sm">إدارة جميع المرشدين والمدربين في المنصة</p>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">جاري التحميل...</div>
      ) : (
        <Tabs defaultValue="mentors">
          <TabsList className="bg-slate-800 border border-white/10">
            <TabsTrigger value="mentors" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">
              المرشدون ({mentors.length})
            </TabsTrigger>
            <TabsTrigger value="coaches" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400">
              المدربون ({coaches.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mentors" className="mt-4">
            <PeopleTable data={mentors} onEdit={p => { setEditPerson(p); setStatus(p.status || 'active'); }} onDelete={setDeletePerson} />
          </TabsContent>
          <TabsContent value="coaches" className="mt-4">
            <PeopleTable data={coaches} onEdit={p => { setEditPerson(p); setStatus(p.status || 'active'); }} onDelete={setDeletePerson} />
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Status */}
      <Dialog open={!!editPerson} onOpenChange={o => !o && setEditPerson(null)}>
        <DialogContent dir="rtl" className="sm:max-w-sm">
          <DialogHeader><DialogTitle>تعديل: {editPerson?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPerson(null)}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deletePerson} onOpenChange={o => !o && setDeletePerson(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف "{deletePerson?.name}"؟</AlertDialogDescription>
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
