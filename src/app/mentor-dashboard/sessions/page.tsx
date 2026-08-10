"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isPast } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Video, User, PlusCircle, MoreHorizontal, Check, X, Star, ImageIcon, Upload, Trash2, Globe, Lock, Pencil } from "lucide-react";
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
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { useLanguage } from "@/components/language-provider";

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
  isPublic?: boolean;
  price?: number;
};
type EvaluationTarget = { sessionId: string; evaluatedId: string; evaluatedName: string };

function safeDate(d: any): Date {
  if (!d) return new Date(0);
  if (typeof d === 'object' && d._seconds) return new Date(d._seconds * 1000);
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
}

const formSchema = z.object({
  beneficiaryId: z.string().optional(),
  title: z.string().min(3, { message: "يجب أن يكون عنوان الجلسة 3 أحرف على الأقل." }),
  description: z.string().optional(),
  date: z.date({ required_error: "الرجاء اختيار تاريخ." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "صيغة الوقت غير صحيحة (مثال: 14:30)." }),
  duration: z.coerce.number().positive({ message: "يجب أن تكون المدة بالدقائق رقمًا موجبًا." }),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
  price: z.coerce.number().min(0).optional(),
});

export default function MentorSessionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user: authUser } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const dfLocale = lang === 'en' ? enUS : ar;
  const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Image state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [existingBannerUrl, setExistingBannerUrl] = useState<string>('');
  const [sessionImageFiles, setSessionImageFiles] = useState<File[]>([]);
  const [sessionImagePreviews, setSessionImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
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
      const sw = { ...s, beneficiaryName: beneficiaryMap.get(s.attendees?.[0]) || bi('مستفيد', 'Beneficiary') };
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
    defaultValues: { duration: 60, meetLink: "", description: "", price: 0 },
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
    const remaining = 6 - existingImageUrls.length;
    const combined = [...sessionImageFiles, ...files].slice(0, remaining);
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
    setExistingBannerUrl('');
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  }

  function removeExistingImage(index: number) {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  }

  function openEdit(session: Session) {
    setEditingSession(session);
    setIsPublic(session.isPublic ?? false);
    const d = safeDate(session.date);
    form.reset({
      beneficiaryId: session.attendees?.[0] || '',
      title: session.title,
      description: session.description || '',
      date: d,
      time: format(d, 'HH:mm'),
      duration: session.duration || 60,
      meetLink: session.meetLink || '',
      price: session.price || 0,
    });
    setExistingBannerUrl(session.bannerUrl || '');
    setBannerPreview(session.bannerUrl || '');
    setBannerFile(null);
    setExistingImageUrls(session.imageUrls || []);
    setSessionImageFiles([]);
    setSessionImagePreviews([]);
    setIsDialogOpen(true);
  }

  async function uploadFile(file: File, folder: string, token: string): Promise<string> {
    return uploadToStorage(file, folder, token);
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
      toast({ title: bi("تم ربط حساب Google", "Google account linked"), description: bi("يمكنك الآن إنشاء روابط Google Meet تلقائياً.", "You can now generate Google Meet links automatically.") });
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('فشل ربط Google', 'Failed to link Google'), description: e.message });
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
    if (!isPublic && !values.beneficiaryId) {
      form.setError('beneficiaryId', { message: bi('الرجاء اختيار مستفيد أو تفعيل النشر على الموقع.', 'Please choose a beneficiary or enable publishing on the site.') });
      return;
    }
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

      const token = await authUser.getIdToken();

      let finalBannerUrl = existingBannerUrl;
      if (bannerFile) {
        finalBannerUrl = await uploadFile(bannerFile, `sessions/${authUser.uid}`, token);
      }

      let newImageUrls: string[] = [];
      if (sessionImageFiles.length > 0) {
        newImageUrls = await Promise.all(
          sessionImageFiles.map((f) => uploadFile(f, `sessions/${authUser.uid}`, token))
        );
      }
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      const sessionPayload = {
        title: values.title,
        description: values.description || '',
        attendees: isPublic ? [] : [values.beneficiaryId],
        date: dt.toISOString(),
        duration: values.duration,
        meetLink,
        isPublic,
        ...(isPublic && values.price != null && { price: values.price }),
        bannerUrl: finalBannerUrl,
        imageUrls: finalImageUrls,
      };

      if (editingSession) {
        const res = await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingSession.id, ...sessionPayload }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast({ title: bi("تم التعديل!", "Updated!"), description: bi(`تم تعديل جلسة "${values.title}" بنجاح.`, `Session "${values.title}" was updated successfully.`) });
      } else {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...sessionPayload, status: 'scheduled' }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast({ title: bi("تمت الجدولة!", "Scheduled!"), description: bi(`تم جدولة جلستك "${values.title}" ${isPublic ? 'ونُشرت على الموقع' : ''}.`, `Your session "${values.title}" was scheduled${isPublic ? ' and published on the site' : ''}.`) });
      }

      setIsDialogOpen(false);
      setEditingSession(null);
      setIsPublic(false);
      form.reset();
      setBannerFile(null);
      setBannerPreview('');
      setExistingBannerUrl('');
      setSessionImageFiles([]);
      setSessionImagePreviews([]);
      setExistingImageUrls([]);
      fetchData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: e.message });
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
      toast({ title: bi("تم التحديث", "Updated"), description: bi("تم تحديث حالة الجلسة بنجاح.", "The session status was updated successfully.") });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ', 'Error'), description: bi('فشل تحديث حالة الجلسة.', 'Failed to update the session status.') });
    }
  }

  const handleEvaluationClick = (session: Session) => {
    setEvaluationTarget({
      sessionId: session.id,
      evaluatedId: session.attendees[0],
      evaluatedName: session.beneficiaryName || bi('المستفيد', 'the beneficiary'),
    });
  };

  return (
    <>
      <div className="space-y-6" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{bi("الجلسات", "Sessions")}</h1>
            <p className="text-sm text-muted-foreground">{bi("إدارة وجدولة جلسات الإرشاد مع المستفيدين.", "Manage and schedule mentoring sessions with beneficiaries.")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSession(null);
              form.reset();
              setBannerFile(null);
              setBannerPreview('');
              setExistingBannerUrl('');
              setSessionImageFiles([]);
              setSessionImagePreviews([]);
              setExistingImageUrls([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="ml-2 h-4 w-4" />{bi("جدولة جلسة جديدة", "Schedule a new session")}</Button>
            </DialogTrigger>
            <DialogContent dir={dir} className="sm:max-w-[90vw] md:max-w-[620px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) e.preventDefault(); }}>
              <DialogHeader>
                <DialogTitle>{editingSession ? bi('تعديل الجلسة', 'Edit session') : bi('جدولة جلسة جديدة', 'Schedule a new session')}</DialogTitle>
                <DialogDescription>{editingSession ? bi('عدّل تفاصيل الجلسة ثم احفظ التغييرات.', 'Edit the session details, then save your changes.') : bi('املأ التفاصيل أدناه لجدولة جلسة إرشادية جديدة.', 'Fill in the details below to schedule a new mentoring session.')}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">

                  {/* Public / Private Toggle */}
                  <div className="flex gap-2 p-1 bg-muted rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!isPublic ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Lock className="h-4 w-4" />
                      {bi("جلسة خاصة بمستفيد", "Private session with beneficiary")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${isPublic ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Globe className="h-4 w-4" />
                      {bi("نشر على الموقع", "Publish on the site")}
                    </button>
                  </div>

                  {isPublic ? (
                    <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                      <Globe className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">{bi("ستظهر هذه الجلسة للجميع على الموقع ويمكن للزوار رؤية تفاصيلها والتواصل معك للحجز.", "This session will be visible to everyone on the site, and visitors can see its details and contact you to book.")}</p>
                    </div>
                  ) : (
                    <FormField control={form.control} name="beneficiaryId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{bi("المستفيد", "Beneficiary")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder={bi("اختر مستفيدًا", "Choose a beneficiary")} /></SelectTrigger></FormControl>
                          <SelectContent>
                            {loading ? <SelectItem value="loading" disabled>{bi("جاري التحميل...", "Loading...")}</SelectItem> :
                              beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("عنوان الجلسة", "Session title")}</FormLabel>
                      <FormControl><Input placeholder={bi("مثال: مراجعة خطة التسويق", "e.g. Marketing plan review")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("وصف الجلسة (اختياري)", "Session description (optional)")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={bi("اكتب وصفاً مفصّلاً للجلسة، أهدافها، والمواضيع التي ستُناقش...", "Write a detailed description of the session, its goals, and the topics to be discussed...")}
                          className="resize-none min-h-[90px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Banner Image */}
                  <FormItem>
                    <FormLabel>{bi("صورة البانر (اختياري)", "Banner image (optional)")}</FormLabel>
                    <FormDescription>{bi("صورة رئيسية تظهر في أعلى الجلسة — يُفضّل 1200×400 بكسل.", "A main image shown at the top of the session — 1200×400px preferred.")}</FormDescription>
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
                        <span className="text-sm">{bi("انقر لرفع صورة البانر", "Click to upload a banner image")}</span>
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
                    <FormLabel>{bi("صور الجلسة (اختياري، حتى 6 صور)", "Session images (optional, up to 6)")}</FormLabel>
                    <FormDescription>{bi("صور إضافية توضح محتوى الجلسة أو موادها.", "Additional images illustrating the session's content or materials.")}</FormDescription>
                    <div className="grid grid-cols-3 gap-2">
                      {existingImageUrls.map((url, i) => (
                        <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(i)}
                            className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {sessionImagePreviews.map((src, i) => (
                        <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
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
                      {existingImageUrls.length + sessionImagePreviews.length < 6 && (
                        <button
                          type="button"
                          onClick={() => imagesInputRef.current?.click()}
                          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors gap-1 text-muted-foreground"
                        >
                          <Upload className="h-4 w-4" />
                          <span className="text-xs">{bi("إضافة", "Add")}</span>
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
                      <FormItem className="flex flex-col"><FormLabel>{bi("التاريخ", "Date")}</FormLabel>
                        <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("pr-3 text-right font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: dfLocale }) : <span>{bi("اختر تاريخًا", "Choose a date")}</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                        <FormLabel>{bi("وقت الجلسة", "Session time")}</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("المدة (بالدقائق)", "Duration (minutes)")}</FormLabel>
                      <FormControl><Input type="number" placeholder="60" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {isPublic && (
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{bi("سعر الجلسة (اتركه 0 للجلسات المجانية)", "Session price (leave 0 for free sessions)")}</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

                  <FormField control={form.control} name="meetLink" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("رابط Google Meet (اختياري)", "Google Meet link (optional)")}</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl><Input dir="ltr" placeholder="https://meet.google.com/..." {...field} /></FormControl>
                        <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>{bi("إنشاء رابط", "Generate link")}</Button>
                      </div>
                      <FormDescription>{bi("يمكنك لصق رابط جلسة حالي أو إنشاء رابط جديد.", "You can paste an existing session link or generate a new one.")}</FormDescription>
                      {!googleToken ? (
                        <Button type="button" variant="secondary" size="sm" className="mt-2 w-full" onClick={handleLinkGoogle} disabled={googleLinking}>
                          {googleLinking ? bi('جارٍ الربط...', 'Linking...') : bi('ربط حساب Google لإنشاء رابط Meet تلقائياً', 'Link a Google account to generate Meet links automatically')}
                        </Button>
                      ) : (
                        <p className="text-xs text-green-600 mt-1">{bi("تم ربط حساب Google — سيتم إنشاء رابط Meet تلقائياً عند الجدولة.", "Google account linked — a Meet link will be generated automatically when scheduling.")}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? bi('جارٍ الحفظ...', 'Saving...') : editingSession ? bi('حفظ التعديلات', 'Save changes') : bi('جدولة', 'Schedule')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{bi("الجلسات القادمة", "Upcoming sessions")}</CardTitle></CardHeader>
          <CardContent>
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video" />)}
              </div>
            )}
            {!loading && upcomingSessions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {upcomingSessions.map(session => (
                  <Card key={session.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-video overflow-hidden bg-muted flex items-center justify-center">
                      {session.bannerUrl
                        ? <img src={session.bannerUrl} alt="" className="w-full h-full object-cover" />
                        : <Video className="h-8 w-8 text-muted-foreground/40" />}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold line-clamp-1 flex-1">{session.title}</p>
                        {session.isPublic && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">
                            <Globe className="h-3 w-3" />{bi("عام", "Public")}
                          </span>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {!session.isPublic && <span className="flex items-center gap-1"><User className="h-3 w-3" />{session.beneficiaryName}</span>}
                        <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(safeDate(session.date), "d MMM", { locale: dfLocale })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(safeDate(session.date), "p", { locale: dfLocale })}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-auto pt-1">
                        <Button size="sm" asChild disabled={!session.meetLink} className="flex-1">
                          <a href={session.meetLink} target="_blank" rel="noopener noreferrer"><Video className="ml-2 h-3.5 w-3.5" />{bi("انضم", "Join")}</a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(session)}><Pencil className="ml-2 h-4 w-4" />{bi("تعديل الجلسة", "Edit session")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateSessionStatus(session.id, 'completed')}><Check className="ml-2 h-4 w-4" />{bi("وضع علامة كمكتملة", "Mark as completed")}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateSessionStatus(session.id, 'cancelled')}><X className="ml-2 h-4 w-4" />{bi("إلغاء الجلسة", "Cancel session")}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!loading && upcomingSessions.length === 0 && <p className="text-center text-muted-foreground p-4">{bi("لا توجد جلسات قادمة مجدولة.", "No upcoming sessions scheduled.")}</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{bi("الجلسات السابقة", "Past sessions")}</CardTitle></CardHeader>
          <CardContent>
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video" />)}
              </div>
            )}
            {!loading && pastSessions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {pastSessions.map(session => {
                  const sessionDate = safeDate(session.date);
                  const isCompleted = session.status === 'completed';
                  const isCancelled = session.status === 'cancelled';
                  return (
                    <Card key={session.id} className="overflow-hidden flex flex-col">
                      <div className="aspect-video overflow-hidden bg-muted flex items-center justify-center">
                        {session.bannerUrl
                          ? <img src={session.bannerUrl} alt="" className="w-full h-full object-cover opacity-80" />
                          : <Video className="h-8 w-8 text-muted-foreground/40" />}
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col gap-2">
                        <p className="font-semibold line-clamp-1">{session.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {session.isPublic && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                              <Globe className="h-3 w-3" />{bi("عام", "Public")}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/40">
                              <Check className="h-3 w-3" />{bi("مكتملة", "Completed")}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40">
                              <X className="h-3 w-3" />{bi("ملغاة", "Cancelled")}
                            </span>
                          )}
                        </div>
                        {session.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {!session.isPublic && <span className="flex items-center gap-1"><User className="h-3 w-3" />{session.beneficiaryName}</span>}
                          <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(sessionDate, "d MMM", { locale: dfLocale })}</span>
                          {session.duration && <span>{session.duration} {bi("دقيقة", "min")}</span>}
                        </div>
                        {isCompleted && (
                          <Button variant="outline" size="sm" className="mt-auto" onClick={() => handleEvaluationClick(session)}>
                            <Star className="ml-2 h-3.5 w-3.5" />{bi("تقييم المستفيد", "Evaluate beneficiary")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {!loading && pastSessions.length === 0 && <p className="text-center text-muted-foreground p-4">{bi("لا توجد جلسات سابقة.", "No past sessions.")}</p>}
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
