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
import { Send, Building } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";

const contactFormSchema = z.object({
  subject: z.string({ required_error: "الرجاء اختيار الموضوع." }),
  message: z.string().min(10, { message: "الرسالة يجب أن تحتوي على 10 أحرف على الأقل." }),
});

export default function ContactOrganizationPage() {
  const { toast } = useToast();
  const { userProfile } = useUser();

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { subject: undefined, message: "" },
  });

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    console.log("Submitting request to organization:", values);
    toast({
        title: "تم إرسال طلبك بنجاح",
        description: `سيتم مراجعة طلبك بخصوص "${values.subject}" من قبل مدير منظمتك.`,
    });
    form.reset();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            التواصل مع المنظمة
          </CardTitle>
          <CardDescription>
            استخدم هذا النموذج لطلب تدريب أو إرشاد، أو لإرسال أي استفسار آخر إلى مدير منظمتك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموضوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الطلب..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="طلب تدريب جديد">طلب تدريب جديد</SelectItem>
                        <SelectItem value="طلب جلسة إرشاد">طلب جلسة إرشاد</SelectItem>
                        <SelectItem value="استفسار عام">استفسار عام</SelectItem>
                        <SelectItem value="مشكلة فنية">مشكلة فنية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرسالة</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اشرح طلبك بالتفصيل هنا..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Send className="ml-2 h-4 w-4" />
                إرسال الطلب
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
