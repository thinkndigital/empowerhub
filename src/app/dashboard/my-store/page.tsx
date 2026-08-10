"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package, DollarSign, Users, ShoppingCart, PlusCircle, MoreVertical, MoreHorizontal, MapPin, Trash2, Edit, Settings, Truck, CheckCircle, XCircle, Tag } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/language-provider";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_CATEGORIES, translateCategory } from "@/lib/product-category";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "يجب أن يكون اسم المنتج حرفين على الأقل." }),
  description: z.string().optional().refine(val => !val || val.length >= 10, { message: "يجب أن يكون الوصف 10 أحرف على الأقل." }),
  location: z.string().optional().refine(val => !val || val.length >= 2, { message: "يجب أن يكون الموقع حرفين على الأقل." }),
  price: z.coerce.number().positive({ message: "يجب أن يكون السعر رقمًا موجبًا." }),
  stock: z.coerce.number().int().min(0, { message: "يجب أن يكون المخزون رقمًا صحيحًا." }),
  deliveryCost: z.coerce.number().min(0).optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
});

type Product = z.infer<typeof formSchema> & { id: string; beneficiaryId?: string; beneficiaryName?: string };
type Order = {
  id: string;
  productName: string;
  buyerName: string;
  createdAt?: any;
  totalAmount?: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
};

const statusMap: { [key in Order['status']]: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  pending: { text: "قيد الانتظار", variant: "secondary" },
  shipped: { text: "تم الشحن", variant: "default" },
  delivered: { text: "تم التوصيل", variant: "outline" },
  cancelled: { text: "ملغي", variant: "destructive" },
};

const statusMapEn: { [key in Order['status']]: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  pending: { text: "Pending", variant: "secondary" },
  shipped: { text: "Shipped", variant: "default" },
  delivered: { text: "Delivered", variant: "outline" },
  cancelled: { text: "Cancelled", variant: "destructive" },
};

// PRODUCT_CATEGORIES values are stored verbatim in Firestore (canonical
// Arabic), so the submitted `value` always stays Arabic — only the
// displayed label is translated.
const CATEGORY_LABELS_EN: Record<string, string> = {
  'مصنوعات يدوية': 'Handmade goods',
  'طعام ومشروبات': 'Food & beverages',
  'ملابس وأزياء': 'Clothing & fashion',
  'حرف يدوية': 'Handicrafts',
  'خدمات': 'Services',
  'منتجات زراعية': 'Agricultural products',
  'منزل وديكور': 'Home & decor',
  'أخرى': 'Other',
};

