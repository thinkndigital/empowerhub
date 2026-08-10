"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Users, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { MERCHANT_PERMISSIONS, MERCHANT_PERMISSION_LABELS, type MerchantPermission } from "@/lib/merchant-permissions";

type TeamMember = {
  id: string; name: string; email: string;
  merchantRole: 'admin' | 'staff'; permissions: MerchantPermission[]; status?: string;
};

const formSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  merchantRole: z.enum(['admin', 'staff']),
});

export default function MerchantTeamPage() {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const isStaff = userProfile?.role === 'merchant_staff';

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addPermissions, setAddPermissions] = useState<MerchantPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editPermissions, setEditPermissions] = useState<MerchantPermission[]>([]);
  const [editRole, setEditRole] = useState<'admin' | 'staff'>('staff');
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/merchant/team', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      setTeam(json.team || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (!isStaff) fetchTeam(); }, [fetchTeam, isStaff]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", merchantRole: "staff" },
  });
  const addRoleWatch = form.watch("merchantRole");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/merchant/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...values, permissions: addPermissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تمت الإضافة بنجاح!", description: `تمت إضافة "${values.name}" لفريقك. كلمة المرور: EmpowerHub@2024` });
      form.reset();
      setAddPermissions([]);
      setIsAddOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ!", description: err.message });
    } finally {
      setSaving(false);
    }
  }

  const openEdit = (member: TeamMember) => {
    setEditMember(member);
    setEditRole(member.merchantRole);
    setEditPermissions(member.permissions || []);
  };

  async function saveEdit() {
    if (!user || !editMember) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/merchant/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ memberId: editMember.id, merchantRole: editRole, permissions: editPermissions }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "تم التحديث" });
      setEditMember(null);
      fetchTeam();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ!", description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!memberToDelete || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/merchant/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ memberId: memberToDelete.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ variant: "destructive", title: "تمت الإزالة!", description: `تمت إزالة "${memberToDelete.name}" من الفريق.` });
      setMemberToDelete(null);
      fetchTeam();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ!", description: err.message });
      setMemberToDelete(null);
    }
  }

  const togglePermission = (list: MerchantPermission[], setList: (p: MerchantPermission[]) => void, perm: MerchantPermission) => {
    setList(list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]);
  };

  if (isStaff) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">هذه الصفحة متاحة لصاحب المتجر فقط.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الفريق والصلاحيات</h1>
          <p className="text-muted-foreground">أضف أعضاء لفريق متجرك وحدد صلاحياتهم.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={o => { setIsAddOpen(o); if (!o) { form.reset(); setAddPermissions([]); } }}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="ml-2 h-4 w-4" />إضافة عضو</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة عضو جديد للفريق</DialogTitle>
              <DialogDescription>أدخل معلومات العضو وحدد دوره وصلاحياته.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="مثال: خالد الأحمد" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" placeholder="khaled@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="merchantRole" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="admin">مدير — صلاحية كاملة</SelectItem>
                        <SelectItem value="staff">عضو فريق — صلاحيات محددة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {addRoleWatch === 'staff' && (
                  <div className="space-y-2">
                    <FormLabel>الصلاحيات</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {MERCHANT_PERMISSIONS.map(perm => (
                        <label key={perm} className="flex items-center gap-2 text-sm rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/40">
                          <Checkbox checked={addPermissions.includes(perm)} onCheckedChange={() => togglePermission(addPermissions, setAddPermissions, perm)} />
                          {MERCHANT_PERMISSION_LABELS[perm]}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                  <Button type="submit" disabled={saving}>{saving ? 'جاري الإضافة...' : 'إضافة'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">أعضاء الفريق</CardTitle>
          <CardDescription>{!loading ? `${team.length} عضو` : 'جاري التحميل...'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead className="hidden lg:table-cell">الصلاحيات</TableHead>
                  <TableHead><span className="sr-only">إجراءات</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-9 w-9 rounded-xl" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-xl" /></TableCell>
                  </TableRow>
                ))}
                {!loading && team.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9 rounded-xl shrink-0">
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.merchantRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {member.merchantRole === 'admin' ? 'مدير' : 'عضو فريق'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.merchantRole === 'admin' ? (
                        <span className="text-xs text-muted-foreground">كل الصلاحيات</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(member.permissions || []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">بدون صلاحيات</span>
                          ) : member.permissions.map(p => (
                            <Badge key={p} variant="outline" className="text-[10px] py-0">{MERCHANT_PERMISSION_LABELS[p]}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(member)}><Edit className="ml-2 h-4 w-4" />تعديل الصلاحيات</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onSelect={e => { e.preventDefault(); setMemberToDelete(member); }}>
                            <Trash2 className="ml-2 h-4 w-4" />إزالة من الفريق
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && team.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <Users className="h-8 w-8 text-muted-foreground/30" />
                        <p className="font-medium text-muted-foreground">لا يوجد أعضاء في الفريق</p>
                        <p className="text-sm text-muted-foreground/70">أضف أعضاء لإدارة متجرك معك</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit permissions dialog */}
      <Dialog open={!!editMember} onOpenChange={o => !o && setEditMember(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل صلاحيات {editMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الدور</label>
              <Select value={editRole} onValueChange={v => setEditRole(v as 'admin' | 'staff')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير — صلاحية كاملة</SelectItem>
                  <SelectItem value="staff">عضو فريق — صلاحيات محددة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === 'staff' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">الصلاحيات</label>
                <div className="grid grid-cols-2 gap-2">
                  {MERCHANT_PERMISSIONS.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-sm rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/40">
                      <Checkbox checked={editPermissions.includes(perm)} onCheckedChange={() => togglePermission(editPermissions, setEditPermissions, perm)} />
                      {MERCHANT_PERMISSION_LABELS[perm]}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditMember(null)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={o => !o && setMemberToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء سيقوم بإزالة "{memberToDelete?.name}" من فريق متجرك ويلغي وصوله للوحة التحكم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>نعم، قم بالإزالة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
