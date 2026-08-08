"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { ClipboardList, MoreHorizontal, Truck, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";

type Order = {
  id: string;
  productName: string;
  buyerName: string;
  totalAmount?: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: any;
};

const statusMap: Record<Order['status'], { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { text: "قيد الانتظار", variant: "secondary" },
  shipped: { text: "تم الشحن", variant: "default" },
  delivered: { text: "تم التوصيل", variant: "outline" },
  cancelled: { text: "ملغي", variant: "destructive" },
};

export default function MerchantOrdersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/beneficiary/store', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setOrders(json.orders || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  };

  async function updateStatus(orderId: string, status: Order['status']) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/beneficiary/store', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status, _collection: 'orders' }),
      });
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
      toast({ title: "تم تحديث حالة الطلب", description: statusMap[status].text });
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الطلب." });
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الطلبات</h1>
        <p className="text-sm text-muted-foreground">إدارة الطلبات الواردة على منتجاتك.</p>
      </div>

      <StatGrid>
        <StatCard title="إجمالي الطلبات" value={`${stats.total}`} icon={ClipboardList} loading={loading} />
        <StatCard title="قيد الانتظار" value={`${stats.pending}`} icon={ClipboardList} loading={loading} active={stats.pending > 0} />
        <StatCard title="تم التوصيل" value={`${stats.delivered}`} icon={CheckCircle} loading={loading} />
        <StatCard title="الإيرادات المكتملة" value={`${stats.revenue.toFixed(2)} د.أ`} icon={DollarSign} loading={loading} />
      </StatGrid>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">الطلبات الواردة</CardTitle>
          <CardDescription>إدارة الطلبات الجديدة على منتجاتك.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <ClipboardList className="h-12 w-12 mx-auto opacity-30" />
              <p>لا توجد طلبات حالية.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الزبون</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right"><span className="sr-only">الإجراءات</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.productName}</TableCell>
                    <TableCell>{order.buyerName || 'غير محدد'}</TableCell>
                    <TableCell className="tabular-nums">{(order.totalAmount ?? 0).toFixed(2)} د.أ</TableCell>
                    <TableCell>
                      {order.createdAt
                        ? format(new Date(order.createdAt._seconds ? order.createdAt._seconds * 1000 : order.createdAt), "d MMMM yyyy", { locale: ar })
                        : 'غير محدد'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[order.status]?.variant} className={order.status === 'delivered' ? 'text-green-600 border-green-600' : ''}>
                        {statusMap[order.status]?.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>تغيير الحالة</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'shipped')}><Truck className="ml-2 h-4 w-4" />تمييز كـ تم الشحن</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'delivered')}><CheckCircle className="ml-2 h-4 w-4" />تمييز كـ تم التوصيل</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => updateStatus(order.id, 'cancelled')}><XCircle className="ml-2 h-4 w-4" />إلغاء الطلب</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
