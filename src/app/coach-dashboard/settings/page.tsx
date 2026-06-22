"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Save, Wallet, User, BookOpen, Camera, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile as uploadToStorage } from '@/lib/upload-file';

const mentorProfileSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يكون الاسم حرفين على الأقل.' }),
  bio: z.string().optional(),
  specializations: z.string().optional(),
  certifications: z.string().optional(),
  phone: z.string().optional(),
  linkedIn: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
});

const payoutSchema = z.object({
  accountHolderName: z.string().min(2, { message: 'يجب أن يكون اسم صاحب الحساب حرفين على الأقل.' }),
  iban: z.string().min(15, { message: 'الرجاء إدخال رقم IBAN صحيح.' }).max(34),
  bankName: z.string().min(3, { message: 'يجب أن يكون اسم البنك 3 أحرف على الأقل.' }),
  address: z.string().min(5, { message: 'يجب أن يكون العنوان 5 أحرف على الأقل.' }),
});

type MentorProfileValues = z.infer<typeof mentorProfileSchema>;
type PayoutInfo = z.infer<typeof payoutSchema>;

type MentorProfile = {
  id?: string; name?: string; email?: string; avatarUrl?: string;
  bio?: string;
  specializations?: string;
  certifications?: string;
  phone?: string;
  linkedIn?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  yearsOfExperience?: number;
  wallet?: {
    balance?: number;
    payoutInfo?: PayoutInfo;
  };
};

