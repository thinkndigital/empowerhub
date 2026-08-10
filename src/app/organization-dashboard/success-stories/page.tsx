"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, Plus, Pencil, Trash2, Quote } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface SuccessStory {
  id: string;
  beneficiaryName: string;
  beneficiaryRole: string;
  title: string;
  content: string;
  avatarUrl: string;
  stars: number;
  status: "published" | "draft";
  orgName: string;
  createdAt: string | null;
}

const emptyForm = {
  beneficiaryName: '',
  beneficiaryRole: '',
  title: '',
  content: '',
  avatarUrl: '',
  stars: 5,
  status: 'published' as 'published' | 'draft',
};

export default function OrgSuccessStoriesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/success-stories', {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setStories(json.stories || []);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل القصص', 'Failed to load stories') });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(story: SuccessStory) {
    setEditing(story);
    setForm({
      beneficiaryName: story.beneficiaryName,
      beneficiaryRole: story.beneficiaryRole,
      title: story.title,
      content: story.content,
      avatarUrl: story.avatarUrl,
      stars: story.stars,
      status: story.status,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!user) return;
    if (!form.beneficiaryName.trim() || !form.content.trim()) {
      toast({ variant: 'destructive', title: bi('الاسم ونص القصة مطلوبان', 'Name and story text are required') });
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const url = editing
        ? `/api/org/success-stories/${editing.id}`
        : '/api/org/success-stories';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || bi('فشل الحفظ', 'Save failed'));
      }
      toast({ title: editing ? bi('تم التعديل بنجاح', 'Updated successfully') : bi('تمت الإضافة بنجاح', 'Added successfully') });
      setDialogOpen(false);
      fetchStories();
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !deleteId) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/org/success-stories/${deleteId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(bi('فشل الحذف', 'Delete failed'));
      toast({ title: bi('تم الحذف', 'Deleted') });
      setDeleteId(null);
      fetchStories();
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(story: SuccessStory) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const newStatus = story.status === 'published' ? 'draft' : 'published';
      await fetch(`/api/org/success-stories/${story.id}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: newStatus === 'published' ? bi('تم النشر', 'Published') : bi('تم إخفاء القصة', 'Story hidden') });
      fetchStories();
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ في تغيير الحالة', 'Failed to change status') });
    }
  }

  const published = stories.filter(s => s.status === 'published').length;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("قصص النجاح", "Success stories")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bi("أضف قصص نجاح المستفيدين لتظهر في الصفحة الرئيسية للمنصة", "Add beneficiary success stories to display on the platform's homepage")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1.5" /> {bi("إضافة قصة", "Add story")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: bi('إجمالي القصص', 'Total stories'), value: stories.length },
          { label: bi('منشور', 'Published'), value: published },
          { label: bi('مسودة', 'Draft'), value: stories.length - published },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stories list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
          <Quote className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-medium">{bi("لا توجد قصص بعد", "No stories yet")}</p>
          <p className="text-sm mt-1">{bi("أضف أول قصة نجاح لمستفيديك", "Add your first beneficiary success story")}</p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4 ml-1.5" /> {bi("إضافة قصة", "Add story")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map(story => (
            <div key={story.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {story.avatarUrl ? (
                    <img
                      src={story.avatarUrl}
                      alt={story.beneficiaryName}
                      className="h-10 w-10 rounded-full object-cover shrink-0 border border-border"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {story.beneficiaryName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{story.beneficiaryName}</p>
                    {story.beneficiaryRole && (
                      <p className="text-xs text-muted-foreground truncate">{story.beneficiaryRole}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={story.status === 'published' ? 'default' : 'secondary'}
                  className="shrink-0 cursor-pointer text-xs"
                  onClick={() => toggleStatus(story)}
                >
                  {story.status === 'published' ? bi('منشور', 'Published') : bi('مسودة', 'Draft')}
                </Badge>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-3 w-3 ${j < story.stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                &ldquo;{story.content}&rdquo;
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(story)}>
                  <Pencil className="h-3.5 w-3.5 ml-1" /> {bi("تعديل", "Edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteId(story.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir={dir} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? bi('تعديل القصة', 'Edit story') : bi('إضافة قصة نجاح', 'Add a success story')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{bi("اسم المستفيد *", "Beneficiary name *")}</Label>
                <Input
                  placeholder={bi("سارة أحمد", "Sara Ahmad")}
                  value={form.beneficiaryName}
                  onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{bi("الدور / المسمى", "Role / title")}</Label>
                <Input
                  placeholder={bi("رائدة أعمال", "Entrepreneur")}
                  value={form.beneficiaryRole}
                  onChange={e => setForm(f => ({ ...f, beneficiaryRole: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{bi("عنوان القصة (اختياري)", "Story title (optional)")}</Label>
              <Input
                placeholder={bi("من الصفر إلى أول عملية بيع...", "From scratch to first sale...")}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{bi("نص القصة *", "Story text *")}</Label>
              <Textarea
                placeholder={bi("اكتب قصة نجاح المستفيد بكلماته...", "Write the beneficiary's success story in their words...")}
                rows={4}
                className="resize-none"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{bi("رابط صورة المستفيد (اختياري)", "Beneficiary photo URL (optional)")}</Label>
              <Input
                placeholder="https://..."
                dir="ltr"
                value={form.avatarUrl}
                onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{bi("التقييم", "Rating")}</Label>
                <Select
                  value={String(form.stars)}
                  onValueChange={v => setForm(f => ({ ...f, stars: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {'★'.repeat(n)} ({n})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{bi("الحالة", "Status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={v => setForm(f => ({ ...f, status: v as 'published' | 'draft' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">{bi("منشور", "Published")}</SelectItem>
                    <SelectItem value="draft">{bi("مسودة", "Draft")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{bi("إلغاء", "Cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? bi('جارٍ الحفظ...', 'Saving...') : (editing ? bi('حفظ التعديلات', 'Save changes') : bi('إضافة القصة', 'Add story'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent dir={dir} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{bi("حذف القصة", "Delete story")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{bi("هل أنت متأكد من حذف هذه القصة؟ لا يمكن التراجع.", "Are you sure you want to delete this story? This cannot be undone.")}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{bi("إلغاء", "Cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? bi('جارٍ الحذف...', 'Deleting...') : bi('حذف', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
