"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Logo } from '@/components/logo';
import { usePlatformBrand } from '@/components/platform-brand-provider';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

const formSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
});

export default function ForgotPasswordPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const { toast } = useToast();
  const { logoUrl: platformLogo, platformName } = usePlatformBrand();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      setSent(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: error.message || bi('حدث خطأ غير متوقع.', 'An unexpected error occurred.') });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-background" dir={dir}>
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link href="/" className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
              {platformLogo
                ? <img src={platformLogo} alt={platformName} className="h-14 w-14 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Logo className="h-14 w-14" />}
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{bi('استعادة كلمة المرور', 'Reset password')}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {bi('أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين', "Enter your email and we'll send you a reset link")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                {bi('إذا كان بريدك الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق.', "If your email is registered with us, you will receive a password reset link within a few minutes.")}
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-sm font-medium">{bi('البريد الإلكتروني', 'Email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="mail@example.com"
                        dir="ltr"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <Button type="submit" className="w-full h-10 font-medium" disabled={isLoading}>
                  {isLoading ? bi('جاري الإرسال...', 'Sending...') : bi('إرسال رابط إعادة التعيين', 'Send reset link')}
                </Button>
              </form>
            </Form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {bi('تذكرت كلمة المرور؟', 'Remembered your password?')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {bi('تسجيل الدخول', 'Log in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
