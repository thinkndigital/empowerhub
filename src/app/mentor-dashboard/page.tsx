'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Star, DollarSign, ArrowUpRight, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

type Session = { id: string; title: string; date: string; status: string; attendees: string[] };
type Beneficiary = { id: string; name?: string; progress?: number };

const StatCard = ({ title, value, sub, icon, trend, color, loading }: {
  title: string, value: string | React.ReactNode, sub: string, icon: React.ReactNode, trend?: string, color: string, loading?: boolean
}) => (
  <Card className="card-hover border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>{icon}</div>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-8 w-20 mb-1" /> : <div className="text-2xl font-bold">{value}</div>}
      <div className="flex items-center gap-1 mt-1">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && <span className="text-xs text-primary flex items-center"><ArrowUpRight className="h-3 w-3" />{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

export default function MentorDashboardPage() {
  const { user: authUser } = useUser();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [benefLoading, setBenefLoading] = useState(true);

  const fetchBeneficiaries = useCallback(async () => {
    if (!authUser) return;
    setBenefLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${authUser.uid}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBeneficiaries(json.users || []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setBenefLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);

  const upcomingSessions: Session[] = [];
  const sessLoading = false;
  const loading = benefLoading;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المرشد</h1>
          <p className="text-muted-foreground">أدواتك لمتابعة المستفيدين، جدولة الجلسات، وقياس تأثيرك.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">مرشد معتمد</Badge>
      </div>

      <div className="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المستفيدين"
          value={beneficiaries?.length || 0}
          sub="مستفيد نشط"
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-primary"
          loading={benefLoading}
        />
        <StatCard
          title="الجلسات القادمة"
          value={upcomingSessions.length}
          sub="جلسة مجدولة"
          icon={<Calendar className="h-5 w-5 text-white" />}
          color="bg-accent"
          loading={sessLoading}
        />
        <StatCard
          title="متوسط التقدم"
          value={beneficiaries && beneficiaries.length > 0
            ? `${Math.round(beneficiaries.reduce((s, b) => s + ((b as any).progress || 0), 0) / beneficiaries.length)}%`
            : '0%'}
          sub="نسبة إنجاز المستفيدين"
          icon={<Star className="h-5 w-5 text-white" />}
          color="bg-amber-500"
          loading={benefLoading}
        />
        <StatCard
          title="إجمالي الأرباح"
          value="0.00 د.أ"
          sub="رصيد المحفظة"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* Upcoming sessions */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">الجلسات القادمة</CardTitle>
                <CardDescription>جلسات الإرشاد المجدولة</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/mentor-dashboard/sessions">إدارة الجلسات</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد جلسات قادمة. <Link href="/mentor-dashboard/sessions" className="text-primary underline">جدولة جلسة</Link></p>
            )}
          </CardContent>
        </Card>

        {/* Beneficiaries sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">مستفيدوني</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                  <Link href="/mentor-dashboard/my-beneficiaries">عرض الكل</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              {!benefLoading && (beneficiaries || []).slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{(b.name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={(b as any).progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{(b as any).progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {!benefLoading && (!beneficiaries || beneficiaries.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد مستفيدون بعد.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/sessions"><Calendar className="h-3 w-3" />الجلسات</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/messages"><MessageSquare className="h-3 w-3" />الرسائل</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/my-beneficiaries"><Users className="h-3 w-3" />المستفيدون</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-start gap-1">
                <Link href="/mentor-dashboard/analytics"><CheckCircle2 className="h-3 w-3" />التحليلات</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
