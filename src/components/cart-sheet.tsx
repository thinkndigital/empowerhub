"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { CartCheckoutDialog } from "@/components/cart-checkout-dialog";

export function CartSheet() {
  const { items, count, subtotal, deliveryTotal, total, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const currency = "JOD";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label="سلة المشتريات"
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -left-1 h-4.5 min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
            {count}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col w-full sm:max-w-md" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              سلة المشتريات {count > 0 && `(${count})`}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-40" />
              <p className="text-sm">سلتك فارغة</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 py-2">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 bg-muted/40 rounded-xl p-2.5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                      {item.storeName && <p className="text-xs text-muted-foreground line-clamp-1">{item.storeName}</p>}
                      <p className="text-primary font-bold text-sm mt-0.5">{item.price.toFixed(2)} {currency}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
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
                            className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.stock != null && item.quantity >= item.stock}
                            className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <SheetFooter className="flex-col gap-3 sm:flex-col border-t pt-4">
                <div className="w-full space-y-1 text-sm">
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
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>الإجمالي</span>
                    <span className="text-primary">{total.toFixed(2)} {currency}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => { setOpen(false); setCheckoutOpen(true); }}
                >
                  إتمام الشراء
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CartCheckoutDialog isOpen={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
