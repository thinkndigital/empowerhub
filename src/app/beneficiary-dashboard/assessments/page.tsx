"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, CheckCircle2, Star, Clock, User } from "lucide-react";

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
  questions: Question[];
  orgName: string;
  orgLogo: string;
  orgColor: string;
  createdAt: string;
  submittedPhases: string[];
}

const typeLabels: Record<AssessmentType, string> = { pre: 'قبلي', post: 'بعدي', both: 'قبلي وبعدي' };
const typeBadgeColor: Record<AssessmentType, string> = {
  pre: 'bg-blue-100 text-blue-700', post: 'bg-emerald-100 text-emerald-700', both: 'bg-purple-100 text-purple-700',
};

function phaseLabel(phase: 'pre' | 'post') { return phase === 'pre' ? 'القبلي' : 'البعدي'; }

function getPendingPhases(assessment: Assessment): Array<'pre' | 'post'> {
  const { type, submittedPhases } = assessment;
  if (type === 'pre') return submittedPhases.includes('pre') ? [] : ['pre'];
  if (type === 'post') return submittedPhases.includes('post') ? [] : ['post'];
  // both
  const pending: Array<'pre' | 'post'> = [];
  if (!submittedPhases.includes('pre')) pending.push('pre');
  if (!submittedPhases.includes('post')) pending.push('post');
  return pending;
}

