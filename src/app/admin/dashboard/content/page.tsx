"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, FileEdit, Trash2, Plus, Eye, EyeOff, RefreshCw, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface ContentItem {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  type?: string;
  authorName?: string;
  organizationName?: string;
  coachName?: string;
  createdAt?: string;
  publishedAt?: string;
  [key: string]: any;
}

const COLLECTIONS: Record<string, { label: string; col: string; titleField: string; subtitleField?: string }> = {
  projects:     { label: 'الفرص والمشاريع', col: 'projects',     titleField: 'title', subtitleField: 'organizationName' },
  articles:     { label: 'المقالات',         col: 'articles',     titleField: 'title', subtitleField: 'authorName' },
  live_sessions:{ label: 'الجلسات المباشرة', col: 'live_sessions', titleField: 'title', subtitleField: 'coachName' },
  courses:      { label: 'الدورات التدريبية', col: 'courses',     titleField: 'title', subtitleField: 'coachName' },
};

const PROJECT_TYPES = ['تدريب', 'تطوع', 'وظيفة', 'منحة', 'مبادرة', 'أخرى'];

function StatusBadge({ status }: { status?: string }) {
  const isPublished = status === 'published';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
      {isPublished ? '● منشور' : '● مسودة'}
    </span>
  );
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function adminUpload(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/admin-panel/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'فشل رفع الصورة');
  return json.url as string;
}

