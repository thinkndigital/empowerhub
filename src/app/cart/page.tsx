"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";

const currency = "JOD";

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, deliveryTotal, total, updateQuantity, removeItem } = useCart();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />

      <div className="container py-8 sm:py-10 max-w-3xl">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <span className="text-border/80 select-none">/</span>
          <Link href="/market" className="hover:text-primary transition-colors">المتجر</Link>
          <span className="text-border/80 select-none">/</span>
          <span className="text-foreground font-medium">سلة المشتريات</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 flex items-center gap-2.5">
          <ShoppingCart className="h-6 w-6 text-primary" />
          سلة المشتريات {items.length > 0 && `(${items.length})`}
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
            <ShoppingCart className="h-14 w-14 opacity-30" />
            <p className="text-base">سلتك فارغة</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/market">تصفح المتجر</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-4 bg-card border border-border rounded-xl p-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                    {item.storeName && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.storeName}</p>}
                    <p className="text-primary font-bold text-sm mt-1">{item.price.toFixed(2)} {currency}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="إزالة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {item.type === 'course' ? (
                      <span className="text-xs text-muted-foreground">دورة</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.stock != null && item.quantity >= item.stock}
                          className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="ghost" asChild className="gap-1.5 text-muted-foreground">
                <Link href="/market"><ArrowRight className="h-4 w-4" />متابعة التسوق</Link>
              </Button>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3 sticky top-20">
                <h2 className="font-semibold text-foreground">ملخص الطلب</h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>المجموع الفرعي</span>
                    <span>{subtotal.toFixed(2)} {currency}</span>
                  </div>
                  {deliveryTotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>التوصيل</span>
                      <span>{deliveryTotal.toFixed(2)} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>الإجمالي</span>
                    <span className="text-primary">{total.toFixed(2)} {currency}</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={() => router.push('/checkout')}>
                  إتمام الشراء
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
