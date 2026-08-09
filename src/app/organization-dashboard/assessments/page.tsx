"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck, Plus, Trash2, Send, Users, Eye, ChevronDown, ChevronUp,
  FileText, Star, List, GripVertical, X, CheckCircle2, Pencil, FolderOpen,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrgGroups } from "@/hooks/use-org-groups";

type QuestionType = 'text' | 'rating' | 'choice';
type AssessmentType = 'pre' | 'post' | 'both';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: AssessmentType;
  status: 'draft' | 'active' | 'closed';
  questions: Question[];
  sentTo: string[];
  responsesCount: number;
  orgName: string;
  orgLogo: string;
  orgColor: string;
  createdAt: string;
}

interface Person { id: string; name: string; email: string; }
type SendTab = 'beneficiaries' | 'coaches' | 'mentors' | 'groups';

const typeLabels: Record<AssessmentType, string> = { pre: 'قبلي', post: 'بعدي', both: 'قبلي وبعدي' };
const typeBadgeColor: Record<AssessmentType, string> = {
  pre: 'bg-blue-100 text-blue-700', post: 'bg-emerald-100 text-emerald-700', both: 'bg-purple-100 text-purple-700',
};
const qTypeLabels: Record<QuestionType, string> = { text: 'نص حر', rating: 'تقييم 1-5', choice: 'اختيار من متعدد' };
const qTypeIcons: Record<QuestionType, React.ReactNode> = {
  text: <FileText className="h-3.5 w-3.5" />,
  rating: <Star className="h-3.5 w-3.5" />,
  choice: <List className="h-3.5 w-3.5" />,
};

function newQuestion(): Question {
  return { id: crypto.randomUUID(), text: '', type: 'text', required: true };
}

