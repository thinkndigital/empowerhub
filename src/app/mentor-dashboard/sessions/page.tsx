"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Video, User, PlusCircle, MoreHorizontal, Check, X, Star, ImageIcon, Upload, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { EvaluationDialog } from "@/components/evaluation-dialog";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useStorage } from "@/firebase/provider";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

type Beneficiary = { id: string; name?: string };
type Session = {
  id: string;
  title: string;
  date: any;
  hostId: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  meetLink?: string;
  beneficiaryName?: string;
  duration?: number;
  description?: string;
  bannerUrl?: string;
  imageUrls?: string[];
};
type EvaluationTarget = { sessionId: string; evaluatedId: string; evaluatedName: string };

function safeDate(d: any): Date {
  if (!d) return new Date(0);
  if (typeof d === 'object' && d._seconds) return new Date(d._seconds * 1000);
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
}

const formSchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار مستفيد." }),
  title: z.string().min(3, { message: "يجب أن يكون عنوان الجلسة 3 أحرف على الأقل." }),
  description: z.string().optional(),
  date: z.date({ required_error: "الرجاء اختيار تاريخ." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "صيغة الوقت غير صحيحة (مثال: 14:30)." }),
  duration: z.coerce.number().positive({ message: "يجب أن تكون المدة بالدقائق رقمًا موجبًا." }),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});

