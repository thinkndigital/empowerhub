"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, MapPin, MessageCircle, Store, Phone, Facebook, Instagram, Twitter, PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/use-currency";
import { translateCategory } from "@/lib/product-category";
import { useLanguage } from "@/components/language-provider";

const PRODUCT_CATEGORY_LABELS_EN: Record<string, string> = {
  'الكل': 'All',
  'مصنوعات يدوية': 'Handmade goods',
  'طعام ومشروبات': 'Food & beverages',
  'ملابس وأزياء': 'Clothing & fashion',
  'حرف يدوية': 'Handicrafts',
  'خدمات': 'Services',
  'منتجات زراعية': 'Agricultural products',
  'منزل وديكور': 'Home & decor',
  'أخرى': 'Other',
};

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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const categoryLabel = (c: string) => (lang === 'en' ? (PRODUCT_CATEGORY_LABELS_EN[c] || c) : c);
  const { symbol: currencySymbol } = useCurrency();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

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

  const categories = ['الكل', ...Array.from(new Set(products.map(p => translateCategory(p.category)).filter(Boolean)))];
  const filtered =(activeCategory === 'الكل' ? products : products.filter(p => translateCategory(p.category) === activeCategory))
    .slice()
    .sort((a, b) => {
      if (sortOrder === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
      if (sortOrder === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <div className="border-b border-border bg-muted/30 px-4 py-6">
          <div className="container flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="container py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" dir={dir}>
        <Store className="h-16 w-16 text-muted-foreground/20" />
        <h1 className="text-2xl font-bold text-foreground">{bi('المتجر غير موجود', 'Store not found')}</h1>
        <p className="text-muted-foreground">{bi('عذراً، لا يمكننا العثور على هذا المتجر.', "Sorry, we couldn't find this store.")}</p>
        <Button asChild variant="outline">
          <Link href="/market">{bi('العودة للمتجر العام', 'Back to the marketplace')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Cover banner */}
      <div className="relative h-32 sm:h-40 w-full bg-muted overflow-hidden">
        {store.coverUrl ? (
          <img src={store.coverUrl} alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Store header — minimal, monochrome */}
      <div className="border-b border-border">
        <div className="container pb-6 sm:pb-8">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground py-4" aria-label="breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">{bi('الرئيسية', 'Home')}</Link>
            <span className="text-border select-none">/</span>
            <Link href="/market" className="hover:text-foreground transition-colors">{bi('المتجر', 'Store')}</Link>
            <span className="text-border select-none">/</span>
            <span className="text-foreground">{store.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Logo / Avatar */}
            <div className="h-16 w-16 -mt-10 sm:mt-0 rounded-xl bg-muted flex items-center justify-center font-semibold text-xl text-foreground shrink-0 overflow-hidden border-4 border-background shadow-sm">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : store.name[0]}
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">{store.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                {store.beneficiaryName && <span>{bi('بإدارة', 'Managed by')} {store.beneficiaryName}</span>}
                {store.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{store.location}
                  </span>
                )}
                {store.phone && (
                  <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-foreground transition-colors" dir="ltr">
                    <Phone className="h-3.5 w-3.5" />{store.phone}
                  </a>
                )}
              </div>
              {store.description && <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">{store.description}</p>}

              {(store.socials?.facebook || store.socials?.instagram || store.socials?.twitter) && (
                <div className="flex items-center gap-2 mt-3">
                  {store.socials?.facebook && (
                    <a href={store.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label={bi('فيسبوك', 'Facebook')}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                      <Facebook className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {store.socials?.instagram && (
                    <a href={store.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label={bi('انستغرام', 'Instagram')}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {store.socials?.twitter && (
                    <a href={store.socials.twitter} target="_blank" rel="noopener noreferrer" aria-label={bi('إكس', 'X')}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
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
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
                {bi('تواصل مع المتجر', 'Contact the store')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10">

          {/* Category filter — plain text links, Medusa-style */}
          {categories.length > 1 && (
            <aside className="lg:sticky lg:top-6 lg:w-44 shrink-0">
              <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-x-5 gap-y-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 text-sm text-right whitespace-nowrap transition-colors ${
                      activeCategory === cat
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {categoryLabel(cat)}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          {/* Grid + toolbar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {activeCategory === 'الكل' ? bi('كل المنتجات', 'All products') : categoryLabel(activeCategory)}
              </h2>
              {products.length > 1 && (
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="h-8 w-auto border-0 shadow-none text-xs text-muted-foreground gap-1 px-2 hover:text-foreground focus:ring-0">
                    <SelectValue placeholder={bi('الترتيب', 'Sort')} />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="default">{bi('الأحدث', 'Newest')}</SelectItem>
                    <SelectItem value="price-asc">{bi('السعر: الأقل أولاً', 'Price: low to high')}</SelectItem>
                    <SelectItem value="price-desc">{bi('السعر: الأعلى أولاً', 'Price: high to low')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground rounded-xl border border-dashed border-border">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">{bi('لا توجد منتجات في هذا المتجر حالياً', 'No products in this store yet')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                {filtered.map(product => {
                  const outOfStock = product.stock === 0;
                  return (
                    <div key={product.id} className="group">
                      {/* Image — padded frame, shadow-elevation on hover, Medusa-style */}
                      <Link
                        href={`/market/${product.id}`}
                        aria-label={bi(`عرض تفاصيل ${product.name}`, `View details for ${product.name}`)}
                        className="relative block w-full aspect-[3/4] rounded-xl bg-muted/60 p-2.5 shadow-sm group-hover:shadow-md transition-shadow duration-200 text-right"
                      >
                        <div className="relative w-full h-full rounded-lg overflow-hidden bg-background">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name}
                              className={`absolute inset-0 w-full h-full object-cover ${outOfStock ? 'opacity-50 grayscale' : ''}`}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Store className="h-8 w-8 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        {outOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex items-center gap-1.5 bg-foreground/90 text-background text-xs font-bold rounded-full px-3 py-1">
                              <PackageX className="h-3.5 w-3.5" />{bi('نفذ المخزون', 'Out of stock')}
                            </span>
                          </div>
                        )}
                        {/* Quick order — hidden until hover, keeps ordering one tap away without cluttering the grid */}
                        {!outOfStock && (
                          <span
                            className="absolute bottom-4 left-4 h-9 w-9 rounded-full bg-background text-foreground shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </span>
                        )}
                      </Link>

                      {/* Body */}
                      <Link href={`/market/${product.id}`} className="mt-3 flex items-baseline justify-between gap-2 w-full text-right">
                        <span className="text-sm text-muted-foreground line-clamp-1">{product.name}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                          {product.price?.toLocaleString(lang === 'en' ? 'en-US' : 'ar') ?? '—'} {currencySymbol}
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
