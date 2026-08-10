"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, ChevronLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { translateCategory } from "@/lib/product-category";
import { useLanguage } from "@/components/language-provider";

type Product = { id: string; name: string; category?: string; price?: number };
type Order = { id: string; status: string; total?: number; totalAmount?: number; buyerName?: string; createdAt?: string };

export default function MerchantDashboardPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? enUS : arLocale;
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
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{bi("لوحة التحكم", "Dashboard")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bi(
              `مرحباً ${userProfile?.name ? `${userProfile.name.split(' ')[0]}` : ''}! هنا نظرة سريعة على متجرك.`,
              `Welcome ${userProfile?.name ? `${userProfile.name.split(' ')[0]}` : ''}! Here's a quick look at your store.`
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border/70 rounded-lg px-3 py-2 w-fit" style={{boxShadow:'var(--shadow-xs)'}}>
          <Clock className="h-3.5 w-3.5" />
          <span>{format(new Date(), lang === 'en' ? "EEEE, d MMMM yyyy" : "EEEE، d MMMM yyyy", { locale })}</span>
        </div>
      </div>

      {/* Stats Row */}
      <StatGrid>
        <StatCard
          title={bi("إيرادات المتجر", "Store revenue")}
          value={`${revenue.toFixed(0)} ${bi('د.أ', 'JOD')}`}
          description={bi("من الطلبات المكتملة", "From completed orders")}
          icon={DollarSign}
          active
          loading={loading}
        />
        <StatCard
          title={bi("المنتجات", "Products")}
          value={`${products.length}`}
          description={bi("منتج بمتجرك", "Products in your store")}
          icon={Package}
          loading={loading}
        />
        <StatCard
          title={bi("الطلبات قيد الانتظار", "Pending orders")}
          value={`${pendingOrders}`}
          description={bi("بحاجة لمتابعة", "Need follow-up")}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatCard
          title={bi("العملاء", "Customers")}
          value={`${customersCount}`}
          description={bi("عميل فريد", "Unique customers")}
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
                <CardTitle className="text-sm font-semibold text-foreground">{bi("أحدث الطلبات", "Recent orders")}</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary hover:text-primary px-2">
                  <Link href="/merchant-dashboard/store">{bi("عرض الكل", "View all")} <ChevronLeft className="h-3 w-3 mr-1" /></Link>
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
                        <p className="font-medium text-xs text-foreground truncate">{order.buyerName || bi('عميل', 'Customer')}</p>
                        {order.createdAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(order.createdAt), 'd MMM yyyy', { locale })}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold tabular-nums">{(order.totalAmount ?? order.total ?? 0).toFixed(2)} {bi('د.أ', 'JOD')}</span>
                        <Badge variant={order.status === 'delivered' ? 'active' : order.status === 'pending' ? 'pending' : 'outline'} className="text-xs">
                          {order.status === 'delivered' ? bi('تم التسليم', 'Delivered') : order.status === 'pending' ? bi('قيد الانتظار', 'Pending') : order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{bi("لا توجد طلبات بعد.", "No orders yet.")}</p>
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
                  <CardTitle className="text-sm font-semibold text-foreground">{bi("منتجاتك", "Your products")}</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary hover:text-primary px-2">
                    <Link href="/merchant-dashboard/store">{bi("إدارة", "Manage")} <ChevronLeft className="h-3 w-3 mr-1" /></Link>
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
              <CardTitle className="text-sm font-semibold text-foreground">{bi("إجراءات سريعة", "Quick actions")}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60 col-span-2">
                <Link href="/merchant-dashboard/store"><Package className="h-3.5 w-3.5 text-primary" />{bi("إضافة منتج", "Add product")}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/merchant-dashboard/content"><ShoppingCart className="h-3.5 w-3.5 text-amber-500" />{bi("محتوى", "Content")}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 text-xs h-9 rounded-lg border-border/60">
                <Link href="/merchant-dashboard/reports"><DollarSign className="h-3.5 w-3.5 text-purple-500" />{bi("التقارير", "Reports")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