export default function MentorSessionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user: authUser } = useUser();
  const storage = useStorage();
  const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Image state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [sessionImageFiles, setSessionImageFiles] = useState<File[]>([]);
  const [sessionImagePreviews, setSessionImagePreviews] = useState<string[]>([]);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const [bRes, sRes] = await Promise.all([
        fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${authUser.uid}`, { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/sessions', { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const bJson = await bRes.json();
      const sJson = await sRes.json();
      setBeneficiaries(bJson.users || []);
      setSessions(sJson.sessions || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const beneficiaryMap = useMemo(() => new Map(beneficiaries.map(b => [b.id, b.name])), [beneficiaries]);

  const { upcomingSessions, pastSessions } = useMemo(() => {
    const upcoming: Session[] = [];
    const past: Session[] = [];
    sessions.forEach(s => {
      const sw = { ...s, beneficiaryName: beneficiaryMap.get(s.attendees?.[0]) || 'مستفيد' };
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
    defaultValues: { duration: 60, meetLink: "", description: "" },
  });

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...sessionImageFiles, ...files].slice(0, 6);
    setSessionImageFiles(combined);
    setSessionImagePreviews(combined.map(f => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    const updated = sessionImageFiles.filter((_, i) => i !== index);
    setSessionImageFiles(updated);
    setSessionImagePreviews(updated.map(f => URL.createObjectURL(f)));
  }

  function removeBanner() {
    setBannerFile(null);
    setBannerPreview('');
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    if (!storage) throw new Error('Storage غير متاح');
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    return getDownloadURL(ref);
  }

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
    setSubmitting(true);
    const [hours, minutes] = values.time.split(':').map(Number);
    const dt = new Date(values.date);
    dt.setHours(hours, minutes);
    try {
      let meetLink = values.meetLink || '';
      if (googleToken && !meetLink) {
        const generated = await generateMeetLink(values.title, dt.toISOString(), values.duration);
        if (generated) meetLink = generated;
      }

      // Upload banner
      let bannerUrl = '';
      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, `sessions/${authUser.uid}/${Date.now()}-banner-${bannerFile.name}`);
      }

      // Upload session images
      let imageUrls: string[] = [];
      if (sessionImageFiles.length > 0) {
        imageUrls = await Promise.all(
          sessionImageFiles.map((f, i) => uploadFile(f, `sessions/${authUser.uid}/${Date.now()}-${i}-${f.name}`))
        );
      }

      const token = await authUser.getIdToken();
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: values.title,
          description: values.description || '',
          attendees: [values.beneficiaryId],
          date: dt.toISOString(),
          duration: values.duration,
          status: 'scheduled',
          meetLink,
          ...(bannerUrl && { bannerUrl }),
          ...(imageUrls.length && { imageUrls }),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "تمت الجدولة!", description: `تم جدولة جلستك "${values.title}".` });
      setIsDialogOpen(false);
      form.reset();
      setBannerFile(null);
      setBannerPreview('');
      setSessionImageFiles([]);
      setSessionImagePreviews([]);
      fetchData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateSessionStatus(sessionId: string, status: 'completed' | 'cancelled') {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: sessionId, status }),
      });
      toast({ title: "تم التحديث", description: "تم تحديث حالة الجلسة بنجاح." });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث حالة الجلسة.' });
    }
  }

  const handleEvaluationClick = (session: Session) => {
    setEvaluationTarget({
      sessionId: session.id,
      evaluatedId: session.attendees[0],
      evaluatedName: session.beneficiaryName || 'المستفيد',
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الجلسات</h1>
            <p className="text-sm text-muted-foreground">إدارة وجدولة جلسات الإرشاد مع المستفيدين.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              form.reset();
              setBannerFile(null);
              setBannerPreview('');
              setSessionImageFiles([]);
              setSessionImagePreviews([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="ml-2 h-4 w-4" />جدولة جلسة جديدة</Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-[90vw] md:max-w-[620px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) e.preventDefault(); }}>
              <DialogHeader>
                <DialogTitle>جدولة جلسة جديدة</DialogTitle>
                <DialogDescription>املأ التفاصيل أدناه لجدولة جلسة إرشادية جديدة.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="beneficiaryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستفيد</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر مستفيدًا" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {loading ? <SelectItem value="loading" disabled>جاري التحميل...</SelectItem> :
                            beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
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

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الجلسة (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اكتب وصفاً مفصّلاً للجلسة، أهدافها، والمواضيع التي ستُناقش..."
                          className="resize-none min-h-[90px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Banner Image */}
                  <FormItem>
                    <FormLabel>صورة البانر (اختياري)</FormLabel>
                    <FormDescription>صورة رئيسية تظهر في أعلى الجلسة — يُفضّل 1200×400 بكسل.</FormDescription>
                    {bannerPreview ? (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img src={bannerPreview} alt="banner preview" className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={removeBanner}
                          className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors gap-2 text-muted-foreground"
                      >
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-sm">انقر لرفع صورة البانر</span>
                      </button>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerChange}
                    />
                  </FormItem>

                  {/* Session Images */}
                  <FormItem>
                    <FormLabel>صور الجلسة (اختياري، حتى 6 صور)</FormLabel>
                    <FormDescription>صور إضافية توضح محتوى الجلسة أو موادها.</FormDescription>
                    <div className="grid grid-cols-3 gap-2">
                      {sessionImagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                          <img src={src} alt={`session image ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {sessionImagePreviews.length < 6 && (
                        <button
                          type="button"
                          onClick={() => imagesInputRef.current?.click()}
                          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors gap-1 text-muted-foreground"
                        >
                          <Upload className="h-4 w-4" />
                          <span className="text-xs">إضافة</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={imagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImagesChange}
                    />
                  </FormItem>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                        <Popover><PopoverTrigger asChild>
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
                      <FormMessage />
                    </FormItem>
                  )} />

                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'جارٍ الحفظ...' : 'جدولة'}
                    </Button>
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
              <div key={session.id} className="rounded-lg border bg-card overflow-hidden">
                {session.bannerUrl && (
                  <div className="w-full h-28 overflow-hidden">
                    <img src={session.bannerUrl} alt="banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{session.title}</p>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{session.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{session.beneficiaryName}</span>
                      <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{format(safeDate(session.date), "d MMMM yyyy", { locale: ar })}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{format(safeDate(session.date), "p", { locale: ar })}</span>
                    </div>
                    {session.imageUrls && session.imageUrls.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {session.imageUrls.slice(0, 4).map((url, i) => (
                          <img key={i} src={url} alt="" className="h-10 w-10 rounded object-cover border" />
                        ))}
                        {session.imageUrls.length > 4 && (
                          <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            +{session.imageUrls.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" asChild disabled={!session.meetLink}>
                      <a href={session.meetLink} target="_blank" rel="noopener noreferrer"><Video className="ml-2 h-4 w-4" />انضم للجلسة</a>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateSessionStatus(session.id, 'completed')}><Check className="ml-2 h-4 w-4" />وضع علامة كمكتملة</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateSessionStatus(session.id, 'cancelled')}><X className="ml-2 h-4 w-4" />إلغاء الجلسة</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                <div key={session.id} className="rounded-lg border bg-card overflow-hidden">
                  {session.bannerUrl && (
                    <div className="w-full h-20 overflow-hidden opacity-70">
                      <img src={session.bannerUrl} alt="banner" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex justify-between items-start gap-4">
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
                      {session.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{session.description}</p>
                      )}
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
                      {session.imageUrls && session.imageUrls.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {session.imageUrls.slice(0, 4).map((url, i) => (
                            <img key={i} src={url} alt="" className="h-9 w-9 rounded object-cover border opacity-80" />
                          ))}
                          {session.imageUrls.length > 4 && (
                            <div className="h-9 w-9 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{session.imageUrls.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isCompleted && (
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleEvaluationClick(session)}>
                        <Star className="ml-2 h-4 w-4" />تقييم المستفيد
                      </Button>
                    )}
                  </div>
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
