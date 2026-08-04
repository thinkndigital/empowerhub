"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Package } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { translateCategory } from "@/lib/product-category";

interface StoreItem { id: string; name: string; logoUrl?: string; location?: string; beneficiaryName?: string; }
interface Product { id: string; name?: string; price?: number; category?: string; imageUrl?: string; image?: string; storeName?: string; }

export default function AdminStoresPage() {
  const { symbol } = useCurrency();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/stores').then(r => r.json()).then(d => {
      setStores(d.stores || []);
      setProducts(d.products || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المتاجر والمنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">جميع المتاجر والمنتجات في السوق</p>
        </div>
        {!loading && (
          <div className="flex gap-2">
            <Badge variant="secondary">{stores.length} متجر</Badge>
            <Badge variant="secondary">{products.length} منتج</Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="stores" dir="rtl">
        <TabsList>
          <TabsTrigger value="stores">المتاجر</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="mt-4">
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المتجر</TableHead>
                  <TableHead className="text-right">صاحب المتجر</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(3)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                ) : stores.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-16 text-muted-foreground"><Store className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد متاجر بعد.</p></TableCell></TableRow>
                ) : stores.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover rounded-lg" /> : <Store className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.beneficiaryName || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.location || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">المتجر</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-16 text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد منتجات بعد.</p></TableCell></TableRow>
                ) : products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted overflow-hidden shrink-0">
                          {(p.imageUrl || p.image)
                            ? <img src={p.imageUrl || p.image} alt={p.name || ''} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                            : <Package className="h-4 w-4 text-muted-foreground m-auto" />}
                        </div>
                        <span className="font-medium text-sm">{p.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.category ? translateCategory(p.category) : '—'}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.storeName || '—'}</TableCell>
                    <TableCell className="font-medium text-sm">{p.price != null ? `${p.price} ${symbol}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
