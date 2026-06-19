"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { Plus, ShoppingBag, Package, Store, Save } from "lucide-react";

type Store = { id: string; name: string; description?: string; location?: string; phone?: string; whatsapp?: string };
type Product = { id: string; name: string; description: string; price: number; category: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string };

const storeSchema = z.object({
  name: z.string().min(2, "اسم المتجر مطلوب (حرفان على الأقل)"),
  description: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  description: z.string().min(5, "الوصف مطلوب"),
  price: z.coerce.number().min(0, "السعر يجب أن يكون موجباً"),
  category: z.string().min(1, "الفئة مطلوبة"),
});

type StoreForm = z.infer<typeof storeSchema>;
type ProductForm = z.infer<typeof productSchema>;

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending:  { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "مُعتمد",       variant: "default"   },
  rejected: { label: "مرفوض",        variant: "destructive" },
};

const categories = [
  { value: "منتجات يدوية", label: "منتجات يدوية" },
  { value: "خدمات",        label: "خدمات" },
  { value: "منتجات رقمية", label: "منتجات رقمية" },
  { value: "أخرى",         label: "أخرى" },
];

export default function BeneficiaryStorePage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeSaving, setStoreSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const storeForm = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: "", description: "", location: "", phone: "", whatsapp: "" },
  });

  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, category: "" },
  });

  const getToken = async () => {
    if (!user) throw new Error('غير مسجل');
    return user.getIdToken();
  };

  const fetchStore = useCallback(async () => {
    if (!user) return;
    setStoreLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.store) {
        setStore(json.store);
        storeForm.reset(json.store);
      }
    } catch { /* silent */ } finally { setStoreLoading(false); }
  }, [user, storeForm]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setProductsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/products', { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('فشل تحميل المنتجات');
      const json = await res.json();
      setProducts(json.products || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setProductsLoading(false); }
  }, [user, toast]);

  useEffect(() => { fetchStore(); fetchProducts(); }, [fetchStore, fetchProducts]);

  const onSaveStore = async (values: StoreForm) => {
    setStoreSaving(true);
    try {
      const token = await getToken();
      let res;
      if (store?.id) {
        res = await fetch('/api/store', {
          method: 'PUT',
          headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: store.id, ...values }),
        });
      } else {
        res = await fetch('/api/store', {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل حفظ المتجر');
      }
      const json = await res.json();
      if (!store?.id && json.id) {
        setStore({ id: json.id, ...values });
      } else {
        setStore(prev => prev ? { ...prev, ...values } : null);
      }
      toast({ title: "تم الحفظ", description: "تم حفظ معلومات متجرك بنجاح." });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setStoreSaving(false); }
  };

  const onAddProduct = async (values: ProductForm) => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/store/products', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل إضافة المنتج');
      }
      toast({ title: "تم إضافة المنتج", description: "سيتم مراجعة منتجك قريباً." });
      productForm.reset();
      setDialogOpen(false);
      fetchProducts();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" /> متجري
          </h1>
          <p className="text-muted-foreground text-sm">أدر متجرك ومنتجاتك وخدماتك هنا.</p>
        </div>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="mb-4">
          <TabsTrigger value="store" className="flex items-center gap-1"><Store className="h-4 w-4" />إعداد المتجر</TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1"><Package className="h-4 w-4" />المنتجات</TabsTrigger>
        </TabsList>

        {/* Store Setup Tab */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">معلومات المتجر</CardTitle>
              <CardDescription>أدخل معلومات متجرك الأساسية</CardDescription>
            </CardHeader>
            <CardContent>
              {storeLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Form {...storeForm}>
                  <form onSubmit={storeForm.handleSubmit(onSaveStore)} className="space-y-4">
                    <FormField control={storeForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المتجر <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="مثال: إبداعات سارة" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={storeForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف المتجر</FormLabel>
                        <FormControl><Textarea placeholder="وصف موجز عن متجرك وما تقدمه..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={storeForm.control} name="location" render={({ field }) => (
                        <FormItem>
                          <FormLabel>الموقع (المدينة)</FormLabel>
                          <FormControl><Input placeholder="مثال: عمّان" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={storeForm.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl><Input dir="ltr" placeholder="+962 7..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={storeForm.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم واتساب</FormLabel>
                        <FormControl><Input dir="ltr" placeholder="+962 7..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={storeSaving} className="w-full sm:w-auto">
                      <Save className="h-4 w-4 ml-2" />
                      {storeSaving ? "جاري الحفظ..." : store?.id ? "تحديث المتجر" : "إنشاء المتجر"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{productsLoading ? "..." : `${products.length} منتج`}</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ml-2" />إضافة منتج</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة منتج جديد</DialogTitle>
                </DialogHeader>
                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(onAddProduct)} className="space-y-4">
                    <FormField control={productForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المنتج</FormLabel>
                        <FormControl><Input placeholder="مثال: حقيبة يدوية" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف</FormLabel>
                        <FormControl><Textarea placeholder="وصف مختصر للمنتج..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر (د.أ)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter className="gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); productForm.reset(); }}>إلغاء</Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "جارٍ الإضافة..." : "إضافة المنتج"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد منتجات بعد. أضف أول منتج لك!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => {
                const cfg = statusConfig[product.status] || statusConfig.pending;
                return (
                  <Card key={product.id} className="border-0 shadow-sm flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">{product.name}</CardTitle>
                        <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
                      </div>
                      <CardDescription className="text-xs">{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                      <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} د.أ</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
