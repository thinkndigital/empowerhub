"use client";

import { useEffect, useMemo, useState } from "react";
import { Store, Package, Eye, EyeOff, Trash2, Search, RefreshCw, Edit2, X, Check, ShoppingCart, Users, Phone, MapPin, Download, Printer, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface StoreItem {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  beneficiaryName: string;
  beneficiaryId: string;
  organizationId: string;
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

function StoresTab() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editStore, setEditStore] = useState<StoreItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);

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

  const filtered = stores.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.beneficiaryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <span className="text-muted-foreground text-sm shrink-0">{stores.length} متجر</span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن متجر..." className="pr-9" />
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>لا توجد متاجر</p>
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
                    <p className="text-foreground font-semibold text-sm truncate">{store.name}</p>
                    <p className="text-muted-foreground text-xs truncate">{store.beneficiaryName || 'بدون صاحب'}</p>
                    {store.location && <p className="text-muted-foreground text-xs truncate">{store.location}</p>}
                  </div>
                  {store.hidden && <Badge className="bg-muted text-muted-foreground text-xs border-0 flex-shrink-0">مخفي</Badge>}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{store.productsCount} منتج</span>
                  {store.createdAt && <span>{new Date(store.createdAt).toLocaleDateString('ar-EG')}</span>}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 gap-1.5 text-xs h-8 ${store.hidden ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => toggleHidden(store)}
                  >
                    {store.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {store.hidden ? 'إظهار' : 'إخفاء'}
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
                        <AlertDialogTitle className="text-foreground">حذف المتجر</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">هل أنت متأكد من حذف متجر "{store.name}"؟ هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteStore(store.id)} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
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
        <DialogContent className="bg-muted border-border text-foreground" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المتجر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم المتجر</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="المدينة..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
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
    setEditCategory(p.category ?? '');
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
    p.category?.toLowerCase().includes(search.toLowerCase())
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
        <span className="text-muted-foreground text-sm shrink-0">{products.length} منتج</span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن منتج..." className="pr-9" />
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>لا توجد منتجات</p>
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
                    {product.hidden && <Badge className="bg-muted text-muted-foreground text-xs border-0 flex-shrink-0">مخفي</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.price != null && (
                      <span className="text-primary text-sm font-semibold">{product.price} د.أ</span>
                    )}
                    {product.category && (
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">{product.category}</Badge>
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
                    {product.hidden ? 'إظهار' : 'إخفاء'}
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
                        <AlertDialogTitle className="text-foreground">حذف المنتج</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">هل أنت متأكد من حذف "{product.name}"؟</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
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
        <DialogContent className="bg-muted border-border text-foreground" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم المنتج</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>السعر (د.أ)</Label>
                <Input value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" min="0" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="ملابس، إلكترونيات..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/admin-panel/stores?type=orders');
    const d = await r.json();
    setOrders(d.orders || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o =>
    o.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.buyerPhone?.includes(search) ||
    o.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    o.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const exportHeaders = ["المنتج", "المتجر", "الزبون", "الهاتف", "المبلغ (د.أ)", "الحالة", "التاريخ"];
  const exportRows = filtered.map(o => [
    o.productName || '—',
    o.storeName || '—',
    o.buyerName || '—',
    o.buyerPhone || '—',
    o.totalAmount.toFixed(2),
    orderStatusLabel[o.status] || o.status,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '—',
  ]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-muted-foreground text-sm shrink-0">{orders.length} طلب</span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالزبون، الهاتف، المتجر..." className="pr-9" />
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToExcel('طلبات_المنصة', exportHeaders, exportRows, { sheetName: 'الطلبات' })}>
          <Download className="h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToPDF('طلبات المنصة - EmpowerHub', exportHeaders, exportRows, { summary: {
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
                <TableHead className="text-muted-foreground">المنتج</TableHead>
                <TableHead className="text-muted-foreground">المتجر</TableHead>
                <TableHead className="text-muted-foreground">الزبون</TableHead>
                <TableHead className="text-muted-foreground">الهاتف</TableHead>
                <TableHead className="text-muted-foreground">المبلغ</TableHead>
                <TableHead className="text-muted-foreground">الحالة</TableHead>
                <TableHead className="text-muted-foreground">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow className="border-border"><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && filtered.map(o => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="text-foreground text-sm">{o.productName || '—'}</TableCell>
                  <TableCell className="text-foreground/90 text-sm">{o.storeName || '—'}</TableCell>
                  <TableCell className="text-foreground/90 text-sm">{o.buyerName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm" dir="ltr">{o.buyerPhone || '—'}</TableCell>
                  <TableCell className="text-primary text-sm font-semibold">{o.totalAmount.toFixed(2)} د.أ</TableCell>
                  <TableCell>
                    <Badge className={`border-0 text-xs ${
                      o.status === 'completed' || o.status === 'delivered' || o.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : o.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {orderStatusLabel[o.status] || o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-EG') : '—'}</TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow className="border-border"><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
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
          name: o.buyerName || 'غير محدد',
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

  const exportHeaders = ["اسم العميل", "الهاتف", "العنوان", "عدد الطلبات", "إجمالي الإنفاق (د.أ)", "آخر طلب"];
  const exportRows = filtered.map(c => [
    c.name,
    c.phone || '—',
    c.address || '—',
    c.ordersCount,
    c.totalSpent.toFixed(2),
    c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('ar-EG') : '—',
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <Users className="h-4 w-4 text-purple-400 mb-2" />
            <p className="text-lg font-bold text-foreground">{loading ? '...' : stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <Repeat className="h-4 w-4 text-blue-400 mb-2" />
            <p className="text-lg font-bold text-foreground">{loading ? '...' : stats.repeat}</p>
            <p className="text-xs text-muted-foreground">عملاء متكررون</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <ShoppingCart className="h-4 w-4 text-emerald-400 mb-2" />
            <p className="text-lg font-bold text-foreground">{loading ? '...' : `${stats.revenue.toFixed(2)} د.أ`}</p>
            <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو رقم الهاتف..." className="pr-9" />
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToExcel('عملاء_المنصة', exportHeaders, exportRows, { sheetName: 'العملاء' })}>
          <Download className="h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || filtered.length === 0} onClick={() => exportToPDF('عملاء المنصة - EmpowerHub', exportHeaders, exportRows, { summary: {
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
                <TableHead className="text-muted-foreground">العميل</TableHead>
                <TableHead className="text-muted-foreground">الهاتف</TableHead>
                <TableHead className="text-muted-foreground">العنوان</TableHead>
                <TableHead className="text-muted-foreground">عدد الطلبات</TableHead>
                <TableHead className="text-muted-foreground">إجمالي الإنفاق</TableHead>
                <TableHead className="text-muted-foreground">آخر طلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow className="border-border"><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
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
                  <TableCell className="text-emerald-400 text-sm font-semibold">{c.totalSpent.toFixed(2)} د.أ</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('ar-EG') : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow className="border-border"><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">لا يوجد عملاء بعد</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StoresAdminPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المتاجر والمنتجات</h1>
        <p className="text-muted-foreground text-sm">إدارة متاجر المستفيدين ومنتجاتهم — يمكنك الإخفاء أو التعديل أو الحذف</p>
      </div>

      <Tabs defaultValue="stores">
        <TabsList className="bg-muted rounded-xl p-1 gap-1">
          <TabsTrigger value="stores" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <Store className="h-4 w-4" />
            المتاجر
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <Package className="h-4 w-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <ShoppingCart className="h-4 w-4" />
            الطلبات
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground gap-2">
            <Users className="h-4 w-4" />
            العملاء
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
