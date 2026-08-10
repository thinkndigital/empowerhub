
"use client";

import { MoreHorizontal, Download, UserX, Edit, User, Eye } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, doc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/components/language-provider";


type Organization = { id: string; name: string; };

// A mapping for roles to display in Arabic
const roleMap: { [key: string]: string } = {
    admin: "مشرف",
    organization: "مدير جهة",
    mentor: "مرشد",
    beneficiary: "مستفيد",
    coach: "مدرب",
    merchant: "تاجر",
    team_member: "عضو فريق"
};
const roleMapEn: { [key: string]: string } = {
    admin: "Admin",
    organization: "Organization manager",
    mentor: "Mentor",
    beneficiary: "Beneficiary",
    coach: "Coach",
    merchant: "Merchant",
    team_member: "Team member"
};

const editUserSchema = z.object({
  role: z.string({ required_error: "الرجاء اختيار دور للمستخدم." }),
});

export default function UsersPage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const tRoleMap = lang === 'en' ? roleMapEn : roleMap;
  const firestore = useFirestore();
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userToView, setUserToView] = useState<UserProfile | null>(null);

  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (userToEdit) {
      form.setValue("role", userToEdit.role || "");
    }
  }, [userToEdit, form]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const organizationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "organizations"));
  }, [firestore]);
  const { data: organizations, isLoading: orgsLoading } = useCollection<Organization>(organizationsQuery);

  const orgMap = useMemo(() => {
      if (!organizations) return new Map();
      return new Map(organizations.map(o => [o.id, o.name]));
  }, [organizations]);

  const loading = usersLoading || orgsLoading;


  const roleAr: Record<string, string> = { admin: 'مدير', organization: 'منظمة', mentor: 'مرشد', coach: 'مدرب', beneficiary: 'مستفيد', merchant: 'تاجر' };
  const roleEn: Record<string, string> = { admin: 'Admin', organization: 'Organization', mentor: 'Mentor', coach: 'Coach', beneficiary: 'Beneficiary', merchant: 'Merchant' };
  const tRoleAr = lang === 'en' ? roleEn : roleAr;

  const handleToggleStatus = async (user: UserProfile) => {
    if (!firestore) return;

    const userRef = doc(firestore, "users", user.id);
    const newStatus = user.status === "نشط" ? "غير نشط" : "نشط";

    updateDoc(userRef, { status: newStatus })
        .then(() => {
            toast({
                title: bi(`تم تغيير حالة المستخدم`, `User status changed`),
                description: bi(`أصبحت حالة ${user.name || 'المستخدم'} الآن "${newStatus}".`, `${user.name || 'The user'}'s status is now "${newStatus}".`),
                variant: newStatus === 'غير نشط' ? 'destructive' : 'default',
            });
        })
        .catch((err) => {
            toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشلت عملية التحديث.", "The update failed.")});
            const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { status: newStatus } });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  async function onEditSubmit(values: z.infer<typeof editUserSchema>) {
    if (!firestore || !userToEdit) return;

    const userRef = doc(firestore, "users", userToEdit.id);
    updateDoc(userRef, { role: values.role })
      .then(() => {
        toast({
          title: bi("تم تحديث الدور!", "Role updated!"),
          description: bi(`تم تغيير دور ${userToEdit.name || 'المستخدم'} إلى ${roleMap[values.role] || values.role}.`, `${userToEdit.name || 'The user'}'s role was changed to ${roleMapEn[values.role] || values.role}.`),
        });
        setUserToEdit(null);
      })
      .catch((err) => {
        toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل تحديث الدور.", "Failed to update the role.")});
        const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { role: values.role } });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  return (
    <div className="space-y-6" dir={dir}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("المستخدمون", "Users")}</h1>
        <p className="text-sm text-muted-foreground">{bi("عرض وإدارة جميع المستخدمين المسجلين على المنصة.", "View and manage all users registered on the platform.")}</p>
      </div>
      <ExportButton
        title={bi("قائمة المستخدمين", "Users list")}
        filename={`users-${new Date().toISOString().slice(0,10)}`}
        headers={lang === 'en' ? ['Name', 'Email', 'Role', 'Organization', 'Status'] : ['الاسم', 'البريد الإلكتروني', 'الدور', 'المنظمة', 'الحالة']}
        rows={(users ?? []).map(u => [
          u.name || '',
          u.email || '',
          tRoleAr[u.role || ''] || u.role || '',
          orgMap.get(u.organizationId || '') || '',
          u.status || bi('نشط', 'Active'),
        ])}
        options={{ summary: { [bi('إجمالي المستخدمين', 'Total users')]: String((users ?? []).length) } }}
      />
    </div>
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{bi("قائمة المستخدمين", "Users list")}</CardTitle>
            <CardDescription>
              {!loading && users ? `${users.length} ${bi("مستخدم مسجل", "registered users")}` : bi('جاري التحميل...', 'Loading...')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{bi("الاسم", "Name")}</TableHead>
              <TableHead className="hidden md:table-cell">{bi("البريد الإلكتروني", "Email")}</TableHead>
              <TableHead>{bi("الدور", "Role")}</TableHead>
              <TableHead className="hidden md:table-cell">{bi("المنظمة", "Organization")}</TableHead>
              <TableHead className="text-center">{bi("الحالة", "Status")}</TableHead>
              <TableHead>
                <span className="sr-only">{bi("الإجراءات", "Actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && users?.map((user) => {
              const userName = user.name || bi('مستخدم بلا اسم', 'Unnamed user');
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt={userName} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                <TableCell>{tRoleMap[user.role || ''] || user.role || bi('غير محدد', 'Not specified')}</TableCell>
                <TableCell className="hidden md:table-cell">{orgMap.get(user.organizationId || "") || "EmpowerHub"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={user.status === "نشط" ? "default" : "secondary"}>
                    {user.status || bi("غير محدد", "Not specified")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{bi("قائمة", "Menu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{bi("الإجراءات", "Actions")}</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setUserToView(user)}>
                        <Eye className="ml-2 h-4 w-4" />
                        {bi("عرض الملف الشخصي", "View profile")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setUserToEdit(user)}>
                        <Edit className="ml-2 h-4 w-4" />
                        {bi("تعديل الدور", "Edit role")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(user)}
                        className={user.status === "نشط" ? "text-red-500" : ""}
                      >
                        <UserX className="ml-2 h-4 w-4" />
                        {user.status === "نشط" ? bi("حظر المستخدم", "Ban user") : bi("تفعيل المستخدم", "Activate user")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
             {!loading && (!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">{bi("لا يوجد مستخدمون لعرضهم.", "No users to display.")}</TableCell>
              </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!userToView} onOpenChange={(isOpen) => !isOpen && setUserToView(null)}>
        <DialogContent dir={dir}>
            <DialogHeader>
                <DialogTitle>{bi("الملف الشخصي", "Profile")}</DialogTitle>
                <DialogDescription>{bi("تفاصيل المستخدم", "User details for")} {userToView?.name || bi('بلا اسم', 'Unnamed')}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={userToView?.avatarUrl || `https://picsum.photos/seed/${userToView?.id}/100/100`} alt={userToView?.name || ''} />
                    <AvatarFallback>{userToView?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{userToView?.name || bi('مستخدم بلا اسم', 'Unnamed user')}</h3>
                    <p className="text-muted-foreground">{userToView?.email || bi('لا يوجد بريد إلكتروني', 'No email')}</p>
                </div>
                <div className="text-right space-y-2 border-t pt-4">
                    <p><strong>{bi("الدور:", "Role:")}</strong> {tRoleMap[userToView?.role || ''] || userToView?.role || bi('غير محدد', 'Not specified')}</p>
                    <p><strong>{bi("المنظمة:", "Organization:")}</strong> {orgMap.get(userToView?.organizationId || "") || bi('EmpowerHub (المنصة الرئيسية)', 'EmpowerHub (main platform)')}</p>
                    <p><strong>{bi("الحالة:", "Status:")}</strong> <Badge variant={userToView?.status === "نشط" ? "default" : "secondary"}>{userToView?.status || bi('غير محدد', 'Not specified')}</Badge></p>
                </div>
            </div>
        </DialogContent>
    </Dialog>


    <Dialog open={!!userToEdit} onOpenChange={(isOpen) => !isOpen && setUserToEdit(null)}>
      <DialogContent dir={dir}>
        <DialogHeader>
          <DialogTitle>{bi("تعديل دور المستخدم", "Edit user role")}</DialogTitle>
          <DialogDescription>{bi("تغيير دور", "Change the role of")} {userToEdit?.name || bi('المستخدم', 'the user')}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{bi("الدور الجديد", "New role")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={bi("اختر دورًا", "Select a role")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(tRoleMap).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
              <Button type="submit">{bi("حفظ التغييرات", "Save changes")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </div>
  );
}
