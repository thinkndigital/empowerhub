"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, MessageCircle, MapPin, Store, PackageX, PackageCheck } from "lucide-react";
import { translateCategory } from "@/lib/product-category";

export interface DetailProduct {
  id: string;
  name?: string;
  description?: string;
  price?: number | null;
  imageUrl?: string;
  image?: string;
  category?: string;
  stock?: number | null;
  deliveryCost?: number;
  location?: string;
  beneficiaryName?: string;
  storeName?: string;
  whatsapp?: string;
}

interface ProductDetailDialogProps {
  product: DetailProduct | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOrder: (product: DetailProduct) => void;
  currencySymbol?: string;
}

export function ProductDetailDialog({ product, isOpen, onOpenChange, onOrder, currencySymbol = 'د.أ' }: ProductDetailDialogProps) {
  if (!product) return null;

  const imageUrl = product.imageUrl || product.image || '';
  const name = product.name || 'منتج';
  const outOfStock = product.stock === 0;
  const sellerName = product.beneficiaryName || product.storeName;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="sr-only">{name}</DialogTitle>
        </DialogHeader>

        {/* Image */}
        <div className="relative aspect-square sm:aspect-video rounded-xl overflow-hidden bg-muted -mt-2">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className={`w-full h-full object-cover ${outOfStock ? 'opacity-50 grayscale' : ''}`}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Store className="h-10 w-10 text-muted-foreground/20" />
            </div>
          )}
          {product.category && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full px-2.5 py-1 border border-border/50">
              {translateCategory(product.category)}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-snug">{name}</h2>
            {sellerName && (
              <p className="text-xs text-muted-foreground mt-1">من: <span className="font-medium text-foreground">{sellerName}</span></p>
            )}
          </div>

          {/* Price + stock */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none">
                {product.price != null ? product.price.toLocaleString('ar') : '—'}
                <span className="text-sm font-normal text-muted-foreground mr-1">{currencySymbol}</span>
              </p>
              {product.deliveryCost != null && product.deliveryCost > 0 && (
                <p className="text-xs text-muted-foreground mt-1">+ {product.deliveryCost} {currencySymbol} رسوم توصيل</p>
              )}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${outOfStock ? 'text-destructive' : 'text-emerald-600'}`}>
              {outOfStock ? <PackageX className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
              {outOfStock
                ? 'نفذ المخزون'
                : (product.stock != null ? `متوفر (${product.stock})` : 'متوفر')}
            </div>
          </div>

          {/* Description */}
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
        </div>

        <div className="flex gap-2 pt-2">
          {product.whatsapp && (
            <a href={`https://wa.me/${product.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="h-10 w-10 shrink-0 rounded-lg border border-green-500/40 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors"
              aria-label="واتساب">
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
          <Button className="flex-1 gap-2" disabled={outOfStock} onClick={() => onOrder(product)}>
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? 'غير متاح حالياً' : 'اطلب الآن'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
