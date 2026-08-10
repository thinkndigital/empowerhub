"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusCircle, FileText, Edit2, Trash2, Clock, Tag, Globe, FileEdit, Upload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFile } from "@/lib/upload-file";
import { useLanguage } from "@/components/language-provider";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string | null;
  readTime: number;
}

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  tags: '',
  status: 'draft' as 'draft' | 'published',
};

export default function MentorArticlesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/articles', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setArticles(json.articles || []);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل المقالات', 'Failed to load articles') });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(article: Article) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImageUrl || '',
      tags: (article.tags || []).join(', '),
      status: article.status,
    });
    setDialogOpen(true);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const token = await user.getIdToken();
      const url = await uploadFile(file, 'articles', token);
      setForm(f => ({ ...f, coverImageUrl: url }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: err.message || bi('فشل رفع الصورة', 'Failed to upload the image') });
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.content) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('العنوان والمحتوى مطلوبان', 'Title and content are required') });
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/articles/${editingId}` : '/api/articles';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, tags: form.tags }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || bi('خطأ', 'Error'));
      }
      toast({ title: editingId ? bi('تم التحديث', 'Updated') : bi('تم الإنشاء', 'Created'), description: editingId ? bi('تم تحديث المقال بنجاح', 'The article was updated successfully') : bi('تم إنشاء المقال بنجاح', 'The article was created successfully') });
      setDialogOpen(false);
      fetchArticles();
    } catch (err: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !deleteId) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/articles/${deleteId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      toast({ title: bi('تم الحذف', 'Deleted'), description: bi('تم حذف المقال بنجاح', 'The article was deleted successfully') });
      setDeleteId(null);
      fetchArticles();
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل حذف المقال', 'Failed to delete the article') });
    } finally {
      setDeleting(false);
    }
  }

  const total = articles.length;
  const published = articles.filter(a => a.status === 'published').length;
  const drafts = articles.filter(a => a.status === 'draft').length;

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("المقالات", "Articles")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{bi("اكتب وانشر مقالاتك للمستفيدين والزوار", "Write and publish articles for beneficiaries and visitors")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {bi("مقال جديد", "New article")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: bi('إجمالي المقالات', 'Total articles'), value: total, icon: FileText },
          { label: bi('منشور', 'Published'), value: published, icon: Globe },
          { label: bi('مسودات', 'Drafts'), value: drafts, icon: FileEdit },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2 shrink-0">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">{bi("لا توجد مقالات بعد", "No articles yet")}</p>
          <p className="text-sm mt-1">{bi("ابدأ بكتابة مقالك الأول", "Start writing your first article")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {articles.map(article => (
            <Card key={article.id} className="overflow-hidden">
              {article.coverImageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2 flex-1">{article.title}</h3>
                  <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
                    {article.status === 'published' ? bi('منشور', 'Published') : bi('مسودة', 'Draft')}
                  </Badge>
                </div>
                {article.excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime} {bi("دقيقة قراءة", "min read")}
                  </span>
                  {article.createdAt && (
                    <span>{formatDate(article.createdAt)}</span>
                  )}
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="flex items-center gap-0.5 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                        <Tag className="h-2.5 w-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(article)}
                  >
                    <Edit2 className="h-3.5 w-3.5 ml-1.5" />
                    {bi("تعديل", "Edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(article.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir={dir} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? bi('تعديل المقال', 'Edit article') : bi('إنشاء مقال جديد', 'Create a new article')}</DialogTitle>
          </DialogHeader>
          <form id="article-form" onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">{bi("العنوان *", "Title *")}</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={bi("عنوان المقال", "Article title")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="excerpt">{bi("المقتطف", "Excerpt")}</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder={bi("وصف مختصر للمقال...", "A brief description of the article...")}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">{bi("المحتوى *", "Content *")}</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={bi("اكتب محتوى المقال هنا...", "Write the article content here...")}
                rows={12}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverImageUrl">{bi("صورة الغلاف", "Cover image")}</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://..."
                  dir="ltr"
                  className="flex-1"
                />
                <label className="cursor-pointer shrink-0">
                  <Button type="button" variant="outline" size="icon" disabled={uploadingCover} asChild>
                    <span>
                      {uploadingCover ? <span className="text-xs">⏳</span> : <Upload className="h-4 w-4" />}
                    </span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
                {form.coverImageUrl && (
                  <div className="h-10 w-10 rounded-lg border overflow-hidden shrink-0">
                    <img src={form.coverImageUrl} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">{bi("الوسوم (مفصولة بفاصلة)", "Tags (comma-separated)")}</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder={bi("تطوير ذاتي، ريادة أعمال، مهارات", "Self-development, entrepreneurship, skills")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{bi("الحالة", "Status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm(f => ({ ...f, status: v as 'draft' | 'published' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{bi("مسودة", "Draft")}</SelectItem>
                  <SelectItem value="published">{bi("منشور", "Published")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {bi("إلغاء", "Cancel")}
            </Button>
            <Button type="submit" form="article-form" disabled={submitting}>
              {submitting ? bi('جاري الحفظ...', 'Saving...') : editingId ? bi('حفظ التغييرات', 'Save changes') : bi('إنشاء المقال', 'Create article')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bi("حذف المقال", "Delete article")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">{bi("هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.", "Are you sure you want to delete this article? This action cannot be undone.")}</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
              {bi("إلغاء", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? bi('جاري الحذف...', 'Deleting...') : bi('حذف', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
