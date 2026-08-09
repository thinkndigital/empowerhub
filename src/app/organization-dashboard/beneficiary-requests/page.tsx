"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { Inbox, CheckCircle, Clock, Eye, UserCircle2 } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";

type ContactRequest = {
  id: string;
  senderId?: string;
  senderName: string;
  subject: string;
  message: string;
  status: "pending" | "resolved";
  createdAt?: string;
};

export default function BeneficiaryRequestsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ContactRequest | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/contact-requests', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setRequests(json.requests || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status !== 'resolved').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  };

  async function toggleStatus(req: ContactRequest) {
    if (!user) return;
    const nextStatus = req.status === 'resolved' ? 'pending' : 'resolved';
    setUpdating(prev => ({ ...prev, [req.id]: true }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/contact-requests', {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'فشل التحديث');
      setRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: nextStatus } : r)));
      toast({ title: nextStatus === 'resolved' ? 'تم تمييز الطلب كمُعالَج' : 'تمت إعادة فتح الطلب' });
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setUpdating(prev => ({ ...prev, [req.id]: false }));
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">طلبات المستفيدين</h1>
        <p className="text-sm text-muted-foreground">الطلبات والاستفسارات التي يرسلها المستفيدون من لوحات تحكمهم.</p>
      </div>

      <StatGrid>
        <StatCard title="إجمالي الطلبات" value={`${stats.total}`} icon={Inbox} loading={loading} />
        <StatCard title="قيد الانتظار" value={`${stats.pending}`} icon={Clock} loading={loading} active={stats.pending > 0} />
        <StatCard title="تم الحل" value={`${stats.resolved}`} icon={CheckCircle} loading={loading} />
      </StatGrid>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">الطلبات الواردة</CardTitle>
          <CardDescription>راجع الطلبات وتابع حالتها.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Inbox className="h-12 w-12 mx-auto opacity-30" />
              <p>لا توجد طلبات حالياً.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المرسل</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right"><span className="sr-only">إجراءات</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.senderId ? (
                        <Link href={`/organization-dashboard/beneficiaries/${req.senderId}`} className="hover:text-primary hover:underline">
                          {req.senderName || 'مستفيد'}
                        </Link>
                      ) : (
                        req.senderName || 'مستفيد'
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{req.subject}</Badge></TableCell>
                    <TableCell className="max-w-xs">
                      <button onClick={() => setViewing(req)} className="text-sm text-muted-foreground line-clamp-1 hover:text-foreground text-right w-full">
                        {req.message}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.createdAt ? format(new Date(req.createdAt), "d MMMM yyyy", { locale: ar }) : 'غير محدد'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'resolved' ? 'outline' : 'secondary'} className={req.status === 'resolved' ? 'text-green-600 border-green-600 text-xs' : 'text-xs'}>
                        {req.status === 'resolved' ? 'تم الحل' : 'قيد الانتظار'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.senderId && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                            <Link href={`/organization-dashboard/beneficiaries/${req.senderId}`} title="عرض ملف المستفيد">
                              <UserCircle2 className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setViewing(req)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={updating[req.id]}
                          onClick={() => toggleStatus(req)}
                        >
                          {req.status === 'resolved' ? 'إعادة فتح' : 'تمييز كمُعالَج'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.subject}</DialogTitle>
            <DialogDescription>من {viewing?.senderName || 'مستفيد'}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{viewing?.message}</p>
          <DialogFooter className="gap-2 sm:justify-between">
            {viewing?.senderId && (
              <Button variant="ghost" className="gap-1.5" asChild>
                <Link href={`/organization-dashboard/beneficiaries/${viewing.senderId}`}>
                  <UserCircle2 className="h-4 w-4" />عرض ملف المستفيد
                </Link>
              </Button>
            )}
            {viewing && (
              <Button
                variant="outline"
                disabled={updating[viewing.id]}
                onClick={() => { toggleStatus(viewing); setViewing(null); }}
              >
                {viewing.status === 'resolved' ? 'إعادة فتح' : 'تمييز كمُعالَج'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
