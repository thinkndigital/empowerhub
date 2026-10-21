"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";
import { useAuthActions } from '@/hooks/use-user';

const formSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  password: z.string().min(1, { message: "الرجاء إدخال كلمة المرور." }),
});

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((image) => image.id === 'login-background');
  const { toast } = useToast();
  const router = useRouter();
  const { setToken } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [authBranding, setAuthBranding] = useState({ imageUrl: '', title: '', subtitle: '' });
  const [platformLogo, setPlatformLogo] = useState('');
  const [platformName, setPlatformName] = useState('EmpowerHub');

  useEffect(() => {
    fetch('/api/public/site-config', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.config?.authBranding) setAuthBranding(d.config.authBranding);
    }).catch(() => {});
    fetch('/api/public/platform-config').then(r => r.json()).then(d => {
      if (d.config?.logoUrl) setPlatformLogo(d.config.logoUrl);
      if (d.config?.platformName) setPlatformName(d.config.platformName);
    }).catch(() => {});
  }, []);

  const brandingImageUrl = authBranding.imageUrl || loginImage?.imageUrl;
  const brandingTitle = authBranding.title || 'منصة التمكين الرقمي';
  const brandingSubtitle = authBranding.subtitle || 'نربط المستفيدين بالمرشدين والمدربين المتخصصين لدعم نموهم المهني والشخصي';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
      setToken(data.token);
      toast({ title: "تم تسجيل الدخول!", description: `مرحباً ${data.user?.name || ''}!` });
      router.push('/redirect');
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل تسجيل الدخول", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo + title */}
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                {platformLogo
                  ? <img src={platformLogo} alt={platformName} className="h-14 w-14 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <Logo className="h-14 w-14" />}
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مرحبًا بعودتك</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                سجّل دخولك للوصول إلى حسابك
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-sm font-medium">البريد الإلكتروني</FormLabel>
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
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem className="text-right">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">كلمة المرور</FormLabel>
                      <Link href="#" className="text-xs text-primary hover:underline">
                        نسيت كلمة المرور؟
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        dir="ltr"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <Button type="submit" className="w-full h-10 font-medium" disabled={isLoading}>
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              أنشئ حسابًا مجانًا
            </Link>
          </p>
        </div>
      </div>

      {/* Branding panel — hidden on mobile */}
      <div className="hidden lg:relative lg:flex lg:w-[480px] lg:flex-col lg:shrink-0 overflow-hidden">
        {brandingImageUrl && (
          <Image
            src={brandingImageUrl}
            alt={brandingTitle}
            fill
            className="object-cover"
            data-ai-hint={loginImage?.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-950/85 to-slate-900/90" />
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          <div className="flex items-center gap-3">
            {platformLogo
              ? <img src={platformLogo} alt={platformName} className="h-8 w-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <Logo className="h-8 w-8" />}
            <span className="text-xl font-bold text-white">{platformName}</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-3 leading-snug">
              {brandingTitle}
            </h2>
            <p className="text-white/65 text-sm leading-relaxed mb-8">
              {brandingSubtitle}
            </p>
            <div className="space-y-3">
              {[
                'تدريب احترافي مع خبراء معتمدين',
                'إرشاد شخصي لتطوير المهارات',
                'متجر إلكتروني مدمج للمنتجات',
                'تقارير وتحليلات متقدمة',
              ].map(feature => (
                <div key={feature} className="flex items-center gap-3 text-sm text-white/75">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
