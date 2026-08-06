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
import { usePlatformBrand } from '@/components/platform-brand-provider';
import { useToast } from "@/hooks/use-toast";

import { GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useFirebaseApp, useFirestore, useAuth } from '@/firebase/provider';

const formSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  password: z.string().min(1, { message: "الرجاء إدخال كلمة المرور." }),
});

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((image) => image.id === 'login-background');
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [authBranding, setAuthBranding] = useState({ imageUrl: '', title: '', subtitle: '' });
  const { logoUrl: platformLogo, platformName } = usePlatformBrand();

  useEffect(() => {
    fetch('/api/public/site-config', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.config?.authBranding) setAuthBranding(d.config.authBranding);
    }).catch(() => {});
  }, []);

  const brandingImageUrl = authBranding.imageUrl || loginImage?.imageUrl;
  const brandingTitle = authBranding.title || 'منصة التمكين الرقمي';
  const brandingSubtitle = authBranding.subtitle || 'نربط المستفيدين بالمرشدين والمدربين المتخصصين لدعم نموهم المهني والشخصي';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'organization': return '/organization-dashboard';
      case 'admin': return '/admin-dashboard';
      case 'mentor': return '/mentor-dashboard';
      case 'coach': return '/coach-dashboard';
      case 'merchant': return '/merchant-dashboard';
      default: return '/dashboard';
    }
  };

  async function handleUserProfile(uid: string, displayName: string | null, email: string | null) {
    if (!firestore) {
      toast({ title: "تم تسجيل الدخول!", description: `مرحباً!` });
      router.push('/redirect');
      return;
    }
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      let userData: any;
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        userData = {
          id: uid,
          name: displayName || email?.split('@')[0] || 'مستخدم',
          email: email || '',
          role: 'beneficiary',
          status: 'نشط',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userData);
      }
      toast({ title: "تم تسجيل الدخول!", description: `مرحباً ${userData.name}!` });
      router.push('/redirect');
    } catch {
      toast({ title: "تم تسجيل الدخول!", description: `مرحباً!` });
      router.push('/redirect');
    }
  }

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).then(result => {
      if (result?.user) {
        handleUserProfile(result.user.uid, result.user.displayName, result.user.email);
      }
    }).catch(() => {});
  }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleSignIn() {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        await handleUserProfile(result.user.uid, result.user.displayName, result.user.email);
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      const msg = error.code === 'auth/unauthorized-domain'
        ? 'النطاق غير مصرح به — تحقق من Authorized domains في Firebase.'
        : error.message || 'فشل تسجيل الدخول بـ Google.';
      toast({ variant: "destructive", title: "خطأ Google", description: msg });
      setIsLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleUserProfile(userCredential.user.uid, userCredential.user.displayName, userCredential.user.email);
    } catch (error: any) {
      let errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      if (error.code !== 'auth/user-not-found' && error.code !== 'auth/wrong-password' && error.code !== 'auth/invalid-credential' && error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "فشل تسجيل الدخول", description: errorMessage });
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
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">أو</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="ml-2 h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              تسجيل الدخول بـ Google
            </Button>
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
