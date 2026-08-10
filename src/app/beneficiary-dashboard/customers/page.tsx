"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Phone, MapPin, RefreshCw, Search, ShoppingBag, Repeat, Download, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/firebase/auth/use-user";
import { useCurrency } from "@/hooks/use-currency";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { useLanguage } from "@/components/language-provider";

interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  totalAmount: number;
  productPrice: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: string;
}

interface Customer {
  key: string;
  name: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
}

export default function BeneficiaryCustomersPage() {
  const { user } = useUser();
  const { symbol: currencySymbol } = useCurrency();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/beneficiary/orders', { headers: { authorization: `Bearer ${token}` } });
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const key = (o.buyerPhone || o.buyerName || '').trim() || o.id;
      const amount = o.totalAmount || o.productPrice || 0;
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += amount;
        if (!existing.address && o.buyerAddress) existing.address = o.buyerAddress;
        if (o.createdAt && (!existing.lastOrderAt || new Date(o.createdAt) > new Date(existing.lastOrderAt))) {
          existing.lastOrderAt = o.createdAt;
        }
      } else {
        map.set(key, {
          key,
          name: o.buyerName || bi('غير معروف', 'Unknown'),
          phone: o.buyerPhone || '',
          address: o.buyerAddress || '',
          ordersCount: 1,
          totalSpent: amount,
          lastOrderAt: o.createdAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastOrderAt || 0).getTime() - new Date(a.lastOrderAt || 0).getTime());
  }, [orders]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const stats = {
    total: customers.length,
    repeat: customers.filter(c => c.ordersCount > 1).length,
    revenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  };

  const exportHeaders = [bi("اسم العميل", "Customer name"), bi("الهاتف", "Phone"), bi("العنوان", "Address"), bi("عدد الطلبات", "Orders"), bi(`إجمالي الإنفاق (${currencySymbol})`, `Total spent (${currencySymbol})`), bi("آخر طلب", "Last order")];
  const exportRows = filtered.map(c => [
    c.name,
    c.phone || '—',
    c.address || '—',
    c.ordersCount,
    c.totalSpent.toFixed(2),
    c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  ]);

  const handleExportExcel = () => {
    exportToExcel(bi('عملاء_متجري', 'my-store-customers'), exportHeaders, exportRows, { sheetName: bi('العملاء', 'Customers') });
  };

  const handleExportPDF = () => {
    exportToPDF(bi('قائمة العملاء - متجري', 'My Store — Customers'), exportHeaders, exportRows, {
      summary: {
        [bi('إجمالي العملاء', 'Total customers')]: String(stats.total),
        [bi('عملاء متكررون', 'Repeat customers')]: String(stats.repeat),
        [bi('إجمالي المبيعات', 'Total sales')]: `${stats.revenue.toFixed(2)} ${currencySymbol}`,
      },
    });
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("العملاء", "Customers")}</h1>
          <p className="text-muted-foreground text-sm">{bi("قائمة العملاء الذين طلبوا من متجرك", "Customers who've ordered from your store")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {bi("تحديث", "Refresh")}
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={loading || filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            {bi("تصدير Excel", "Export Excel")}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={loading || filtered.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            {bi("طباعة/PDF", "Print/PDF")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: bi('إجمالي العملاء', 'Total customers'), value: stats.total, icon: Users, color: 'text-primary' },
          { label: bi('عملاء متكررون', 'Repeat customers'), value: stats.repeat, icon: Repeat, color: 'text-blue-500' },
          { label: bi('إجمالي المبيعات', 'Total sales'), value: `${stats.revenue.toFixed(0)} ${currencySymbol}`, icon: ShoppingBag, color: 'text-emerald-500' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className={`${s.color} mb-1`}><s.icon className="h-5 w-5" /></div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <Input
          placeholder={bi("بحث بالاسم أو رقم الهاتف...", "Search by name or phone number...")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{bi("جاري التحميل...", "Loading...")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg">{bi("لا يوجد عملاء بعد", "No customers yet")}</p>
          <p className="text-sm">{bi("سيظهر عملاؤك هنا عند ورود طلبات جديدة", "Your customers will show up here once new orders come in")}</p>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{bi("العميل", "Customer")}</TableHead>
                    <TableHead className="text-right">{bi("الهاتف", "Phone")}</TableHead>
                    <TableHead className="text-right">{bi("العنوان", "Address")}</TableHead>
                    <TableHead className="text-right">{bi("عدد الطلبات", "Orders")}</TableHead>
                    <TableHead className="text-right">{bi("إجمالي الإنفاق", "Total spent")}</TableHead>
                    <TableHead className="text-right">{bi("آخر طلب", "Last order")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
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
                        <Badge variant={c.ordersCount > 1 ? 'default' : 'secondary'} className="text-xs">
                          {c.ordersCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-primary">{c.totalSpent.toFixed(2)} {currencySymbol}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