export default function MyStorePage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? enUS : arLocale;
  const tStatusMap = lang === 'en' ? statusMapEn : statusMap;
  const pathname = usePathname();
  const { user: authUser, userProfile, loading: authLoading } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setIsLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/beneficiary/store', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setProducts(json.products || []);
      setOrders(json.orders || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) fetchData();
  }, [authLoading, authUser, fetchData]);

  const storeStats = useMemo(() => {
    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return {
      totalProducts: products.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: `${orders.length}`,
      newCustomers: `${new Set(orders.map(o => o.buyerName).filter(Boolean)).size}`,
    };
  }, [products, orders]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", price: 0, stock: 0, description: "", location: "", deliveryCost: 0, imageUrl: "", category: "" },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openDialogForEdit = (product: Product) => {
    setEditProduct(product);
    form.reset({ ...product, category: translateCategory(product.category) });
    setImagePreview(product.imageUrl || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const openDialogForAdd = () => {
    setEditProduct(null);
    form.reset({ name: "", price: 0, stock: 0, description: "", location: "", deliveryCost: 0, imageUrl: "", category: "" });
    setImagePreview(null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!authUser) return;
    setIsUploading(true);

    let finalImageUrl = editProduct?.imageUrl || "";

    try {
      const token = await authUser.getIdToken();

      if (imageFile) {
        finalImageUrl = await uploadToStorage(imageFile, `product-images/${authUser.uid}`, token);
      }
      const productData = {
        ...values,
        imageUrl: finalImageUrl,
        beneficiaryId: authUser.uid,
        beneficiaryName: userProfile?.name || '',
        ...(editProduct?.id ? { id: editProduct.id } : {}),
      };

      const method = editProduct?.id ? 'PUT' : 'POST';
      const endpoint = editProduct?.id
        ? `/api/beneficiary/store`
        : `/api/beneficiary/store`;

      const res = await fetch(endpoint, {
        method: editProduct?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(editProduct?.id
          ? { id: editProduct.id, ...values, imageUrl: finalImageUrl }
          : productData
        ),
      });

      if (!res.ok) throw new Error((await res.json()).error || bi('فشل الحفظ', 'Save failed'));

      toast({ title: editProduct ? bi("تم التعديل بنجاح!", "Updated successfully!") : bi("تمت الإضافة بنجاح!", "Added successfully!"), description: `"${values.name}"` });
      form.reset();
      setIsDialogOpen(false);
      setEditProduct(null);
      setImagePreview(null);
      setImageFile(null);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message || bi("فشل حفظ المنتج.", "Failed to save the product.") });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    if (!productToDelete?.id || !authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch(`/api/beneficiary/store?id=${productToDelete.id}&type=product`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      toast({ variant: "destructive", title: bi("تم الحذف!", "Deleted!"), description: bi(`تم حذف "${productToDelete.name}".`, `"${productToDelete.name}" was deleted.`) });
      setProductToDelete(null);
      fetchData();
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل حذف المنتج.", "Failed to delete the product.") });
      setProductToDelete(null);
    }
  }

  async function handleUpdateOrderStatus(orderId: string, status: Order['status']) {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/beneficiary/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: orderId, status, _collection: 'orders' }),
      });
      toast({ title: bi("تم تحديث حالة الطلب", "Order status updated"), description: `"${tStatusMap[status].text}"` });
      fetchData();
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل تحديث حالة الطلب.", "Failed to update order status.") });
    }
  }

  return (
    <>
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("لوحة تحكم متجري", "My store dashboard")}</h1>
        <p className="text-muted-foreground">{bi("نظرة عامة على أداء متجرك الإلكتروني.", "An overview of your online store's performance.")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{bi("إجمالي الإيرادات", "Total revenue")}</CardTitle><div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><DollarSign className="h-5 w-5 text-white" /></div></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{storeStats.totalRevenue} {bi('د.أ', 'JOD')}</div>}<p className="text-xs text-muted-foreground mt-1">{bi("من الطلبات المكتملة", "From completed orders")}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{bi("إجمالي المنتجات", "Total products")}</CardTitle><div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center"><Package className="h-5 w-5 text-white" /></div></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{storeStats.totalProducts}</div>}<p className="text-xs text-muted-foreground mt-1">{bi("منتج معروض في المتجر", "Products listed in the store")}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{bi("الطلبات", "Orders")}</CardTitle><div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-white" /></div></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{storeStats.totalOrders}</div>}<p className="text-xs text-muted-foreground mt-1">{bi("إجمالي الطلبات المستلمة", "Total orders received")}</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{bi("العملاء", "Customers")}</CardTitle><div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center"><Users className="h-5 w-5 text-white" /></div></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{storeStats.newCustomers}</div>}<p className="text-xs text-muted-foreground mt-1">{bi("إجمالي عدد العملاء", "Total number of customers")}</p></CardContent></Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{bi("منتجاتك", "Your products")}</h2>
            <p className="text-muted-foreground">{bi("إدارة منتجات متجرك.", "Manage your store's products.")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`${pathname}/settings`}><Settings className="ml-2 h-4 w-4" />{bi("إعدادات المتجر", "Store settings")}</Link>
            </Button>
            <Button onClick={openDialogForAdd}><PlusCircle className="ml-2 h-4 w-4" />{bi("إضافة منتج جديد", "Add new product")}</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {isLoading && [...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><Skeleton className="h-[300px]" /></CardContent></Card>
          ))}
          {!isLoading && products.map((product) => (
            <Card key={product.id} className="group flex flex-col border-0 shadow-sm">
              <CardHeader className="p-0 relative">
                <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} width={400} height={300} className="rounded-t-lg object-cover" />
                <div className="absolute top-2 left-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDialogForEdit(product)}><Edit className="ml-2 h-4 w-4" />{bi("تعديل المنتج", "Edit product")}</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={() => setProductToDelete(product)}><Trash2 className="ml-2 h-4 w-4" />{bi("حذف المنتج", "Delete product")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-[40px]">{product.description}</p>
                <p className="text-sm text-muted-foreground mt-2">{bi(`المخزون: ${product.stock} قطعة`, `Stock: ${product.stock} units`)}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center p-4 pt-0">
                <div>
                  <p className="text-lg font-semibold">{product.price?.toFixed(2)} {bi('د.أ', 'JOD')}</p>
                  {product.deliveryCost && product.deliveryCost > 0 && (
                    <p className="text-xs text-muted-foreground">{bi(`+ ${product.deliveryCost.toFixed(2)} د.أ توصيل`, `+ ${product.deliveryCost.toFixed(2)} JOD delivery`)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />{product.location || bi('غير محدد', 'Not specified')}
                </div>
              </CardFooter>
            </Card>
          ))}
          {!isLoading && products.length === 0 && (
            <div className="col-span-full text-center h-40 flex items-center justify-center">
              <p>{bi('لم تقم بإضافة أي منتجات بعد. انقر على "إضافة منتج جديد" للبدء.', 'You haven\'t added any products yet. Click "Add new product" to get started.')}</p>
            </div>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>{bi("الطلبات الواردة", "Incoming orders")}</CardTitle><CardDescription>{bi("إدارة الطلبات الجديدة على منتجاتك.", "Manage new orders for your products.")}</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{bi("المنتج", "Product")}</TableHead>
                <TableHead>{bi("الزبون", "Customer")}</TableHead>
                <TableHead>{bi("تاريخ الطلب", "Order date")}</TableHead>
                <TableHead>{bi("الحالة", "Status")}</TableHead>
                <TableHead className="text-right"><span className="sr-only">{bi("الإجراءات", "Actions")}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">{bi("جاري تحميل الطلبات...", "Loading orders...")}</TableCell></TableRow>}
              {!isLoading && orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.productName}</TableCell>
                  <TableCell>{order.buyerName || bi('غير محدد', 'Not specified')}</TableCell>
                  <TableCell>{order.createdAt ? format(new Date(order.createdAt._seconds ? order.createdAt._seconds * 1000 : order.createdAt), "d MMMM yyyy", { locale }) : bi('غير محدد', 'Not specified')}</TableCell>
                  <TableCell>
                    <Badge variant={tStatusMap[order.status]?.variant} className={order.status === 'delivered' ? 'text-green-600 border-green-600' : ''}>
                      {tStatusMap[order.status]?.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{bi("تغيير الحالة", "Change status")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}><Truck className="ml-2 h-4 w-4" />{bi("تمييز كـ تم الشحن", "Mark as shipped")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}><CheckCircle className="ml-2 h-4 w-4" />{bi("تمييز كـ تم التوصيل", "Mark as delivered")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}><XCircle className="ml-2 h-4 w-4" />{bi("إلغاء الطلب", "Cancel order")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && orders.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center h-24">{bi("لا توجد طلبات حالية.", "No current orders.")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
      setIsDialogOpen(isOpen);
      if (!isOpen) { setEditProduct(null); setImagePreview(null); setImageFile(null); form.reset(); }
    }}>
      <DialogContent className="sm:max-w-lg" dir={dir}>
        <DialogHeader>
          <DialogTitle>{editProduct ? bi('تعديل المنتج', 'Edit product') : bi('إضافة منتج جديد', 'Add new product')}</DialogTitle>
          <DialogDescription>{editProduct ? bi('قم بتحديث تفاصيل المنتج.', 'Update the product details.') : bi('أدخل تفاصيل المنتج الجديد.', 'Enter the new product details.')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto px-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>{bi("اسم المنتج", "Product name")}</FormLabel><FormControl><Input placeholder={bi("مثال: خاتم فضة", "e.g. Silver ring")} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>{bi("وصف المنتج", "Product description")}</FormLabel><FormControl><Textarea placeholder={bi("وصف موجز للمنتج ومميزاته...", "A brief description of the product and its features...")} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormItem>
              <FormLabel>{bi("صورة المنتج", "Product image")}</FormLabel>
              <FormControl><Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} /></FormControl>
            </FormItem>
            {imagePreview && (
              <div><FormLabel>{bi("معاينة الصورة", "Image preview")}</FormLabel><div className="mt-2"><Image src={imagePreview} alt={bi("معاينة", "Preview")} width={100} height={100} className="rounded-md object-cover border" /></div></div>
            )}
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>{bi("الموقع (المدينة)", "Location (city)")}</FormLabel><FormControl><Input placeholder={bi("مثال: الرياض", "e.g. Riyadh")} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>{bi("السعر (د.أ)", "Price (JOD)")}</FormLabel><FormControl><Input type="number" step="0.01" placeholder="150.00" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="deliveryCost" render={({ field }) => (
                <FormItem><FormLabel>{bi("تكلفة التوصيل (د.أ)", "Delivery cost (JOD)")}</FormLabel><FormControl><Input type="number" step="0.1" placeholder="3.00" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="stock" render={({ field }) => (
              <FormItem><FormLabel>{bi("الكمية في المخزون", "Stock quantity")}</FormLabel><FormControl><Input type="number" placeholder="25" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> {bi("التصنيف", "Category")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={bi("اختر تصنيف...", "Choose a category...")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{lang === 'en' ? (CATEGORY_LABELS_EN[cat] ?? cat) : cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
              <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
              <Button type="submit" disabled={isUploading}>{isUploading ? bi('جاري الحفظ...', 'Saving...') : editProduct ? bi('حفظ التغييرات', 'Save changes') : bi('إضافة المنتج', 'Add product')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
      <AlertDialogContent dir={dir}>
        <AlertDialogHeader>
          <AlertDialogTitle>{bi("هل أنت متأكد تمامًا؟", "Are you absolutely sure?")}</AlertDialogTitle>
          <AlertDialogDescription>{bi(`هذا الإجراء سيقوم بحذف المنتج "${productToDelete?.name}" نهائيًا من متجرك.`, `This action will permanently delete the product "${productToDelete?.name}" from your store.`)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{bi("إلغاء", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>{bi("نعم، قم بالحذف", "Yes, delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
