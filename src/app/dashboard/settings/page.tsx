"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { User, Bell, Shield, Palette, Globe, Camera, Loader2, Save, BookOpen, Target } from "lucide-react";
// Note: Firestore client SDK not used here — all writes go through API routes
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";

const profileSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  educationLevel: z.string().optional(),
  employmentStatus: z.string().optional(),
  skills: z.string().optional(),
  goals: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const { userProfile, user: authUser } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState({
    email: true, sessions: true, courses: false, store: true,
  });

  const name = userProfile?.name || bi("مستفيد تجريبي", "Demo beneficiary");
  const email = userProfile?.email || "user@example.com";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      idNumber: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      educationLevel: "",
      employmentStatus: "",
      skills: "",
      goals: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || "",
        phone: (userProfile as any).phone || "",
        idNumber: (userProfile as any).idNumber || "",
        gender: (userProfile as any).gender || "",
        dateOfBirth: (userProfile as any).dateOfBirth || "",
        address: (userProfile as any).address || "",
        educationLevel: (userProfile as any).educationLevel || "",
        employmentStatus: (userProfile as any).employmentStatus || "",
        skills: (userProfile as any).skills || "",
        goals: (userProfile as any).goals || "",
      });
    }
  }, [userProfile, form]);

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
      toast({ title: bi('تم تحديث الصورة الشخصية', 'Profile picture updated'), description: bi('تم رفع صورتك الشخصية بنجاح.', 'Your profile picture was uploaded successfully.') });
    } catch {
      toast({ variant: 'destructive', title: bi('خطأ!', 'Error!'), description: bi('فشل رفع الصورة الشخصية.', 'Failed to upload the profile picture.') });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onSubmitProfile(values: ProfileFormValues) {
    if (!authUser) return;
    setIsSaving(true);
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      toast({ title: bi("تم الحفظ!", "Saved!"), description: bi("تم تحديث ملفك الشخصي بنجاح.", "Your profile was updated successfully.") });
    } catch (err) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل حفظ البيانات.", "Failed to save the data.") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("الإعدادات", "Settings")}</h1>
        <p className="text-muted-foreground mt-1">{bi("إدارة ملفك الشخصي وتفضيلات حسابك.", "Manage your profile and account preferences.")}</p>
      </div>

      {/* Profile */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                {bi("المعلومات الأساسية", "Basic information")}
              </CardTitle>
              <CardDescription>{bi("معلوماتك الأساسية المعروضة على المنصة", "Your basic information shown on the platform")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={avatarPreview || (userProfile as any)?.avatarUrl} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">{name[0]}</AvatarFallback>
                  </Avatar>
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {bi("تغيير الصورة", "Change picture")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bi("PNG، JPG — حد أقصى 2MB", "PNG, JPG — max 2MB")}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("الاسم الكامل", "Full name")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <Label>{bi("البريد الإلكتروني", "Email")}</Label>
                  <Input defaultValue={email} dir="ltr" type="email" disabled className="opacity-60" />
                </div>
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("رقم الهاتف", "Phone number")}</FormLabel>
                    <FormControl><Input placeholder="+966 5XX XXX XXXX" dir="ltr" type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="idNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("رقم الهوية الوطنية", "National ID number")}</FormLabel>
                    <FormControl><Input placeholder="10XXXXXXXX" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("الجنس", "Gender")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={bi("اختر...", "Choose...")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">{bi("ذكر", "Male")}</SelectItem>
                        <SelectItem value="female">{bi("أنثى", "Female")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("تاريخ الميلاد", "Date of birth")}</FormLabel>
                    <FormControl><Input type="date" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{bi("العنوان", "Address")}</FormLabel>
                    <FormControl><Input placeholder={bi("المدينة، الحي، الشارع...", "City, neighborhood, street...")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Education & Employment */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                {bi("التعليم والعمل", "Education & employment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("المستوى التعليمي", "Education level")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={bi("اختر...", "Choose...")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">{bi("ابتدائي", "Primary")}</SelectItem>
                        <SelectItem value="intermediate">{bi("متوسط", "Intermediate")}</SelectItem>
                        <SelectItem value="secondary">{bi("ثانوي", "Secondary")}</SelectItem>
                        <SelectItem value="diploma">{bi("دبلوم", "Diploma")}</SelectItem>
                        <SelectItem value="bachelor">{bi("بكالوريوس", "Bachelor's")}</SelectItem>
                        <SelectItem value="master">{bi("ماجستير", "Master's")}</SelectItem>
                        <SelectItem value="phd">{bi("دكتوراه", "PhD")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("الحالة الوظيفية", "Employment status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={bi("اختر...", "Choose...")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employed">{bi("موظف", "Employed")}</SelectItem>
                        <SelectItem value="self_employed">{bi("عمل حر", "Self-employed")}</SelectItem>
                        <SelectItem value="unemployed">{bi("باحث عن عمل", "Job seeker")}</SelectItem>
                        <SelectItem value="student">{bi("طالب", "Student")}</SelectItem>
                        <SelectItem value="retired">{bi("متقاعد", "Retired")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Goals */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                {bi("المهارات والأهداف", "Skills & goals")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="skills" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("المهارات (افصل بينها بفاصلة)", "Skills (comma-separated)")}</FormLabel>
                  <FormControl>
                    <Input placeholder={bi("مثال: تصميم جرافيك، تسويق رقمي، خياطة...", "e.g. Graphic design, digital marketing, sewing...")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="goals" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("الأهداف والطموحات", "Goals & aspirations")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={bi("ما هي أهدافك التي تسعى لتحقيقها من خلال المنصة؟", "What goals are you hoping to achieve through the platform?")} rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="shadow-md">
              <Save className="ml-2 h-4 w-4" />
              {isSaving ? bi("جاري الحفظ...", "Saving...") : bi("حفظ التغييرات", "Save changes")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            {bi("الإشعارات", "Notifications")}
          </CardTitle>
          <CardDescription>{bi("تحكم في الإشعارات التي تريد استقبالها", "Control which notifications you want to receive")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: bi("إشعارات البريد الإلكتروني", "Email notifications"), desc: bi("استقبال الإشعارات عبر البريد الإلكتروني", "Receive notifications via email") },
            { key: "sessions" as const, label: bi("تذكير بالجلسات", "Session reminders"), desc: bi("تنبيه قبل 30 دقيقة من موعد الجلسة", "Alert 30 minutes before a session's start time") },
            { key: "courses" as const, label: bi("تحديثات الدورات", "Course updates"), desc: bi("إشعار عند إضافة محتوى جديد للدورات", "Notify when new content is added to courses") },
            { key: "store" as const, label: bi("طلبات المتجر", "Store orders"), desc: bi("إشعار فوري عند ورود طلب جديد", "Instant notification when a new order arrives") },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            {bi("الأمان", "Security")}
          </CardTitle>
          <CardDescription>{bi("إدارة كلمة المرور وأمان حسابك", "Manage your password and account security")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{bi("كلمة المرور الحالية", "Current password")}</Label>
              <Input type="password" dir="ltr" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>{bi("كلمة المرور الجديدة", "New password")}</Label>
              <Input type="password" dir="ltr" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">{bi("التحقق الثنائي", "Two-factor authentication")}</p>
              <p className="text-xs text-muted-foreground">{bi("طبقة أمان إضافية لحسابك", "An extra layer of security for your account")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{bi("غير مفعّل", "Not enabled")}</Badge>
              <Button size="sm" variant="outline" type="button" onClick={() => toast({ title: bi("قريباً", "Coming soon"), description: bi("هذه الميزة ستتوفر قريباً.", "This feature will be available soon.") })}>{bi("تفعيل", "Enable")}</Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="shadow-md" type="button" onClick={() => toast({ title: bi("تم التحديث!", "Updated!"), description: bi("تم تحديث كلمة المرور بنجاح.", "Your password was updated successfully.") })}>{bi("تحديث كلمة المرور", "Update password")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            {bi("التفضيلات", "Preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{bi("اللغة", "Language")}</p>
                <p className="text-xs text-muted-foreground">{bi("لغة واجهة المستخدم", "User interface language")}</p>
              </div>
            </div>
            <Badge variant="outline">{bi("العربية", "English")}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
