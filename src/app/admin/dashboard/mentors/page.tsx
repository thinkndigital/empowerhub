"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Trash2, Pencil, Plus, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";

interface Person {
  id: string; name: string; email: string; role: string;
  organizationId?: string; status?: string; avatarUrl?: string; specializations?: string[];
}

const statusBadge: Record<string, string> = { active: "text-emerald-400", suspended: "text-red-400", pending: "text-yellow-400" };
const statusLabel: Record<string, string> = { active: "نشط", suspended: "موقوف", pending: "معلق" };
const statusLabelEn: Record<string, string> = { active: "Active", suspended: "Suspended", pending: "Pending" };

function PeopleTable({ data, onEdit, onDelete }: { data: Person[]; onEdit: (p: Person) => void; onDelete: (p: Person) => void }) {
  const [search, setSearch] = useState("");
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const tStatus = lang === 'en' ? statusLabelEn : statusLabel;
  const filtered = data.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={bi('بحث...', 'Search...')} className="bg-muted border-border text-foreground pr-10" />
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">{bi('لا يوجد بيانات', 'No data')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('الاسم', 'Name')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden md:table-cell">{bi('البريد', 'Email')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden sm:table-cell">{bi('التخصصات', 'Specializations')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('الحالة', 'Status')}</th>
                    <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('إجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-border hover:bg-accent/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.avatarUrl} />
                            <AvatarFallback className="bg-muted text-xs text-foreground/90">{p.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-sm">{p.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-muted-foreground text-sm">{p.email}</span></td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-muted-foreground text-xs">
                          {Array.isArray(p.specializations) ? p.specializations.join('، ') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${statusBadge[p.status || 'active']}`}>
                          ● {tStatus[p.status || 'active']}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => onEdit(p)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onDelete(p)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
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

const emptyForm = { name: '', email: '', bio: '', specializations: '', sessionPrice: '', avatarUrl: '', whatsapp: '', linkedin: '', instagram: '', yearsOfExperience: '' };

async function adminUpload(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/admin-panel/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'فشل رفع الصورة');
  return json.url as string;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Person[]>([]);
  const [coaches, setCoaches] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [addRole, setAddRole] = useState<'mentor' | 'coach'>('mentor');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
    await fetch(`/api/admin-panel/mentors`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: deletePerson.id }),
    });
    setDeletePerson(null);
    load();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await adminUpload(file, 'avatars');
      setForm(f => ({ ...f, avatarUrl: url }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch('/api/admin-panel/mentors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        role: addRole,
        specializations: form.specializations.split('،').map(s => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setShowAdd(false);
    setForm(emptyForm);
    setAvatarPreview(null);
    load();
  };

  const field = (key: keyof typeof form, label: string, type: 'input' | 'textarea' = 'input', placeholder = '') => (
    <div className="space-y-1.5">
      <Label className="text-foreground/90 text-xs">{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="bg-muted border-border text-foreground text-sm resize-none"
          rows={3}
        />
      ) : (
        <Input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="bg-muted border-border text-foreground text-sm"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bi('المرشدون والمدربون', 'Mentors & Coaches')}</h1>
          <p className="text-muted-foreground text-sm">{bi('إدارة جميع المرشدين والمدربين في المنصة', 'Manage all mentors and coaches on the platform')}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          {bi('إضافة', 'Add')}
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-12">{bi('جاري التحميل...', 'Loading...')}</div>
      ) : (
        <Tabs defaultValue="mentors">
          <TabsList className="bg-muted rounded-xl p-1 gap-1">
            <TabsTrigger value="mentors" className="rounded-lg border-0 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
              {bi('المرشدون', 'Mentors')} ({mentors.length})
            </TabsTrigger>
            <TabsTrigger value="coaches" className="rounded-lg border-0 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
              {bi('المدربون', 'Coaches')} ({coaches.length})
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

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={o => { if (!o) { setShowAdd(false); setForm(emptyForm); setAvatarPreview(null); } }}>
        <DialogContent dir={dir} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bi(`إضافة ${addRole === 'mentor' ? 'مرشد' : 'مدرب'} جديد`, `Add New ${addRole === 'mentor' ? 'Mentor' : 'Coach'}`)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Role picker */}
            <div className="space-y-1.5">
              <Label className="text-foreground/90 text-xs">{bi('النوع', 'Type')}</Label>
              <div className="flex gap-2">
                {(['mentor', 'coach'] as const).map(r => (
                  <button key={r} onClick={() => setAddRole(r)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${addRole === r ? (r === 'mentor' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-orange-600 border-orange-500 text-white') : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    {r === 'mentor' ? bi('مرشد', 'Mentor') : bi('مدرب', 'Coach')}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar upload */}
            <div className="space-y-2">
              <Label className="text-foreground/90 text-xs">{bi('الصورة الشخصية', 'Profile picture')}</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full border border-border overflow-hidden bg-muted flex-shrink-0">
                  {(avatarPreview || form.avatarUrl) ? (
                    <img src={avatarPreview || form.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">{bi('صورة', 'Image')}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading}
                    className="border-border text-foreground/90 hover:text-foreground gap-1.5 w-fit">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? bi('جاري الرفع...', 'Uploading...') : bi('رفع صورة', 'Upload image')}
                  </Button>
                  <span className="text-xs text-muted-foreground">{bi('أو', 'or')}</span>
                  <Input
                    value={form.avatarUrl}
                    onChange={e => { setForm(f => ({ ...f, avatarUrl: e.target.value })); setAvatarPreview(null); }}
                    placeholder={bi('رابط الصورة https://...', 'Image URL https://...')}
                    className="bg-muted border-border text-foreground text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {field('name', bi('الاسم *', 'Name *'), 'input', bi('أحمد العلي', 'John Smith'))}
            {field('email', bi('البريد الإلكتروني', 'Email'), 'input', 'ahmed@example.com')}
            {field('bio', bi('نبذة تعريفية', 'Bio'), 'textarea', bi('خبير في ...', 'Expert in ...'))}
            {field('specializations', bi('التخصصات (افصل بـ ،)', 'Specializations (comma-separated)'), 'input', bi('القيادة، ريادة الأعمال، التسويق', 'Leadership, Entrepreneurship, Marketing'))}
            {field('sessionPrice', bi('سعر الجلسة (د.أ)', 'Session price (JOD)'), 'input', '200')}
            {field('yearsOfExperience', bi('سنوات الخبرة', 'Years of experience'), 'input', '10')}
            {field('whatsapp', bi('واتساب (مع رمز الدولة)', 'WhatsApp (with country code)'), 'input', '966501234567')}
            {field('linkedin', bi('رابط LinkedIn', 'LinkedIn URL'), 'input', 'https://linkedin.com/in/...')}
            {field('instagram', bi('رابط Instagram', 'Instagram URL'), 'input', 'https://instagram.com/...')}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); setAvatarPreview(null); }}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={handleAdd} disabled={saving || !form.name.trim()} className="bg-purple-600 hover:bg-purple-700">
              {saving ? bi('جاري الحفظ...', 'Saving...') : bi('إضافة', 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status */}
      <Dialog open={!!editPerson} onOpenChange={o => !o && setEditPerson(null)}>
        <DialogContent dir={dir} className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{bi('تعديل:', 'Edit:')} {editPerson?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>{bi('الحالة', 'Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{bi('نشط', 'Active')}</SelectItem>
                <SelectItem value="suspended">{bi('موقوف', 'Suspended')}</SelectItem>
                <SelectItem value="pending">{bi('معلق', 'Pending')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPerson(null)}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "..." : bi("حفظ", "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deletePerson} onOpenChange={o => !o && setDeletePerson(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi('تأكيد الحذف', 'Confirm Deletion')}</AlertDialogTitle>
            <AlertDialogDescription>{bi(`هل أنت متأكد من حذف "${deletePerson?.name}"؟`, `Are you sure you want to delete "${deletePerson?.name}"?`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{bi('حذف', 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
