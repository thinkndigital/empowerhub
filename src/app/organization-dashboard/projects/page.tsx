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
import { Switch } from "@/components/ui/switch";
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
  PlusCircle, Briefcase, Edit2, Trash2, Globe, FileEdit,
  MapPin, Calendar, Users, Eye, Upload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFile } from "@/lib/upload-file";
import { useLanguage } from "@/components/language-provider";

interface FieldConfig {
  enabled: boolean;
  required: boolean;
  label?: string;
}

interface RegistrationForm {
  fields: Record<string, FieldConfig>;
}

interface Project {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  type: string;
  location: string;
  deadline: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string | null;
  registrationsCount: number;
  registrationForm: RegistrationForm;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  submittedAt: string | null;
  [key: string]: any;
}

const PROJECT_TYPES = ['تدريب', 'تطوع', 'وظيفة', 'منحة', 'مبادرة', 'أخرى'];

const OPTIONAL_FIELDS: Array<{ key: string; label: string; hasCustomLabel?: boolean }> = [
  { key: 'phone', label: 'رقم الهاتف' },
  { key: 'birthDate', label: 'تاريخ الميلاد' },
  { key: 'gender', label: 'الجنس' },
  { key: 'education', label: 'المستوى التعليمي' },
  { key: 'major', label: 'التخصص' },
  { key: 'currentJob', label: 'الوظيفة الحالية' },
  { key: 'yearsOfExperience', label: 'سنوات الخبرة' },
  { key: 'city', label: 'المدينة' },
  { key: 'linkedin', label: 'رابط LinkedIn' },
  { key: 'portfolio', label: 'ملف الأعمال' },
  { key: 'skills', label: 'المهارات' },
  { key: 'motivation', label: 'دوافع التقديم' },
  { key: 'customQuestion1', label: 'سؤال مخصص 1', hasCustomLabel: true },
  { key: 'customQuestion2', label: 'سؤال مخصص 2', hasCustomLabel: true },
  { key: 'customQuestion3', label: 'سؤال مخصص 3', hasCustomLabel: true },
];

function defaultRegistrationForm(): RegistrationForm {
  const fields: Record<string, FieldConfig> = {};
  for (const f of OPTIONAL_FIELDS) {
    fields[f.key] = { enabled: false, required: false, label: f.label };
  }
  return { fields };
}

const emptyForm = {
  title: '',
  description: '',
  coverImageUrl: '',
  type: 'أخرى',
  location: '',
  deadline: '',
  status: 'draft' as 'draft' | 'published',
  registrationForm: defaultRegistrationForm(),
};

