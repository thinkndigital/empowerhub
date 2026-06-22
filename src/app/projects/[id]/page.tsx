"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, MapPin, Calendar, Building2, CheckCircle } from "lucide-react";

interface FieldConfig {
  enabled: boolean;
  required: boolean;
  label?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  organizationName: string;
  type: string;
  location: string;
  deadline: string;
  registrationForm: {
    fields: Record<string, FieldConfig>;
  };
}

const TYPE_COLORS: Record<string, string> = {
  'تدريب': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'تطوع': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'وظيفة': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'منحة': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'مبادرة': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'أخرى': 'bg-muted text-muted-foreground',
};

const FIELD_TYPES: Record<string, 'input' | 'textarea' | 'select'> = {
  phone: 'input',
  birthDate: 'input',
  gender: 'select',
  education: 'select',
  major: 'input',
  currentJob: 'input',
  yearsOfExperience: 'input',
  city: 'input',
  linkedin: 'input',
  portfolio: 'input',
  skills: 'textarea',
  motivation: 'textarea',
  customQuestion1: 'textarea',
  customQuestion2: 'textarea',
  customQuestion3: 'textarea',
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  phone: '05xxxxxxxx',
  birthDate: 'YYYY-MM-DD',
  gender: '',
  education: '',
  major: 'مثال: علوم الحاسب',
  currentJob: 'مثال: موظف في شركة ...',
  yearsOfExperience: 'مثال: 3',
  city: 'مثال: الرياض',
  linkedin: 'https://linkedin.com/in/...',
  portfolio: 'https://...',
  skills: 'اذكر مهاراتك الرئيسية...',
  motivation: 'ما الذي يدفعك للتقديم على هذه الفرصة؟',
  customQuestion1: 'اكتب إجابتك هنا...',
  customQuestion2: 'اكتب إجابتك هنا...',
  customQuestion3: 'اكتب إجابتك هنا...',
};

const GENDER_OPTIONS = ['ذكر', 'أنثى'];
const EDUCATION_OPTIONS = ['ثانوية', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه', 'أخرى'];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchProject() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/projects/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const json = await res.json();
        setProject(json.project);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function deadlineLabel(deadline: string) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'انتهى التقديم';
    if (diff === 0) return 'آخر يوم للتقديم';
    return `${diff} يوم متبقي`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    if (!formData.name || !formData.email) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الاسم والبريد الإلكتروني مطلوبان' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/projects/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'خطأ في التقديم');
      }
      setSubmitted(true);
      toast({ title: 'تم التقديم بنجاح', description: 'سيتم التواصل معك قريباً' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-foreground">المشروع غير موجود</h1>
        <Button onClick={() => router.push('/projects')}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للمشاريع
        </Button>
      </div>
    );
  }

  const enabledFields = Object.entries(project.registrationForm?.fields || {})
    .filter(([, cfg]) => cfg.enabled)
    .map(([key, cfg]) => ({ key, ...cfg }));

  const isExpired = project.deadline && new Date(project.deadline) < new Date();

  function renderField(key: string, label: string, required: boolean) {
    const type = FIELD_TYPES[key] || 'input';
    const placeholder = FIELD_PLACEHOLDERS[key] || '';
    const value = formData[key] || '';

    if (type === 'textarea') {
      return (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key}>
            {label}
            {required && <span className="text-destructive mr-1">*</span>}
          </Label>
          <Textarea
            id={key}
            value={value}
            onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            required={required}
            rows={3}
          />
        </div>
      );
    }

    if (type === 'select') {
      const options = key === 'gender' ? GENDER_OPTIONS : EDUCATION_OPTIONS;
      return (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key}>
            {label}
            {required && <span className="text-destructive mr-1">*</span>}
          </Label>
          <select
            id={key}
            value={value}
            onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
            required={required}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">اختر...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1.5">
        <Label htmlFor={key}>
          {label}
          {required && <span className="text-destructive mr-1">*</span>}
        </Label>
        <Input
          id={key}
          value={value}
          onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          required={required}
          dir={key === 'linkedin' || key === 'portfolio' ? 'ltr' : 'rtl'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Cover */}
      {project.coverImageUrl && (
        <div className="w-full aspect-video max-h-[400px] overflow-hidden bg-muted">
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.push('/projects')} className="mb-6 gap-2 text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للمشاريع
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-medium px-3 py-0.5 rounded-full ${TYPE_COLORS[project.type] || TYPE_COLORS['أخرى']}`}>
              {project.type}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{project.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {project.organizationName && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {project.organizationName}
              </span>
            )}
            {project.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {project.location}
              </span>
            )}
            {project.deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(project.deadline)}
                {!isExpired && (
                  <Badge variant="outline" className="text-xs">
                    {deadlineLabel(project.deadline)}
                  </Badge>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-loose whitespace-pre-line mb-10">
          {project.description}
        </div>

        <Separator className="mb-10" />

        {/* Registration Form */}
        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">تم إرسال طلبك بنجاح!</h2>
            <p className="text-muted-foreground">سيتم مراجعة طلبك والتواصل معك قريباً.</p>
            <Button variant="outline" onClick={() => router.push('/projects')}>
              استعراض فرص أخرى
            </Button>
          </div>
        ) : isExpired ? (
          <div className="text-center py-8 bg-destructive/10 rounded-2xl">
            <p className="text-destructive font-medium">انتهت مدة التقديم على هذه الفرصة</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">نموذج التقديم</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Always required: name + email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">
                  الاسم الكامل
                  <span className="text-destructive mr-1">*</span>
                </Label>
                <Input
                  id="reg-name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="أدخل اسمك الكامل"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">
                  البريد الإلكتروني
                  <span className="text-destructive mr-1">*</span>
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                />
              </div>

              {/* Dynamic fields */}
              {enabledFields.map(field =>
                renderField(field.key, field.label || field.key, field.required)
              )}

              <Button type="submit" disabled={submitting} className="w-full h-11 text-base">
                {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
