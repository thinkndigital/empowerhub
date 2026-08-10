"use client";

import { useEffect, useMemo, useState } from "react";
import { Store, Package, Eye, EyeOff, Trash2, Search, RefreshCw, Edit2, X, Check, ShoppingCart, Users, Phone, MapPin, Download, Printer, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { translateCategory } from "@/lib/product-category";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { useLanguage } from "@/components/language-provider";

interface StoreItem {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  beneficiaryName: string;
  beneficiaryId: string;
  organizationId: string;
  ownerRole: string;
  hidden: boolean;
  productsCount: number;
  createdAt?: string;
}

interface ProductItem {
  id: string;
  name: string;
  price?: number;
  category?: string;
  status?: string;
  hidden: boolean;
  imageUrl: string;
  userId?: string;
  storeId?: string;
  createdAt?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  storeName: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: string;
}

interface CustomerRow {
  key: string;
  name: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
}

const orderStatusLabel: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  completed: 'مكتمل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

const orderStatusLabelEn: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function StoresTab() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editStore, setEditStore] = useState<StoreItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'merchant'>('all');
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/admin-panel/stores?type=stores');
    const d = await r.json();
    setStores(d.stores || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleHidden = async (store: StoreItem) => {
    await fetch(`/api/admin-panel/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hidden: !store.hidden }),
    });
    setStores(s => s.map(x => x.id === store.id ? { ...x, hidden: !x.hidden } : x));
  };

  const deleteStore = async (id: string) => {
    await fetch(`/api/admin-panel/stores/${id}`, { method: 'DELETE' });
    setStores(s => s.filter(x => x.id !== id));
  };

  const openEdit = (store: StoreItem) => {
    setEditStore(store);
    setEditName(store.name);
    setEditLocation(store.location);
  };

  const saveEdit = async () => {
    if (!editStore) return;
    setSaving(true);
    await fetch(`/api/admin-panel/stores/${editStore.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: editName, location: editLocation }),
    });
    setStores(s => s.map(x => x.id === editStore.id ? { ...x, name: editName, location: editLocation } : x));
    setEditStore(null);
    setSaving(false);
  };

  const filtered = stores
    .filter(s => ownerFilter === 'all' || s.ownerRole === 'merchant')
    .filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.beneficiaryName?.toLowerCase().includes(search.toLowerCase())
    );
  const merchantStoresCount = stores.filter(s => s.ownerRole === 'merchant').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-muted-foreground text-sm shrink-0">{bi(`${stores.length} متجر`, `${stores.length} stores`)}</span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={bi('بحث عن متجر...', 'Search for a store...')} className="pr-9" />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setOwnerFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ownerFilter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {bi('الكل', 'All')}
          </button>
          <button onClick={() => setOwnerFilter('merchant')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ownerFilter === 'merchant' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {bi('متاجر التجار', 'Merchant stores')} ({merchantStoresCount})
          </button>
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{bi('جاري التحميل...', 'Loading...')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{bi('لا توجد متاجر', 'No stores')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(store => (
            <Card key={store.id} className={`border-0 shadow-sm transition-all ${store.hidden ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-foreground font-semibold text-sm truncate">{store.name}</p>
                      {store.ownerRole === 'merchant' && (
                        <Badge className="bg-amber-500/20 text-amber-500 text-[10px] border-0 shrink-0 px-1.5">{bi('تاجر', 'Merchant')}</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs truncate">{store.beneficiaryName || bi('بدون صاحب', 'No owner')}</p>
                    {store.location && <p className="text-muted-foreground text-xs truncate">{store.location}</p>}
                  </div>
                  {store.hidden && <Badge className="bg-muted text-muted-foreground text-xs border-0 flex-shrink-0">{bi('مخفي', 'Hidden')}</Badge>}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{bi(`${store.productsCount} منتج`, `${store.productsCount} products`)}</span>
                  {store.createdAt && <span>{new Date(store.createdAt).toLocaleDateString(locale)}</span>}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 gap-1.5 text-xs h-8 ${store.hidden ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => toggleHidden(store)}
                  >
                    {store.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {store.hidden ? bi('إظهار', 'Show') : bi('إخفاء', 'Hide')}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-400 hover:border-blue-500/30" onClick={() => openEdit(store)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:border-red-500/30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-muted border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">{bi('حذف المتجر', 'Delete Store')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">{bi(`هل أنت متأكد من حذف متجر "${store.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`, `Are you sure you want to delete "${store.name}"? This action cannot be undone.`)}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{bi('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteStore(store.id)} className="bg-red-600 hover:bg-red-700">{bi('حذف', 'Delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editStore} onOpenChange={o => !o && setEditStore(null)}>
        <DialogContent className="bg-muted border-border text-foreground" dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi('تعديل المتجر', 'Edit Store')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{bi('اسم المتجر', 'Store name')}</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{bi('الموقع', 'Location')}</Label>
              <Input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder={bi('المدينة...', 'City...')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/admin-panel/stores?type=products');
    const d = await r.json();
    setProducts(d.products || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleHidden = async (product: ProductItem) => {
    await fetch(`/api/admin-panel/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hidden: !product.hidden }),
    });
    setProducts(p => p.map(x => x.id === product.id ? { ...x, hidden: !x.hidden } : x));
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/admin-panel/products/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(x => x.id !== id));
  };

  const openEdit = (p: ProductItem) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditPrice(String(p.price ?? ''));
    setEditCategory(translateCategory(p.category));
  };

  const saveEdit = async () => {
    if (!editProduct) return;
    setSaving(true);
    const body: any = { name: editName, category: editCategory };
    if (editPrice) body.price = parseFloat(editPrice);
    await fetch(`/api/admin-panel/products/${editProduct.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setProducts(p => p.map(x => x.id === editProduct.id ? { ...x, ...body } : x));
    setEditProduct(null);
    setSaving(false);
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    translateCategory(p.category).toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    published: 'bg-emerald-500/20 text-emerald-400',
    منشورة: 'bg-emerald-500/20 text-emerald-400',
    draft: 'bg-muted text-muted-foreground',
    مسودة: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <span className="text-muted-foreground text-sm shrink-0">{bi(`${products.length} منتج`, `${products.length} products`)}</span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={bi('بحث عن منتج...', 'Search for a product...')} className="pr-9" />
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{bi('جاري التحميل...', 'Loading...')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{bi('لا توجد منتجات', 'No products')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <Card key={product.id} className={`border-0 shadow-sm overflow-hidden transition-all ${product.hidden ? 'opacity-50' : ''}`}>
              {product.imageUrl && (
                <div className="h-28 w-full bg-muted overflow-hidden">
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                </div>
              )}
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-foreground font-semibold text-sm line-clamp-2 flex-1">{product.name}</p>
                    {product.hidden && <Badge className="bg-muted text-muted-foreground text-xs border-0 flex-shrink-0">{bi('مخفي', 'Hidden')}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.price != null && (
                      <span className="text-primary text-sm font-semibold">{product.price} {bi('د.أ', 'JOD')}</span>
                    )}
                    {product.category && (
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">{translateCategory(product.category)}</Badge>
                    )}
                    {product.status && (
                      <Badge className={`border-0 text-xs ${statusColor[product.status] || 'bg-muted text-muted-foreground'}`}>
                        {product.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 gap-1.5 text-xs h-8 ${product.hidden ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => toggleHidden(product)}
                  >
                    {product.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {product.hidden ? bi('إظهار', 'Show') : bi('إخفاء', 'Hide')}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-400 hover:border-blue-500/30" onClick={() => openEdit(product)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:border-red-500/30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-muted border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">{bi('حذف المنتج', 'Delete Product')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">{bi(`هل أنت متأكد من حذف "${product.name}"؟`, `Are you sure you want to delete "${product.name}"?`)}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{bi('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">{bi('حذف', 'Delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={o => !o && setEditProduct(null)}>
        <DialogContent className="bg-muted border-border text-foreground" dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi('تعديل المنتج', 'Edit Product')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{bi('اسم المنتج', 'Product name')}</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{bi('السعر (د.أ)', 'Price (JOD)')}</Label>
                <Input value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" min="0" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{bi('التصنيف', 'Category')}</Label>
                <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder={bi('ملابس، إلكترونيات...', 'Clothing, Electronics...')} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>{bi('إلغاء', 'Cancel')}</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const SETTLED_STATUSES = ['completed', 'delivered', 'confirmed'];

function OrdersTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';
  const tOrderStatus = lang === 'en' ? orderStatusLabelEn : orderStatusLabel;

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/admin-panel/stores?type=orders');
    const d = await r.json();
    setOrders(d.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch('/api/admin-panel/payment-config').then(r => r.json()).then(d => {
      setCommissionRate(d.config?.commissionRate || 0);
    }).catch(() => {});
  }, []);

  const settledSales = orders.filter(o => SETTLED_STATUSES.includes(o.status)).reduce((s, o) => s + o.totalAmount, 0);
  const commissionAmount = settledSales * (commissionRate / 100);

  const filtered = orders.filter(o =>
    o.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.buyerPhone?.includes(search) ||
    o.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    o.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const exportHeaders = lang === 'en'
    ? ["Product", "Store", "Customer", "Phone", "Amount (JOD)", "Status", "Date"]
    : ["المنتج", "المتجر", "الزبون", "الهاتف", "المبلغ (د.أ)", "الحالة", "التاريخ"];
  const exportRows = filtered.map(o => [
    o.productName || '—',
    o.storeName || '—',
    o.buyerName || '—',
    o.buyerPhone || '—',
    o.totalAmount.toFixed(2),
    tOrderStatus[o.status] || o.status,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : '—',
  ]);

  return (
    <div className="space-y-4">
      {commissionRate > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs mb-1">{bi('إجمالي المبيعات المكتملة', 'Total completed sales')}</p>
              <p className="text-foreground text-xl font-bold">{settledSales.toFixed(2)} {bi('د.أ', 'JOD')}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs mb-1">{bi('نسبة عمولة المنصة', 'Platform commission rate')}</p>
              <p className="text-foreground text-xl font-bold">{commissionRate}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs mb-1">{bi('عمولة المنصة المقدّرة', 'Estimated platform commission')}</p>
              <p className="text-primary text-xl font-bold">{commissionAmount.toFixed(2)} {bi('د.أ', 'JOD')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-muted-foreground text-sm shrink-0">{bi(`${orders.length} طلب`, `${orders.length} orders`)}</span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={bi('بحث بالزبون، الهاتف، المتجر...', 'Search by customer, phone, store...')} className="pr-9" />
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToExcel(bi('طلبات_المنصة', 'platform_orders'), exportHeaders, exportRows, { sheetName: bi('الطلبات', 'Orders') })}>
          <Download className="h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToPDF(bi('طلبات المنصة - EmpowerHub', 'Platform Orders - EmpowerHub'), exportHeaders, exportRows, { summary: lang === 'en' ? {
          'Total Orders': String(filtered.length),
          'Total Sales': `${filtered.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} JOD`,
        } : {
          'إجمالي الطلبات': String(filtered.length),
          'إجمالي المبيعات': `${filtered.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} د.أ`,
        } })}>
          <Printer className="h-4 w-4" />
          PDF
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">{bi('المنتج', 'Product')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('المتجر', 'Store')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('الزبون', 'Customer')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('الهاتف', 'Phone')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('المبلغ', 'Amount')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('الحالة', 'Status')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('التاريخ', 'Date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow className="border-border"><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{bi('جاري التحميل...', 'Loading...')}</TableCell></TableRow>}
              {!loading && filtered.map(o => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="text-foreground text-sm">{o.productName || '—'}</TableCell>
                  <TableCell className="text-foreground/90 text-sm">{o.storeName || '—'}</TableCell>
                  <TableCell className="text-foreground/90 text-sm">{o.buyerName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm" dir="ltr">{o.buyerPhone || '—'}</TableCell>
                  <TableCell className="text-primary text-sm font-semibold">{o.totalAmount.toFixed(2)} {bi('د.أ', 'JOD')}</TableCell>
                  <TableCell>
                    <Badge className={`border-0 text-xs ${
                      o.status === 'completed' || o.status === 'delivered' || o.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : o.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tOrderStatus[o.status] || o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : '—'}</TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow className="border-border"><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{bi('لا توجد طلبات', 'No orders')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomersTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-EG';

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/admin-panel/stores?type=orders');
    const d = await r.json();
    setOrders(d.orders || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const customers = useMemo<CustomerRow[]>(() => {
    const map = new Map<string, CustomerRow>();
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const key = (o.buyerPhone || o.buyerName || '').trim() || o.id;
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += o.totalAmount;
        if (!existing.address && o.buyerAddress) existing.address = o.buyerAddress;
        if (o.createdAt && (!existing.lastOrderAt || new Date(o.createdAt) > new Date(existing.lastOrderAt))) {
          existing.lastOrderAt = o.createdAt;
        }
      } else {
        map.set(key, {
          key,
          name: o.buyerName || bi('غير محدد', 'Unspecified'),
          phone: o.buyerPhone || '',
          address: o.buyerAddress || '',
          ordersCount: 1,
          totalSpent: o.totalAmount,
          lastOrderAt: o.createdAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastOrderAt || 0).getTime() - new Date(a.lastOrderAt || 0).getTime());
  }, [orders]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const stats = {
    total: customers.length,
    repeat: customers.filter(c => c.ordersCount > 1).length,
    revenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  };

  const exportHeaders = lang === 'en'
    ? ["Customer name", "Phone", "Address", "Orders count", "Total spent (JOD)", "Last order"]
    : ["اسم العميل", "الهاتف", "العنوان", "عدد الطلبات", "إجمالي الإنفاق (د.أ)", "آخر طلب"];
  const exportRows = filtered.map(c => [
    c.name,
    c.phone || '—',
    c.address || '—',
    c.ordersCount,
    c.totalSpent.toFixed(2),
    c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString(locale) : '—',
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <Users className="h-4 w-4 text-purple-400 mb-2" />
            <p className="text-lg font-bold text-foreground">{loading ? '...' : stats.total}</p>
            <p className="text-xs text-muted-foreground">{bi('إجمالي العملاء', 'Total customers')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <Repeat className="h-4 w-4 text-blue-400 mb-2" />
            <p className="text-lg font-bold text-foreground">{loading ? '...' : stats.repeat}</p>
            <p className="text-xs text-muted-foreground">{bi('عملاء متكررون', 'Repeat customers')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <ShoppingCart className="h-4 w-4 text-emerald-400 mb-2" />
            <p className="text-lg font-bold text-foreground">{loading ? '...' : bi(`${stats.revenue.toFixed(2)} د.أ`, `${stats.revenue.toFixed(2)} JOD`)}</p>
            <p className="text-xs text-muted-foreground">{bi('إجمالي المبيعات', 'Total sales')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={bi('بحث بالاسم أو رقم الهاتف...', 'Search by name or phone number...')} className="pr-9" />
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToExcel(bi('عملاء_المنصة', 'platform_customers'), exportHeaders, exportRows, { sheetName: bi('العملاء', 'Customers') })}>
          <Download className="h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToPDF(bi('عملاء المنصة - EmpowerHub', 'Platform Customers - EmpowerHub'), exportHeaders, exportRows, { summary: lang === 'en' ? {
          'Total Customers': String(stats.total),
          'Repeat Customers': String(stats.repeat),
          'Total Sales': `${stats.revenue.toFixed(2)} JOD`,
        } : {
          'إجمالي العملاء': String(stats.total),
          'عملاء متكررون': String(stats.repeat),
          'إجمالي المبيعات': `${stats.revenue.toFixed(2)} د.أ`,
        } })}>
          <Printer className="h-4 w-4" />
          PDF
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">{bi('العميل', 'Customer')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('الهاتف', 'Phone')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('العنوان', 'Address')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('عدد الطلبات', 'Order count')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('إجمالي الإنفاق', 'Total spent')}</TableHead>
                <TableHead className="text-muted-foreground">{bi('آخر طلب', 'Last order')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow className="border-border"><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{bi('جاري التحميل...', 'Loading...')}</TableCell></TableRow>}
              {!loading && filtered.map(c => (
                <TableRow key={c.key} className="border-border">
                  <TableCell className="text-foreground text-sm font-medium">{c.name}</TableCell>
                  <TableCell dir="ltr">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-foreground/90 hover:text-primary text-sm">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        {c.phone}
                      </a>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[220px]">
                    {c.address ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border-0 text-xs ${c.ordersCount > 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{c.ordersCount}</Badge>
                  </TableCell>
                  <TableCell className="text-emerald-400 text-sm font-semibold">{c.totalSpent.toFixed(2)} {bi('د.أ', 'JOD')}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString(locale) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow className="border-border"><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{bi('لا يوجد عملاء بعد', 'No customers yet')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StoresAdminPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{bi('المتاجر والمنتجات', 'Stores & Products')}</h1>
        <p className="text-muted-foreground text-sm">{bi('إدارة متاجر المستفيدين ومنتجاتهم — يمكنك الإخفاء أو التعديل أو الحذف', 'Manage beneficiary stores and products — you can hide, edit, or delete')}</p>
      </div>

      <Tabs defaultValue="stores">
        <TabsList className="bg-muted rounded-xl p-1 gap-1">
          <TabsTrigger value="stores" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <Store className="h-4 w-4" />
            {bi('المتاجر', 'Stores')}
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <Package className="h-4 w-4" />
            {bi('المنتجات', 'Products')}
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <ShoppingCart className="h-4 w-4" />
            {bi('الطلبات', 'Orders')}
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <Users className="h-4 w-4" />
            {bi('العملاء', 'Customers')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="mt-4">
          <StoresTab />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <CustomersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
