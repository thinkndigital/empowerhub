"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase/provider";
import { Plus, Package, Store, Save, CheckCircle, AlertCircle } from "lucide-react";

type Product = { id: string; name: string; description: string; price: number; category: string; status: string };

const productSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  description: z.string().min(5, "الوصف مطلوب"),
  price: z.coerce.number().min(0, "السعر يجب أن يكون موجباً"),
  category: z.string().min(1, "الفئة مطلوبة"),
});

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending:  { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "مُعتمد",       variant: "default"   },
  rejected: { label: "مرفوض",        variant: "destructive" },
};

const CATEGORIES = ["منتجات يدوية", "خدمات", "منتجات رقمية", "أخرى"];

export default function BeneficiaryStorePage() {
  const auth = useAuth();
  const { toast } = useToast();

  // Store fields — plain state
  const [storeId, setStoreId]       = useState<string>("");
  const [storeName, setStoreName]   = useState("");
  const [storeDesc, setStoreDesc]   = useState("");
  const [storeLoc, setStoreLoc]     = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeWa, setStoreWa]       = useState("");
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const [storeMsg, setStoreMsg] = useState<{type:'ok'|'err', text:string}|null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, category: "" },
  });

  // Load store and products once user is ready
  useEffect(() => {
    const user = auth?.currentUser;
    if (!user) return;
    let cancelled = false;

    user.getIdToken().then(token => {
      // Load store profile
      fetch('/api/store', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(json => {
          if (cancelled) return;
          if (json.store) {
            setStoreId(json.store.id || "");
            setStoreName(json.store.name || "");
            setStoreDesc(json.store.description || "");
            setStoreLoc(json.store.location || "");
            setStorePhone(json.store.phone || "");
            setStoreWa(json.store.whatsapp || "");
          }
          setStoreReady(true);
        })
        .catch(() => { if (!cancelled) setStoreReady(true); });

      // Load products
      setProductsLoading(true);
      fetch('/api/store/products', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(json => { if (!cancelled) setProducts(json.products || []); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setProductsLoading(false); });
    });

    return () => { cancelled = true; };
  }, [auth]);

  async function handleSaveStore() {
    const user = auth?.currentUser;
    setStoreMsg(null);
    if (!user) {
      setStoreMsg({ type: 'err', text: 'يجب تسجيل الدخول أولاً' });
      return;
    }
    if (!storeName.trim()) {
      setStoreMsg({ type: 'err', text: 'اسم المتجر مطلوب' });
      return;
    }

    setStoreSaving(true);
    try {
      const token = await user.getIdToken();
      const body = { name: storeName, description: storeDesc, location: storeLoc, phone: storePhone, whatsapp: storeWa };

      const res = await fetch('/api/store', {
        method: storeId ? 'PUT' : 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(storeId ? { id: storeId, ...body } : body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحفظ');

      if (!storeId && json.id) setStoreId(json.id);
      setStoreMsg({ type: 'ok', text: 'تم حفظ معلومات متجرك بنجاح ✓' });
    } catch (e: any) {
      setStoreMsg({ type: 'err', text: e.message });
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleAddProduct(values: z.infer<typeof productSchema>) {
    const user = auth?.currentUser;
    if (!user) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/products', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل إضافة المنتج');

      toast({ title: "تم إضافة المنتج ✓", description: "سيتم مراجعة منتجك قريباً." });
      productForm.reset();
      setDialogOpen(false);
      setProducts(prev => [{ id: json.id, ...values, status: 'pending' } as Product, ...prev]);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">متجري</h1>
        <p className="text-muted-foreground text-sm">أدر متجرك ومنتجاتك هنا.</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList>
          <TabsTrigger value="store"><Store className="h-4 w-4 ml-1" />إعداد المتجر</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 ml-1" />المنتجات</TabsTrigger>
        </TabsList>

        {/* ── Store Setup ── */}
        <TabsContent value="store" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">معلومات المتجر</CardTitle>
              <CardDescription>أدخل معلومات متجرك ثم اضغط الزر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <>
                  <div className="space-y-2">
                    <Label>اسم المتجر <span className="text-red-500">*</span></Label>
                    <Input placeholder="مثال: إبداعات سارة" value={storeName} onChange={e => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>وصف المتجر</Label>
                    <Textarea placeholder="وصف موجز عن متجرك..." rows={3} value={storeDesc} onChange={e => setStoreDesc(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الموقع</Label>
                      <Input placeholder="مثال: عمّان" value={storeLoc} onChange={e => setStoreLoc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input dir="ltr" placeholder="+962 7..." value={storePhone} onChange={e => setStorePhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم واتساب</Label>
                    <Input dir="ltr" placeholder="+962 7..." value={storeWa} onChange={e => setStoreWa(e.target.value)} />
                  </div>
                  {storeMsg && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${storeMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {storeMsg.type === 'ok' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                      {storeMsg.text}
                    </div>
                  )}
                  <Button
                    onClick={handleSaveStore}
                    disabled={storeSaving}
                    className="mt-2"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {storeSaving ? "جاري الحفظ..." : storeId ? "تحديث المتجر" : "إنشاء المتجر"}
                  </Button>
              </>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Products ── */}
        <TabsContent value="products" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{productsLoading ? "..." : `${products.length} منتج`}</p>
            <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) productForm.reset(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ml-2" />إضافة منتج</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة منتج جديد</DialogTitle>
                </DialogHeader>
                <Form {...productForm}>
                  <form id="product-form" onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-4 py-2">
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
                        <FormControl><Textarea placeholder="وصف مختصر..." rows={3} {...field} /></FormControl>
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
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </form>
                </Form>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">إلغاء</Button>
                  </DialogClose>
                  <Button type="submit" form="product-form" disabled={submitting}>
                    {submitting ? "جارٍ الإضافة..." : "إضافة المنتج"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Package className="h-12 w-12 mx-auto opacity-40" />
              <p>لا توجد منتجات بعد. أضف أول منتج لك!</p>
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
                    <CardContent className="flex-1 space-y-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                      <p className="text-lg font-bold text-primary">{Number(product.price).toFixed(2)} د.أ</p>
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