export default function CoachSettingsPage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/user/profile', { headers: { authorization: `Bearer ${token}` } });
      setProfile((await res.json()).profile);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [authUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const profileForm = useForm<MentorProfileValues>({
    resolver: zodResolver(mentorProfileSchema),
    defaultValues: {
      name: '',
      bio: '',
      specializations: '',
      certifications: '',
      phone: '',
      linkedIn: '',
      website: '',
      twitter: '',
      instagram: '',
      yearsOfExperience: 0,
    },
  });

  const payoutForm = useForm<PayoutInfo>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      accountHolderName: '',
      iban: '',
      bankName: '',
      address: '',
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || '',
        bio: profile.bio || '',
        specializations: profile.specializations || '',
        certifications: profile.certifications || '',
        phone: profile.phone || '',
        linkedIn: profile.linkedIn || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        instagram: profile.instagram || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
      });
      if (profile.wallet?.payoutInfo) {
        payoutForm.reset(profile.wallet.payoutInfo);
      }
    }
  }, [profile, profileForm, payoutForm]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const token = await authUser.getIdToken();
      const downloadUrl = await uploadToStorage(file, `avatars/${authUser.uid}`, token);
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl: downloadUrl }),
      });
      setProfile(prev => prev ? { ...prev, avatarUrl: downloadUrl } : prev);
      toast({ title: 'تم تحديث الصورة الشخصية', description: 'تم رفع صورتك الشخصية بنجاح.' });
    } catch {
      toast({ variant: 'destructive', title: 'خطأ!', description: 'فشل رفع الصورة الشخصية.' });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onSubmitProfile(values: MentorProfileValues) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(values) });
      toast({ title: 'تم حفظ الملف الشخصي', description: 'تم تحديث معلوماتك بنجاح.' });
    } catch { toast({ variant: 'destructive', title: 'خطأ!', description: 'فشلت عملية الحفظ.' }); }
  }

  async function onSubmitPayout(values: PayoutInfo) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ wallet: { payoutInfo: values } }) });
      toast({ title: 'تم حفظ الإعدادات', description: 'تم تحديث معلومات الدفع بنجاح.' });
    } catch { toast({ variant: 'destructive', title: 'خطأ!', description: 'فشلت عملية الحفظ.' }); }
  }

  const currentAvatarUrl = avatarPreview || profile?.avatarUrl;
  const avatarInitial = profile?.name?.charAt(0) || '؟';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إعدادات الملف الشخصي والمحفظة</h1>
        <p className="text-sm text-muted-foreground">إدارة معلوماتك المهنية وتفاصيل الدفع.</p>
      </div>

      {/* Professional Profile */}
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> المعلومات الشخصية</CardTitle>
              <CardDescription>معلوماتك المعروضة للمستفيدين على المنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={currentAvatarUrl} alt={profile?.name || ''} />
                        <AvatarFallback className="text-2xl">{avatarInitial}</AvatarFallback>
                      </Avatar>
                      {avatarUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">الصورة الشخصية</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        <Camera className="ml-2 h-4 w-4" />
                        تغيير الصورة
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG، JPG حتى 5MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" placeholder="+966 5..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="yearsOfExperience" render={({ field }) => (
                      <FormItem><FormLabel>سنوات الخبرة</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="linkedIn" render={({ field }) => (
                      <FormItem><FormLabel>رابط LinkedIn</FormLabel><FormControl><Input dir="ltr" placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="website" render={({ field }) => (
                      <FormItem><FormLabel>الموقع الشخصي</FormLabel><FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="twitter" render={({ field }) => (
                      <FormItem><FormLabel>حساب X / Twitter</FormLabel><FormControl><Input dir="ltr" placeholder="https://x.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="instagram" render={({ field }) => (
                      <FormItem><FormLabel>حساب Instagram</FormLabel><FormControl><Input dir="ltr" placeholder="https://instagram.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={profileForm.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>نبذة شخصية / السيرة الذاتية</FormLabel><FormControl><Textarea rows={4} placeholder="اكتب نبذة مختصرة عن خبراتك ومسيرتك المهنية..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> التخصصات والشهادات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <FormField control={profileForm.control} name="specializations" render={({ field }) => (
                    <FormItem>
                      <FormLabel>التخصصات (افصل بينها بفاصلة)</FormLabel>
                      <FormControl><Input placeholder="مثال: ريادة الأعمال، تسويق رقمي، تطوير المهارات..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={profileForm.control} name="certifications" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الشهادات والمؤهلات</FormLabel>
                      <FormControl><Textarea rows={3} placeholder="أدخل شهاداتك ومؤهلاتك المهنية..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}
            </CardContent>
          </Card>

          <Button type="submit">
            <Save className="ml-2 h-4 w-4" />
            حفظ الملف الشخصي
          </Button>
        </form>
      </Form>

      <Separator />

      {/* Wallet */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> رصيد الأرباح</CardTitle>
          <CardDescription>إجمالي أرباحك من جلسات الإرشاد.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-10 w-32" /> :
            <p className="text-3xl font-bold">{(profile?.wallet?.balance || 0).toFixed(2)} د.أ</p>
          }
          <p className="text-xs text-muted-foreground mt-1">سيتم تحويل الرصيد إلى حسابك البنكي في بداية كل شهر.</p>
        </CardContent>
      </Card>

      <Form {...payoutForm}>
        <form onSubmit={payoutForm.handleSubmit(onSubmitPayout)} className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" /> معلومات الدفع</CardTitle>
              <CardDescription>أدخل معلومات حسابك البنكي لاستلام أرباحك.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={payoutForm.control} name="accountHolderName" render={({ field }) => (
                <FormItem><FormLabel>اسم صاحب الحساب</FormLabel><FormControl><Input placeholder="الاسم كما هو مسجل في البنك" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={payoutForm.control} name="iban" render={({ field }) => (
                <FormItem><FormLabel>رقم IBAN</FormLabel><FormControl><Input dir="ltr" placeholder="JOXX XXXX XXXX XXXX XXXX XXXX XX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={payoutForm.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input placeholder="اسم البنك" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={payoutForm.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>عنوان الفرع</FormLabel><FormControl><Input placeholder="عنوان فرع البنك" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit">
            <Save className="ml-2 h-4 w-4" />
            حفظ معلومات الدفع
          </Button>
        </form>
      </Form>
    </div>
  );
}
