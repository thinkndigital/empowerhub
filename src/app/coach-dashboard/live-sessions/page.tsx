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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PlusCircle, Video, Edit2, Trash2, Calendar, Clock, Users,
  Globe, FileEdit, Upload, DollarSign, Link as LinkIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFile } from "@/lib/upload-file";
import { useLanguage } from "@/components/language-provider";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  date: string | null;
  duration: number;
  meetLink: string;
  price: number;
  maxParticipants: number | null;
  status: 'draft' | 'published';
  registrationsCount: number;
  createdAt: string | null;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string | null;
  paymentStatus: 'free' | 'pending' | 'paid';
}

const emptyForm = {
  title: '',
  description: '',
  coverImageUrl: '',
  date: '',
  duration: '60',
  meetLink: '',
  price: '0',
  maxParticipants: '',
  status: 'draft' as 'draft' | 'published',
};

export default function CoachLiveSessionsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [regsSession, setRegsSession] = useState<LiveSession | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/live-sessions', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setSessions(json.sessions || []);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل الجلسات المباشرة', 'Failed to load live sessions') });
    } finally {
      setLoading(false);
    }
  }, [user, toast, lang]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(s: LiveSession) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      description: s.description,
      coverImageUrl: s.coverImageUrl || '',
      date: s.date ? s.date.slice(0, 16) : '',
      duration: String(s.duration),
      meetLink: s.meetLink || '',
      price: String(s.price ?? 0),
      maxParticipants: s.maxParticipants != null ? String(s.maxParticipants) : '',
      status: s.status,
    });
    setDialogOpen(true);
  }

  async function openRegistrations(s: LiveSession) {
    if (!user) return;
    setRegsSession(s);
    setLoadingRegs(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/live-sessions/${s.id}/registrations`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setRegistrations(json.registrations || []);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل المسجلين', 'Failed to load registrations') });
    } finally {
      setLoadingRegs(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const token = await user.getIdToken();
      const url = await uploadFile(file, 'live-sessions', token);
      setForm(f => ({ ...f, coverImageUrl: url }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: err.message || bi('فشل رفع الصورة', 'Failed to upload image') });
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.date) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('العنوان والتاريخ مطلوبان', 'Title and date are required') });
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/live-sessions/${editingId}` : '/api/live-sessions';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          coverImageUrl: form.coverImageUrl,
          date: form.date,
          duration: Number(form.duration) || 60,
          meetLink: form.meetLink,
          price: Number(form.price) || 0,
          maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || bi('خطأ', 'Error'));
      }
      toast({
        title: editingId ? bi('تم التحديث', 'Updated') : bi('تم الإنشاء', 'Created'),
        description: editingId ? bi('تم تحديث الجلسة بنجاح', 'Session updated successfully') : bi('تم إنشاء الجلسة بنجاح', 'Session created successfully'),
      });
      setDialogOpen(false);
      fetchSessions();
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
      await fetch(`/api/live-sessions/${deleteId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      toast({ title: bi('تم الحذف', 'Deleted'), description: bi('تم حذف الجلسة بنجاح', 'Session deleted successfully') });
      setDeleteId(null);
      fetchSessions();
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل حذف الجلسة', 'Failed to delete session') });
    } finally {
      setDeleting(false);
    }
  }

  const total = sessions.length;
  const published = sessions.filter(s => s.status === 'published').length;
  const totalRegs = sessions.reduce((acc, s) => acc + (s.registrationsCount || 0), 0);

  const dateLocale = lang === 'en' ? 'en-US' : 'ar-SA';

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleString(dateLocale, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatRegDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi('الجلسات المباشرة', 'Live Sessions')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{bi('أنشئ وأدر جلساتك المباشرة المجدولة', 'Create and manage your scheduled live sessions')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {bi('جلسة جديدة', 'New Session')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: bi('إجمالي الجلسات', 'Total Sessions'), value: total, icon: Video },
          { label: bi('منشور', 'Published'), value: published, icon: Globe },
          { label: bi('إجمالي المسجلين', 'Total Registrations'), value: totalRegs, icon: Users },
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

      {/* Sessions grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Video className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">{bi('لا توجد جلسات مباشرة بعد', 'No live sessions yet')}</p>
          <p className="text-sm mt-1">{bi('ابدأ بإنشاء جلستك الأولى', 'Start by creating your first session')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sessions.map(session => (
            <Card key={session.id} className="overflow-hidden">
              {session.coverImageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={session.coverImageUrl}
                    alt={session.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2 flex-1">{session.title}</h3>
                  <Badge variant={session.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
                    {session.status === 'published' ? bi('منشور', 'Published') : bi('مسودة', 'Draft')}
                  </Badge>
                </div>
                {session.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">{session.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                  {session.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(session.date)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {bi(`${session.duration} دقيقة`, `${session.duration} min`)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {bi(`${session.registrationsCount} مسجل`, `${session.registrationsCount} registered`)}
                    {session.maxParticipants ? ` / ${session.maxParticipants}` : ''}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <DollarSign className="h-3 w-3" />
                    {session.price > 0 ? bi(`${session.price} د.أ`, `${session.price} JOD`) : bi('مجاني', 'Free')}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(session)}
                  >
                    <Edit2 className="h-3.5 w-3.5 ml-1.5" />
                    {bi('تعديل', 'Edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openRegistrations(session)}
                  >
                    <Users className="h-3.5 w-3.5 ml-1.5" />
                    {bi('المسجلون', 'Registrants')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(session.id)}
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
            <DialogTitle>{editingId ? bi('تعديل الجلسة المباشرة', 'Edit Live Session') : bi('إنشاء جلسة مباشرة جديدة', 'Create New Live Session')}</DialogTitle>
          </DialogHeader>
          <form id="live-session-form" onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ls-title">{bi('العنوان *', 'Title *')}</Label>
              <Input
                id="ls-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={bi('عنوان الجلسة المباشرة', 'Live session title')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ls-description">{bi('الوصف', 'Description')}</Label>
              <Textarea
                id="ls-description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={bi('وصف الجلسة وما ستتناوله...', 'Describe the session and what it will cover...')}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ls-cover">{bi('صورة الغلاف', 'Cover Image')}</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="ls-cover"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ls-date">{bi('التاريخ والوقت *', 'Date & Time *')}</Label>
                <Input
                  id="ls-date"
                  type="datetime-local"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ls-duration">{bi('المدة (دقيقة)', 'Duration (minutes)')}</Label>
                <Input
                  id="ls-duration"
                  type="number"
                  min="15"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="60"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ls-meet">{bi('رابط الاجتماع', 'Meeting Link')}</Label>
              <Input
                id="ls-meet"
                value={form.meetLink}
                onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))}
                placeholder="https://meet.google.com/..."
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ls-price">{bi('السعر (0 = مجاني)', 'Price (0 = free)')}</Label>
                <Input
                  id="ls-price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ls-max">{bi('الحد الأقصى للمشاركين', 'Max Participants')}</Label>
                <Input
                  id="ls-max"
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))}
                  placeholder={bi('غير محدود', 'Unlimited')}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{bi('الحالة', 'Status')}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm(f => ({ ...f, status: v as 'draft' | 'published' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{bi('مسودة', 'Draft')}</SelectItem>
                  <SelectItem value="published">{bi('منشور', 'Published')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {bi('إلغاء', 'Cancel')}
            </Button>
            <Button type="submit" form="live-session-form" disabled={submitting}>
              {submitting ? bi('جاري الحفظ...', 'Saving...') : editingId ? bi('حفظ التغييرات', 'Save Changes') : bi('إنشاء الجلسة', 'Create Session')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={!!regsSession} onOpenChange={(open) => !open && setRegsSession(null)}>
        <DialogContent dir={dir} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bi('المسجلون', 'Registrants')} — {regsSession?.title}</DialogTitle>
          </DialogHeader>
          {loadingRegs ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-30" />
              <p>{bi('لا يوجد مسجلون بعد', 'No registrants yet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{bi('الاسم', 'Name')}</TableHead>
                    <TableHead className="text-right">{bi('البريد الإلكتروني', 'Email')}</TableHead>
                    <TableHead className="text-right">{bi('الهاتف', 'Phone')}</TableHead>
                    <TableHead className="text-right">{bi('تاريخ التسجيل', 'Registration Date')}</TableHead>
                    <TableHead className="text-right">{bi('حالة الدفع', 'Payment Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map(reg => (
                    <TableRow key={reg.id}>
                      <TableCell>{reg.name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{reg.email}</TableCell>
                      <TableCell dir="ltr" className="text-right">{reg.phone || '—'}</TableCell>
                      <TableCell>{formatRegDate(reg.registeredAt)}</TableCell>
                      <TableCell>
                        <Badge variant={reg.paymentStatus === 'paid' ? 'default' : reg.paymentStatus === 'free' ? 'secondary' : 'outline'}>
                          {reg.paymentStatus === 'paid' ? bi('مدفوع', 'Paid') : reg.paymentStatus === 'free' ? bi('مجاني', 'Free') : bi('في الانتظار', 'Pending')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {bi(`إجمالي المسجلين: ${registrations.length}`, `Total registrants: ${registrations.length}`)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegsSession(null)}>{bi('إغلاق', 'Close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bi('حذف الجلسة المباشرة', 'Delete Live Session')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">{bi('هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to delete this session? This action cannot be undone.')}</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
              {bi('إلغاء', 'Cancel')}
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
