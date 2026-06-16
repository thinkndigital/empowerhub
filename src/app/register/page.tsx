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

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from '@/firebase/provider';


const formSchema = z.object({
    name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
    role: z.string({ required_error: "الرجاء اختيار نوع الحساب." }),
    organizationName: z.string().optional(),
    orgInviteCode: z.string().optional(),
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
            role: roleFromQuery && ["beneficiary", "organization", "mentor", "coach"].includes(roleFromQuery)
                ? roleFromQuery
                : "beneficiary",
            organizationName: "",
            orgInviteCode: "",
        },
    });

    const selectedRole = form.watch("role");

    useEffect(() => {
        const role = searchParams.get('role');
        if (role && ["beneficiary", "organization", "mentor", "coach"].includes(role)) {
            form.setValue('role', role);
        }
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
            // Abort if API takes more than 15 seconds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            let res: Response;
            try {
                res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        password: values.password,
                        role: values.role,
                        organizationName: values.organizationName,
                        orgInviteCode: values.orgInviteCode,
                    }),
                    signal: controller.signal,
                });
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('انتهت مهلة الطلب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
                }
                throw fetchError;
            }
            clearTimeout(timeoutId);

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                if (!res.ok) throw new Error(`فشل الطلب (${res.status})`);
            }

            if (!res.ok) {
                throw new Error(data.error || 'فشل إنشاء الحساب.');
            }

            // Sign in after successful registration
            let signedInUid: string | null = data.uid || null;
            if (auth) {
                try {
                    const cred = await signInWithEmailAndPassword(auth, values.email, values.password);
                    signedInUid = cred.user.uid;
                } catch {
                    // Sign-in failed but account was created — redirect anyway
                }
            }

            // Write Firestore profile from client side as well (in case server-side write failed)
            if (firestore && signedInUid) {
                try {
                    await setDoc(doc(firestore, 'users', signedInUid), {
                        id: signedInUid,
                        name: values.name,
                        email: values.email,
                        role: values.role,
                        status: 'نشط',
                        progress: 0,
                        createdAt: new Date().toISOString(),
                        ...(data.organizationId ? { organizationId: data.organizationId } : {}),
                    }, { merge: true });
                } catch (e) {
                    console.error('Client profile write failed:', e);
                }
            }

            toast({
                title: "تم إنشاء الحساب بنجاح!",
                description: "مرحباً بك في EmpowerHub!",
            });

            router.push('/redirect');

        } catch (error: any) {
            console.error("Registration error", error);
            let errorMessage = error.message || "فشل إنشاء الحساب. الرجاء المحاولة مرة أخرى.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "كلمة المرور ضعيفة جدًا (6 أحرف على الأقل).";
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
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!!roleFromQuery}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر نوع حسابك" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="beneficiary">مستفيد</SelectItem>
                                                <SelectItem value="organization">مدير منظمة</SelectItem>
                                                <SelectItem value="mentor">مرشد</SelectItem>
                                                <SelectItem value="coach">مدرب / مدربة</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">
                                            {(selectedRole === 'mentor' || selectedRole === 'coach')
                                                ? 'يمكنك إدخال كود دعوة المنظمة إن وجد (اختياري).'
                                                : 'اختر دورك على المنصة.'}
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

                            {(selectedRole === 'mentor' || selectedRole === 'coach') && (
                                <FormField
                                    control={form.control}
                                    name="orgInviteCode"
                                    render={({ field }) => (
                                        <FormItem className="text-right">
                                            <FormLabel>كود دعوة المنظمة <span className="text-muted-foreground font-normal">(اختياري)</span></FormLabel>
                                            <FormControl>
                                                <Input dir="ltr" placeholder="أدخل كود الدعوة إن وجد" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                إذا انتميت لمنظمة، أدخل الكود لربط حسابك بها.
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
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
