"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight, Users, CheckCircle2, Star, FileText, List,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
} from "lucide-react";

type QuestionType = 'text' | 'rating' | 'choice';
type AssessmentType = 'pre' | 'post' | 'both';
type RespondentRole = 'beneficiary' | 'coach' | 'mentor';

interface Question { id: string; text: string; type: QuestionType; options?: string[]; required: boolean; }
interface AnswerEntry { questionId: string; value: string | number; }
interface ResponseEntry {
  id: string;
  respondentId: string;
  respondentRole: RespondentRole;
  phase: 'pre' | 'post' | null;
  answers: AnswerEntry[];
  respondentInfo: { name?: string; specialization?: string; phone?: string; address?: string } | null;
  submittedAt: string | null;
  respondentName: string;
  respondentEmail: string;
}
interface AssessmentInfo {
  id: string; title: string; description: string; type: AssessmentType;
  questions: Question[]; sentTo: string[]; sentToCoaches: string[]; sentToMentors: string[];
}

const typeLabels: Record<AssessmentType, string> = { pre: 'قبلي', post: 'بعدي', both: 'قبلي وبعدي' };
const roleLabels: Record<RespondentRole, string> = { beneficiary: 'مستفيد', coach: 'مدرب', mentor: 'مرشد' };
const roleBadgeColor: Record<RespondentRole, string> = {
  beneficiary: 'bg-blue-100 text-blue-700', coach: 'bg-purple-100 text-purple-700', mentor: 'bg-amber-100 text-amber-700',
};

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function answerFor(r: ResponseEntry, questionId: string): string | number | undefined {
  return r.answers.find(a => a.questionId === questionId)?.value;
}

function computeQuestionStats(question: Question, responses: ResponseEntry[]) {
  const values = responses
    .map(r => answerFor(r, question.id))
    .filter(v => v !== undefined && v !== '');

  if (question.type === 'rating') {
    const nums = values.map(Number).filter(n => !isNaN(n));
    const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
    const dist = [1, 2, 3, 4, 5].map(n => nums.filter(x => x === n).length);
    return { kind: 'rating' as const, avg, dist, count: nums.length };
  }
  if (question.type === 'choice') {
    const options = question.options || [];
    const counts = options.map(opt => values.filter(v => v === opt).length);
    return { kind: 'choice' as const, options, counts, total: values.length };
  }
  return { kind: 'text' as const, answers: values.map(v => String(v)) };
}

