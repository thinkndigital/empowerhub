
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
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

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useFirebaseApp } from '@/firebase/provider';

const formSchema = z.object({
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(1, { message: "الرجاء إدخال كلمة المرور." }),
});

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((image) => image.id === 'login-background');
  const { toast } = useToast();
  const router = useRouter();
  const app = useFirebaseApp();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'organization':
        return '/organization-dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'mentor':
        return '/mentor-dashboard';
      case 'coach':
        return '/coach-dashboard';
      case 'beneficiary':
      default:
        return '/dashboard';
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
      setIsLoading(true);
      if (!app) {
          toast({
              variant: "destructive",
              title: "حدث خطأ",
              description: "لم يتم تهيئة Firebase بعد. الرجاء المحاولة مرة أخرى.",
          });
          setIsLoading(false);
          return;
      }
      try {
          const auth = getAuth(app);
          const firestore = getFirestore(app);

          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user;

          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData?.role;
              toast({
                  title: "تم تسجيل الدخول بنجاح!",
                  description: `مرحباً بعودتك، ${userData?.name || 'المستخدم'}!`,
              });
              if (role) {
                const dashboardUrl = getDashboardLink(role);
                router.push(dashboardUrl);
              } else {
                 // Even if role is missing, we can default to the beneficiary dashboard
                 toast({
                    variant: "destructive",
                    title: "الدور غير محدد",
                    description: "لم يتم تحديد دور لهذا الحساب. يتم توجيهك إلى لوحة التحكم الافتراضية."
                 });
                 router.push('/dashboard');
              }
          } else {
              await auth.signOut();
              throw new Error("لم يتم العثور على ملف تعريف المستخدم.");
          }

      } catch (error: any) {
          console.error("Login error", error);
           let errorMessage = "فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            } else if (error.message) {
                errorMessage = error.message;
            }
          toast({
              variant: "destructive",
              title: "حدث خطأ",
              description: errorMessage,
          });
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex justify-center items-center gap-2">
              <Logo className="w-16 h-16 mx-auto" />
            </Link>
            <h1 className="text-3xl font-bold">مرحبًا بعودتك</h1>
             <p className="text-balance text-muted-foreground">
              أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك
            </p>
          </div>

           <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="text-right">
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="mail@example.com" required dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="text-right">
                            <div className="flex items-center">
                                <FormLabel>كلمة المرور</FormLabel>
                                <Link href="#" className="mr-auto inline-block text-sm underline">
                                هل نسيت كلمة المرور؟
                                </Link>
                            </div>
                            <FormControl>
                                <Input type="password" required dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
                <Button variant="secondary" asChild>
                    <Link href="/try-roles">تجربة المنصة بدون حساب</Link>
                </Button>
              </form>
           </Form>

          <div className="mt-4 text-center text-sm">
            ألا تمتلك حسابًا؟{' '}
            <Link href="/register" className="underline">
              أنشئ حسابًا
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            width={1200}
            height={900}
            className="h-full w-full object-cover"
            data-ai-hint={loginImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
    </div>
  );
}
