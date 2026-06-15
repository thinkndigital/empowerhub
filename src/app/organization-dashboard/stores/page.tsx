
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { DollarSign, Package, Users, BarChart } from "lucide-react";
import { slugify } from "@/lib/utils";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";


type Store = {
    id: string;
    beneficiaryId: string;
    name?: string;
    logoUrl?: string;
    beneficiaryName?: string;
    organizationId?: string;
}


export default function OrgStoresPage() {
  const firestore = useFirestore();
  const { userProfile, loading: userLoading } = useUser();

  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organizationId) return null;
    return query(collection(firestore, "stores"), where("organizationId", "==", userProfile.organizationId));
  }, [firestore, userProfile]);

  const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);

  const loading = userLoading || storesLoading;

  // Stats are reset. In a real app, this data would be aggregated or fetched.
  const stats = {
      revenue: "0",
      products: 0,
      customers: 0,
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">متاجر المستفيدين</h1>
        <p className="text-muted-foreground">
          مراقبة أداء المتاجر التي يديرها المستفيدون في منظمتك.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
         {loading && [...Array(2)].map((_, i) => (
            <Card key={i} className="flex flex-col md:flex-row">
                <div className="md:w-1/3"><Skeleton className="aspect-square h-full w-full" /></div>
                <div className="md:w-2/3 flex flex-col p-6">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                    <div className="flex-grow mt-4 grid grid-cols-3 gap-4">
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                    </div>
                    <Skeleton className="h-10 w-full mt-4" />
                </div>
            </Card>
         ))}
        {!loading && stores?.map((store) => {
          const storeName = store.name || "متجر غير مسمى";
          return (
            <Card key={store.id} className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                    <Image src={store.logoUrl || `https://picsum.photos/seed/${store.id}/400/400`} alt={storeName} width={400} height={400} className="rounded-t-lg md:rounded-r-lg md:rounded-l-none object-cover h-full" />
                </div>
                <div className="md:w-2/3 flex flex-col">
                <CardHeader>
                    <CardTitle>{storeName}</CardTitle>
                    <CardDescription>المستفيد: {store.beneficiaryName || store.beneficiaryId}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col items-center gap-1">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{stats.revenue} د.أ</span>
                        <span className="text-xs text-muted-foreground">الإيرادات</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{stats.products}</span>
                        <span className="text-xs text-muted-foreground">منتج</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{stats.customers}</span>
                        <span className="text-xs text-muted-foreground">عميل</span>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/stores/${slugify(storeName)}`}>
                            <BarChart className="ml-2 h-4 w-4" />
                            عرض المتجر
                        </Link>
                    </Button>
                </CardFooter>
                </div>
            </Card>
          )
        })}
         {!loading && (!stores || stores.length === 0) && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">لا توجد متاجر لعرضها.</p>
              </div>
          )}
      </div>
    </div>
  );
}
