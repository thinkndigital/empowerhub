"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, ChevronLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { translateCategory } from "@/lib/product-category";

type Product = { id: string; name: string; category?: string; price?: number };
type Order = { id: string; status: string; total?: number; totalAmount?: number; buyerName?: string; createdAt?: string };

export default function MerchantDashboardPage() {
  const { user: authUser, userProfile, loading: authLoading } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/beneficiary/store', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setProducts(json.products || []);
      setOrders(json.orders || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) fetchData();
  }, [authLoading, authUser, fetchData]);

  const revenue = useMemo(
    () => orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0),
    [orders]
  );
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
  const customersCount = useMemo(() => new Set(orders.map(o => o.buyerName).filter(Boolean)).size, [orders]);
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5),
    [orders]
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مرحباً {userProfile?.name ? `${userProfile.name.split(' ')[0]}` : ''}! هنا نظرة سريعة على متجرك.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border/70 rounded-lg px-3 py-2 w-fit" style={{boxShadow:'var(--shadow-xs)'}}>
          <Clock className="h-3.5 w-3.5" />
          <span>{format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}</span>
        </div>
      </div>

      {/* Stats Row */}
      <StatGrid>
        <StatCard
          title="إيرادات المتجر"
          value={`${revenue.toFixed(0)} د.أ`}
          description="من الطلبات المكتملة"
          icon={DollarSign}
          active
          loading={loading}
        />
        <StatCard
          title="المنتجات"
          value={`${products.length}`}
          description="منتج بمتجرك"
          icon={Package}
          loading={loading}
        />
        <StatCard
          title="الطلبات قيد الانتظار"
          value={`${pendingOrders}`}
          description="بحاجة لمتابعة"
          icon={ShoppingCart}
          loading={loading}
        />
        <StatCard
          title="العملاء"
          value={`${customersCount}`}
          description="عميل فريد"
          icon={Users}
          loading={loading}
        />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">أحدث الطلبات</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary hover:text-primary px-2">
                  <Link href="/merchant-dashboard/store">عرض الكل <ChevronLeft className="h-3 w-3 mr-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
              ) : recentOrders.length > 0 ? (
                <div className="flex flex-col divide-y divide-border/50">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-foreground truncate">{order.buyerName || 'عميل'}</p>
                        {order.createdAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(order.createdAt), 'd MMM yyyy', { locale: ar })}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold tabular-nums">{(order.totalAmount ?? order.total ?? 0).toFixed(2)} د.أ</span>
                        <Badge variant={order.status === 'delivered' ? 'active' : order.status === 'pending' ? 'pending' : 'outline'} className="text-xs">
                          {order.status === 'delivered' ? 'تم التسليم' : order.status === 'pending' ? 'قيد الانتظار' : order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد طلبات بعد.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top Products */}
          {products.length > 0 && (
            <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">منتجاتك</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary hover:text-primary px-2">
                    <Link href="/merchant-dashboard/store">إدارة <ChevronLeft className="h-3 w-3 mr-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                {products.slice(0, 4).map(product => (
                  <div key={product.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium line-clamp-1 text-foreground">{product.name}</span>
                    {product.category && <Badge variant="outline" className="text-xs py-0 border-border/60 shrink-0">{translateCategory(product.category)}</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-card border border-border/70 rounded-xl" style={{boxShadow:'var(--shadow-xs)'}}>
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60 col-span-2">
                <Link href="/merchant-dashboard/store"><Package className="h-3.5 w-3.5 text-primary" />إضافة منتج</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/merchant-dashboard/content"><ShoppingCart className="h-3.5 w-3.5 text-amber-500" />محتوى</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/merchant-dashboard/reports"><DollarSign className="h-3.5 w-3.5 text-purple-500" />التقارير</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