export default function BeneficiaryAssessmentsPage() {
  const { user: authUser, userProfile } = useUser();
  const { toast } = useToast();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Fill dialog
  const [fillOpen, setFillOpen] = useState(false);
  const [fillAssessment, setFillAssessment] = useState<Assessment | null>(null);
  const [fillPhase, setFillPhase] = useState<'pre' | 'post'>('pre');
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState({ name: '', specialization: '', phone: '', address: '' });

  const fetchAssessments = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setFetchError('');
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/beneficiary/assessments', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحميل النماذج');
      setAssessments(data.assessments || []);
    } catch (e: any) {
      setFetchError(e.message || 'حدث خطأ');
    } finally { setLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const openFill = (a: Assessment, phase: 'pre' | 'post') => {
    setFillAssessment(a);
    setFillPhase(phase);
    setAnswers({});
    const p = userProfile as any;
    const specs = Array.isArray(p?.specializations) ? p.specializations.join('، ') : (p?.specializations || '');
    setInfo({
      name: p?.name || authUser?.displayName || '',
      specialization: specs,
      phone: p?.phone || '',
      address: p?.address || '',
    });
    setFillOpen(true);
  };

  const handleSubmit = async () => {
    if (!authUser || !fillAssessment) return;

    // Validate required
    const missing = fillAssessment.questions.filter(q => q.required && !answers[q.id]);
    if (missing.length > 0) {
      toast({ variant: 'destructive', title: 'يرجى الإجابة على جميع الأسئلة المطلوبة' }); return;
    }

    setSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      const answerList = fillAssessment.questions.map(q => ({ questionId: q.id, value: answers[q.id] ?? '' }));
      const res = await fetch(`/api/beneficiary/assessments/${fillAssessment.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answerList, phase: fillPhase, respondentInfo: info }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'تم إرسال إجاباتك بنجاح' });
      setFillOpen(false);
      fetchAssessments();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally { setSubmitting(false); }
  };

  const pending = assessments.filter(a => getPendingPhases(a).length > 0);
  const completed = assessments.filter(a => getPendingPhases(a).length === 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">نماذج التقييم</h1>
        <p className="text-sm text-muted-foreground mt-1">النماذج المرسلة إليك من المنظمة</p>
      </div>

      {fetchError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive text-center">{fetchError}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : assessments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">لا توجد نماذج حالياً</p>
            <p className="text-sm text-muted-foreground/70">ستظهر هنا النماذج التي ترسلها لك المنظمة</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> بانتظار إجابتك ({pending.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map(a => {
                  const phases = getPendingPhases(a);
                  return (
                    <Card key={a.id} className="border-0 shadow-sm ring-1 ring-amber-200 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          {a.orgLogo ? (
                            <img src={a.orgLogo} alt={a.orgName} className="h-9 w-9 rounded-lg object-contain border" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                              style={{ background: a.orgColor || 'hsl(var(--primary))' }}>
                              {a.orgName?.[0] || '؟'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{a.orgName}</p>
                            <CardTitle className="text-sm leading-snug">{a.title}</CardTitle>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadgeColor[a.type]}`}>
                            {typeLabels[a.type]}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                        <p className="text-xs text-muted-foreground">{a.questions.length} سؤال</p>
                        <div className="flex gap-2 flex-wrap pt-1">
                          {phases.map(phase => (
                            <Button key={phase} size="sm" className="h-8 gap-1.5 text-xs"
                              style={{ background: a.orgColor || undefined }}
                              onClick={() => openFill(a, phase)}>
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              أجب على التقييم {phaseLabel(phase)}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> مكتملة ({completed.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {completed.map(a => (
                  <Card key={a.id} className="border-0 shadow-sm opacity-75">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        {a.orgLogo ? (
                          <img src={a.orgLogo} alt={a.orgName} className="h-9 w-9 rounded-lg object-contain border" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ background: a.orgColor || 'hsl(var(--primary))' }}>
                            {a.orgName?.[0] || '؟'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{a.orgName}</p>
                          <CardTitle className="text-sm leading-snug">{a.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                          <CheckCircle2 className="h-3 w-3 ml-1" />مكتمل
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Fill Dialog */}
      {fillAssessment && (
        <Dialog open={fillOpen} onOpenChange={setFillOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0" dir="rtl">
            {/* Branded header */}
            <div className="px-6 py-5 flex items-center gap-3"
              style={{
                background: fillAssessment.orgColor ? `${fillAssessment.orgColor}18` : 'hsl(var(--primary) / 0.08)',
                borderBottom: `3px solid ${fillAssessment.orgColor || 'hsl(var(--primary))'}`,
              }}>
              {fillAssessment.orgLogo ? (
                <img src={fillAssessment.orgLogo} alt="logo" className="h-10 w-10 object-contain rounded-lg" />
              ) : (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ background: fillAssessment.orgColor || 'hsl(var(--primary))' }}>
                  {fillAssessment.orgName?.[0] || '؟'}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">{fillAssessment.orgName}</p>
                <h2 className="font-bold text-base">{fillAssessment.title}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fillPhase === 'pre' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  التقييم {phaseLabel(fillPhase)}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {fillAssessment.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{fillAssessment.description}</p>
              )}

              {/* Personal info — pre-filled, editable */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />معلوماتك الشخصية
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">الاسم الكامل</Label>
                    <Input value={info.name} onChange={e => setInfo(p => ({ ...p, name: e.target.value }))} placeholder="الاسم" className="h-8 text-sm bg-background" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">التخصص / المجال</Label>
                    <Input value={info.specialization} onChange={e => setInfo(p => ({ ...p, specialization: e.target.value }))} placeholder="التخصص" className="h-8 text-sm bg-background" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">رقم الجوال</Label>
                    <Input value={info.phone} onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))} placeholder="05xxxxxxxx" dir="ltr" className="h-8 text-sm bg-background" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">العنوان</Label>
                    <Input value={info.address} onChange={e => setInfo(p => ({ ...p, address: e.target.value }))} placeholder="المدينة / المنطقة" className="h-8 text-sm bg-background" />
                  </div>
                </div>
              </div>

              {fillAssessment.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2.5">
                  <p className="text-sm font-medium">
                    {idx + 1}. {q.text}
                    {q.required && <span className="text-destructive mr-1">*</span>}
                  </p>

                  {q.type === 'text' && (
                    <Textarea
                      rows={3}
                      placeholder="اكتب إجابتك هنا..."
                      value={(answers[q.id] as string) || ''}
                      onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      className="resize-none"
                    />
                  )}

                  {q.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button"
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: n }))}
                          className={`h-10 w-10 rounded-lg border-2 font-bold text-sm transition-all ${answers[q.id] === n ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-border hover:border-amber-300'}`}>
                          {n}
                        </button>
                      ))}
                      {answers[q.id] && (
                        <div className="flex items-center gap-1 mr-2">
                          {Array.from({ length: answers[q.id] as number }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'choice' && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt, i) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${answers[q.id] === opt ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${answers[q.id] === opt ? 'border-primary' : 'border-muted-foreground/40'}`}>
                            {answers[q.id] === opt && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <span className="text-sm">{opt}</span>
                          <input type="radio" className="sr-only" checked={answers[q.id] === opt}
                            onChange={() => setAnswers(p => ({ ...p, [q.id]: opt }))} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="px-6 pb-6 pt-2 gap-2">
              <Button variant="ghost" onClick={() => setFillOpen(false)}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={submitting}
                style={{ background: fillAssessment.orgColor || undefined }}
                className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? 'جاري الإرسال...' : 'إرسال الإجابات'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
