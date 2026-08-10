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
import { useLanguage } from "@/components/language-provider";

const MERCHANT_PERMISSION_LABELS_EN: Record<MerchantPermission, string> = {
  store: 'My store',
  inventory: 'Inventory & products',
  orders: 'Orders',
  customers: 'Customers',
  reports: 'Reports',
  content: 'Social media content',
};

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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const tPermLabels = lang === 'en' ? MERCHANT_PERMISSION_LABELS_EN : MERCHANT_PERMISSION_LABELS;
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
      toast({
        title: bi("تمت الإضافة بنجاح!", "Added successfully!"),
        description: bi(`تمت إضافة "${values.name}" لفريقك. كلمة المرور: EmpowerHub@2024`, `"${values.name}" was added to your team. Password: EmpowerHub@2024`),
      });
      form.reset();
      setAddPermissions([]);
      setIsAddOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: err.message });
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
      toast({ title: bi("تم التحديث", "Updated") });
      setEditMember(null);
      fetchTeam();
    } catch (err: any) {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: err.message });
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
      toast({
        variant: "destructive",
        title: bi("تمت الإزالة!", "Removed!"),
        description: bi(`تمت إزالة "${memberToDelete.name}" من الفريق.`, `"${memberToDelete.name}" was removed from the team.`),
      });
      setMemberToDelete(null);
      fetchTeam();
    } catch (err: any) {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: err.message });
      setMemberToDelete(null);
    }
  }

  const togglePermission = (list: MerchantPermission[], setList: (p: MerchantPermission[]) => void, perm: MerchantPermission) => {
    setList(list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]);
  };

  if (isStaff) {
    return (
      <div dir={dir} className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">{bi("هذه الصفحة متاحة لصاحب المتجر فقط.", "This page is only available to the store owner.")}</p>
      </div>
    );
  }

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("الفريق والصلاحيات", "Team & permissions")}</h1>
          <p className="text-muted-foreground">{bi("أضف أعضاء لفريق متجرك وحدد صلاحياتهم.", "Add members to your store team and set their permissions.")}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={o => { setIsAddOpen(o); if (!o) { form.reset(); setAddPermissions([]); } }}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="ml-2 h-4 w-4" />{bi("إضافة عضو", "Add member")}</Button>
          </DialogTrigger>
          <DialogContent dir={dir}>
            <DialogHeader>
              <DialogTitle>{bi("إضافة عضو جديد للفريق", "Add a new team member")}</DialogTitle>
              <DialogDescription>{bi("أدخل معلومات العضو وحدد دوره وصلاحياته.", "Enter the member's information and set their role and permissions.")}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>{bi("الاسم الكامل", "Full name")}</FormLabel><FormControl><Input placeholder={bi("مثال: خالد الأحمد", "e.g. Khaled Al-Ahmad")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>{bi("البريد الإلكتروني", "Email")}</FormLabel><FormControl><Input dir="ltr" placeholder="khaled@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="merchantRole" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bi("الدور", "Role")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="admin">{bi("مدير — صلاحية كاملة", "Admin — full access")}</SelectItem>
                        <SelectItem value="staff">{bi("عضو فريق — صلاحيات محددة", "Team member — limited permissions")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {addRoleWatch === 'staff' && (
                  <div className="space-y-2">
                    <FormLabel>{bi("الصلاحيات", "Permissions")}</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {MERCHANT_PERMISSIONS.map(perm => (
                        <label key={perm} className="flex items-center gap-2 text-sm rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/40">
                          <Checkbox checked={addPermissions.includes(perm)} onCheckedChange={() => togglePermission(addPermissions, setAddPermissions, perm)} />
                          {tPermLabels[perm]}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
                  <Button type="submit" disabled={saving}>{saving ? bi('جاري الإضافة...', 'Adding...') : bi('إضافة', 'Add')}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{bi("أعضاء الفريق", "Team members")}</CardTitle>
          <CardDescription>{!loading ? bi(`${team.length} عضو`, `${team.length} members`) : bi('جاري التحميل...', 'Loading...')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{bi("الاسم", "Name")}</TableHead>
                  <TableHead className="hidden md:table-cell">{bi("البريد الإلكتروني", "Email")}</TableHead>
                  <TableHead>{bi("الدور", "Role")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{bi("الصلاحيات", "Permissions")}</TableHead>
                  <TableHead><span className="sr-only">{bi("إجراءات", "Actions")}</span></TableHead>
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
                        {member.merchantRole === 'admin' ? bi('مدير', 'Admin') : bi('عضو فريق', 'Team member')}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.merchantRole === 'admin' ? (
                        <span className="text-xs text-muted-foreground">{bi("كل الصلاحيات", "All permissions")}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(member.permissions || []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">{bi("بدون صلاحيات", "No permissions")}</span>
                          ) : member.permissions.map(p => (
                            <Badge key={p} variant="outline" className="text-[10px] py-0">{tPermLabels[p]}</Badge>
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
                          <DropdownMenuLabel>{bi("الإجراءات", "Actions")}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(member)}><Edit className="ml-2 h-4 w-4" />{bi("تعديل الصلاحيات", "Edit permissions")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onSelect={e => { e.preventDefault(); setMemberToDelete(member); }}>
                            <Trash2 className="ml-2 h-4 w-4" />{bi("إزالة من الفريق", "Remove from team")}
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
                        <p className="font-medium text-muted-foreground">{bi("لا يوجد أعضاء في الفريق", "No team members yet")}</p>
                        <p className="text-sm text-muted-foreground/70">{bi("أضف أعضاء لإدارة متجرك معك", "Add members to help manage your store")}</p>
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
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{bi(`تعديل صلاحيات ${editMember?.name}`, `Edit permissions for ${editMember?.name}`)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{bi("الدور", "Role")}</label>
              <Select value={editRole} onValueChange={v => setEditRole(v as 'admin' | 'staff')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{bi("مدير — صلاحية كاملة", "Admin — full access")}</SelectItem>
                  <SelectItem value="staff">{bi("عضو فريق — صلاحيات محددة", "Team member — limited permissions")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === 'staff' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{bi("الصلاحيات", "Permissions")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {MERCHANT_PERMISSIONS.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-sm rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/40">
                      <Checkbox checked={editPermissions.includes(perm)} onCheckedChange={() => togglePermission(editPermissions, setEditPermissions, perm)} />
                      {tPermLabels[perm]}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditMember(null)}>{bi("إلغاء", "Cancel")}</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={o => !o && setMemberToDelete(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{bi("هل أنت متأكد تمامًا؟", "Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {bi(
                `هذا الإجراء سيقوم بإزالة "${memberToDelete?.name}" من فريق متجرك ويلغي وصوله للوحة التحكم.`,
                `This action will remove "${memberToDelete?.name}" from your store team and revoke their access to the dashboard.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bi("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{bi("نعم، قم بالإزالة", "Yes, remove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
