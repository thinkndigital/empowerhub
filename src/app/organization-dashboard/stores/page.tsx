"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { CheckCircle, XCircle, Package } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type FilterTab = 'all' | 'pending' | 'approved';

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending:  { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "مُعتمد",       variant: "default"   },
  rejected: { label: "مرفوض",        variant: "destructive" },
};

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'جميع المنتجات' },
  { key: 'pending',  label: 'قيد المراجعة'  },
  { key: 'approved', label: 'مُعتمد'        },
];

export default function OrgStoresPage() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/products?scope=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('فشل تحميل المنتجات');
      const json = await res.json();
      setProducts(json.products || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
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
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const isLoading = userLoading || loading;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">منتجات المستفيدين</h1>
        <p className="text-muted-foreground text-sm">راجع وأدر المنتجات المقدمة من المستفيدين في منظمتك.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="mr-2 text-xs bg-muted rounded-full px-1.5 py-0.5">
                {products.filter(p => p.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد منتجات في هذا القسم.</p>
        </div>
      )}

      {!isLoading && filteredProducts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => {
            const cfg = statusConfig[product.status] || statusConfig.pending;
            const isPending = product.status === 'pending';
            return (
              <Card key={product.id} className="border-0 shadow-sm flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{product.name}</CardTitle>
                    <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {product.category} — {product.userName || 'مستفيد'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                  <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} د.أ</p>
                </CardContent>
                {isPending && (
                  <CardFooter className="gap-2 pt-0">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={updating === product.id}
                      onClick={() => updateStatus(product.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" /> موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      disabled={updating === product.id}
                      onClick={() => updateStatus(product.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 ml-1" /> رفض
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
