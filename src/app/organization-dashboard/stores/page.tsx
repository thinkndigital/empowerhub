"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { CheckCircle, XCircle, Package, Store, ShoppingCart, TrendingUp, MapPin, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StoreData = {
  id: string;
  name: string;
  location?: string;
  beneficiaryName?: string;
  beneficiaryId?: string;
  organizationId?: string;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  userId: string;
  userName?: string;
  storeId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
};

type Order = {
  id: string;
  productId?: string;
  productName?: string;
  storeId?: string;
  buyerName?: string;
  total?: number;
  status?: string;
  createdAt?: string;
};

type StoreWithStats = StoreData & {
  productCount: number;
  revenue: number;
  products: Product[];
  orders: Order[];
};

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending:  { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "مُعتمد",       variant: "default"   },
  rejected: { label: "مرفوض",        variant: "destructive" },
};

export default function OrgStoresPage() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreWithStats[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreWithStats | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/org/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('فشل تحميل البيانات');
      const json = await res.json();

      const rawStores: StoreData[] = json.stores || [];
      const products: Product[] = json.products || [];
      const orders: Order[] = json.orders || [];

      setAllProducts(products);
      setAllOrders(orders);

      const storesWithStats: StoreWithStats[] = rawStores.map(store => {
        const storeProducts = products.filter(p => p.userId === store.beneficiaryId || p.storeId === store.id);
        const storeOrders = orders.filter(o => o.storeId === store.id);
        const revenue = storeOrders
          .filter(o => o.status === 'delivered' || o.status === 'مكتمل')
          .reduce((sum, o) => sum + (o.total || 0), 0);
        return {
          ...store,
          productCount: storeProducts.length,
          revenue,
          products: storeProducts,
          orders: storeOrders,
        };
      });

      setStores(storesWithStats);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateProductStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    setUpdating(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/products', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل تحديث الحالة');
      }
      toast({ title: status === 'approved' ? "تمت الموافقة" : "تم الرفض" });
      // Update local state
      setAllProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      setStores(prev => prev.map(s => ({
        ...s,
        products: s.products.map(p => p.id === id ? { ...p, status } : p),
      })));
      if (selectedStore) {
        setSelectedStore(prev => prev ? {
          ...prev,
          products: prev.products.map(p => p.id === id ? { ...p, status } : p),
        } : null);
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const isLoading = userLoading || loading;

  // Summary stats
  const totalStores = stores.length;
  const totalProducts = allProducts.length;
  const totalRevenue = allOrders
    .filter(o => o.status === 'delivered' || o.status === 'مكتمل')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المتاجر والمنتجات</h1>
        <p className="text-muted-foreground text-sm">إدارة متاجر المستفيدين ومنتجاتهم وطلباتهم في منظمتك.</p>
      </div>

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المتاجر</p>
                <p className="text-2xl font-bold">{totalStores}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} د.أ</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stores Grid */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
        </div>
      )}

      {!isLoading && stores.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Store className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد متاجر بعد.</p>
        </div>
      )}

      {!isLoading && stores.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map(store => (
            <Card
              key={store.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedStore(store)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    {store.name}
                  </CardTitle>
                </div>
                {store.location && (
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" /> {store.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {store.beneficiaryName && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" /> {store.beneficiaryName}
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Package className="h-3 w-3" /> {store.productCount} منتج
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-xs text-green-700 border-green-300">
                    <TrendingUp className="h-3 w-3" /> {store.revenue.toFixed(0)} د.أ
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedStore(store)}>
                  عرض التفاصيل
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Store Detail Dialog */}
      <Dialog open={!!selectedStore} onOpenChange={(open) => !open && setSelectedStore(null)}>
        <DialogContent dir="rtl" className="sm:max-w-[90vw] md:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedStore?.beneficiaryName && `المستفيد: ${selectedStore.beneficiaryName}`}
              {selectedStore?.location && ` | الموقع: ${selectedStore.location}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="products">
            <TabsList className="w-full">
              <TabsTrigger value="products" className="flex-1">
                المنتجات ({selectedStore?.products.length || 0})
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex-1">
                الطلبات ({selectedStore?.orders.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-4">
              {(selectedStore?.products.length || 0) === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد منتجات</p>
              ) : (
                <div className="space-y-3">
                  {selectedStore?.products.map(product => {
                    const cfg = statusConfig[product.status] || statusConfig.pending;
                    const isPending = product.status === 'pending';
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category} — {product.price?.toFixed(2)} د.أ</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={updating === product.id}
                                onClick={() => updateProductStatus(product.id, 'approved')}
                              >
                                <CheckCircle className="h-3 w-3 ml-1" /> موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                disabled={updating === product.id}
                                onClick={() => updateProductStatus(product.id, 'rejected')}
                              >
                                <XCircle className="h-3 w-3 ml-1" /> رفض
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              {(selectedStore?.orders.length || 0) === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right hidden md:table-cell">المشتري</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStore?.orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm">{order.productName || '—'}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{order.buyerName || '—'}</TableCell>
                        <TableCell className="text-sm">{order.total?.toFixed(2) || '—'} د.أ</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'delivered' || order.status === 'مكتمل' ? 'default' : 'secondary'} className="text-xs">
                            {order.status || 'قيد المعالجة'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
