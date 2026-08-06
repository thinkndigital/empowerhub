"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Users, Phone, MapPin, RefreshCw, Search, ShoppingCart, Repeat, Download, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/firebase/auth/use-user";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

type Order = {
  id: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  totalAmount?: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: any;
};

type Customer = {
  key: string;
  name: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: Date;
};

function toDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value._seconds) return new Date(value._seconds * 1000);
  return new Date(value);
}

export default function CustomersPage() {
  const { user: authUser, loading: authLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setIsLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/beneficiary/store', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setOrders(json.orders || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) fetchData();
  }, [authLoading, authUser, fetchData]);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const key = (o.buyerPhone || o.buyerName || '').trim() || o.id;
      const amount = o.totalAmount || 0;
      const orderDate = toDate(o.createdAt);
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += amount;
        if (!existing.address && o.buyerAddress) existing.address = o.buyerAddress;
        if (orderDate && (!existing.lastOrderAt || orderDate > existing.lastOrderAt)) existing.lastOrderAt = orderDate;
      } else {
        map.set(key, {
          key,
          name: o.buyerName || 'غير محدد',
          phone: o.buyerPhone || '',
          address: o.buyerAddress || '',
          ordersCount: 1,
          totalSpent: amount,
          lastOrderAt: orderDate,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.lastOrderAt?.getTime() || 0) - (a.lastOrderAt?.getTime() || 0));
  }, [orders]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const stats = {
    total: customers.length,
    repeat: customers.filter(c => c.ordersCount > 1).length,
    revenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  };

  const exportHeaders = ["اسم العميل", "الهاتف", "العنوان", "عدد الطلبات", "إجمالي الإنفاق (د.أ)", "آخر طلب"];
  const exportRows = filtered.map(c => [
    c.name,
    c.phone || '—',
    c.address || '—',
    c.ordersCount,
    c.totalSpent.toFixed(2),
    c.lastOrderAt ? format(c.lastOrderAt, "d MMMM yyyy", { locale: ar }) : '—',
  ]);

  const handleExportExcel = () => {
    exportToExcel('عملاء_متجري', exportHeaders, exportRows, { sheetName: 'العملاء' });
  };

  const handleExportPDF = () => {
    exportToPDF('قائمة العملاء - متجري', exportHeaders, exportRows, {
      summary: {
        'إجمالي العملاء': String(stats.total),
        'عملاء متكررون': String(stats.repeat),
        'إجمالي المبيعات': `${stats.revenue.toFixed(2)} د.أ`,
      },
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">العملاء</h1>
          <p className="text-muted-foreground">قائمة العملاء الذين طلبوا من متجرك.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || filtered.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة/PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center mb-3"><Users className="h-5 w-5 text-white" /></div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.total}</div>}
            <p className="text-xs text-muted-foreground mt-1">إجمالي العملاء</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center mb-3"><Repeat className="h-5 w-5 text-white" /></div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.repeat}</div>}
            <p className="text-xs text-muted-foreground mt-1">عملاء متكررون</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center mb-3"><ShoppingCart className="h-5 w-5 text-white" /></div>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stats.revenue.toFixed(2)} د.أ</div>}
            <p className="text-xs text-muted-foreground mt-1">إجمالي المبيعات</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <Input
          placeholder="بحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>عدد الطلبات</TableHead>
                <TableHead>إجمالي الإنفاق</TableHead>
                <TableHead>آخر طلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center">جاري التحميل...</TableCell></TableRow>}
              {!isLoading && filtered.map(c => (
                <TableRow key={c.key}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell dir="ltr">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-primary">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        {c.phone}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[220px]">
                    {c.address ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.ordersCount > 1 ? 'default' : 'secondary'}>{c.ordersCount}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{c.totalSpent.toFixed(2)} د.أ</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.lastOrderAt ? format(c.lastOrderAt, "d MMMM yyyy", { locale: ar }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center h-24">لا يوجد عملاء بعد.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
