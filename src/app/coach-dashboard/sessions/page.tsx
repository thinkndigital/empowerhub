"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Video, User, PlusCircle, MoreHorizontal, Check, X, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { EvaluationDialog } from "@/components/evaluation-dialog";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

type Beneficiary = { id: string; name?: string };
type Session = {
  id: string; title: string; date: any; hostId: string;
  attendees: string[]; status: 'scheduled' | 'completed' | 'cancelled';
  meetLink?: string; beneficiaryName?: string; duration?: number;
};
type EvaluationTarget = { sessionId: string; evaluatedId: string; evaluatedName: string };

function safeDate(d: any): Date {
  if (!d) return new Date(0);
  if (typeof d === 'object' && d._seconds) return new Date(d._seconds * 1000);
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
}

const formSchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار متدرب." }),
  title: z.string().min(3, { message: "يجب أن يكون عنوان الجلسة 3 أحرف على الأقل." }),
  date: z.date({ required_error: "الرجاء اختيار تاريخ." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "صيغة الوقت غير صحيحة (مثال: 14:30)." }),
  duration: z.coerce.number().positive({ message: "يجب أن تكون المدة بالدقائق رقمًا موجبًا." }),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});

export default function CoachSessionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user: authUser } = useUser();
  const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleLinking, setGoogleLinking] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const [bRes, sRes] = await Promise.all([
        fetch(`/api/org/users?role=beneficiary&scope=all&coachId=${authUser.uid}`, { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } }),
      ]);
      setBeneficiaries((await bRes.json()).users || []);
      setSessions((await sRes.json()).sessions || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const beneficiaryMap = useMemo(() => new Map(beneficiaries.map(b => [b.id, b.name || ''])), [beneficiaries]);

  const { upcomingSessions, pastSessions } = useMemo(() => {
    const upcoming: Session[] = [], past: Session[] = [];
    sessions.forEach(s => {
      const sw = { ...s, beneficiaryName: beneficiaryMap.get(s.attendees?.[0]) || 'متدرب' };
      if (s.status === 'scheduled' && !isPast(safeDate(s.date))) upcoming.push(sw);
      else past.push(sw);
    });
    return {
      upcomingSessions: upcoming.sort((a, b) => safeDate(a.date).getTime() - safeDate(b.date).getTime()),
      pastSessions: past.sort((a, b) => safeDate(b.date).getTime() - safeDate(a.date).getTime()),
    };
  }, [sessions, beneficiaryMap]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { duration: 60, meetLink: "" },
  });

  async function handleLinkGoogle() {
    setGoogleLinking(true);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      setGoogleToken(token);
      toast({ title: "تم ربط حساب Google", description: "يمكنك الآن إنشاء روابط Google Meet تلقائياً." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل ربط Google', description: e.message });
    } finally {
      setGoogleLinking(false);
    }
  }

  async function generateMeetLink(title: string, startIso: string, durationMinutes: number): Promise<string | null> {
    if (!googleToken) return null;
    try {
      const endDate = new Date(new Date(startIso).getTime() + durationMinutes * 60000);
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: title,
          start: { dateTime: startIso },
          end: { dateTime: endDate.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: Math.random().toString(36).substring(2),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.conferenceData?.entryPoints?.[0]?.uri || null;
    } catch {
      return null;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!authUser) return;
    const [hours, minutes] = values.time.split(':').map(Number);
    const dt = new Date(values.date);
    dt.setHours(hours, minutes);
    try {
      let meetLink = values.meetLink || '';
      if (googleToken && !meetLink) {
        const generated = await generateMeetLink(values.title, dt.toISOString(), values.duration);
        if (generated) meetLink = generated;
      }
      const token = await authUser.getIdToken();
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: values.title, attendees: [values.beneficiaryId], date: dt.toISOString(), duration: values.duration, status: 'scheduled', meetLink }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "تمت الجدولة!", description: `تم جدولة جلستك "${values.title}".` });
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (e: any) { toast({ variant: 'destructive', title: 'خطأ', description: e.message }); }
  }

  async function handleUpdateSessionStatus(sessionId: string, status: 'completed' | 'cancelled') {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/sessions', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id: sessionId, status }) });
      toast({ title: "تم التحديث" });
      fetchData();
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث حالة الجلسة.' }); }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الجلسات</h1>
            <p className="text-sm text-muted-foreground">إدارة وجدولة جلسات التدريب مع المتدربين.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="ml-2 h-4 w-4" />جدولة جلسة جديدة</Button></DialogTrigger>
                <DialogContent dir="rtl" className="sm:max-w-[90vw] md:max-w-[600px]" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) e.preventDefault(); }}>
                  <DialogHeader><DialogTitle>جدولة جلسة جديدة</DialogTitle><DialogDescription>املأ التفاصيل لجدولة جلسة تدريبية جديدة.</DialogDescription></DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                      <FormField control={form.control} name="beneficiaryId" render={({ field }) => (
                        <FormItem><FormLabel>المتدرب</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر متدربًا" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {loading ? <SelectItem value="l" disabled>جاري التحميل...</SelectItem> :
                                beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>عنوان الجلسة</FormLabel><FormControl><Input placeholder="مثال: مراجعة مهارات القيادة" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                            <Popover><PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("pr-3 text-right font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخًا</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl></PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date(new Date().toISOString().split('T')[0])} initialFocus />
                              </PopoverContent>
                            </Popover><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="time" render={({ field }) => (
                          <FormItem><FormLabel>وقت الجلسة</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="duration" render={({ field }) => (
                        <FormItem><FormLabel>المدة (بالدقائق)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="meetLink" render={({ field }) => (
                        <FormItem><FormLabel>رابط Google Meet (اختياري)</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl><Input dir="ltr" placeholder="https://meet.google.com/..." {...field} /></FormControl>
                            <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>إنشاء رابط</Button>
                          </div>
                          <FormDescription>يمكنك لصق رابط جلسة حالي أو إنشاء رابط جديد.</FormDescription>
                          {!googleToken ? (
                            <Button type="button" variant="secondary" size="sm" className="mt-2 w-full" onClick={handleLinkGoogle} disabled={googleLinking}>
                              {googleLinking ? 'جارٍ الربط...' : 'ربط حساب Google لإنشاء رابط Meet تلقائياً'}
                            </Button>
                          ) : (
                            <p className="text-xs text-green-600 mt-1">تم ربط حساب Google — سيتم إنشاء رابط Meet تلقائياً عند الجدولة.</p>
                          )}
                          <FormMessage /></FormItem>
                      )} />
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                        <Button type="submit">جدولة</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>الجلسات القادمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading && [...Array(1)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            {!loading && upcomingSessions.map(session => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-semibold">{session.title}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{session.beneficiaryName}</span>
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{format(safeDate(session.date), "d MMMM yyyy", { locale: ar })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{format(safeDate(session.date), "p", { locale: ar })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" asChild disabled={!session.meetLink}><a href={session.meetLink} target="_blank" rel="noopener noreferrer"><Video className="ml-2 h-4 w-4" />انضم للجلسة</a></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateSessionStatus(session.id, 'completed')}><Check className="ml-2 h-4 w-4" />وضع علامة كمكتملة</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateSessionStatus(session.id, 'cancelled')}><X className="ml-2 h-4 w-4" />إلغاء الجلسة</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {!loading && upcomingSessions.length === 0 && <p className="text-center text-muted-foreground p-4">لا توجد جلسات قادمة مجدولة.</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>الجلسات السابقة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!loading && pastSessions.map(session => {
              const sessionDate = safeDate(session.date);
              const isCompleted = session.status === 'completed';
              const isCancelled = session.status === 'cancelled';
              return (
                <div key={session.id} className="p-4 rounded-lg border bg-card flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{session.title}</p>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          <Check className="h-3 w-3" />مكتملة
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <X className="h-3 w-3" />ملغاة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{session.beneficiaryName}</span>
                      <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{format(sessionDate, "d MMMM yyyy", { locale: ar })}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{format(sessionDate, "p", { locale: ar })}</span>
                      {session.duration && (
                        <span className="flex items-center gap-1.5 text-xs">{session.duration} دقيقة</span>
                      )}
                    </div>
                    {isCompleted && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 rounded-full bg-green-200 flex-1 max-w-[120px]">
                            <div className="h-1.5 rounded-full bg-green-500 w-full" />
                          </div>
                          <span className="text-xs text-green-600">مكتملة</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {isCompleted && (
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEvaluationTarget({ sessionId: session.id, evaluatedId: session.attendees[0], evaluatedName: session.beneficiaryName || 'المتدرب' })}>
                      <Star className="ml-2 h-4 w-4" />تقييم المتدرب
                    </Button>
                  )}
                </div>
              );
            })}
            {!loading && pastSessions.length === 0 && <p className="text-center text-muted-foreground p-4">لا توجد جلسات سابقة.</p>}
          </CardContent>
        </Card>
      </div>

      {evaluationTarget && authUser && (
        <EvaluationDialog
          isOpen={!!evaluationTarget}
          onOpenChange={(isOpen) => !isOpen && setEvaluationTarget(null)}
          sessionId={evaluationTarget.sessionId}
          evaluatorId={authUser.uid}
          evaluatedId={evaluationTarget.evaluatedId}
          evaluatedName={evaluationTarget.evaluatedName}
          type="mentor_to_beneficiary"
        />
      )}
    </>
  );
}
