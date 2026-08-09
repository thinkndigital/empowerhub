"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/hooks/use-toast";
import { translateCategory } from "@/lib/product-category";
import {
  ArrowRight, ShoppingBag, ShoppingCart, MessageCircle, MapPin,
  Store, PackageX, PackageCheck, Loader2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  deliveryCost?: number;
  category?: string;
  imageUrl?: string;
  stock?: number | null;
  whatsapp?: string;
  location?: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  organizationId?: string;
  storeId?: string;
  storeName?: string;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/products/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      setProduct(data.product);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const outOfStock = product?.stock === 0;

  const addToCart = () => {
    if (!product || !product.beneficiaryId) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price || 0,
      deliveryCost: product.deliveryCost || 0,
      imageUrl: product.imageUrl,
      storeId: product.storeId || '',
      storeName: product.storeName || product.beneficiaryName || '',
      beneficiaryId: product.beneficiaryId,
      organizationId: product.organizationId || '',
      stock: product.stock ?? undefined,
    });
  };

  const handleAddToCart = () => {
    addToCart();
    toast({ title: 'أُضيف للسلة', description: product?.name });
  };

  const handleBuyNow = () => {
    if (!product) return;
    setBuyingNow(true);
    addToCart();
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
          <h1 className="text-xl font-bold text-foreground">المنتج غير موجود</h1>
          <Button asChild variant="outline">
            <Link href="/market"><ArrowRight className="h-4 w-4 ml-2" />العودة للمتجر</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sellerName = product.beneficiaryName || product.storeName;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />

      <div className="container py-8 sm:py-10">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <span className="text-border/80 select-none">/</span>
          <Link href="/market" className="hover:text-primary transition-colors">المتجر</Link>
          <span className="text-border/80 select-none">/</span>
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`w-full h-full object-cover ${outOfStock ? 'opacity-50 grayscale' : ''}`}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Store className="h-14 w-14 text-muted-foreground/20" />
              </div>
            )}
            {product.category && (
              <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full px-2.5 py-1 border border-border/50">
                {translateCategory(product.category)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">{product.name}</h1>
              {sellerName && (
                <p className="text-sm text-muted-foreground mt-1.5">من: <span className="font-medium text-foreground">{sellerName}</span></p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-3xl font-extrabold text-foreground tabular-nums leading-none">
                  {product.price != null ? product.price.toLocaleString('ar') : '—'}
                  <span className="text-base font-normal text-muted-foreground mr-1.5">د.أ</span>
                </p>
                {!!product.deliveryCost && (
                  <p className="text-xs text-muted-foreground mt-1.5">+ {product.deliveryCost} د.أ رسوم توصيل</p>
                )}
              </div>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${outOfStock ? 'text-destructive' : 'text-emerald-600'}`}>
                {outOfStock ? <PackageX className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                {outOfStock ? 'نفذ المخزون' : (product.stock != null ? `متوفر (${product.stock})` : 'متوفر')}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">الوصف والمواصفات</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{product.location}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              {product.whatsapp && (
                <a href={`https://wa.me/${product.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="h-11 w-11 shrink-0 rounded-lg border border-green-500/40 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors"
                  aria-label="واتساب">
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
              {!outOfStock && product.beneficiaryId && (
                <Button variant="outline" size="lg" className="gap-2" onClick={handleAddToCart}>
                  <ShoppingBag className="h-4 w-4" />أضف للسلة
                </Button>
              )}
              <Button size="lg" className="flex-1 gap-2" disabled={outOfStock || buyingNow} onClick={handleBuyNow}>
                {buyingNow ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {outOfStock ? 'غير متاح حالياً' : 'اشتر الآن'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