function QuestionStatsBlock({ question, responses }: { question: Question; responses: ResponseEntry[] }) {
  const stats = computeQuestionStats(question, responses);
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-semibold">{question.text}</p>

      {stats.kind === 'rating' && (
        <div className="space-y-2">
          {stats.avg != null ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-foreground">{stats.avg.toFixed(1)}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`h-4 w-4 ${n <= Math.round(stats.avg!) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({stats.count} إجابة)</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">لا توجد إجابات بعد</p>
          )}
          {stats.count > 0 && (
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((n, idx) => {
                const c = stats.dist[n - 1];
                const pct = stats.count ? Math.round((c / stats.count) * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{n}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-muted-foreground text-left">{c}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {stats.kind === 'choice' && (
        <div className="space-y-1.5">
          {stats.total === 0 ? (
            <p className="text-xs text-muted-foreground">لا توجد إجابات بعد</p>
          ) : stats.options.map((opt, i) => {
            const c = stats.counts[i];
            const pct = stats.total ? Math.round((c / stats.total) * 100) : 0;
            return (
              <div key={opt} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{opt}</span>
                  <span className="text-muted-foreground">{c} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {stats.kind === 'text' && (
        stats.answers.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد إجابات بعد</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {stats.answers.map((a, i) => (
              <p key={i} className="text-xs bg-background rounded-lg border border-border px-3 py-2 leading-relaxed">"{a}"</p>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function PhaseComparisonRow({ question, pre, post }: { question: Question; pre: ResponseEntry[]; post: ResponseEntry[] }) {
  if (question.type !== 'rating') return null;
  const preStats = computeQuestionStats(question, pre);
  const postStats = computeQuestionStats(question, post);
  if (preStats.kind !== 'rating' || postStats.kind !== 'rating') return null;
  if (preStats.avg == null || postStats.avg == null) return null;
  const delta = postStats.avg - preStats.avg;
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
      <span className="font-medium flex-1">{question.text}</span>
      <span className="text-muted-foreground">{preStats.avg.toFixed(1)} ← قبلي</span>
      <span className="mx-2 text-muted-foreground">/</span>
      <span className="text-muted-foreground">بعدي → {postStats.avg.toFixed(1)}</span>
      <span className={`mr-3 flex items-center gap-0.5 font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
        {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : delta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
      </span>
    </div>
  );
}

export default function AssessmentResultsPage() {
  const { user: authUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!authUser || !id) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/assessments/${id}/responses`, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setAssessment(data.assessment); setResponses(data.responses || []); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser, id]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="space-y-4 text-center py-16" dir="rtl">
        <p className="text-muted-foreground">النموذج غير موجود</p>
        <Button variant="outline" onClick={() => router.push('/organization-dashboard/assessments')}>
          <ArrowRight className="h-4 w-4 ml-2" />العودة للنماذج
        </Button>
      </div>
    );
  }

  const totalSent = assessment.sentTo.length + assessment.sentToCoaches.length + assessment.sentToMentors.length;
  const totalResponses = responses.length;
  const responseRate = totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0;

  const beneficiaryResponses = responses.filter(r => r.respondentRole === 'beneficiary');
  const staffResponses = responses.filter(r => r.respondentRole !== 'beneficiary');
  const preResponses = beneficiaryResponses.filter(r => r.phase === 'pre');
  const postResponses = beneficiaryResponses.filter(r => r.phase === 'post');
  const isBoth = assessment.type === 'both';

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <Button variant="ghost" onClick={() => router.push('/organization-dashboard/assessments')} className="mb-3 gap-2 text-muted-foreground -mr-3">
          <ArrowRight className="h-4 w-4" />العودة للنماذج
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
          <Badge variant="secondary" className="text-xs">{typeLabels[assessment.type]}</Badge>
        </div>
        {assessment.description && <p className="text-sm text-muted-foreground mt-1">{assessment.description}</p>}
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><Users className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-xl font-bold">{totalSent}</p><p className="text-xs text-muted-foreground">تم الإرسال إليهم</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-xl font-bold">{totalResponses}</p><p className="text-xs text-muted-foreground">الردود المستلمة</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xl font-bold">{responseRate}%</p><p className="text-xs text-muted-foreground">نسبة الاستجابة</p></div>
          </CardContent>
        </Card>
      </div>

      {responses.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center gap-2 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">لا توجد ردود بعد</p>
            <p className="text-sm text-muted-foreground/70">ستظهر التحليلات هنا فور بدء المستلمين بالإجابة</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pre/Post comparison (rating questions only) */}
          {isBoth && preResponses.length > 0 && postResponses.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />مقارنة قبلي / بعدي</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {assessment.questions.filter(q => q.type === 'rating').map(q => (
                  <PhaseComparisonRow key={q.id} question={q} pre={preResponses} post={postResponses} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Beneficiary analytics */}
          {beneficiaryResponses.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />تحليل إجابات المستفيدين</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isBoth ? (
                  <>
                    {preResponses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">التقييم القبلي ({preResponses.length})</p>
                        {assessment.questions.map(q => <QuestionStatsBlock key={`pre-${q.id}`} question={q} responses={preResponses} />)}
                      </div>
                    )}
                    {postResponses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">التقييم البعدي ({postResponses.length})</p>
                        {assessment.questions.map(q => <QuestionStatsBlock key={`post-${q.id}`} question={q} responses={postResponses} />)}
                      </div>
                    )}
                  </>
                ) : (
                  assessment.questions.map(q => <QuestionStatsBlock key={q.id} question={q} responses={beneficiaryResponses} />)
                )}
              </CardContent>
            </Card>
          )}

          {/* Staff analytics */}
          {staffResponses.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><List className="h-4 w-4 text-primary" />تحليل إجابات المدربين والمرشدين</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {assessment.questions.map(q => <QuestionStatsBlock key={q.id} question={q} responses={staffResponses} />)}
              </CardContent>
            </Card>
          )}

          {/* Individual responses */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">الردود الفردية ({responses.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {responses.map(r => {
                const isOpen = expandedId === r.id;
                return (
                  <div key={r.id} className="rounded-xl border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : r.id)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors text-right"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{r.respondentName}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${roleBadgeColor[r.respondentRole]}`}>{roleLabels[r.respondentRole]}</Badge>
                        {r.phase && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.phase === 'pre' ? 'قبلي' : 'بعدي'}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDate(r.submittedAt)}</span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                        {r.respondentEmail && <p className="text-xs text-muted-foreground">{r.respondentEmail}</p>}
                        {assessment.questions.map((q, idx) => {
                          const val = answerFor(r, q.id);
                          return (
                            <div key={q.id} className="text-xs">
                              <p className="text-muted-foreground">{idx + 1}. {q.text}</p>
                              <p className="font-medium mt-0.5">{val !== undefined && val !== '' ? String(val) : '—'}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
