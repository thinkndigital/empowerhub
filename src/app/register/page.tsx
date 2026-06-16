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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { useAuth, useFirestore } from '@/firebase/provider';


const formSchema = z.object({
    name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
    role: z.string({ required_error: "الرجاء اختيار دور." }),
    organizationName: z.string().optional(),
}).refine((data) => {
    if (data.role === 'organization') {
        return data.organizationName && data.organizationName.length >= 2;
    }
    return true;
}, {
    message: "يجب إدخال اسم المنظمة (حرفان على الأقل).",
    path: ["organizationName"],
});

function RegisterForm() {
    const registerImage = PlaceHolderImages.find((image) => image.id === 'register-background');
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(false);

    const roleFromQuery = searchParams.get('role');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: roleFromQuery && ["beneficiary", "organization"].includes(roleFromQuery) ? roleFromQuery : "beneficiary",
            organizationName: "",
        },
    });

    const selectedRole = form.watch("role");

    useEffect(() => {
        const role = searchParams.get('role');
        if (role) form.setValue('role', role);
    }, [searchParams, form]);

    const getDashboardLink = (role: string) => {
        switch (role) {
            case 'organization': return '/organization-dashboard';
            case 'admin': return '/admin-dashboard';
            case 'mentor': return '/mentor-dashboard';
            case 'coach': return '/coach-dashboard';
            default: return '/dashboard';
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            if (!auth || !firestore) throw new Error("الخدمة غير متاحة مؤقتاً، حاول مرة أخرى.");

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            let organizationId: string | undefined;

            // If registering as organization admin, create the org document first
            if (values.role === 'organization') {
                const orgRef = doc(collection(firestore, 'organizations'));
                organizationId = orgRef.id;
                await setDoc(orgRef, {
                    id: organizationId,
                    name: values.organizationName || values.name,
                    adminId: user.uid,
                    status: 'نشطة',
                    createdAt: new Date().toISOString(),
                    primaryColor: '#2563eb',
                });
            }

            // Create user document in Firestore
            const userData: Record<string, any> = {
                id: user.uid,
                name: values.name,
                email: values.email,
                role: values.role,
                status: 'نشط',
                progress: 0,
                createdAt: new Date().toISOString(),
            };

            if (organizationId) userData.organizationId = organizationId;

            await setDoc(doc(firestore, "users", user.uid), userData);

            toast({
                title: "تم إنشاء الحساب بنجاح!",
                description: "تم تسجيل دخولك تلقائيًا.",
            });

            router.push(getDashboardLink(values.role));

        } catch (error: any) {
            console.error("Registration error", error);
            let errorMessage = "فشل إنشاء الحساب. الرجاء المحاولة مرة أخرى.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "كلمة المرور ضعيفة جدًا.";
            }
            toast({ variant: "destructive", title: "حدث خطأ", description: errorMessage });
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
                            انضم إلى منصة EmpowerHub
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
                                        <FormLabel>نوع الحساب</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!!roleFromQuery}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر نوع حسابك" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="beneficiary">مستفيد</SelectItem>
                                                <SelectItem value="organization">مدير منظمة</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">
                                            المرشدون والمدربون يُضافون من قبل مدير المنظمة.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedRole === 'organization' && (
                                <FormField
                                    control={form.control}
                                    name="organizationName"
                                    render={({ field }) => (
                                        <FormItem className="text-right">
                                            <FormLabel>اسم المنظمة</FormLabel>
                                            <FormControl>
                                                <Input placeholder="مثال: مؤسسة الأمل" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                سيتم إنشاء حساب منظمتك تلقائياً.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

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
                        انضم إلى منصة EmpowerHub وابدأ التغيير اليوم
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