export default function AssessmentsPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<Person[]>([]);
  const [coaches, setCoaches] = useState<Person[]>([]);
  const [mentors, setMentors] = useState<Person[]>([]);
  const { data: groups } = useOrgGroups();

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assessType, setAssessType] = useState<AssessmentType>('pre');
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);

  // Send dialog state
  const [sendOpen, setSendOpen] = useState(false);
  const [sendingAssessment, setSendingAssessment] = useState<Assessment | null>(null);
  const [sendTab, setSendTab] = useState<SendTab>('beneficiaries');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAssessment, setPreviewAssessment] = useState<Assessment | null>(null);

  const fetchAssessments = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/org/assessments', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAssessments(data.assessments || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser]);

  const fetchPeople = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const toRow = (u: any): Person => ({ id: u.id, name: u.name || u.email, email: u.email });
      const [bRes, cRes, mRes] = await Promise.all([
        fetch('/api/org/users?role=beneficiary&scope=all', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/org/users?role=coach&scope=all', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/org/users?role=mentor&scope=all', { headers: { authorization: `Bearer ${token}` } }),
      ]);
      setBeneficiaries(((await bRes.json()).users || []).map(toRow));
      setCoaches(((await cRes.json()).users || []).map(toRow));
      setMentors(((await mRes.json()).users || []).map(toRow));
    } catch { /* silent */ }
  }, [authUser]);

  useEffect(() => { fetchAssessments(); fetchPeople(); }, [fetchAssessments, fetchPeople]);

  const openCreate = () => {
    setEditingId(null);
    setTitle(''); setDescription(''); setAssessType('pre');
    setQuestions([newQuestion()]);
    setFormOpen(true);
  };

  const openEdit = (a: Assessment) => {
    setEditingId(a.id);
    setTitle(a.title); setDescription(a.description); setAssessType(a.type);
    setQuestions(a.questions.length > 0 ? a.questions : [newQuestion()]);
    setFormOpen(true);
  };

  const handleSave = async (asDraft = false) => {
    if (!authUser || !title.trim()) { toast({ variant: 'destructive', title: 'العنوان مطلوب' }); return; }
    if (questions.some(q => !q.text.trim())) { toast({ variant: 'destructive', title: 'أكمل نص جميع الأسئلة' }); return; }
    setSaving(true);
    try {
      const token = await authUser.getIdToken();
      const body: Record<string, any> = { title: title.trim(), description: description.trim(), type: assessType, questions };
    if (!editingId) body.status = 'draft';
      let res;
      if (editingId) {
        res = await fetch(`/api/org/assessments/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/org/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      }
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editingId ? 'تم تحديث النموذج' : 'تم إنشاء النموذج' });
      setFormOpen(false);
      fetchAssessments();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!authUser) return;
    if (!confirm('هل تريد حذف هذا النموذج؟')) return;
    try {
      const token = await authUser.getIdToken();
      await fetch(`/api/org/assessments/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      toast({ title: 'تم الحذف' });
      setAssessments(p => p.filter(a => a.id !== id));
    } catch { toast({ variant: 'destructive', title: 'فشل الحذف' }); }
  };

  const openSend = (a: Assessment) => {
    setSendingAssessment(a);
    setSendTab('beneficiaries');
    setSelectedBeneficiaries(beneficiaries.map(b => b.id));
    setSelectedCoaches([]);
    setSelectedMentors([]);
    setSendOpen(true);
  };

  const totalSelected = selectedBeneficiaries.length + selectedCoaches.length + selectedMentors.length;

  // Groups are just named subsets of beneficiaries — toggling one adds/
  // removes its members from the same selectedBeneficiaries list the
  // "المستفيدون" tab uses, rather than tracking a separate recipient type.
  const toggleGroup = (memberIds: string[]) => {
    const validIds = memberIds.filter(id => beneficiaries.some(b => b.id === id));
    const allSelected = validIds.length > 0 && validIds.every(id => selectedBeneficiaries.includes(id));
    setSelectedBeneficiaries(prev =>
      allSelected
        ? prev.filter(id => !validIds.includes(id))
        : Array.from(new Set([...prev, ...validIds]))
    );
  };

  const handleSend = async () => {
    if (!authUser || !sendingAssessment || totalSelected === 0) return;
    setSending(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/assessments/${sendingAssessment.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ beneficiaryIds: selectedBeneficiaries, coachIds: selectedCoaches, mentorIds: selectedMentors }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `تم الإرسال لـ ${data.sent} شخص` });
      setSendOpen(false);
      fetchAssessments();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل الإرسال', description: e.message });
    } finally { setSending(false); }
  };

  // Question helpers
  const addQuestion = () => setQuestions(p => [...p, newQuestion()]);
  const removeQuestion = (id: string) => setQuestions(p => p.filter(q => q.id !== id));
  const updateQuestion = (id: string, patch: Partial<Question>) =>
    setQuestions(p => p.map(q => q.id === id ? { ...q, ...patch } : q));
  const addOption = (qId: string) =>
    setQuestions(p => p.map(q => q.id === qId ? { ...q, options: [...(q.options || []), ''] } : q));
  const updateOption = (qId: string, idx: number, val: string) =>
    setQuestions(p => p.map(q => q.id === qId ? { ...q, options: (q.options || []).map((o, i) => i === idx ? val : o) } : q));
  const removeOption = (qId: string, idx: number) =>
    setQuestions(p => p.map(q => q.id === qId ? { ...q, options: (q.options || []).filter((_, i) => i !== idx) } : q));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نماذج التقييم</h1>
          <p className="text-sm text-muted-foreground mt-1">أنشئ نماذج تقييم مخصصة وأرسلها للمستفيدين</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />إنشاء نموذج
        </Button>
      </div>

      {/* Assessment cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : assessments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">لا توجد نماذج بعد</p>
            <p className="text-sm text-muted-foreground/70">أنشئ أول نموذج تقييم للمستفيدين</p>
            <Button onClick={openCreate} className="mt-2 gap-2"><Plus className="h-4 w-4" />إنشاء نموذج</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assessments.map(a => (
            <Card key={a.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2 ${typeBadgeColor[a.type]}`}>
                      {typeLabels[a.type]}
                    </span>
                    <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                    {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                  </div>
                  <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                    {a.status === 'active' ? 'نشط' : a.status === 'draft' ? 'مسودة' : 'مغلق'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{a.questions?.length || 0} سؤال</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{a.sentTo?.length || 0} مستفيد</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{a.responsesCount || 0} استجابة</span>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />تعديل
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openSend(a)}>
                    <Send className="h-3.5 w-3.5" />إرسال
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => { setPreviewAssessment(a); setPreviewOpen(true); }}>
                    <Eye className="h-3.5 w-3.5" />معاينة
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل النموذج' : 'إنشاء نموذج تقييم جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>عنوان النموذج *</Label>
                <Input placeholder="مثال: تقييم ما قبل التدريب" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>وصف النموذج</Label>
                <Textarea placeholder="وصف مختصر للغرض من هذا التقييم..." rows={2} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>نوع التقييم *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pre', 'post', 'both'] as AssessmentType[]).map(t => (
                    <button key={t} type="button"
                      onClick={() => setAssessType(t)}
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${assessType === t ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'}`}
                    >
                      <div className="text-base mb-0.5">{t === 'pre' ? '📋' : t === 'post' ? '✅' : '📊'}</div>
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">الأسئلة</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" />إضافة سؤال
                </Button>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                    <Input
                      placeholder="نص السؤال..."
                      value={q.text}
                      onChange={e => updateQuestion(q.id, { text: e.target.value })}
                      className="flex-1 bg-background"
                    />
                    <Select value={q.type} onValueChange={v => updateQuestion(q.id, { type: v as QuestionType, options: v === 'choice' ? ['', ''] : undefined })}>
                      <SelectTrigger className="w-36 h-9 bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['text', 'rating', 'choice'] as QuestionType[]).map(t => (
                          <SelectItem key={t} value={t} className="text-xs">
                            <span className="flex items-center gap-1.5">{qTypeIcons[t]} {qTypeLabels[t]}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => removeQuestion(q.id)} disabled={questions.length === 1}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Rating preview */}
                  {q.type === 'rating' && (
                    <div className="flex items-center gap-1 mr-7">
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} className="h-5 w-5 text-amber-300 fill-amber-300" />)}
                      <span className="text-xs text-muted-foreground mr-2">1 - 5</span>
                    </div>
                  )}

                  {/* Choice options */}
                  {q.type === 'choice' && (
                    <div className="mr-7 space-y-2">
                      {(q.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                          <Input value={opt} onChange={e => updateOption(q.id, oIdx, e.target.value)}
                            placeholder={`الخيار ${oIdx + 1}`} className="h-8 text-sm bg-background" />
                          <button type="button" onClick={() => removeOption(q.id, oIdx)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => addOption(q.id)} className="h-7 text-xs gap-1 mr-5">
                        <Plus className="h-3 w-3" />إضافة خيار
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mr-7">
                    <Checkbox id={`req-${q.id}`} checked={q.required} onCheckedChange={v => updateQuestion(q.id, { required: !!v })} />
                    <label htmlFor={`req-${q.id}`} className="text-xs text-muted-foreground cursor-pointer">مطلوب</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ النموذج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />إرسال النموذج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">اختر من سيتلقى نموذج <span className="font-medium text-foreground">"{sendingAssessment?.title}"</span></p>

            {/* Tabs */}
            <div className="flex rounded-lg border overflow-hidden text-sm">
              {([
                { key: 'groups',        label: 'المجموعات',  count: (groups ?? []).length, sel: (groups ?? []).filter(g => g.memberIds.length > 0 && g.memberIds.every(id => selectedBeneficiaries.includes(id))).length },
                { key: 'beneficiaries', label: 'المستفيدون', count: beneficiaries.length, sel: selectedBeneficiaries.length },
                { key: 'coaches',       label: 'المدربون',   count: coaches.length,       sel: selectedCoaches.length },
                { key: 'mentors',       label: 'المرشدون',   count: mentors.length,        sel: selectedMentors.length },
              ] as Array<{key: SendTab; label: string; count: number; sel: number}>).map(tab => (
                <button key={tab.key} type="button"
                  onClick={() => setSendTab(tab.key)}
                  className={`flex-1 py-2 px-3 font-medium transition-colors ${sendTab === tab.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}>
                  {tab.label}
                  {tab.sel > 0 && <span className={`mr-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${sendTab === tab.key ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{tab.sel}</span>}
                </button>
              ))}
            </div>

            {/* Groups list — selecting a group selects its member
                beneficiaries into the "المستفيدون" tab's list. */}
            {sendTab === 'groups' && (
              <div className="space-y-2">
                {(groups ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    لا توجد مجموعات — يمكنك إنشاؤها من صفحة المستفيدين
                  </p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {(groups ?? []).map(g => {
                      const validMemberIds = g.memberIds.filter(id => beneficiaries.some(b => b.id === id));
                      const allSelected = validMemberIds.length > 0 && validMemberIds.every(id => selectedBeneficiaries.includes(id));
                      return (
                        <div key={g.id} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-muted/40">
                          <Checkbox
                            id={`group-${g.id}`}
                            checked={allSelected}
                            disabled={validMemberIds.length === 0}
                            onCheckedChange={() => toggleGroup(g.memberIds)}
                          />
                          <label htmlFor={`group-${g.id}`} className="text-sm cursor-pointer flex-1 flex items-center gap-1.5">
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium">{g.name}</span>
                            <span className="text-muted-foreground text-xs mr-1">({validMemberIds.length} مستفيد)</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  اختيار مجموعة يحدد جميع أعضائها ضمن تبويب "المستفيدون".
                </p>
              </div>
            )}

            {/* People list */}
            {([
              { key: 'beneficiaries', list: beneficiaries, sel: selectedBeneficiaries, setSel: setSelectedBeneficiaries },
              { key: 'coaches',       list: coaches,       sel: selectedCoaches,       setSel: setSelectedCoaches },
              { key: 'mentors',       list: mentors,        sel: selectedMentors,        setSel: setSelectedMentors },
            ] as Array<{key: SendTab; list: Person[]; sel: string[]; setSel: React.Dispatch<React.SetStateAction<string[]>>}>)
              .filter(t => t.key === sendTab)
              .map(({ key, list, sel, setSel }) => (
                <div key={key} className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">لا يوجد {key === 'coaches' ? 'مدربون' : key === 'mentors' ? 'مرشدون' : 'مستفيدون'} مسجلون</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id={`sel-all-${key}`}
                          checked={sel.length === list.length && list.length > 0}
                          onCheckedChange={v => setSel(v ? list.map(p => p.id) : [])}
                        />
                        <label htmlFor={`sel-all-${key}`} className="text-sm font-medium cursor-pointer">تحديد الكل ({list.length})</label>
                      </div>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {list.map(p => (
                          <div key={p.id} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-muted/40">
                            <Checkbox
                              id={`${key}-${p.id}`}
                              checked={sel.includes(p.id)}
                              onCheckedChange={v => setSel(prev => v ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                            />
                            <label htmlFor={`${key}-${p.id}`} className="text-sm cursor-pointer flex-1">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-muted-foreground text-xs mr-2">{p.email}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))
            }

            {totalSelected > 0 && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                سيتم الإرسال لـ <span className="font-bold text-foreground">{totalSelected}</span> شخص:
                {selectedBeneficiaries.length > 0 && ` ${selectedBeneficiaries.length} مستفيد`}
                {selectedCoaches.length > 0 && ` · ${selectedCoaches.length} مدرب`}
                {selectedMentors.length > 0 && ` · ${selectedMentors.length} مرشد`}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSendOpen(false)}>إلغاء</Button>
            <Button onClick={handleSend} disabled={sending || totalSelected === 0} className="gap-2">
              <Send className="h-4 w-4" />
              {sending ? 'جاري الإرسال...' : `إرسال لـ ${totalSelected} شخص`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewAssessment && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0" dir="rtl">
            {/* Org branded header */}
            <div
              className="px-6 py-5 flex items-center gap-3"
              style={{ background: previewAssessment.orgColor ? `${previewAssessment.orgColor}18` : 'hsl(var(--primary) / 0.08)', borderBottom: `3px solid ${previewAssessment.orgColor || 'hsl(var(--primary))'}` }}
            >
              {previewAssessment.orgLogo ? (
                <img src={previewAssessment.orgLogo} alt="logo" className="h-10 w-10 object-contain rounded-lg" />
              ) : (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: previewAssessment.orgColor || 'hsl(var(--primary))' }}>
                  {previewAssessment.orgName?.[0] || '؟'}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">{previewAssessment.orgName}</p>
                <h2 className="font-bold text-base">{previewAssessment.title}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadgeColor[previewAssessment.type]}`}>
                  تقييم {typeLabels[previewAssessment.type]}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 space-y-5">
              {previewAssessment.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{previewAssessment.description}</p>
              )}
              {previewAssessment.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    {idx + 1}. {q.text}
                    {q.required && <span className="text-destructive mr-1">*</span>}
                  </p>
                  {q.type === 'text' && <Textarea rows={2} disabled placeholder="إجابة نصية..." className="resize-none" />}
                  {q.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" className="h-9 w-9 rounded-lg border-2 border-border text-sm font-bold hover:border-amber-400 hover:bg-amber-50 transition-colors">
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'choice' && (q.options || []).map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <div className="h-4 w-4 rounded-full border-2 border-border" />
                      <span className="text-sm">{opt || `الخيار ${i + 1}`}</span>
                    </label>
                  ))}
                </div>
              ))}
              <div className="pt-2 pb-4">
                <Button className="w-full" style={{ background: previewAssessment.orgColor || undefined }} disabled>
                  إرسال الإجابات (معاينة)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
