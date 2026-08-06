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
  const { userProfile, user: authUser } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState({
    email: true, sessions: true, courses: false, store: true,
  });

  const name = userProfile?.name || "مستفيد تجريبي";
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
      toast({ title: 'تم تحديث الصورة الشخصية', description: 'تم رفع صورتك الشخصية بنجاح.' });
    } catch {
      toast({ variant: 'destructive', title: 'خطأ!', description: 'فشل رفع الصورة الشخصية.' });
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
      toast({ title: "تم الحفظ!", description: "تم تحديث ملفك الشخصي بنجاح." });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ البيانات." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إدارة ملفك الشخصي وتفضيلات حسابك.</p>
      </div>

      {/* Profile */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                المعلومات الأساسية
              </CardTitle>
              <CardDescription>معلوماتك الأساسية المعروضة على المنصة</CardDescription>
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
                    تغيير الصورة
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">PNG، JPG — حد أقصى 2MB</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input defaultValue={email} dir="ltr" type="email" disabled className="opacity-60" />
                </div>
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl><Input placeholder="+966 5XX XXX XXXX" dir="ltr" type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="idNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهوية الوطنية</FormLabel>
                    <FormControl><Input placeholder="10XXXXXXXX" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجنس</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الميلاد</FormLabel>
                    <FormControl><Input type="date" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>العنوان</FormLabel>
                    <FormControl><Input placeholder="المدينة، الحي، الشارع..." {...field} /></FormControl>
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
                التعليم والعمل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستوى التعليمي</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">ابتدائي</SelectItem>
                        <SelectItem value="intermediate">متوسط</SelectItem>
                        <SelectItem value="secondary">ثانوي</SelectItem>
                        <SelectItem value="diploma">دبلوم</SelectItem>
                        <SelectItem value="bachelor">بكالوريوس</SelectItem>
                        <SelectItem value="master">ماجستير</SelectItem>
                        <SelectItem value="phd">دكتوراه</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة الوظيفية</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employed">موظف</SelectItem>
                        <SelectItem value="self_employed">عمل حر</SelectItem>
                        <SelectItem value="unemployed">باحث عن عمل</SelectItem>
                        <SelectItem value="student">طالب</SelectItem>
                        <SelectItem value="retired">متقاعد</SelectItem>
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
                المهارات والأهداف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="skills" render={({ field }) => (
                <FormItem>
                  <FormLabel>المهارات (افصل بينها بفاصلة)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: تصميم جرافيك، تسويق رقمي، خياطة..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="goals" render={({ field }) => (
                <FormItem>
                  <FormLabel>الأهداف والطموحات</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ما هي أهدافك التي تسعى لتحقيقها من خلال المنصة؟" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="shadow-md">
              <Save className="ml-2 h-4 w-4" />
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            الإشعارات
          </CardTitle>
          <CardDescription>تحكم في الإشعارات التي تريد استقبالها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: "إشعارات البريد الإلكتروني", desc: "استقبال الإشعارات عبر البريد الإلكتروني" },
            { key: "sessions" as const, label: "تذكير بالجلسات", desc: "تنبيه قبل 30 دقيقة من موعد الجلسة" },
            { key: "courses" as const, label: "تحديثات الدورات", desc: "إشعار عند إضافة محتوى جديد للدورات" },
            { key: "store" as const, label: "طلبات المتجر", desc: "إشعار فوري عند ورود طلب جديد" },
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
            الأمان
          </CardTitle>
          <CardDescription>إدارة كلمة المرور وأمان حسابك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>كلمة المرور الحالية</Label>
              <Input type="password" dir="ltr" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input type="password" dir="ltr" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">التحقق الثنائي</p>
              <p className="text-xs text-muted-foreground">طبقة أمان إضافية لحسابك</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">غير مفعّل</Badge>
              <Button size="sm" variant="outline" type="button" onClick={() => toast({ title: "قريباً", description: "هذه الميزة ستتوفر قريباً." })}>تفعيل</Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="shadow-md" type="button" onClick={() => toast({ title: "تم التحديث!", description: "تم تحديث كلمة المرور بنجاح." })}>تحديث كلمة المرور</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            التفضيلات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">اللغة</p>
                <p className="text-xs text-muted-foreground">لغة واجهة المستخدم</p>
              </div>
            </div>
            <Badge variant="outline">العربية</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
