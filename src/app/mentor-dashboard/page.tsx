'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, BarChart, DollarSign } from "lucide-react";
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type MentorProfile = UserProfile & {
  wallet?: {
    balance?: number;
  }
};

export default function MentorDashboardPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: loading } = useDoc<MentorProfile>(userRef);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المرشد</h1>
        <p className="text-muted-foreground">أدواتك لمتابعة المستفيدين، جدولة الجلسات، وقياس تأثيرك.</p>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستفيدين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الجلسات القادمة</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط تقييمك</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0/5</div>
            <p className="text-xs text-muted-foreground">لا توجد تقييمات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-24" /> :
              <div className="text-3xl font-bold">{(user?.wallet?.balance || 0).toFixed(2)} د.أ</div>
            }
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 pt-4">
        <Card>
            <CardHeader>
                <CardTitle>مرحبا بك في لوحة التحكم</CardTitle>
                <CardDescription>
                هنا يمكنك متابعة مستفيديك، جدولة الجلسات، وقياس تأثيرك.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    </>
  );
}
