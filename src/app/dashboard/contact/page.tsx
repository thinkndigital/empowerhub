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
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

const contactFormSchema = z.object({
  subject: z.string({ required_error: "الرجاء اختيار الموضوع." }),
  message: z.string().min(10, { message: "الرسالة يجب أن تحتوي على 10 أحرف على الأقل." }),
});

// Subject values are stored in Firestore as-is (canonical Arabic), so the
// value sent to the API always stays Arabic regardless of UI language —
// only the displayed label is translated.
const SUBJECT_OPTIONS: { value: string; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
  { value: "طلب تدريب جديد", labelAr: "طلب تدريب جديد", labelEn: "New training request", icon: <BookOpen className="h-4 w-4" /> },
  { value: "طلب جلسة إرشاد", labelAr: "طلب جلسة إرشاد", labelEn: "Mentoring session request", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "استفسار عام", labelAr: "استفسار عام", labelEn: "General inquiry", icon: <HelpCircle className="h-4 w-4" /> },
  { value: "مشكلة فنية", labelAr: "مشكلة فنية", labelEn: "Technical issue", icon: <Wrench className="h-4 w-4" /> },
];

export default function ContactOrganizationPage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const { user: authUser } = useUser();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { subject: undefined, message: "" },
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    if (!authUser) return;
    setSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/beneficiary/contact-org', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error || bi('فشل إرسال الطلب', 'Failed to send request'));

      toast({
        title: bi("تم إرسال طلبك بنجاح", "Your request was sent successfully"),
        description: bi(`سيتم مراجعة طلبك بخصوص "${values.subject}" من قبل مدير منظمتك.`, `Your request regarding "${values.subject}" will be reviewed by your organization admin.`),
      });
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: e.message || bi("فشل إرسال الطلب. حاول مرة أخرى.", "Failed to send the request. Please try again.") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("التواصل مع المنظمة", "Contact the organization")}</h1>
        <p className="text-muted-foreground mt-1">{bi("أرسل طلباتك واستفساراتك لمدير منظمتك مباشرةً.", "Send your requests and inquiries directly to your organization admin.")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBJECT_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => form.setValue("subject", opt.value)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-primary/5 hover:border-primary/30 transition-colors text-center group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              {opt.icon}
            </div>
            <span className="text-xs font-medium leading-tight">{bi(opt.labelAr, opt.labelEn)}</span>
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-primary" />{bi("نموذج الطلب", "Request form")}
          </CardTitle>
          <CardDescription>{bi("سيتم إرسال طلبك لمدير منظمتك للمراجعة.", "Your request will be sent to your organization admin for review.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("الموضوع", "Subject")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={bi("اختر نوع الطلب...", "Choose a request type...")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{bi(opt.labelAr, opt.labelEn)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("الرسالة", "Message")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={bi("اشرح طلبك بالتفصيل هنا...", "Describe your request in detail here...")} className="min-h-[140px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="shadow-md" disabled={submitting}>
                <Send className="ml-2 h-4 w-4" />
                {submitting ? bi("جاري الإرسال...", "Sending...") : bi("إرسال الطلب", "Send request")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
