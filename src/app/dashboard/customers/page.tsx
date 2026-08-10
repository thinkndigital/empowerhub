"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { Users, Phone, MapPin, RefreshCw, Search, ShoppingCart, Repeat, Download, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/firebase/auth/use-user";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { useLanguage } from "@/components/language-provider";

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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? enUS : arLocale;
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
          name: o.buyerName || bi('غير محدد', 'Not specified'),
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

  const exportHeaders = lang === 'en'
    ? ["Customer name", "Phone", "Address", "Order count", "Total spent (JOD)", "Last order"]
    : ["اسم العميل", "الهاتف", "العنوان", "عدد الطلبات", "إجمالي الإنفاق (د.أ)", "آخر طلب"];
  const exportRows = filtered.map(c => [
    c.name,
    c.phone || '—',
    c.address || '—',
    c.ordersCount,
    c.totalSpent.toFixed(2),
    c.lastOrderAt ? format(c.lastOrderAt, "d MMMM yyyy", { locale }) : '—',
  ]);

  const handleExportExcel = () => {
    exportToExcel(bi('عملاء_متجري', 'my_store_customers'), exportHeaders, exportRows, { sheetName: bi('العملاء', 'Customers') });
  };

  const handleExportPDF = () => {
    exportToPDF(bi('قائمة العملاء - متجري', 'Customer list - My store'), exportHeaders, exportRows, {
      summary: {
        [bi('إجمالي العملاء', 'Total customers')]: String(stats.total),
        [bi('عملاء متكررون', 'Repeat customers')]: String(stats.repeat),
        [bi('إجمالي المبيعات', 'Total sales')]: `${stats.revenue.toFixed(2)} ${bi('د.أ', 'JOD')}`,
      },
    });
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("العملاء", "Customers")}</h1>
          <p className="text-muted-foreground">{bi("قائمة العملاء الذين طلبوا من متجرك.", "List of customers who have ordered from your store.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {bi("تحديث", "Refresh")}
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            {bi("تصدير Excel", "Export Excel")}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || filtered.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            {bi("طباعة/PDF", "Print/PDF")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center mb-3"><Users className="h-5 w-5 text-white" /></div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.total}</div>}
            <p className="text-xs text-muted-foreground mt-1">{bi("إجمالي العملاء", "Total customers")}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center mb-3"><Repeat className="h-5 w-5 text-white" /></div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.repeat}</div>}
            <p className="text-xs text-muted-foreground mt-1">{bi("عملاء متكررون", "Repeat customers")}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center mb-3"><ShoppingCart className="h-5 w-5 text-white" /></div>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stats.revenue.toFixed(2)} {bi('د.أ', 'JOD')}</div>}
            <p className="text-xs text-muted-foreground mt-1">{bi("إجمالي المبيعات", "Total sales")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <Input
          placeholder={bi("بحث بالاسم أو رقم الهاتف...", "Search by name or phone number...")}
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
                <TableHead>{bi("العميل", "Customer")}</TableHead>
                <TableHead>{bi("الهاتف", "Phone")}</TableHead>
                <TableHead>{bi("العنوان", "Address")}</TableHead>
                <TableHead>{bi("عدد الطلبات", "Order count")}</TableHead>
                <TableHead>{bi("إجمالي الإنفاق", "Total spent")}</TableHead>
                <TableHead>{bi("آخر طلب", "Last order")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center">{bi("جاري التحميل...", "Loading...")}</TableCell></TableRow>}
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
                  <TableCell className="font-semibold">{c.totalSpent.toFixed(2)} {bi('د.أ', 'JOD')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.lastOrderAt ? format(c.lastOrderAt, "d MMMM yyyy", { locale }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center h-24">{bi("لا يوجد عملاء بعد.", "No customers yet.")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