export default function OrgProjectsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'form'>('basic');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Registrations view
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/projects', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setProjects(json.projects || []);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل المشاريع', 'Failed to load projects') });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function fetchRegistrations(projectId: string) {
    if (!user) return;
    setLoadingRegs(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/projects/${projectId}/registrations`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setRegistrations(json.registrations || []);
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحميل التسجيلات', 'Failed to load registrations') });
    } finally {
      setLoadingRegs(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setActiveTab('basic');
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      coverImageUrl: project.coverImageUrl || '',
      type: project.type || 'أخرى',
      location: project.location || '',
      deadline: project.deadline || '',
      status: project.status,
      registrationForm: project.registrationForm || defaultRegistrationForm(),
    });
    setActiveTab('basic');
    setDialogOpen(true);
  }

  function openViewRegs(project: Project) {
    setViewProject(project);
    fetchRegistrations(project.id);
  }

  function updateFieldConfig(key: string, updates: Partial<FieldConfig>) {
    setForm(f => ({
      ...f,
      registrationForm: {
        fields: {
          ...f.registrationForm.fields,
          [key]: { ...(f.registrationForm.fields[key] || { enabled: false, required: false }), ...updates },
        },
      },
    }));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const token = await user.getIdToken();
      const url = await uploadFile(file, 'projects', token);
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
    if (!form.title || !form.description) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('العنوان والوصف مطلوبان', 'Title and description are required') });
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || bi('خطأ', 'Error'));
      }
      toast({ title: editingId ? bi('تم التحديث', 'Updated') : bi('تم الإنشاء', 'Created') });
      setDialogOpen(false);
      fetchProjects();
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
      await fetch(`/api/projects/${deleteId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      toast({ title: bi('تم الحذف', 'Deleted') });
      setDeleteId(null);
      fetchProjects();
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل حذف المشروع', 'Failed to delete the project') });
    } finally {
      setDeleting(false);
    }
  }

  const total = projects.length;
  const published = projects.filter(p => p.status === 'published').length;
  const drafts = projects.filter(p => p.status === 'draft').length;
  const totalRegs = projects.reduce((sum, p) => sum + (p.registrationsCount || 0), 0);

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function deadlineLabel(deadline: string) {
    if (!deadline) return '';
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    if (diff < 0) return bi('انتهى', 'Ended');
    if (diff === 0) return bi('اليوم', 'Today');
    return bi(`${diff} يوم متبقي`, `${diff} days left`);
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("المشاريع والفرص", "Projects & opportunities")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{bi("انشر مشاريع وفرص التقديم للجمهور", "Publish projects and application opportunities to the public")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {bi("مشروع جديد", "New project")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: bi('إجمالي المشاريع', 'Total projects'), value: total, icon: Briefcase },
          { label: bi('منشور', 'Published'), value: published, icon: Globe },
          { label: bi('مسودات', 'Drafts'), value: drafts, icon: FileEdit },
          { label: bi('إجمالي التسجيلات', 'Total registrations'), value: totalRegs, icon: Users },
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

      {/* Projects grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Briefcase className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">{bi("لا توجد مشاريع بعد", "No projects yet")}</p>
          <p className="text-sm mt-1">{bi("أنشئ أول مشروع أو فرصة", "Create your first project or opportunity")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {projects.map(project => (
            <Card key={project.id} className="overflow-hidden">
              {project.coverImageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={project.coverImageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2 flex-1">{project.title}</h3>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {project.type}
                    </Badge>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {project.status === 'published' ? bi('منشور', 'Published') : bi('مسودة', 'Draft')}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">{project.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{project.location}
                    </span>
                  )}
                  {project.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{deadlineLabel(project.deadline)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />{project.registrationsCount || 0} {bi("تسجيل", "registrations")}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className=""
                    onClick={() => openViewRegs(project)}
                  >
                    <Eye className="h-3.5 w-3.5 ml-1.5" />
                    {bi("التسجيلات", "Registrations")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => openEdit(project)}
                  >
                    <Edit2 className="h-3.5 w-3.5 ml-1.5" />
                    {bi("تعديل", "Edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(project.id)}
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
            <DialogTitle>{editingId ? bi('تعديل المشروع', 'Edit project') : bi('إنشاء مشروع جديد', 'Create a new project')}</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'basic' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {bi("المعلومات الأساسية", "Basic information")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'form' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {bi("نموذج التسجيل", "Registration form")}
            </button>
          </div>

          <form id="project-form" onSubmit={handleSubmit} className="space-y-4 py-2">
            {activeTab === 'basic' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-title">{bi("العنوان *", "Title *")}</Label>
                  <Input
                    id="proj-title"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={bi("عنوان المشروع أو الفرصة", "Project or opportunity title")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-description">{bi("الوصف *", "Description *")}</Label>
                  <Textarea
                    id="proj-description"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={bi("وصف تفصيلي للمشروع أو الفرصة...", "A detailed description of the project or opportunity...")}
                    rows={5}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{bi("النوع", "Type")}</Label>
                    <Select
                      value={form.type}
                      onValueChange={v => setForm(f => ({ ...f, type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-location">{bi("الموقع", "Location")}</Label>
                    <Input
                      id="proj-location"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder={bi("الرياض / عن بُعد", "Riyadh / Remote")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-deadline">{bi("آخر موعد للتقديم", "Application deadline")}</Label>
                    <Input
                      id="proj-deadline"
                      type="date"
                      value={form.deadline}
                      onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{bi("الحالة", "Status")}</Label>
                    <Select
                      value={form.status}
                      onValueChange={v => setForm(f => ({ ...f, status: v as 'draft' | 'published' }))}
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
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-cover">{bi("صورة الغلاف", "Cover image")}</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="proj-cover"
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
              </>
            )}

            {activeTab === 'form' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {bi("حقلا الاسم والبريد الإلكتروني مطلوبان دائمًا. فعّل الحقول الإضافية التي تريدها.", "The name and email fields are always required. Enable any additional fields you want.")}
                </p>
                <div className="divide-y divide-border rounded-lg border overflow-hidden">
                  {OPTIONAL_FIELDS.map(field => {
                    const config = form.registrationForm.fields[field.key] || { enabled: false, required: false, label: field.label };
                    return (
                      <div key={field.key} className="flex items-center gap-4 p-3 bg-card">
                        <Switch
                          checked={!!config.enabled}
                          onCheckedChange={v => updateFieldConfig(field.key, { enabled: v, required: v ? config.required : false })}
                        />
                        <div className="flex-1 min-w-0">
                          {field.hasCustomLabel && config.enabled ? (
                            <Input
                              value={config.label || field.label}
                              onChange={e => updateFieldConfig(field.key, { label: e.target.value })}
                              placeholder={field.label}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className={`text-sm ${config.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {config.label || field.label}
                            </span>
                          )}
                        </div>
                        {config.enabled && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={!!config.required}
                              onCheckedChange={v => updateFieldConfig(field.key, { required: v })}
                            />
                            <span className="text-xs text-muted-foreground">{bi("مطلوب", "Required")}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {bi("إلغاء", "Cancel")}
            </Button>
            <Button type="submit" form="project-form" disabled={submitting}>
              {submitting ? bi('جاري الحفظ...', 'Saving...') : editingId ? bi('حفظ التغييرات', 'Save changes') : bi('إنشاء المشروع', 'Create project')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={!!viewProject} onOpenChange={(open) => !open && setViewProject(null)}>
        <DialogContent dir={dir} className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bi("تسجيلات:", "Registrations:")} {viewProject?.title}</DialogTitle>
          </DialogHeader>
          {loadingRegs ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : registrations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{bi("لا توجد تسجيلات بعد", "No registrations yet")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{bi("الاسم", "Name")}</TableHead>
                    <TableHead className="text-right">{bi("البريد الإلكتروني", "Email")}</TableHead>
                    <TableHead className="text-right">{bi("تاريخ التسجيل", "Registration date")}</TableHead>
                    <TableHead className="text-right">{bi("بيانات إضافية", "Additional data")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map(reg => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.name}</TableCell>
                      <TableCell dir="ltr">{reg.email}</TableCell>
                      <TableCell>
                        {reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString(locale) : ''}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {['phone', 'city', 'education', 'currentJob', 'skills'].map(k =>
                            reg[k] ? <div key={k}>{reg[k]}</div> : null
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewProject(null)}>{bi("إغلاق", "Close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bi("حذف المشروع", "Delete project")}</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500 text-sm">{bi("هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.", "Are you sure you want to delete this project? This action cannot be undone.")}</p>
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
