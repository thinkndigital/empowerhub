"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Building, MessageSquare, HelpCircle, Wrench, BookOpen } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

const contactFormSchema = z.object({
  subject: z.string({ required_error: "الرجاء اختيار الموضوع." }),
  message: z.string().min(10, { message: "الرسالة يجب أن تحتوي على 10 أحرف على الأقل." }),
});

export default function ContactOrganizationPage() {
  const { toast } = useToast();
  const { user: authUser, userProfile } = useUser();
  const firestore = useFirestore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { subject: undefined, message: "" },
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    if (!firestore || !authUser || !userProfile) return;
    setSubmitting(true);
    try {
      // Find org admin to notify
      let orgAdminId: string | null = null;
      if ((userProfile as any).organizationId) {
        const snap = await getDocs(
          query(collection(firestore, "users"), where("role", "==", "organization"), where("organizationId", "==", (userProfile as any).organizationId))
        );
        if (!snap.empty) orgAdminId = snap.docs[0].id;
      }

      await addDoc(collection(firestore, "contactRequests"), {
        senderId: authUser.uid,
        senderName: userProfile.name || authUser.email,
        organizationId: (userProfile as any).organizationId || null,
        subject: values.subject,
        message: values.message,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      if (orgAdminId) {
        await addDoc(collection(firestore, "notifications"), {
          userId: orgAdminId,
          title: `طلب جديد: ${values.subject}`,
          body: `${userProfile.name || 'مستفيد'} أرسل طلباً: ${values.message.slice(0, 80)}`,
          read: false,
          createdAt: serverTimestamp(),
          link: "/organization-dashboard/messages",
        });
      }

      toast({ title: "تم إرسال طلبك بنجاح", description: `سيتم مراجعة طلبك بخصوص "${values.subject}" من قبل مدير منظمتك.` });
      form.reset();
    } catch {
      toast({ variant: "destructive", title: "خطأ!", description: "فشل إرسال الطلب. حاول مرة أخرى." });
    } finally {
      setSubmitting(false);
    }
  }

  const subjectIcons: Record<string, React.ReactNode> = {
    "طلب تدريب جديد": <BookOpen className="h-4 w-4" />,
    "طلب جلسة إرشاد": <MessageSquare className="h-4 w-4" />,
    "استفسار عام": <HelpCircle className="h-4 w-4" />,
    "مشكلة فنية": <Wrench className="h-4 w-4" />,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التواصل مع المنظمة</h1>
        <p className="text-muted-foreground mt-1">أرسل طلباتك واستفساراتك لمدير منظمتك مباشرةً.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(subjectIcons).map(([label, icon]) => (
          <button key={label} type="button" onClick={() => form.setValue("subject", label)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-primary/5 hover:border-primary/30 transition-colors text-center group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              {icon}
            </div>
            <span className="text-xs font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-primary" />نموذج الطلب
          </CardTitle>
          <CardDescription>سيتم إرسال طلبك لمدير منظمتك للمراجعة.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>الموضوع</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر نوع الطلب..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="طلب تدريب جديد">طلب تدريب جديد</SelectItem>
                      <SelectItem value="طلب جلسة إرشاد">طلب جلسة إرشاد</SelectItem>
                      <SelectItem value="استفسار عام">استفسار عام</SelectItem>
                      <SelectItem value="مشكلة فنية">مشكلة فنية</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>الرسالة</FormLabel>
                  <FormControl>
                    <Textarea placeholder="اشرح طلبك بالتفصيل هنا..." className="min-h-[140px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="shadow-md" disabled={submitting}>
                <Send className="ml-2 h-4 w-4" />
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