export default function ContentPage() {
  const [items, setItems] = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ col: string; id: string; title: string } | null>(null);
  const [showAdd, setShowAdd] = useState<string | null>(null); // col name
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin-panel/content');
    const d = await res.json();
    setItems({
      projects: d.projects || [],
      articles: d.articles || [],
      live_sessions: d.live_sessions || [],
      courses: d.courses || [],
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (col: string, id: string, current?: string) => {
    const key = `${col}-${id}`;
    setToggling(key);
    const newStatus = current === 'published' ? 'draft' : 'published';
    await fetch('/api/admin-panel/content', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: col, id, status: newStatus }),
    });
    setToggling(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch('/api/admin-panel/content', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: deleteTarget.col, id: deleteTarget.id }),
    });
    setDeleteTarget(null);
    await load();
  };

  const handleAdd = async () => {
    if (!showAdd) return;
    setSaving(true);
    await fetch('/api/admin-panel/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: showAdd, ...addForm, status: 'published' }),
    });
    setSaving(false);
    setShowAdd(null);
    setAddForm({});
    setCoverPreview(null);
    await load();
  };

  const openAdd = (col: string) => {
    setAddForm({});
    setCoverPreview(null);
    setShowAdd(col);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const url = await adminUpload(file, 'covers');
      setAddForm(p => ({ ...p, coverImageUrl: url }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const renderTable = (col: string) => {
    const meta = COLLECTIONS[col];
    const list = items[col] || [];
    const published = list.filter(i => i.status === 'published').length;
    const drafts = list.filter(i => i.status !== 'published').length;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-emerald-400 font-semibold">{published}</span> منشور
            <span className="mr-2 text-yellow-400 font-semibold">{drafts}</span> مسودة
            <span className="mr-2 text-slate-500">{list.length} إجمالي</span>
          </div>
          <Button size="sm" variant="ghost" onClick={load} className="text-slate-400 hover:text-white h-7 w-7 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => openAdd(col)} className="mr-auto bg-primary hover:bg-primary/80 text-white gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            إضافة جديد
          </Button>
        </div>

        <Card className="bg-slate-900/60 border-white/[0.08] shadow-lg shadow-black/20">
          <CardContent className="p-0">
            {list.length === 0 ? (
              <p className="text-slate-500 text-center py-10">لا يوجد محتوى بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-right text-slate-400 text-xs px-4 py-3">العنوان</th>
                      <th className="text-right text-slate-400 text-xs px-4 py-3 hidden sm:table-cell">
                        {col === 'projects' ? 'المنظمة' : col === 'articles' ? 'الكاتب' : col === 'courses' ? 'المدرب' : 'المدرب'}
                      </th>
                      <th className="text-right text-slate-400 text-xs px-4 py-3">الحالة</th>
                      <th className="text-right text-slate-400 text-xs px-4 py-3 hidden md:table-cell">تاريخ الإنشاء</th>
                      <th className="text-right text-slate-400 text-xs px-4 py-3">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(item => {
                      const title = item[meta.titleField] || item.name || '—';
                      const subtitle = meta.subtitleField ? item[meta.subtitleField] : '';
                      const key = `${col}-${item.id}`;
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium line-clamp-1">{title}</p>
                            {col === 'projects' && item.type && <p className="text-xs text-slate-500 mt-0.5">{item.type}</p>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-slate-400 text-xs">{subtitle || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-slate-500 text-xs">{formatDate(item.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => toggleStatus(col, item.id, item.status)}
                                disabled={toggling === key}
                                className={`h-7 w-7 p-0 ${item.status === 'published' ? 'text-yellow-400 hover:text-yellow-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                                title={item.status === 'published' ? 'إلغاء النشر' : 'نشر'}
                              >
                                {toggling === key
                                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  : item.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />
                                }
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => setDeleteTarget({ col, id: item.id, title })}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const coverUploadField = (
    <div className="space-y-2" key="coverImageUrl">
      <Label className="text-slate-300 text-xs">صورة الغلاف</Label>
      {(coverPreview || addForm.coverImageUrl) && (
        <img src={coverPreview || addForm.coverImageUrl} alt="" className="w-full h-28 object-cover rounded-lg border border-white/[0.08]" />
      )}
      <div className="flex gap-2">
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        <Button type="button" size="sm" variant="outline"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="border-white/20 text-slate-300 hover:text-white gap-1.5 flex-1">
          <Upload className="h-3.5 w-3.5" />
          {uploadingCover ? 'جاري الرفع...' : 'رفع صورة'}
        </Button>
      </div>
      <Input
        value={addForm.coverImageUrl || ''}
        onChange={e => { setAddForm(p => ({ ...p, coverImageUrl: e.target.value })); setCoverPreview(null); }}
        placeholder="أو أدخل رابط الصورة https://..."
        className="bg-slate-800 border-white/[0.08] text-white text-xs"
      />
    </div>
  );

  // Add form fields per collection
  const renderAddForm = () => {
    if (!showAdd) return null;
    const f = (key: string, label: string, type: 'input' | 'textarea' | 'select' = 'input', options?: string[]) => (
      <div className="space-y-1.5" key={key}>
        <Label className="text-slate-300 text-xs">{label}</Label>
        {type === 'textarea' ? (
          <Textarea value={addForm[key] || ''} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
            className="bg-slate-800 border-white/[0.08] text-white text-sm resize-none" rows={3} />
        ) : type === 'select' ? (
          <Select value={addForm[key] || ''} onValueChange={v => setAddForm(p => ({ ...p, [key]: v }))}>
            <SelectTrigger className="bg-slate-800 border-white/[0.08] text-white text-sm"><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>{options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={addForm[key] || ''} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
            className="bg-slate-800 border-white/[0.08] text-white text-sm" />
        )}
      </div>
    );

    const commonFields = [f('title', 'العنوان *')];

    const extraFields: Record<string, JSX.Element[]> = {
      projects: [
        f('description', 'الوصف', 'textarea'),
        f('type', 'نوع الفرصة', 'select', PROJECT_TYPES),
        f('organizationName', 'اسم المنظمة'),
        f('location', 'الموقع'),
        f('deadline', 'الموعد النهائي (YYYY-MM-DD)'),
        coverUploadField,
      ],
      articles: [
        f('excerpt', 'مقتطف'),
        f('content', 'المحتوى', 'textarea'),
        f('authorName', 'اسم الكاتب'),
        f('authorRole', 'دور الكاتب', 'select', ['mentor', 'coach']),
        f('tags', 'التاغات (افصل بفاصلة)'),
        coverUploadField,
      ],
      live_sessions: [
        f('description', 'الوصف', 'textarea'),
        f('coachName', 'اسم المدرب'),
        f('date', 'التاريخ والوقت (ISO)'),
        f('duration', 'المدة (دقائق)'),
        f('price', 'السعر'),
        f('maxParticipants', 'الحد الأقصى للمشاركين'),
        f('meetLink', 'رابط الاجتماع'),
        coverUploadField,
      ],
      courses: [
        f('description', 'الوصف', 'textarea'),
        f('coachName', 'اسم المدرب'),
        f('price', 'السعر'),
        f('duration', 'المدة'),
        f('level', 'المستوى'),
        coverUploadField,
      ],
    };

    return (
      <div className="space-y-3 py-2">
        {commonFields}
        {(extraFields[showAdd] || []).map(el => el)}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">إدارة المحتوى</h1>
        <p className="text-slate-400 text-sm mt-1">نشر وإلغاء نشر وإدارة جميع المحتوى على المنصة</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> المحتوى <strong>المنشور</strong> يظهر على الموقع
        </span>
        <span className="flex items-center gap-2">
          <EyeOff className="h-4 w-4" /> المحتوى <strong>كمسودة</strong> لا يظهر للزوار
        </span>
        <span className="text-slate-400 mr-auto text-xs">اضغط أيقونة العين لتغيير الحالة فوراً</span>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-16 animate-pulse">جاري تحميل المحتوى...</div>
      ) : (
        <Tabs defaultValue="projects">
          <TabsList className="bg-slate-800 border border-white/[0.08] h-auto flex-wrap gap-0.5">
            {Object.entries(COLLECTIONS).map(([key, meta]) => (
              <TabsTrigger key={key} value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400 text-xs sm:text-sm">
                {meta.label}
                <span className="mr-1.5 text-[10px] opacity-70">({(items[key] || []).length})</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.keys(COLLECTIONS).map(key => (
            <TabsContent key={key} value={key} className="mt-4">
              {renderTable(key)}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Add Dialog */}
      <Dialog open={!!showAdd} onOpenChange={o => { if (!o) { setShowAdd(null); setAddForm({}); setCoverPreview(null); } }}>
        <DialogContent dir="rtl" className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة — {showAdd ? COLLECTIONS[showAdd]?.label : ''}</DialogTitle>
          </DialogHeader>
          {renderAddForm()}
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => { setShowAdd(null); setAddForm({}); setCoverPreview(null); }}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={saving || !addForm.title?.trim()} className="bg-primary hover:bg-primary/80">
              {saving ? 'جاري الحفظ...' : 'نشر مباشرة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف "{deleteTarget?.title}"؟ لا يمكن التراجع.</AlertDialogDescription>
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
