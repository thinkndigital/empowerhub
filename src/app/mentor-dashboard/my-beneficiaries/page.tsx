"use client";

import { useState, useEffect, useCallback } from "react";
import { MoreHorizontal, Download, Calendar, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Beneficiary = {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  progress?: number;
  status?: string;
  category?: string;
};

export default function MyBeneficiariesPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [beneficiaryToView, setBeneficiaryToView] = useState<Beneficiary | null>(null);

  const fetchBeneficiaries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/org/users?role=beneficiary&scope=all&mentorId=${user.uid}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBeneficiaries(json.users || []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);

  const handleExport = () => {
    toast({ title: "جاري تصدير قائمة المستفيدين...", description: "سيتم تنزيل ملف CSV قريبًا." });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>المستفيدون</CardTitle>
              <CardDescription>قائمة المستفيدين الذين تشرف على إرشادهم.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                <TableHead>التقدم</TableHead>
                <TableHead className="hidden md:table-cell">آخر جلسة</TableHead>
                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {!loading && beneficiaries?.map((b) => {
                const userName = b.name || 'مستفيد بلا اسم';
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={b.avatarUrl} alt={userName} />
                          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{b.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={b.progress || 0} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{b.progress || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">لم تحدد</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => setBeneficiaryToView(b)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض الملف الشخصي
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/mentor-dashboard/sessions">
                              <Calendar className="ml-2 h-4 w-4" />
                              جدولة جلسة جديدة
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/mentor-dashboard/messages">
                              <MessageSquare className="ml-2 h-4 w-4" />
                              إرسال رسالة
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && (!beneficiaries || beneficiaries.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">لا يوجد مستفيدون معينون لك.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!beneficiaryToView} onOpenChange={(open) => !open && setBeneficiaryToView(null)}>
        <DialogContent dir="rtl" className="sm:max-w-[90vw] md:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>الملف الشخصي للمستفيد</DialogTitle>
            <DialogDescription>تفاصيل المستفيد {beneficiaryToView?.name || 'بلا اسم'}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={beneficiaryToView?.avatarUrl} alt={beneficiaryToView?.name || ''} />
              <AvatarFallback>{beneficiaryToView?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{beneficiaryToView?.name || 'مستفيد بلا اسم'}</h3>
              <p className="text-muted-foreground">{beneficiaryToView?.email || 'لا يوجد بريد إلكتروني'}</p>
            </div>
            <div className="text-right space-y-2 border-t pt-4">
              <p><strong>الفئة:</strong> {beneficiaryToView?.category || 'غير محدد'}</p>
              <p><strong>الحالة:</strong> <Badge variant={beneficiaryToView?.status === "نشط" ? "default" : "secondary"}>{beneficiaryToView?.status || 'غير محدد'}</Badge></p>
              <div className="space-y-1">
                <p><strong>التقدم العام:</strong></p>
                <div className="flex items-center gap-2">
                  <Progress value={beneficiaryToView?.progress || 0} className="h-2" />
                  <span className="text-xs font-medium text-muted-foreground">{beneficiaryToView?.progress || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
