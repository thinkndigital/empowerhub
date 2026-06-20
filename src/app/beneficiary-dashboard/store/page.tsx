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
import { useUser } from "@/firebase/auth/use-user";
import { Plus, Package, Store, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Product = { id: string; name: string; description: string; price: number; category: string; status: string };

const productSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  description: z.string().min(5, "الوصف مطلوب"),
  price: z.coerce.number().min(0, "السعر يجب أن يكون موجباً"),
  category: z.string().min(1, "الفئة مطلوبة"),
});

const STATUS: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending:  { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "مُعتمد",       variant: "default"   },
  rejected: { label: "مرفوض",        variant: "destructive" },
};

const CATS = ["منتجات يدوية", "خدمات", "منتجات رقمية", "أخرى"];

export default function BeneficiaryStorePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [storeId, setStoreId]       = useState("");
  const [storeName, setStoreName]   = useState("");
  const [storeDesc, setStoreDesc]   = useState("");
  const [storeLoc, setStoreLoc]     = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeWa, setStoreWa]       = useState("");
  const [storeLoading, setStoreLoading]   = useState(true);
  const [storeSaving, setStoreSaving]     = useState(false);
  const [storeStatus, setStoreStatus]     = useState<{ ok: boolean; msg: string } | null>(null);

  const [products, setProducts]         = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, category: "" },
  });

  // Fetch store + products whenever the authenticated user becomes available
  useEffect(() => {
    if (!user) return;
    let alive = true;

    async function load() {
      const token = await user!.getIdToken();
      const headers = { authorization: `Bearer ${token}` };

      setStoreLoading(true);
      setProductsLoading(true);

      const [storeRes, prodRes] = await Promise.all([
        fetch('/api/store', { headers }).catch(() => null),
        fetch('/api/store/products', { headers }).catch(() => null),
      ]);

      if (!alive) return;

      if (storeRes?.ok) {
        const j = await storeRes.json();
        if (j.store) {
          setStoreId(j.store.id || "");
          setStoreName(j.store.name || "");
          setStoreDesc(j.store.description || "");
          setStoreLoc(j.store.location || "");
          setStorePhone(j.store.phone || "");
          setStoreWa(j.store.whatsapp || "");
        }
      }
      setStoreLoading(false);

      if (prodRes?.ok) {
        const j = await prodRes.json();
        setProducts(j.products || []);
      }
      setProductsLoading(false);
    }

    load().catch(() => { setStoreLoading(false); setProductsLoading(false); });
    return () => { alive = false; };
  }, [user]);

  async function handleSaveStore() {
    setStoreStatus(null);
    if (!user) { setStoreStatus({ ok: false, msg: 'يجب تسجيل الدخول أولاً' }); return; }
    if (!storeName.trim()) { setStoreStatus({ ok: false, msg: 'اسم المتجر مطلوب' }); return; }

    setStoreSaving(true);
    try {
      const token = await user.getIdToken();
      const body = { name: storeName.trim(), description: storeDesc, location: storeLoc, phone: storePhone, whatsapp: storeWa };
      const res = await fetch('/api/store', {
        method: storeId ? 'PUT' : 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(storeId ? { id: storeId, ...body } : body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحفظ');
      if (!storeId && json.id) setStoreId(json.id);
      setStoreStatus({ ok: true, msg: 'تم حفظ معلومات المتجر بنجاح ✓' });
    } catch (e: any) {
      setStoreStatus({ ok: false, msg: e.message });
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleAddProduct(values: z.infer<typeof productSchema>) {
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
      toast({ title: "تم إضافة المنتج", description: "سيتم مراجعة منتجك قريباً." });
      productForm.reset();
      setDialogOpen(false);
      setProducts(prev => [{ id: json.id || Date.now().toString(), ...values, status: 'pending' } as Product, ...prev]);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">متجري</h1>
        <p className="text-sm text-muted-foreground">أدر متجرك ومنتجاتك هنا.</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList>
          <TabsTrigger value="store"><Store className="h-4 w-4 ml-1" />إعداد المتجر</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 ml-1" />المنتجات</TabsTrigger>
        </TabsList>

        {/* Store Setup */}
        <TabsContent value="store" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">معلومات المتجر</CardTitle>
              <CardDescription>أدخل معلومات متجرك ثم اضغط الزر أدناه</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storeLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
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
                      <Input placeholder="عمّان" value={storeLoc} onChange={e => setStoreLoc(e.target.value)} />
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

                  {storeStatus && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${storeStatus.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {storeStatus.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                      <span>{storeStatus.msg}</span>
                    </div>
                  )}

                  <Button onClick={handleSaveStore} disabled={storeSaving} className="w-full sm:w-auto">
                    {storeSaving ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري الحفظ...</> : <><Save className="h-4 w-4 ml-2" />{storeId ? "تحديث المتجر" : "إنشاء المتجر"}</>}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground">{productsLoading ? "جاري التحميل..." : `${products.length} منتج`}</p>
            <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) productForm.reset(); }}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-2" />إضافة منتج</Button></DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader><DialogTitle>إضافة منتج جديد</DialogTitle></DialogHeader>
                <Form {...productForm}>
                  <form id="pf" onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-4 py-2">
                    <FormField control={productForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>اسم المنتج</FormLabel><FormControl><Input placeholder="مثال: حقيبة يدوية" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={productForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea placeholder="وصف مختصر..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={productForm.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>السعر (د.أ)</FormLabel><FormControl><Input type="number" min={0} step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={productForm.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl>
                          <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </form>
                </Form>
                <DialogFooter className="gap-2">
                  <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                  <Button type="submit" form="pf" disabled={submitting}>
                    {submitting ? <><Loader2 className="h-4 w-4 ml-1 animate-spin" />جارٍ الإضافة...</> : "إضافة المنتج"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Package className="h-12 w-12 mx-auto opacity-30" />
              <p>لا توجد منتجات بعد. أضف أول منتج!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(p => {
                const cfg = STATUS[p.status] || STATUS.pending;
                return (
                  <Card key={p.id} className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <Badge variant={cfg.variant} className="text-xs shrink-0">{cfg.label}</Badge>
                      </div>
                      <CardDescription className="text-xs">{p.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      <p className="text-lg font-bold text-primary">{isNaN(Number(p.price)) ? '0.00' : Number(p.price).toFixed(2)} د.أ</p>
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
