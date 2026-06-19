"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package, DollarSign, ShoppingCart, PlusCircle, Trash2, Edit, Settings, Truck, CheckCircle, XCircle, Tag } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useUser } from "@/firebase/auth/use-user";
import { useStorage } from "@/firebase/provider";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { MoreHorizontal } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون اسم المنتج حرفين على الأقل." }),
  description: z.string().refine(v => !v || v.length >= 10, { message: "يجب أن يكون الوصف 10 أحرف على الأقل." }).optional(),
  price: z.coerce.number().positive({ message: "يجب أن يكون السعر رقمًا موجبًا." }),
  stock: z.coerce.number().int().min(0, { message: "يجب أن يكون المخزون رقمًا صحيحًا." }),
  deliveryCost: z.coerce.number().min(0).optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

type Product = ProductForm & { id: string; beneficiaryId: string; beneficiaryName: string };
type Order = { id: string; status: string; total?: number; price?: number; productName?: string; buyerName?: string; createdAt?: any };
type Store = { id: string; name: string; logoUrl?: string; location?: string };

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: <ShoppingCart className="h-3 w-3" /> },
  confirmed: { label: "مؤكد", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" /> },
  shipped: { label: "تم الشحن", color: "bg-purple-100 text-purple-800", icon: <Truck className="h-3 w-3" /> },
  delivered: { label: "تم التسليم", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: "ملغى", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function MyStorePage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const storage = useStorage();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, stock: 0, deliveryCost: 0, imageUrl: "", category: "" },
  });

  const getToken = useCallback(async () => authUser?.getIdToken(), [authUser]);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/beneficiary/store', { headers: { Authorization: `Bearer ${token}` } });
      const { store: s, products: p, orders: o } = await res.json();
      setStore(s);
      setProducts(p || []);
      setOrders(o || []);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "فشل في جلب بيانات المتجر." });
    } finally {
      setLoading(false);
    }
  }, [authUser, getToken, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    form.reset({ name: "", description: "", price: 0, stock: 0, deliveryCost: 0, imageUrl: "", category: "" });
    setIsProductDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setImageFile(null);
    setImagePreview(product.imageUrl || null);
    form.reset({ name: product.name, description: product.description || "", price: product.price, stock: product.stock, deliveryCost: product.deliveryCost || 0, imageUrl: product.imageUrl || "", category: product.category || "" });
    setIsProductDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(file); }
  };

  const onSubmitProduct = async (values: ProductForm) => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      let imageUrl = values.imageUrl || editingProduct?.imageUrl || "";
      if (imageFile && storage) {
        const ref = storageRef(storage, `products/${authUser.uid}/${Date.now()}-${imageFile.name}`);
        const snap = await uploadBytes(ref, imageFile);
        imageUrl = await getDownloadURL(snap.ref);
      }

      const token = await getToken();
      const payload = { ...values, imageUrl };

      if (editingProduct) {
        const res = await fetch('/api/beneficiary/store', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingProduct.id, _collection: 'products' }),
        });
        if (!res.ok) throw new Error(await res.text());
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
        toast({ title: "تم التحديث", description: "تم تحديث المنتج بنجاح." });
      } else {
        const res = await fetch('/api/beneficiary/store', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const newProduct = await res.json();
        setProducts(prev => [...prev, newProduct]);
        toast({ title: "تم الإضافة!", description: "تم إضافة المنتج بنجاح." });
      }
      setIsProductDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المنتج." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/beneficiary/store?id=${deleteTarget.id}&collection=products`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast({ title: "تم الحذف", description: "تم حذف المنتج." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المنتج." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/beneficiary/store', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, _collection: 'orders', status }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الطلب." });
    }
  };

  const totalRevenue = useMemo(() => orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || o.price || 0), 0), [orders]);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{store?.name || 'متجري'}</h1>
          {store?.location && <p className="text-muted-foreground text-sm mt-1">{store.location}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/dashboard/my-store/settings"><Settings className="ml-2 h-4 w-4" />إعدادات المتجر</Link></Button>
          <Button onClick={openAddDialog}><PlusCircle className="ml-2 h-4 w-4" />إضافة منتج</Button>
        </div>
      </div>

      {!store && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لم يتم إنشاء متجرك بعد</h3>
            <p className="text-muted-foreground text-sm mb-4">أنشئ متجرك الآن وابدأ ببيع منتجاتك.</p>
            <Button asChild><Link href="/dashboard/my-store/settings">إنشاء المتجر</Link></Button>
          </CardContent>
        </Card>
      )}

      {store && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" dir="rtl">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div>
                  <div><p className="text-2xl font-bold">{totalRevenue.toFixed(0)} د.أ</p><p className="text-xs text-muted-foreground">إجمالي الإيرادات</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Package className="h-5 w-5 text-blue-600" /></div>
                  <div><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">المنتجات</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-yellow-600" /></div>
                  <div><p className="text-2xl font-bold">{pendingOrders}</p><p className="text-xs text-muted-foreground">طلبات معلقة</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>المنتجات</CardTitle>
              <Button size="sm" onClick={openAddDialog}><PlusCircle className="ml-2 h-4 w-4" />إضافة</Button>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>لا توجد منتجات. أضف منتجك الأول!</p></div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map(product => (
                    <Card key={product.id} className="border shadow-sm">
                      {product.imageUrl && (
                        <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            {product.category && <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>خيارات</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(product)}><Edit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: product.id, name: product.name })}><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary">{product.price} د.أ</span>
                          <span className="text-xs text-muted-foreground">المخزون: {product.stock}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>الطلبات</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground"><ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>لا توجد طلبات حتى الآن.</p></div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead className="hidden md:table-cell">المشتري</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="hidden md:table-cell">التاريخ</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => {
                      const cfg = statusConfig[order.status] || statusConfig.pending;
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium truncate max-w-[100px]">{order.productName || '—'}</TableCell>
                          <TableCell className="hidden md:table-cell">{order.buyerName || '—'}</TableCell>
                          <TableCell>{(order.total || order.price || 0).toFixed(0)} د.أ</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {(() => { try { const d = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt?._seconds ? order.createdAt._seconds * 1000 : order.createdAt); return d && !isNaN(d.getTime()) ? format(d, 'd MMM yyyy', { locale: ar }) : '—'; } catch { return '—'; } })()}
                          </TableCell>
                          <TableCell>
                            <Select value={order.status} onValueChange={v => handleUpdateOrderStatus(order.id, v)}>
                              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitProduct)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>اسم المنتج</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>السعر (د.أ)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem><FormLabel>المخزون</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="deliveryCost" render={({ field }) => (
                  <FormItem><FormLabel>تكلفة التوصيل</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: ملابس" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormItem>
                <FormLabel>صورة المنتج</FormLabel>
                <FormControl><Input type="file" accept="image/*" onChange={handleImageChange} /></FormControl>
                {imagePreview && <div className="mt-2 relative h-32 w-full rounded-md overflow-hidden border"><Image src={imagePreview} alt="معاينة" fill className="object-cover" /></div>}
              </FormItem>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف منتج "{deleteTarget?.name}" نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
