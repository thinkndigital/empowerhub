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
import { useLanguage } from '@/components/language-provider';

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

export default function MentorSettingsPage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
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
      const json = await res.json();
      setProfile(json.profile);
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

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
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
      toast({ title: bi('تم تحديث الصورة الشخصية', 'Profile photo updated'), description: bi('تم رفع صورتك الشخصية بنجاح.', 'Your profile photo was uploaded successfully.') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: err?.message || bi('فشل رفع الصورة الشخصية.', 'Failed to upload the profile photo.') });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onSubmitProfile(values: MentorProfileValues) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      toast({ title: bi('تم حفظ الملف الشخصي', 'Profile saved'), description: bi('تم تحديث معلوماتك بنجاح.', 'Your information was updated successfully.') });
    } catch { toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: bi('فشلت عملية الحفظ.', 'The save operation failed.') }); }
  }

  async function onSubmitPayout(values: PayoutInfo) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ wallet: { payoutInfo: values } }),
      });
      toast({ title: bi('تم حفظ الإعدادات', 'Settings saved'), description: bi('تم تحديث معلومات الدفع بنجاح.', 'Payment information updated successfully.') });
    } catch { toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: bi('فشلت عملية الحفظ.', 'The save operation failed.') }); }
  }

  const currentAvatarUrl = avatarPreview || profile?.avatarUrl;
  const avatarInitial = profile?.name?.charAt(0) || '؟';

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("إعدادات الملف الشخصي والمحفظة", "Profile & wallet settings")}</h1>
        <p className="text-sm text-muted-foreground">{bi("إدارة معلوماتك المهنية وتفاصيل الدفع.", "Manage your professional information and payment details.")}</p>
      </div>

      {/* Professional Profile */}
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {bi("المعلومات الشخصية", "Personal information")}</CardTitle>
              <CardDescription>{bi("معلوماتك المعروضة للمستفيدين على المنصة", "Your information shown to beneficiaries on the platform")}</CardDescription>
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
                      <p className="text-sm font-medium mb-2">{bi("الصورة الشخصية", "Profile photo")}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        <Camera className="ml-2 h-4 w-4" />
                        {bi("تغيير الصورة", "Change photo")}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{bi("PNG، JPG حتى 5MB", "PNG, JPG up to 5MB")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>{bi("الاسم الكامل", "Full name")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>{bi("رقم الهاتف", "Phone number")}</FormLabel><FormControl><Input dir="ltr" placeholder="+966 5..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="yearsOfExperience" render={({ field }) => (
                      <FormItem><FormLabel>{bi("سنوات الخبرة", "Years of experience")}</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="linkedIn" render={({ field }) => (
                      <FormItem><FormLabel>{bi("رابط LinkedIn", "LinkedIn URL")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="website" render={({ field }) => (
                      <FormItem><FormLabel>{bi("الموقع الشخصي", "Personal website")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="twitter" render={({ field }) => (
                      <FormItem><FormLabel>{bi("حساب X / Twitter", "X / Twitter account")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://x.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control} name="instagram" render={({ field }) => (
                      <FormItem><FormLabel>{bi("حساب Instagram", "Instagram account")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://instagram.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={profileForm.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>{bi("نبذة شخصية / السيرة الذاتية", "Bio / CV summary")}</FormLabel><FormControl><Textarea rows={4} placeholder={bi("اكتب نبذة مختصرة عن خبراتك ومسيرتك المهنية...", "Write a brief summary of your experience and career...")} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> {bi("التخصصات والشهادات", "Specializations & certifications")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <FormField control={profileForm.control} name="specializations" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("التخصصات (افصل بينها بفاصلة)", "Specializations (comma-separated)")}</FormLabel>
                      <FormControl><Input placeholder={bi("مثال: ريادة الأعمال، تسويق رقمي، تطوير المهارات...", "e.g. Entrepreneurship, Digital marketing, Skill development...")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={profileForm.control} name="certifications" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("الشهادات والمؤهلات", "Certifications & qualifications")}</FormLabel>
                      <FormControl><Textarea rows={3} placeholder={bi("أدخل شهاداتك ومؤهلاتك المهنية...", "Enter your professional certifications and qualifications...")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}
            </CardContent>
          </Card>

          <Button type="submit">
            <Save className="ml-2 h-4 w-4" />
            {bi("حفظ الملف الشخصي", "Save profile")}
          </Button>
        </form>
      </Form>

      <Separator />

      {/* Wallet */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> {bi("رصيد الأرباح", "Earnings balance")}</CardTitle>
          <CardDescription>{bi("إجمالي أرباحك من جلسات الإرشاد.", "Your total earnings from mentoring sessions.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-10 w-32" /> :
            <p className="text-3xl font-bold">{(profile?.wallet?.balance || 0).toFixed(2)} {bi("د.أ", "JOD")}</p>
          }
          <p className="text-xs text-muted-foreground mt-1">{bi("سيتم تحويل الرصيد إلى حسابك البنكي في بداية كل شهر.", "The balance will be transferred to your bank account at the start of each month.")}</p>
        </CardContent>
      </Card>

      <Form {...payoutForm}>
        <form onSubmit={payoutForm.handleSubmit(onSubmitPayout)} className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" /> {bi("معلومات الدفع", "Payment information")}</CardTitle>
              <CardDescription>{bi("أدخل معلومات حسابك البنكي لاستلام أرباحك.", "Enter your bank account information to receive your earnings.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={payoutForm.control} name="accountHolderName" render={({ field }) => (
                <FormItem><FormLabel>{bi("اسم صاحب الحساب", "Account holder name")}</FormLabel><FormControl><Input placeholder={bi("الاسم كما هو مسجل في البنك", "Name as registered at the bank")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={payoutForm.control} name="iban" render={({ field }) => (
                <FormItem><FormLabel>{bi("رقم IBAN", "IBAN")}</FormLabel><FormControl><Input dir="ltr" placeholder="JOXX XXXX XXXX XXXX XXXX XXXX XX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={payoutForm.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel>{bi("اسم البنك", "Bank name")}</FormLabel><FormControl><Input placeholder={bi("اسم البنك", "Bank name")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={payoutForm.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>{bi("عنوان الفرع", "Branch address")}</FormLabel><FormControl><Input placeholder={bi("عنوان فرع البنك", "Bank branch address")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit">
            <Save className="ml-2 h-4 w-4" />
            {bi("حفظ معلومات الدفع", "Save payment information")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
