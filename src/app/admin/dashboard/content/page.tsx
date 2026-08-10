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
import { useLanguage } from "@/components/language-provider";

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

const COLLECTIONS: Record<string, { label: string; labelEn: string; col: string; titleField: string; subtitleField?: string }> = {
  projects:     { label: 'الفرص والمشاريع', labelEn: 'Opportunities & Projects', col: 'projects',     titleField: 'title', subtitleField: 'organizationName' },
  articles:     { label: 'المقالات',         labelEn: 'Articles', col: 'articles',     titleField: 'title', subtitleField: 'authorName' },
  live_sessions:{ label: 'الجلسات المباشرة', labelEn: 'Live Sessions', col: 'live_sessions', titleField: 'title', subtitleField: 'coachName' },
  courses:      { label: 'الدورات التدريبية', labelEn: 'Courses', col: 'courses',     titleField: 'title', subtitleField: 'coachName' },
};

const PROJECT_TYPES = ['تدريب', 'تطوع', 'وظيفة', 'منحة', 'مبادرة', 'أخرى'];

function StatusBadge({ status }: { status?: string }) {
  const isPublished = status === 'published';
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
      {isPublished ? bi('● منشور', '● Published') : bi('● مسودة', '● Draft')}
    </span>
  );
}

function formatDate(d?: string, locale: string = 'ar-SA') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{published}</span> {bi('منشور', 'published')}
            <span className="mr-2 text-yellow-400 font-semibold">{drafts}</span> {bi('مسودة', 'draft')}
            <span className="mr-2 text-muted-foreground">{list.length} {bi('إجمالي', 'total')}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={load} className="text-muted-foreground hover:text-foreground h-7 w-7 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => openAdd(col)} className="mr-auto bg-primary hover:bg-primary/80 text-primary-foreground gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {bi('إضافة جديد', 'Add new')}
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {list.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">{bi('لا يوجد محتوى بعد', 'No content yet')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('العنوان', 'Title')}</th>
                      <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden sm:table-cell">
                        {col === 'projects' ? bi('المنظمة', 'Organization') : col === 'articles' ? bi('الكاتب', 'Author') : bi('المدرب', 'Coach')}
                      </th>
                      <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('الحالة', 'Status')}</th>
                      <th className="text-right text-muted-foreground text-xs px-4 py-3 hidden md:table-cell">{bi('تاريخ الإنشاء', 'Created')}</th>
                      <th className="text-right text-muted-foreground text-xs px-4 py-3">{bi('إجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(item => {
                      const title = item[meta.titleField] || item.name || '—';
                      const subtitle = meta.subtitleField ? item[meta.subtitleField] : '';
                      const key = `${col}-${item.id}`;
                      return (
                        <tr key={item.id} className="border-b border-border hover:bg-accent/50">
                          <td className="px-4 py-3">
                            <p className="text-foreground text-sm font-medium line-clamp-1">{title}</p>
                            {col === 'projects' && item.type && <p className="text-xs text-muted-foreground mt-0.5">{item.type}</p>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-muted-foreground text-xs">{subtitle || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-muted-foreground text-xs">{formatDate(item.createdAt, locale)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => toggleStatus(col, item.id, item.status)}
                                disabled={toggling === key}
                                className={`h-7 w-7 p-0 ${item.status === 'published' ? 'text-yellow-400 hover:text-yellow-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                                title={item.status === 'published' ? bi('إلغاء النشر', 'Unpublish') : bi('نشر', 'Publish')}
                              >
                                {toggling === key
                                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  : item.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />
                                }
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => setDeleteTarget({ col, id: item.id, title })}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
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
      <Label className="text-foreground/90 text-xs">{bi('صورة الغلاف', 'Cover image')}</Label>
      {(coverPreview || addForm.coverImageUrl) && (
        <img src={coverPreview || addForm.coverImageUrl} alt="" className="w-full h-28 object-cover rounded-lg border border-border" />
      )}
      <div className="flex gap-2">
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        <Button type="button" size="sm" variant="outline"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="border-border text-foreground/90 hover:text-foreground gap-1.5 flex-1">
          <Upload className="h-3.5 w-3.5" />
          {uploadingCover ? bi('جاري الرفع...', 'Uploading...') : bi('رفع صورة', 'Upload image')}
        </Button>
      </div>
      <Input
        value={addForm.coverImageUrl || ''}
        onChange={e => { setAddForm(p => ({ ...p, coverImageUrl: e.target.value })); setCoverPreview(null); }}
        placeholder={bi('أو أدخل رابط الصورة https://...', 'Or enter image URL https://...')}
        className="bg-muted border-border text-foreground text-xs"
      />
    </div>
  );

  // Add form fields per collection
  const renderAddForm = () => {
    if (!showAdd) return null;
    const f = (key: string, label: string, type: 'input' | 'textarea' | 'select' = 'input', options?: string[]) => (
      <div className="space-y-1.5" key={key}>
        <Label className="text-foreground/90 text-xs">{label}</Label>
        {type === 'textarea' ? (
          <Textarea value={addForm[key] || ''} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
            className="bg-muted border-border text-foreground text-sm resize-none" rows={3} />
        ) : type === 'select' ? (
          <Select value={addForm[key] || ''} onValueChange={v => setAddForm(p => ({ ...p, [key]: v }))}>
            <SelectTrigger className="bg-muted border-border text-foreground text-sm"><SelectValue placeholder={bi('اختر...', 'Choose...')} /></SelectTrigger>
            <SelectContent>{options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={addForm[key] || ''} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
            className="bg-muted border-border text-foreground text-sm" />
        )}
      </div>
    );

    const commonFields = [f('title', bi('العنوان *', 'Title *'))];

    const extraFields: Record<string, JSX.Element[]> = {
      projects: [
        f('description', bi('الوصف', 'Description'), 'textarea'),
        f('type', bi('نوع الفرصة', 'Opportunity type'), 'select', PROJECT_TYPES),
        f('organizationName', bi('اسم المنظمة', 'Organization name')),
        f('location', bi('الموقع', 'Location')),
        f('deadline', bi('الموعد النهائي (YYYY-MM-DD)', 'Deadline (YYYY-MM-DD)')),
        coverUploadField,
      ],
      articles: [
        f('excerpt', bi('مقتطف', 'Excerpt')),
        f('content', bi('المحتوى', 'Content'), 'textarea'),
        f('authorName', bi('اسم الكاتب', 'Author name')),
        f('authorRole', bi('دور الكاتب', 'Author role'), 'select', ['mentor', 'coach']),
        f('tags', bi('التاغات (افصل بفاصلة)', 'Tags (comma-separated)')),
        coverUploadField,
      ],
      live_sessions: [
        f('description', bi('الوصف', 'Description'), 'textarea'),
        f('coachName', bi('اسم المدرب', 'Coach name')),
        f('date', bi('التاريخ والوقت (ISO)', 'Date & time (ISO)')),
        f('duration', bi('المدة (دقائق)', 'Duration (minutes)')),
        f('price', bi('السعر', 'Price')),
        f('maxParticipants', bi('الحد الأقصى للمشاركين', 'Max participants')),
        f('meetLink', bi('رابط الاجتماع', 'Meeting link')),
        coverUploadField,
      ],
      courses: [
        f('description', bi('الوصف', 'Description'), 'textarea'),
        f('coachName', bi('اسم المدرب', 'Coach name')),
        f('price', bi('السعر', 'Price')),
        f('duration', bi('المدة', 'Duration')),
        f('level', bi('المستوى', 'Level')),
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
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{bi('إدارة المحتوى', 'Content Management')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{bi('نشر وإلغاء نشر وإدارة جميع المحتوى على المنصة', 'Publish, unpublish, and manage all content on the platform')}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> {bi('المحتوى', 'Content')} <strong>{bi('المنشور', 'published')}</strong> {bi('يظهر على الموقع', 'appears on the site')}
        </span>
        <span className="flex items-center gap-2">
          <EyeOff className="h-4 w-4" /> {bi('المحتوى', 'Content')} <strong>{bi('كمسودة', 'as a draft')}</strong> {bi('لا يظهر للزوار', "doesn't appear to visitors")}
        </span>
        <span className="text-muted-foreground mr-auto text-xs">{bi('اضغط أيقونة العين لتغيير الحالة فوراً', 'Click the eye icon to change status instantly')}</span>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-16 animate-pulse">{bi('جاري تحميل المحتوى...', 'Loading content...')}</div>
      ) : (
        <Tabs defaultValue="projects">
          <TabsList className="bg-muted rounded-xl h-auto flex-wrap gap-0.5 p-1">
            {Object.entries(COLLECTIONS).map(([key, meta]) => (
              <TabsTrigger key={key} value={key}
                className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground text-xs sm:text-sm">
                {bi(meta.label, meta.labelEn)}
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
        <DialogContent dir={dir} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bi('إضافة —', 'Add —')} {showAdd ? bi(COLLECTIONS[showAdd]?.label, COLLECTIONS[showAdd]?.labelEn) : ''}</DialogTitle>
          </DialogHeader>
          {renderAddForm()}
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => { setShowAdd(null); setAddForm({}); setCoverPreview(null); }}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={handleAdd} disabled={saving || !addForm.title?.trim()} className="bg-primary hover:bg-primary/80">
              {saving ? bi('جاري الحفظ...', 'Saving...') : bi('نشر مباشرة', 'Publish directly')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi('تأكيد الحذف', 'Confirm Deletion')}</AlertDialogTitle>
            <AlertDialogDescription>{bi(`هل أنت متأكد من حذف "${deleteTarget?.title}"؟ لا يمكن التراجع.`, `Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`)}</AlertDialogDescription>
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
