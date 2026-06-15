"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save } from "lucide-react";

const settingsSchema = z.object({
  currency: z.enum(["د.أ", "$", "€"]),
});

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: "د.أ", // This would come from a database in a real app
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    console.log("Saving settings:", values);
    // In a real app, you would save this to a global state/database
    toast({
      title: "تم حفظ الإعدادات",
      description: `تم تحديث العملة الافتراضية إلى ${values.currency}.`,
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
       <h1 className="text-lg font-semibold md:text-2xl mb-4">إعدادات النظام</h1>
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إعدادات العملة
            </CardTitle>
            <CardDescription>
                تحديد العملة الافتراضية المستخدمة في جميع أنحاء المنصة، بما في ذلك متاجر المستفيدين.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>العملة الافتراضية</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="اختر العملة" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="د.أ">دينار أردني (د.أ)</SelectItem>
                                    <SelectItem value="$">دولار أمريكي ($)</SelectItem>
                                    <SelectItem value="€">يورو (€)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                ستظهر هذه العملة في جميع الأسعار والمعاملات المالية.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">
                        <Save className="ml-2 h-4 w-4" />
                        حفظ التغييرات
                    </Button>
                </form>
            </Form>
        </CardContent>
       </Card>
    </div>
  );
}
