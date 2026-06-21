
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { OrderDialog } from "@/components/order-dialog";
import { ArrowRight, ShoppingCart, MapPin } from "lucide-react";
import { slugify } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/lib/products-data";
import { useCurrency } from "@/hooks/use-currency";


type Store = {
    id: string;
    beneficiaryId: string;
    name?: string;
    logoUrl?: string;
    beneficiaryName?: string;
    location?: string;
}

export default function StorePage({ params }: { params: { storeId: string } }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const firestore = useFirestore();
  const { symbol: currencySymbol } = useCurrency();

  // Fetch all stores to find the one matching the slug
  const allStoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'stores'));
  }, [firestore]);

  const { data: allStores, isLoading: storesLoading } = useCollection<Store>(allStoresQuery);

  const store = useMemo(() => {
    if (!allStores) return null;
    return allStores.find(s => slugify(s.name || '') === params.storeId);
  }, [allStores, params.storeId]);

  // Fetch products for the found store's beneficiary
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !store) return null;
    return query(collection(firestore, "products"), where("beneficiaryId", "==", store.beneficiaryId));
  }, [firestore, store]);

  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const loading = storesLoading || productsLoading;
  const storeName = store?.name || "متجر غير مسمى";
  const beneficiaryName = store?.beneficiaryName || "غير معروف";
  const location = store?.location || "غير محدد";

  if (loading) {
     return (
        <>
            <header className="py-4 px-6 border-b bg-card">
                 <div className="container mx-auto flex items-center justify-between">
                     <Skeleton className="h-6 w-40" />
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-48" />
                             <Skeleton className="h-4 w-24" />
                        </div>
                     </div>
                 </div>
            </header>
            <main className="container mx-auto py-8 px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-[300px]" /></CardContent></Card>
                ))}
                </div>
            </main>
        </>
     )
  }

  if (!store) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">المتجر غير موجود</h1>
            <p className="text-muted-foreground">عذراً، لا يمكننا العثور على هذا المتجر.</p>
            <Button asChild className="mt-4">
                <Link href="/market">العودة إلى المتجر العام</Link>
            </Button>
        </div>
    )
  }

  return (
    <>
      <header className="py-4 px-6 border-b bg-card">
        <div className="container mx-auto flex items-center justify-between">
            <Link href="/market" className="flex items-center gap-2 text-primary hover:underline">
                <ArrowRight className="h-4 w-4" />
                <span>العودة للمتجر العام</span>
            </Link>
            <div className="flex items-center gap-3">
                 <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${params.storeId}/40/40`} alt={beneficiaryName} />
                    <AvatarFallback>{beneficiaryName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{storeName}</h1>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>بإدارة {beneficiaryName} من {location}</span>
                  </div>
                </div>
            </div>
        </div>
      </header>
      <main className="container mx-auto py-8 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {!products || products.length === 0 ? (
                <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">لا توجد منتجات في هذا المتجر حاليًا.</p>
                </div>
            ) : products.map((product) => (
                <Card key={product.id} className="overflow-hidden group flex flex-col">
                    <CardHeader className="p-0">
                        <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} width={400} height={300} className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105" />
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                         <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">{product.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            المخزون: {product.stock}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center p-4 pt-0 mt-auto">
                        <p className="text-lg font-semibold">{product.price.toFixed(2)} {currencySymbol}</p>
                        <Button size="sm" onClick={() => setSelectedProduct(product)}>
                            <ShoppingCart className="ml-2 h-4 w-4" />
                            اطلب الآن
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </main>
      <OrderDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => {
            if(!open) setSelectedProduct(null);
        }}
      />
    </>
  );
}
