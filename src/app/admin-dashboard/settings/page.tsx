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

const settingsSchema = z.object({
  currency: z.enum(["د.أ", "$", "€"]),
  platformName: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  notifyOnRegister: z.boolean().default(true),
  notifyOnOrder: z.boolean().default(true),
});

export default function AdminSettingsPage() {
  const { toast } = useToast();
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
      toast({ title: "تم حفظ الإعدادات", description: "تم تحديث إعدادات المنصة بنجاح." });
    } catch {
      toast({ variant: "destructive", title: "خطأ!", description: "فشل حفظ الإعدادات." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold md:text-2xl">إعدادات النظام</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />إعدادات عامة</CardTitle>
              <CardDescription>الإعدادات الأساسية للمنصة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="platformName" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنصة</FormLabel>
                  <FormControl><Input placeholder="EmpowerHub" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>العملة الافتراضية</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[280px]"><SelectValue placeholder="اختر العملة" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="د.أ">دينار أردني (د.أ)</SelectItem>
                      <SelectItem value="$">دولار أمريكي ($)</SelectItem>
                      <SelectItem value="€">يورو (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>ستظهر هذه العملة في جميع الأسعار والمعاملات المالية.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />إعدادات الإشعارات</CardTitle>
              <CardDescription>تحكم في الإشعارات التلقائية للمنصة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="notifyOnRegister" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>إشعار عند تسجيل مستخدم جديد</FormLabel>
                    <FormDescription>يُرسل إشعاراً للأدمن عند انضمام مستخدم جديد.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="notifyOnOrder" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>إشعار عند طلب شراء جديد</FormLabel>
                    <FormDescription>يُرسل إشعاراً عند استلام طلب شراء جديد في أي متجر.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving}>
            <Save className="ml-2 h-4 w-4" />
            {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
