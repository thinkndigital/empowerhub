
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Download, Edit, Trash2, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/language-provider";

type TeamMember = { id: string; name?: string; email?: string; role?: string; status?: string; avatarUrl?: string };

const formSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  role: z.string({ required_error: "الرجاء اختيار دور." }),
});

const roleMap: { [key: string]: string } = {
    organization: "مدير منظمة",
    team_member: "عضو فريق",
};

const roleMapEn: { [key: string]: string } = {
    organization: "Organization admin",
    team_member: "Team member",
};

export default function TeamPage() {
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
    const { user, userProfile } = useUser();
    const { lang, dir } = useLanguage();
    const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
    const ORG_ID = userProfile?.organizationId;
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeam = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/org/team', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch team');
            const json = await res.json();
            setTeam(json.team || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!ORG_ID) return;
        try {
            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    role: values.role || 'team_member',
                    organizationId: ORG_ID,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast({ title: bi("تم بنجاح!", "Success!"), description: bi(`تمت إضافة "${values.name}". كلمة المرور: EmpowerHub@2024`, `"${values.name}" was added. Password: EmpowerHub@2024`) });
            form.reset();
            setIsAddDialogOpen(false);
            fetchTeam();
        } catch (err: any) {
            toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: err.message });
        }
    }

    const handleExport = () => {
        toast({ title: bi("جاري تصدير قائمة الفريق...", "Exporting team list..."), description: bi("سيتم تنزيل ملف CSV قريبًا.", "A CSV file will download shortly.") });
    }

    const handleDelete = async () => {
        if (!memberToDelete || !user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/org/team', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ memberId: memberToDelete.id }),
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast({ variant: "destructive", title: bi("تمت الإزالة!", "Removed!"), description: bi(`تمت إزالة "${memberToDelete.name}" من الفريق.`, `"${memberToDelete.name}" was removed from the team.`) });
            setMemberToDelete(null);
            fetchTeam();
        } catch {
            toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشلت إزالة العضو.", "Failed to remove member.") });
            setMemberToDelete(null);
        }
    }

  return (
    <div dir={dir} className="space-y-6 animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">{bi("فريق العمل", "Team")}</h1>
          <p className="page-subtitle">{bi("إدارة أعضاء فريق منظمتك وأدوارهم.", "Manage your organization's team members and their roles.")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            {bi("تصدير", "Export")}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                {bi("إضافة عضو", "Add member")}
              </Button>
            </DialogTrigger>
            <DialogContent dir={dir}>
              <DialogHeader>
                <DialogTitle>{bi("إضافة عضو جديد للفريق", "Add a new team member")}</DialogTitle>
                <DialogDescription>{bi("أدخل معلومات العضو الجديد وأرسل له دعوة.", "Enter the new member's information and send them an invitation.")}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>{bi("الاسم الكامل", "Full name")}</FormLabel><FormControl><Input placeholder={bi("مثال: خالد الأحمد", "e.g. Khaled Al-Ahmad")} {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>{bi("البريد الإلكتروني", "Email")}</FormLabel><FormControl><Input dir="ltr" placeholder="khaled@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bi("الدور", "Role")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={bi("اختر دورًا", "Choose a role")} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="organization">{bi("مدير منظمة", "Organization admin")}</SelectItem>
                          <SelectItem value="team_member">{bi("عضو فريق", "Team member")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">{bi("إلغاء", "Cancel")}</Button></DialogClose>
                    <Button type="submit">{bi("إرسال دعوة", "Send invitation")}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{bi("قائمة أعضاء الفريق", "Team members list")}</CardTitle>
          <CardDescription>{!loading ? bi(`${team.length} عضو`, `${team.length} member${team.length === 1 ? '' : 's'}`) : bi('جاري التحميل...', 'Loading...')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{bi("الاسم", "Name")}</TableHead>
              <TableHead className="hidden md:table-cell">{bi("البريد الإلكتروني", "Email")}</TableHead>
              <TableHead>{bi("الدور", "Role")}</TableHead>
              <TableHead className="text-center">{bi("الحالة", "Status")}</TableHead>
              <TableHead>
                <span className="sr-only">{bi("الإجراءات", "Actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(3)].map((_, i) => (
                 <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-9 w-9 rounded-xl" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-xl" /></TableCell>
                </TableRow>
            ))}
            {!loading && team.map((user) => {
              const userName = user.name || bi('عضو فريق بلا اسم', 'Unnamed team member');
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 rounded-xl shrink-0">
                      <AvatarImage src={user.avatarUrl} alt={userName} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                <TableCell>{(lang === 'en' ? roleMapEn : roleMap)[user.role || ''] || user.role || bi('غير محدد', 'Unspecified')}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={user.status || 'active'} />
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
                      <DropdownMenuItem onClick={() => toast({ title: bi("سيتم فتح نافذة تعديل الدور قريبًا.", "The role-edit dialog will open soon.")})}>
                        <Edit className="ml-2 h-4 w-4" />
                        {bi("تعديل الدور", "Edit role")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setMemberToDelete(user);}}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        {bi("إزالة من الفريق", "Remove from team")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
            {!loading && team.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users className="h-6 w-6" /></div>
                    <p className="empty-state-title">{bi("لا يوجد أعضاء في الفريق", "No team members")}</p>
                    <p className="empty-state-desc">{bi("أضف أعضاء لفريق عمل منظمتك", "Add members to your organization's team")}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
     <AlertDialog open={!!memberToDelete} onOpenChange={(isOpen) => !isOpen && setMemberToDelete(null)}>
        <AlertDialogContent dir={dir}>
            <AlertDialogHeader>
                <AlertDialogTitle>{bi("هل أنت متأكد تمامًا؟", "Are you absolutely sure?")}</AlertDialogTitle>
                <AlertDialogDescription>
                    {bi(`هذا الإجراء سيقوم بإزالة "${memberToDelete?.name || 'العضو'}" من فريق العمل.`, `This action will remove "${memberToDelete?.name || 'the member'}" from the team.`)}
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
