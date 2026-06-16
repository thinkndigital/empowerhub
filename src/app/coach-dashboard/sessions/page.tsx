
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isPast, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Video, User, PlusCircle, MoreHorizontal, Check, X, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, addDoc, doc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { EvaluationDialog } from "@/components/evaluation-dialog";

type Session = {
  id: string;
  title: string;
  date: string;
  hostId: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  meetLink?: string;
  beneficiaryName?: string;
};

const formSchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار متدرب." }),
  title: z.string().min(3, { message: "يجب أن يكون عنوان الجلسة 3 أحرف على الأقل." }),
  date: z.date({ required_error: "الرجاء اختيار تاريخ." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "صيغة الوقت غير صحيحة (مثال: 14:30)." }),
  duration: z.coerce.number().positive({ message: "يجب أن تكون المدة بالدقائق رقمًا موجبًا." }),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});

type EvaluationTarget = { sessionId: string; evaluatedId: string; evaluatedName: string };

export default function CoachSessionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "users"), where("coachId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: beneficiaries, isLoading: beneficiariesLoading } = useCollection<UserProfile>(beneficiariesQuery);

  const beneficiaryMap = useMemo(() => {
    if (!beneficiaries) return new Map<string, string>();
    return new Map(beneficiaries.map(b => [b.id, b.name || '']));
  }, [beneficiaries]);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "sessions"), where("hostId", "==", authUser.uid), orderBy("date", "desc"));
  }, [firestore, authUser]);
  const { data: sessions, isLoading: sessionsLoading } = useCollection<Session>(sessionsQuery);

  const { upcomingSessions, pastSessions } = useMemo(() => {
    const upcoming: Session[] = [];
    const past: Session[] = [];
    sessions?.forEach(s => {
      const withName = { ...s, beneficiaryName: beneficiaryMap.get(s.attendees[0]) || 'متدرب غير معروف' };
      if (s.status === 'scheduled' && !isPast(parseISO(s.date))) {
        upcoming.push(withName);
      } else {
        past.push(withName);
      }
    });
    return {
      upcomingSessions: upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      pastSessions: past,
    };
  }, [sessions, beneficiaryMap]);

  const loading = sessionsLoading || beneficiariesLoading;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { duration: 60, meetLink: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !authUser) return;

    const [hours, minutes] = values.time.split(':').map(Number);
    const sessionDateTime = new Date(values.date);
    sessionDateTime.setHours(hours, minutes);

    const newSessionData = {
      title: values.title,
      attendees: [values.beneficiaryId],
      hostId: authUser.uid,
      date: sessionDateTime.toISOString(),
      duration: values.duration,
      status: "scheduled" as const,
      meetLink: values.meetLink || "",
    };

    const sessionsCollection = collection(firestore, "sessions");

    addDoc(sessionsCollection, newSessionData)
      .then(async () => {
        toast({ title: "تمت الجدولة!", description: `تم جدولة جلستك "${values.title}".` });
        setIsDialogOpen(false);
        form.reset();
        // إشعار للمتدرب
        try {
          await addDoc(collection(firestore, "notifications"), {
            userId: values.beneficiaryId,
            title: "جلسة تدريبية جديدة",
            body: `تم جدولة جلسة "${values.title}" بتاريخ ${sessionDateTime.toLocaleDateString('ar-SA')}`,
            read: false,
            createdAt: serverTimestamp(),
            link: "/dashboard/mentorship",
          });
        } catch (_) {}
      })
      .catch(() => {
        toast({ variant: "destructive", title: "خطأ!", description: "فشل جدولة الجلسة." });
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionsCollection.path, operation: 'create', requestResourceData: newSessionData }));
      });
  }

  async function handleUpdateSessionStatus(sessionId: string, status: 'completed' | 'cancelled') {
    if (!firestore) return;
    const sessionRef = doc(firestore, 'sessions', sessionId);
    const session = sessions?.find(s => s.id === sessionId);
    updateDoc(sessionRef, { status })
      .then(async () => {
        toast({ title: "تم التحديث", description: "تم تحديث حالة الجلسة بنجاح." });
        if (session && status === 'completed') {
          try {
            await addDoc(collection(firestore, "notifications"), {
              userId: session.attendees[0],
              title: "تم إتمام جلستك التدريبية",
              body: `تم تحديد جلسة "${session.title}" كمكتملة.`,
              read: false,
              createdAt: serverTimestamp(),
              link: "/dashboard/mentorship",
            });
          } catch (_) {}
        }
      })
      .catch(() => {
        toast({ variant: "destructive", title: "خطأ!", description: "فشل تحديث حالة الجلسة." });
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionRef.path, operation: 'update', requestResourceData: { status } }));
      });
  }

  const handleEvaluationClick = (session: Session) => {
    setEvaluationTarget({
      sessionId: session.id,
      evaluatedId: session.attendees[0],
      evaluatedName: session.beneficiaryName || 'المتدرب',
    });
  };

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>جلسات التدريب</CardTitle>
                <CardDescription>إدارة وجدولة جلسات التدريب مع المتدربين.</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="ml-2 h-4 w-4" />جدولة جلسة جديدة</Button>
                </DialogTrigger>
                <DialogContent dir="rtl" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) e.preventDefault(); }}>
                  <DialogHeader>
                    <DialogTitle>جدولة جلسة تدريبية جديدة</DialogTitle>
                    <DialogDescription>املأ التفاصيل أدناه لجدولة جلسة تدريبية.</DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                      <FormField control={form.control} name="beneficiaryId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>المتدرب</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="اختر متدربًا" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {beneficiariesLoading
                                ? <SelectItem value="loading" disabled>جاري التحميل...</SelectItem>
                                : beneficiaries?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)
                              }
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان الجلسة</FormLabel>
                          <FormControl><Input placeholder="مثال: مراجعة خطة التسويق" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخًا</span>}
                                    <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date(new Date().toISOString().split('T')[0])} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="time" render={({ field }) => (
                          <FormItem>
                            <FormLabel>وقت الجلسة</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="duration" render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدة (بالدقائق)</FormLabel>
                          <FormControl><Input type="number" placeholder="60" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="meetLink" render={({ field }) => (
                        <FormItem>
                          <FormLabel>رابط Google Meet (اختياري)</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input dir="ltr" placeholder="https://meet.google.com/..." {...field} />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>
                              إنشاء رابط
                            </Button>
                          </div>
                          <FormDescription>يمكنك لصق رابط حالي أو إنشاء رابط جديد.</FormDescription>
                          <FormMessage />
                        </FormItem>
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
          </CardHeader>
        </Card>

        <Card>
          <CardHeader><CardTitle>الجلسات القادمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading && [...Array(1)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            {!loading && upcomingSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-semibold">{session.title}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {session.beneficiaryName}</span>
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(parseISO(session.date), "p", { locale: ar })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild disabled={!session.meetLink}>
                    <a href={session.meetLink} target="_blank" rel="noopener noreferrer">
                      <Video className="ml-2 h-4 w-4" />انضم للجلسة
                    </a>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
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

        <Card>
          <CardHeader><CardTitle>الجلسات السابقة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!loading && pastSessions.map(session => (
              <div key={session.id} className="p-3 border-b flex justify-between items-center">
                <div>
                  <p className="font-semibold">{session.title} <span className="text-sm text-muted-foreground font-normal">مع {session.beneficiaryName} - {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span></p>
                  <p className="text-sm text-muted-foreground mt-1"><b>الحالة:</b> {session.status === 'completed' ? 'مكتملة' : 'ملغاة'}</p>
                </div>
                {session.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={() => handleEvaluationClick(session)}>
                    <Star className="ml-2 h-4 w-4" />تقييم المتدرب
                  </Button>
                )}
              </div>
            ))}
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
