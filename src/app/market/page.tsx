
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { OrderDialog } from "@/components/order-dialog";
import { ShoppingCart, MapPin, Search, Store, SlidersHorizontal, Star } from "lucide-react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/products-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MarketPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "products"));
  }, [firestore]);

  const { data: allProducts, isLoading: loading } = useCollection<Product>(productsQuery);

  const categories = useMemo(() => {
    if (!allProducts) return [];
    return Array.from(new Set(allProducts.map(p => p.category || "متفرقات")));
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !activeCategory || (p.category || "متفرقات") === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchQuery, activeCategory]);

  const productsByCategory = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const category = product.category || "متفرقات";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <div>
              <span className="text-lg font-bold gradient-text">EmpowerHub</span>
              <span className="text-muted-foreground text-sm mr-1">| المتجر</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/">الرئيسية</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild>
              <Link href="/register">ابدأ مجاناً</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-14 text-center">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">المتجر العام</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            اكتشف منتجات فريدة ومصنوعة بحب من قبل المستفيدين في برنامج التمكين.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن منتج..."
              className="pr-10 bg-card shadow-sm border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="container mx-auto py-10 px-4">
        {/* Category Filters */}
        {!loading && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="rounded-full"
            >
              الكل
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Results info */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} منتج متاح
              {searchQuery && <span> لـ "<strong>{searchQuery}</strong>"</span>}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>ترتيب حسب: الأحدث</span>
            </div>
          </div>
        )}

        <div className="space-y-12">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && Object.entries(productsByCategory).map(([category, products]) => (
            <section key={category}>
              <div className="flex items-center gap-3 mb-6 border-b pb-3">
                <h2 className="text-2xl font-bold">{category}</h2>
                <Badge variant="secondary">{products.length} منتج</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="card-hover overflow-hidden flex flex-col border-0 shadow-md">
                    <div className="relative overflow-hidden">
                      <Image
                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`}
                        alt={product.name}
                        width={400}
                        height={300}
                        className="object-cover w-full h-48 transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs">
                          {product.category || "متفرقات"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="font-bold text-base mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>من: <span className="font-semibold text-primary">{product.beneficiaryName}</span></p>
                        {product.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{product.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                          ))}
                          <span className="text-xs">(4.8)</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center p-4 pt-0 border-t mt-2">
                      <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">د.أ</span></p>
                      <Button size="sm" onClick={() => setSelectedProduct(product)} className="gap-1.5">
                        <ShoppingCart className="h-4 w-4" />
                        اطلب الآن
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground">
                {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : "لم يتم إضافة أي منتجات بعد."}
              </p>
              {searchQuery && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                  مسح البحث
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12 bg-card">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold gradient-text">EmpowerHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            جميع المنتجات مصنوعة بحب من قبل مستفيدي برنامج التمكين © 2024
          </p>
        </div>
      </footer>

      <OrderDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}
