"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useFirebaseApp } from '@/firebase/provider';


const formSchema = z.object({
    name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
    role: z.string({ required_error: "الرجاء اختيار دور." }),
});

function RegisterForm() {
    const registerImage = PlaceHolderImages.find((image) => image.id === 'register-background');
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const app = useFirebaseApp();
    const [isLoading, setIsLoading] = useState(false);

    const roleFromQuery = searchParams.get('role');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: roleFromQuery && ["beneficiary", "coach", "mentor", "organization"].includes(roleFromQuery) ? roleFromQuery : "beneficiary",
        },
    });

    useEffect(() => {
        const role = searchParams.get('role');
        if (role) {
            form.setValue('role', role);
        }
    }, [searchParams, form]);
    
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
        try {
            if (!app) throw new Error("Firebase app is not initialized.");
            const auth = getAuth(app);
            const firestore = getFirestore(app);

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await setDoc(doc(firestore, "users", user.uid), {
                name: values.name,
                email: values.email,
                role: values.role,
                status: "نشط",
                createdAt: new Date().toISOString(),
                id: user.uid,
            });

            toast({
                title: "تم إنشاء الحساب بنجاح!",
                description: "تم تسجيل دخولك تلقائيًا.",
            });

            const dashboardUrl = getDashboardLink(values.role);
            router.push(dashboardUrl);

        } catch (error: any) {
            console.error("Registration error", error);
            const errorCode = error.code;
            let errorMessage = "فشل إنشاء الحساب. الرجاء المحاولة مرة أخرى.";
            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل.";
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = "كلمة المرور ضعيفة جدًا.";
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
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2" dir="rtl">
            <div className="flex items-center justify-center py-12 px-4">
                <div className="mx-auto grid w-full max-w-[380px] gap-6">
                    <div className="grid gap-2 text-center">
                        <Link href="/" className="flex justify-center items-center gap-2 mb-2">
                           <Logo className="w-12 h-12 mx-auto" />
                        </Link>
                        <h1 className="text-3xl font-bold">إنشاء حساب جديد</h1>
                        <p className="text-balance text-muted-foreground">
                            انضم إلى آلاف المستفيدين على منصة EmpowerHub
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>الاسم الكامل</FormLabel>
                                        <FormControl>
                                            <Input placeholder="محمد أحمد" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>البريد الإلكتروني</FormLabel>
                                        <FormControl>
                                            <Input type="email" dir="ltr" placeholder="mail@example.com" {...field} />
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
                                        <FormLabel>كلمة المرور</FormLabel>
                                        <FormControl>
                                            <Input type="password" dir="ltr" placeholder="6 أحرف على الأقل" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>الانضمام كـ</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!roleFromQuery}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر دورًا لحسابك" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="beneficiary">مستفيد</SelectItem>
                                                <SelectItem value="coach">مدرب</SelectItem>
                                                <SelectItem value="mentor">مرشد</SelectItem>
                                                <SelectItem value="organization">مدير منظمة</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full shadow-md" disabled={isLoading}>
                                {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب مجاناً'}
                            </Button>
                        </form>
                    </Form>

                    <p className="text-xs text-center text-muted-foreground">
                        بالتسجيل أنت توافق على{' '}
                        <Link href="#" className="underline hover:text-primary">شروط الاستخدام</Link>
                        {' '}و{' '}
                        <Link href="#" className="underline hover:text-primary">سياسة الخصوصية</Link>
                    </p>

                    <div className="text-center text-sm">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="underline font-medium text-primary">
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block relative overflow-hidden">
                {registerImage && (
                    <Image
                        src={registerImage.imageUrl}
                        alt={registerImage.description}
                        fill
                        className="object-cover"
                        data-ai-hint={registerImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-10 right-10 text-white max-w-xs">
                    <h2 className="text-2xl font-bold mb-2">ابدأ رحلتك نحو النجاح</h2>
                    <p className="text-white/80 text-sm leading-relaxed">
                        انضم إلى آلاف المستفيدين الذين غيّروا حياتهم من خلال منصة EmpowerHub
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">جاري التحميل...</div></div>}>
            <RegisterForm />
        </Suspense>
    );
}
