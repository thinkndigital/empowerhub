"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save, Settings, Bell } from "lucide-react";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

const settingsSchema = z.object({
  currency: z.enum(["د.أ", "$", "€"]),
  platformName: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  notifyOnRegister: z.boolean().default(true),
  notifyOnOrder: z.boolean().default(true),
});

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "platform");
  }, [firestore]);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { currency: "د.أ", platformName: "EmpowerHub", notifyOnRegister: true, notifyOnOrder: true },
  });

  useEffect(() => {
    if (!settingsRef || !firestore) return;
    getDoc(settingsRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        form.reset({
          currency: data.currency || "د.أ",
          platformName: data.platformName || "EmpowerHub",
          notifyOnRegister: data.notifyOnRegister ?? true,
          notifyOnOrder: data.notifyOnOrder ?? true,
        });
      }
    });
  }, [settingsRef, firestore, form]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "settings", "platform"), values, { merge: true });
      toast({ title: bi("تم حفظ الإعدادات", "Settings saved"), description: bi("تم تحديث إعدادات المنصة بنجاح.", "Platform settings updated successfully.") });
    } catch {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل حفظ الإعدادات.", "Failed to save settings.") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{bi("إعدادات النظام", "System Settings")}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />{bi("إعدادات عامة", "General settings")}</CardTitle>
              <CardDescription>{bi("الإعدادات الأساسية للمنصة.", "Core platform settings.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="platformName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("اسم المنصة", "Platform name")}</FormLabel>
                  <FormControl><Input placeholder="EmpowerHub" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("العملة الافتراضية", "Default currency")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[280px]"><SelectValue placeholder={bi("اختر العملة", "Select currency")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="د.أ">{bi("دينار أردني (د.أ)", "Jordanian Dinar (JOD)")}</SelectItem>
                      <SelectItem value="$">{bi("دولار أمريكي ($)", "US Dollar ($)")}</SelectItem>
                      <SelectItem value="€">{bi("يورو (€)", "Euro (€)")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{bi("ستظهر هذه العملة في جميع الأسعار والمعاملات المالية.", "This currency will appear across all prices and financial transactions.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />{bi("إعدادات الإشعارات", "Notification settings")}</CardTitle>
              <CardDescription>{bi("تحكم في الإشعارات التلقائية للمنصة.", "Control the platform's automatic notifications.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="notifyOnRegister" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{bi("إشعار عند تسجيل مستخدم جديد", "Notify on new user registration")}</FormLabel>
                    <FormDescription>{bi("يُرسل إشعاراً للأدمن عند انضمام مستخدم جديد.", "Sends a notification to the admin when a new user joins.")}</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="notifyOnOrder" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{bi("إشعار عند طلب شراء جديد", "Notify on new purchase order")}</FormLabel>
                    <FormDescription>{bi("يُرسل إشعاراً عند استلام طلب شراء جديد في أي متجر.", "Sends a notification when a new purchase order is received in any store.")}</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving}>
            <Save className="ml-2 h-4 w-4" />
            {isSaving ? bi("جاري الحفظ...", "Saving...") : bi("حفظ التغييرات", "Save changes")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
