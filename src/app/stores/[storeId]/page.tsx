"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDialog } from "@/components/order-dialog";
import { ShoppingCart, MapPin, ArrowRight, MessageCircle, Store, Phone, Facebook, Instagram, Twitter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/use-currency";
import type { Product as LibProduct } from "@/lib/products-data";

interface StoreData {
  id: string;
  slug?: string;
  name: string;
  logoUrl: string;
  coverUrl?: string;
  beneficiaryName: string;
  location: string;
  description: string;
  phone?: string;
  whatsapp: string;
  socials?: { facebook?: string; instagram?: string; twitter?: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number | null;
  whatsapp: string;
}

export default function StorePage({ params }: { params: { storeId: string } }) {
  const { symbol: currencySymbol } = useCurrency();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LibProduct | null>(null);
  const [activeCategory, setActiveCategory] = useState('الكل');

  useEffect(() => {
    fetch(`/api/public/stores/${params.storeId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.store) { setNotFound(true); return; }
        setStore(d.store);
        setProducts(d.products || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.storeId]);

  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = activeCategory === 'الكل' ? products : products.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="border-b border-border bg-muted/30 px-4 py-6">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" dir="rtl">
        <Store className="h-16 w-16 text-muted-foreground/20" />
        <h1 className="text-2xl font-bold text-foreground">المتجر غير موجود</h1>
        <p className="text-muted-foreground">عذراً، لا يمكننا العثور على هذا المتجر.</p>
        <Button asChild variant="outline">
          <Link href="/market">العودة للمتجر العام</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Cover banner */}
      <div className="relative h-36 sm:h-48 md:h-56 w-full bg-muted overflow-hidden">
        {store.coverUrl ? (
          <img src={store.coverUrl} alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
      </div>

      {/* Store header */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 pb-6 sm:pb-8">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground py-4" aria-label="breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <span className="text-border/80 select-none">/</span>
            <Link href="/market" className="hover:text-primary transition-colors">المتجر</Link>
            <span className="text-border/80 select-none">/</span>
            <span className="text-foreground font-medium">{store.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Logo / Avatar */}
            <div className="h-20 w-20 sm:h-16 sm:w-16 -mt-10 sm:mt-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-2xl text-primary shrink-0 overflow-hidden border-4 border-background shadow-md">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : store.name[0]}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                {store.beneficiaryName && <span>بإدارة: <strong className="text-foreground">{store.beneficiaryName}</strong></span>}
                {store.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{store.location}
                  </span>
                )}
                {store.phone && (
                  <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-primary transition-colors" dir="ltr">
                    <Phone className="h-3.5 w-3.5" />{store.phone}
                  </a>
                )}
              </div>
              {store.description && <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">{store.description}</p>}

              {(store.socials?.facebook || store.socials?.instagram || store.socials?.twitter) && (
                <div className="flex items-center gap-2 mt-3">
                  {store.socials?.facebook && (
                    <a href={store.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="فيسبوك"
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                      <Facebook className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {store.socials?.instagram && (
                    <a href={store.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="انستغرام"
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {store.socials?.twitter && (
                    <a href={store.socials.twitter} target="_blank" rel="noopener noreferrer" aria-label="إكس"
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                      <Twitter className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500/40 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
                تواصل مع المتجر
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold">لا توجد منتجات في هذا المتجر حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map(product => (
              <div key={product.id}
                className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex flex-col overflow-hidden">
                {/* Image */}
                <div className="h-40 bg-muted overflow-hidden shrink-0 relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Store className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-semibold rounded-full px-2 py-0.5 border border-border/50">
                      {product.category}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  {product.stock !== null && product.stock !== undefined && (
                    <p className="text-xs text-muted-foreground mt-auto">المخزون: {product.stock}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 pb-3 pt-2 border-t border-border flex items-center justify-between gap-2">
                  <p className="font-extrabold text-base text-foreground tabular-nums leading-none">
                    {product.price?.toLocaleString('ar') ?? '—'}
                    <span className="text-xs font-normal text-muted-foreground mr-0.5">{currencySymbol}</span>
                  </p>
                  <div className="flex gap-1.5 shrink-0">
                    {product.whatsapp && (
                      <a href={`https://wa.me/${product.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        aria-label="واتساب"
                        className="h-8 w-8 rounded-lg border border-green-500/40 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Button size="sm" className="h-8 text-xs px-2.5 gap-1"
                      onClick={() => setSelectedProduct(product as unknown as LibProduct)}>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      اطلب
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrderDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={open => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}
