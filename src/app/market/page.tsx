"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { OrderDialog } from "@/components/order-dialog";
import { ShoppingCart, MapPin, Search, Store, Star, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    return allProducts.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery]);

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
        {!loading && (
          <p className="text-sm text-muted-foreground mb-6">
            {filteredProducts.length} منتج متاح
            {searchQuery && <span> لـ "<strong>{searchQuery}</strong>"</span>}
          </p>
        )}

        <div>
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

          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
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
                        {product.beneficiaryName && (
                          <p>من: <span className="font-semibold text-primary">{product.beneficiaryName}</span></p>
                        )}
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
                    <CardFooter className="flex justify-between items-center p-4 pt-0 border-t mt-2 gap-2">
                      <p className="text-lg font-bold text-primary">
                        {product.price != null ? product.price.toFixed(2) : '—'}{' '}
                        <span className="text-sm font-normal text-muted-foreground">ر.س</span>
                      </p>
                      <div className="flex gap-2">
                        {product.whatsapp && (
                          <Button size="sm" variant="outline" className="gap-1.5 border-green-500 text-green-600 hover:bg-green-50" asChild>
                            <a href={`https://wa.me/${(product.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-4 w-4" />
                              واتساب
                            </a>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setSelectedProduct(product as unknown as LibProduct)} className="gap-1.5">
                          <ShoppingCart className="h-4 w-4" />
                          اطلب
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
              ))}
            </div>
          )}

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
