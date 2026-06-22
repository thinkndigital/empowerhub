"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/logo";
import { OrderDialog } from "@/components/order-dialog";
import { ShoppingCart, Search, Store, MessageCircle, ArrowLeft, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Product as LibProduct } from "@/lib/products-data";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  beneficiaryName?: string;
  location?: string;
  whatsapp?: string;
  stock?: number;
  beneficiaryId?: string;
}

export default function MarketPage() {
  const [selectedProduct, setSelectedProduct] = useState<LibProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("الكل");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/stores');
        if (res.ok) {
          const json = await res.json();
          setAllProducts((json.products || []) as Product[]);
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))) as string[];
    return ["الكل", ...cats];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (activeCategory !== "الكل") {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allProducts, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      <SiteHeader />

      <main>

        {/* ── Page Header ─────────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 border-b border-border bg-muted/30">
          <div className="container">
            <div className="max-w-2xl">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
                <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                <span className="text-border/80 select-none">/</span>
                <span className="text-foreground font-medium">المتجر</span>
              </nav>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">متجر المجتمع</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
                منتجات صنعها مجتمعنا
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                اكتشف منتجات فريدة ومصنوعة بحب من مستفيدي برنامج التمكين. كل عملية شراء تدعم رحلة صاحبها نحو الاستقلالية.
              </p>
              <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="ابحث عن منتج..."
                  className="pr-10 h-11 bg-card"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Filters + Grid ──────────────────────────────────────────────────── */}
        <div className="container py-8 sm:py-10">

          {/* Category filter pills */}
          {!loading && categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Result count */}
          {!loading && (
            <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
              {filteredProducts.length > 0
                ? `${filteredProducts.length} منتج`
                : 'لا توجد نتائج'}
              {searchQuery && (
                <span> لـ &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;</span>
              )}
            </p>
          )}

          {/* ─ Skeleton ─ */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border bg-card">
                  <div className="h-40 sm:h-48 bg-muted animate-pulse" />
                  <div className="p-3 sm:p-4 space-y-2.5">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-full" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─ Product Grid ─ */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-48 bg-muted overflow-hidden shrink-0">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Store className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {product.category && (
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-[10px] sm:text-xs font-semibold rounded-full px-2 py-0.5 border border-border/50">
                        {product.category}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3 sm:p-4 flex flex-col gap-1 flex-grow">
                    <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
                    )}
                    <div className="mt-auto pt-1.5 flex flex-col gap-0.5">
                      {product.beneficiaryName && (
                        <p className="text-xs text-muted-foreground">
                          من: <span className="font-medium text-foreground">{product.beneficiaryName}</span>
                        </p>
                      )}
                      {product.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {product.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <p className="font-extrabold text-base sm:text-lg text-foreground tabular-nums leading-none">
                      {product.price != null ? product.price.toLocaleString('ar') : '—'}
                      <span className="text-xs font-normal text-muted-foreground mr-0.5">ر.س</span>
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                      {product.whatsapp && (
                        <a
                          href={`https://wa.me/${product.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="تواصل واتساب"
                          className="h-8 w-8 rounded-lg border border-green-500/40 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors shrink-0"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        size="sm"
                        className="h-8 text-xs px-2.5 sm:px-3 gap-1"
                        onClick={() => setSelectedProduct(product as unknown as LibProduct)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">اطلب</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─ Empty state ─ */}
          {!loading && filteredProducts.length === 0 && (
            <div className="py-20 sm:py-28 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
                <Store className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : 'لا توجد منتجات بعد'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'جرّب كلمة بحث مختلفة أو تصفح فئة أخرى' : 'كن أول من يضيف منتجه في المتجر'}
              </p>
              {searchQuery ? (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>مسح البحث</Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/register">أضف منتجك الآن <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t py-10 bg-card mt-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold text-sm text-foreground">EmpowerHub</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            جميع المنتجات من مستفيدي برنامج التمكين © 2024
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">تسجيل الدخول</Link>
            <Link href="/register" className="hover:text-foreground transition-colors flex items-center gap-1">
              ابدأ مجاناً <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </footer>

      <OrderDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={open => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}
