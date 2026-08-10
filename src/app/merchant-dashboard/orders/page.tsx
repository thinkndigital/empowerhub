"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/language-provider";
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

const statusMapEn: Record<Order['status'], { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { text: "Pending", variant: "secondary" },
  shipped: { text: "Shipped", variant: "default" },
  delivered: { text: "Delivered", variant: "outline" },
  cancelled: { text: "Cancelled", variant: "destructive" },
};

export default function MerchantOrdersPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? enUS : arLocale;
  const tStatusMap = lang === 'en' ? statusMapEn : statusMap;
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
      toast({ title: bi("تم تحديث حالة الطلب", "Order status updated"), description: tStatusMap[status].text });
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل تحديث حالة الطلب.", "Failed to update order status.") });
    }
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("الطلبات", "Orders")}</h1>
        <p className="text-sm text-muted-foreground">{bi("إدارة الطلبات الواردة على منتجاتك.", "Manage incoming orders for your products.")}</p>
      </div>

      <StatGrid>
        <StatCard title={bi("إجمالي الطلبات", "Total orders")} value={`${stats.total}`} icon={ClipboardList} loading={loading} />
        <StatCard title={bi("قيد الانتظار", "Pending")} value={`${stats.pending}`} icon={ClipboardList} loading={loading} active={stats.pending > 0} />
        <StatCard title={bi("تم التوصيل", "Delivered")} value={`${stats.delivered}`} icon={CheckCircle} loading={loading} />
        <StatCard title={bi("الإيرادات المكتملة", "Completed revenue")} value={`${stats.revenue.toFixed(2)} ${bi('د.أ', 'JOD')}`} icon={DollarSign} loading={loading} />
      </StatGrid>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{bi("الطلبات الواردة", "Incoming orders")}</CardTitle>
          <CardDescription>{bi("إدارة الطلبات الجديدة على منتجاتك.", "Manage new orders for your products.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <ClipboardList className="h-12 w-12 mx-auto opacity-30" />
              <p>{bi("لا توجد طلبات حالية.", "No current orders.")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{bi("المنتج", "Product")}</TableHead>
                  <TableHead>{bi("الزبون", "Customer")}</TableHead>
                  <TableHead>{bi("الإجمالي", "Total")}</TableHead>
                  <TableHead>{bi("تاريخ الطلب", "Order date")}</TableHead>
                  <TableHead>{bi("الحالة", "Status")}</TableHead>
                  <TableHead className="text-right"><span className="sr-only">{bi("الإجراءات", "Actions")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.productName}</TableCell>
                    <TableCell>{order.buyerName || bi('غير محدد', 'Not specified')}</TableCell>
                    <TableCell className="tabular-nums">{(order.totalAmount ?? 0).toFixed(2)} {bi('د.أ', 'JOD')}</TableCell>
                    <TableCell>
                      {order.createdAt
                        ? format(new Date(order.createdAt._seconds ? order.createdAt._seconds * 1000 : order.createdAt), "d MMMM yyyy", { locale })
                        : bi('غير محدد', 'Not specified')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tStatusMap[order.status]?.variant} className={order.status === 'delivered' ? 'text-green-600 border-green-600' : ''}>
                        {tStatusMap[order.status]?.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{bi("تغيير الحالة", "Change status")}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'shipped')}><Truck className="ml-2 h-4 w-4" />{bi("تمييز كـ تم الشحن", "Mark as shipped")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'delivered')}><CheckCircle className="ml-2 h-4 w-4" />{bi("تمييز كـ تم التوصيل", "Mark as delivered")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => updateStatus(order.id, 'cancelled')}><XCircle className="ml-2 h-4 w-4" />{bi("إلغاء الطلب", "Cancel order")}</DropdownMenuItem>
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
