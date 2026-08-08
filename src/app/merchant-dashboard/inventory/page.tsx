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

type Product = {
  id: string;
  name: string;
  category?: string;
  price: number;
  stock?: number;
};

const LOW_STOCK_THRESHOLD = 5;

function stockBadge(stock: number) {
  if (stock <= 0) return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />نفد المخزون</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge variant="secondary" className="text-xs gap-1 text-amber-700 bg-amber-100 hover:bg-amber-100"><AlertTriangle className="h-3 w-3" />مخزون منخفض</Badge>;
  return <Badge variant="outline" className="text-xs">متوفر</Badge>;
}

export default function MerchantInventoryPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/beneficiary/store', { headers: { authorization: `Bearer ${token}` } });
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
      toast({ variant: "destructive", title: "قيمة غير صالحة", description: "يجب أن يكون المخزون رقمًا صحيحًا موجبًا." });
      return;
    }
    setSaving(prev => ({ ...prev, [productId]: true }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/beneficiary/store', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, stock }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'فشل التحديث');
      setProducts(prev => prev.map(p => (p.id === productId ? { ...p, stock } : p)));
      setEditing(prev => { const next = { ...prev }; delete next[productId]; return next; });
      toast({ title: "تم تحديث المخزون" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setSaving(prev => ({ ...prev, [productId]: false }));
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المخزون</h1>
        <p className="text-sm text-muted-foreground">تابع كميات منتجاتك وحدّث المخزون أولاً بأول.</p>
      </div>

      <StatGrid>
        <StatCard title="إجمالي المنتجات" value={`${stats.total}`} icon={Package} loading={loading} />
        <StatCard title="نفد المخزون" value={`${stats.outOfStock}`} icon={XCircle} loading={loading} active={stats.outOfStock > 0} />
        <StatCard title="مخزون منخفض" value={`${stats.lowStock}`} icon={AlertTriangle} loading={loading} />
        <StatCard title="إجمالي القطع" value={`${stats.totalUnits}`} icon={Boxes} loading={loading} />
      </StatGrid>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">منتجاتك</CardTitle>
          <CardDescription>عدّل كمية المخزون مباشرة من الجدول.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Package className="h-12 w-12 mx-auto opacity-30" />
              <p>لا توجد منتجات بعد.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead>تنبيه</TableHead>
                  <TableHead className="text-right"><span className="sr-only">إجراءات</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => {
                  const currentStock = editing[p.id] ?? String(p.stock ?? 0);
                  const isDirty = editing[p.id] !== undefined && editing[p.id] !== String(p.stock ?? 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{translateCategory(p.category || '')}</TableCell>
                      <TableCell className="tabular-nums">{isNaN(Number(p.price)) ? '0.00' : Number(p.price).toFixed(2)} د.أ</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={currentStock}
                          onChange={e => setEditing(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="h-8 w-20 tabular-nums"
                        />
                      </TableCell>
                      <TableCell>{stockBadge(Number(currentStock) || 0)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isDirty || saving[p.id]}
                          onClick={() => saveStock(p.id)}
                          className="h-8 gap-1"
                        >
                          {saving[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          حفظ
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
