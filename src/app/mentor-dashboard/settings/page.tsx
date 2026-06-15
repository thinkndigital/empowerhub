"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Save, Wallet } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const payoutSchema = z.object({
  accountHolderName: z.string().min(2, { message: 'يجب أن يكون اسم صاحب الحساب حرفين على الأقل.' }),
  iban: z.string().min(15, { message: 'الرجاء إدخال رقم IBAN صحيح.' }).max(34, { message: 'الرجاء إدخال رقم IBAN صحيح.' }),
  bankName: z.string().min(3, { message: 'يجب أن يكون اسم البنك 3 أحرف على الأقل.' }),
  address: z.string().min(5, { message: 'يجب أن يكون العنوان 5 أحرف على الأقل.' }),
});

type PayoutInfo = z.infer<typeof payoutSchema>;

type MentorProfile = UserProfile & {
  wallet?: {
    balance?: number;
    payoutInfo?: PayoutInfo;
  }
};

export default function MentorSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: loading } = useDoc<MentorProfile>(userRef);

  const form = useForm<PayoutInfo>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      accountHolderName: '',
      iban: '',
      bankName: '',
      address: '',
    },
  });

  useEffect(() => {
    if (user?.wallet?.payoutInfo) {
      form.reset(user.wallet.payoutInfo);
    }
  }, [user, form]);
  

  async function onSubmit(values: PayoutInfo) {
    if (!userRef) return;
    
    updateDoc(userRef, { 'wallet.payoutInfo': values })
        .then(() => {
            toast({
                title: 'تم حفظ الإعدادات',
                description: 'تم تحديث معلومات الدفع الخاصة بك بنجاح.',
            });
        })
        .catch(err => {
            toast({ variant: 'destructive', title: 'خطأ!', description: 'فشلت عملية الحفظ.' });
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { 'wallet.payoutInfo': values } }));
        });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
          <h1 className="text-lg font-semibold md:text-2xl">المحفظة والإعدادات</h1>
          <p className="text-muted-foreground">إدارة أرباحك وتفاصيل الدفع الخاصة بك.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  رصيد الأرباح
              </CardTitle>
              <CardDescription>
                  هذا هو إجمالي أرباحك الحالية من جلسات الإرشاد.
              </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-32" /> :
              <p className="text-3xl font-bold">
                  {(user?.wallet?.balance || 0).toFixed(2)} د.أ
              </p>
            }
              <p className="text-xs text-muted-foreground mt-1">
                  سيتم تحويل الرصيد إلى حسابك البنكي في بداية كل شهر.
              </p>
          </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        معلومات الدفع
                    </CardTitle>
                    <CardDescription>
                        الرجاء إدخال معلومات حسابك البنكي لاستلام أرباحك.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                        <FormItem><FormLabel>اسم صاحب الحساب</FormLabel><FormControl><Input placeholder="الاسم كما هو مسجل في البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="iban" render={({ field }) => (
                        <FormItem><FormLabel>رقم الحساب المصرفي الدولي (IBAN)</FormLabel><FormControl><Input dir="ltr" placeholder="JOXX XXXX XXXX XXXX XXXX XXXX XX" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input placeholder="اسم البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>عنوان الفرع</FormLabel><FormControl><Input placeholder="عنوان فرع البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <div>
                <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    حفظ المعلومات
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
