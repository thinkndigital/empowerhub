"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase/auth/use-user";
import { User, Bell, Shield, Palette, Globe, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function SettingsPage() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true, sessions: true, courses: false, store: true,
  });

  const name = userProfile?.name || "مستفيد تجريبي";
  const email = userProfile?.email || "user@example.com";

  const handleSave = () => {
    toast({ title: "تم الحفظ!", description: "تم حفظ إعداداتك بنجاح." });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إدارة ملفك الشخصي وتفضيلات حسابك.</p>
      </div>

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            الملف الشخصي
          </CardTitle>
          <CardDescription>معلوماتك الأساسية المعروضة على المنصة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={userProfile?.avatarUrl} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">{name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                تغيير الصورة
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG، JPG — حد أقصى 2MB</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input defaultValue={name} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input defaultValue={email} dir="ltr" type="email" />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input placeholder="+966 5XX XXX XXXX" dir="ltr" type="tel" />
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input placeholder="الرياض" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} className="shadow-md">حفظ التغييرات</Button>
          </div>
        </CardContent>
      </Card>

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
              <Button size="sm" variant="outline" onClick={() => toast({ title: "قريباً", description: "هذه الميزة ستتوفر قريباً." })}>تفعيل</Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} className="shadow-md">تحديث كلمة المرور</Button>
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
