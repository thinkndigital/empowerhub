"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { Package, AlertTriangle, XCircle, Boxes, Save, Loader2 } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { translateCategory } from "@/lib/product-category";
import { useLanguage } from "@/components/language-provider";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock?: number;
  status: string;
};

const STATUS_AR: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending: { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "مُعتمد", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
};
const STATUS_EN: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending: { label: "Pending review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const LOW_STOCK_THRESHOLD = 5;

function stockBadge(stock: number, lang: 'ar' | 'en') {
  if (stock <= 0) return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />{lang === 'en' ? 'Out of stock' : 'نفد المخزون'}</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge variant="secondary" className="text-xs gap-1 text-amber-700 bg-amber-100 hover:bg-amber-100"><AlertTriangle className="h-3 w-3" />{lang === 'en' ? 'Low stock' : 'مخزون منخفض'}</Badge>;
  return <Badge variant="outline" className="text-xs">{lang === 'en' ? 'In stock' : 'متوفر'}</Badge>;
}

export default function BeneficiaryInventoryPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const STATUS = lang === 'en' ? STATUS_EN : STATUS_AR;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/products', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setProducts(json.products || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: products.length,
    outOfStock: products.filter(p => (p.stock ?? 0) <= 0).length,
    lowStock: products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length,
    totalUnits: products.reduce((sum, p) => sum + (p.stock ?? 0), 0),
  };

  async function saveStock(productId: string) {
    if (!user) return;
    const value = editing[productId];
    if (value === undefined) return;
    const stock = Number(value);
    if (isNaN(stock) || stock < 0) {
      toast({ variant: "destructive", title: bi("قيمة غير صالحة", "Invalid value"), description: bi("يجب أن يكون المخزون رقمًا صحيحًا موجبًا.", "Stock must be a positive whole number.") });
      return;
    }
    setSaving(prev => ({ ...prev, [productId]: true }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/products', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, stock }),
      });
      if (!res.ok) throw new Error((await res.json()).error || bi('فشل التحديث', 'Update failed'));
      setProducts(prev => prev.map(p => (p.id === productId ? { ...p, stock } : p)));
      setEditing(prev => { const next = { ...prev }; delete next[productId]; return next; });
      toast({ title: bi("تم تحديث المخزون", "Stock updated") });
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
    } finally {
      setSaving(prev => ({ ...prev, [productId]: false }));
    }
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("المخزون", "Inventory")}</h1>
        <p className="text-sm text-muted-foreground">{bi("تابع كميات منتجاتك وحدّث المخزون أولاً بأول.", "Track your product quantities and keep stock up to date.")}</p>
      </div>

      <StatGrid>
        <StatCard title={bi("إجمالي المنتجات", "Total products")} value={`${stats.total}`} icon={Package} loading={loading} />
        <StatCard title={bi("نفد المخزون", "Out of stock")} value={`${stats.outOfStock}`} icon={XCircle} loading={loading} active={stats.outOfStock > 0} />
        <StatCard title={bi("مخزون منخفض", "Low stock")} value={`${stats.lowStock}`} icon={AlertTriangle} loading={loading} />
        <StatCard title={bi("إجمالي القطع", "Total units")} value={`${stats.totalUnits}`} icon={Boxes} loading={loading} />
      </StatGrid>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{bi("منتجاتك", "Your products")}</CardTitle>
          <CardDescription>{bi("عدّل كمية المخزون مباشرة من الجدول.", "Edit stock quantities directly from the table.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Package className="h-12 w-12 mx-auto opacity-30" />
              <p>{bi("لا توجد منتجات بعد.", "No products yet.")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{bi("المنتج", "Product")}</TableHead>
                  <TableHead>{bi("الفئة", "Category")}</TableHead>
                  <TableHead>{bi("السعر", "Price")}</TableHead>
                  <TableHead>{bi("الحالة", "Status")}</TableHead>
                  <TableHead>{bi("المخزون", "Stock")}</TableHead>
                  <TableHead>{bi("تنبيه", "Alert")}</TableHead>
                  <TableHead className="text-right"><span className="sr-only">{bi("إجراءات", "Actions")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => {
                  const cfg = STATUS[p.status] || STATUS.pending;
                  const currentStock = editing[p.id] ?? String(p.stock ?? 0);
                  const isDirty = editing[p.id] !== undefined && editing[p.id] !== String(p.stock ?? 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{translateCategory(p.category)}</TableCell>
                      <TableCell className="tabular-nums">{isNaN(Number(p.price)) ? '0.00' : Number(p.price).toFixed(2)} {bi('د.أ', 'JOD')}</TableCell>
                      <TableCell><Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge></TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={currentStock}
                          onChange={e => setEditing(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="h-8 w-20 tabular-nums"
                        />
                      </TableCell>
                      <TableCell>{stockBadge(Number(currentStock) || 0, lang)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isDirty || saving[p.id]}
                          onClick={() => saveStock(p.id)}
                          className="h-8 gap-1"
                        >
                          {saving[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {bi('حفظ', 'Save')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
