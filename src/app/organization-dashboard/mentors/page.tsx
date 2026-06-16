"use client";

import { UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


const addMentorSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  expertise: z.string().min(2, { message: "يجب أن يكون التخصص حرفين على الأقل." }),
});

const assignToBeneficiarySchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار مستفيد." }),
});

type Mentor = UserProfile & {
  expertise?: string;
};


export default function OrgMentorsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [mentorToAssign, setMentorToAssign] = useState<Mentor | null>(null);
    
    // Get mentors assigned to THIS organization
    const orgMentorsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.organizationId) return null;
        return query(collection(firestore, "users"), where("role", "==", "mentor"), where("organizationId", "==", userProfile.organizationId));
    }, [firestore, userProfile?.organizationId]);
    const { data: orgMentors, isLoading: orgMentorsLoading } = useCollection<Mentor>(orgMentorsQuery);

    // Get ALL mentors on the platform to find unassigned ones
    const allMentorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("role", "==", "mentor"));
    }, [firestore]);
    const { data: allMentors, isLoading: allMentorsLoading } = useCollection<Mentor>(allMentorsQuery);

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.organizationId) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", userProfile.organizationId));
    }, [firestore, userProfile?.organizationId]);
    const { data: beneficiaries, isLoading: beneficiariesLoading } = useCollection<UserProfile>(beneficiariesQuery);

    const unassignedMentors = useMemo(() => {
        if (!allMentors) return [];
        return allMentors.filter(m => !m.organizationId);
    }, [allMentors]);

    const loading = orgMentorsLoading || allMentorsLoading || beneficiariesLoading;
    
    const form = useForm<z.infer<typeof addMentorSchema>>({
        resolver: zodResolver(addMentorSchema),
        defaultValues: { name: "", email: "", expertise: "" },
    });

    const assignForm = useForm<z.infer<typeof assignToBeneficiarySchema>>({
        resolver: zodResolver(assignToBeneficiarySchema),
    });

    async function handleAddMentor(values: z.infer<typeof addMentorSchema>) {
        if (!userProfile?.organizationId) return;
        try {
            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    role: 'mentor',
                    organizationId: userProfile.organizationId,
                    expertise: values.expertise,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast({ title: "تمت الإضافة بنجاح!", description: `تمت إضافة المرشد ${values.name}. كلمة المرور المؤقتة: EmpowerHub@2024` });
            setIsAddDialogOpen(false);
            form.reset();
        } catch (err: any) {
            toast({ variant: "destructive", title: "خطأ!", description: err.message });
        }
    }

    async function handleAssignMentor(mentor: Mentor) {
        if (!firestore || !userProfile?.organizationId) return;
        const mentorRef = doc(firestore, 'users', mentor.id);

        updateDoc(mentorRef, { organizationId: userProfile.organizationId })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين المرشد ${mentor.name} إلى منظمتك.` });
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تعيين المرشد." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: mentorRef.path, operation: 'update', requestResourceData: { organizationId: userProfile.organizationId } }));
            });
    }

    async function handleAssignToBeneficiary(values: z.infer<typeof assignToBeneficiarySchema>) {
        if (!firestore || !mentorToAssign) return;
        const beneficiaryRef = doc(firestore, 'users', values.beneficiaryId);

        updateDoc(beneficiaryRef, { mentorId: mentorToAssign.id })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين المرشد ${mentorToAssign.name} للمستفيد.` });
                setMentorToAssign(null);
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تعيين المرشد للمستفيد." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: beneficiaryRef.path, operation: 'update', requestResourceData: { mentorId: mentorToAssign.id } }));
            });
    }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle>المرشدون</CardTitle>
                  <CardDescription>
                  إدارة وتعيين المرشدين لمنظمتك.
                  </CardDescription>
              </div>
               <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                      <Button>
                          <UserPlus className="ml-2 h-4 w-4" />
                          إضافة أو تعيين مرشد
                      </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl" className="sm:max-w-lg">
                      <DialogHeader>
                          <DialogTitle>إدارة المرشدين</DialogTitle>
                          <DialogDescription>
                              إضافة مرشد جديد يدويًا أو تعيين مرشد مسجل بالفعل في المنصة.
                          </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="assign" className="pt-4">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="assign">تعيين مرشد مسجل</TabsTrigger>
                              <TabsTrigger value="add">إضافة مرشد جديد</TabsTrigger>
                          </TabsList>
                          <TabsContent value="assign">
                              <p className="text-sm text-muted-foreground my-4">اختر مرشدًا من القائمة لتعيينه إلى منظمتك.</p>
                              <ScrollArea className="h-60">
                                  <div className="space-y-2 pr-4">
                                      {unassignedMentors.length > 0 ? unassignedMentors.map(mentor => (
                                          <div key={mentor.id} className="flex items-center justify-between p-2 rounded-md border">
                                              <div className="flex items-center gap-2">
                                                  <Avatar className="h-8 w-8">
                                                      <AvatarImage src={mentor.avatarUrl || `https://picsum.photos/seed/${mentor.id}/40/40`} />
                                                      <AvatarFallback>{mentor.name?.charAt(0) || 'M'}</AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                      <p className="font-medium">{mentor.name || 'مرشد بلا اسم'}</p>
                                                      <p className="text-xs text-muted-foreground">{mentor.expertise || 'خبرة عامة'}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignMentor(mentor)}>تعيين</Button>
                                          </div>
                                      )) : <p className="text-center text-muted-foreground py-8">لا يوجد مرشدون غير معينين حاليًا.</p>}
                                  </div>
                              </ScrollArea>
                          </TabsContent>
                          <TabsContent value="add">
                              <Form {...form}>
                                  <form onSubmit={form.handleSubmit(handleAddMentor)} className="space-y-4 pt-4">
                                      <FormField control={form.control} name="name" render={({ field }) => (
                                          <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="اسم المرشد" {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                       <FormField control={form.control} name="email" render={({ field }) => (
                                          <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" placeholder="mentor@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                       <FormField control={form.control} name="expertise" render={({ field }) => (
                                          <FormItem><FormLabel>مجال الخبرة</FormLabel><FormControl><Input placeholder="ريادة الأعمال، التسويق الرقمي..." {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                      <DialogFooter>
                                          <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                                          <Button type="submit">إضافة المرشد</Button>
                                      </DialogFooter>
                                  </form>
                              </Form>
                          </TabsContent>
                      </Tabs>
                  </DialogContent>
               </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>مجال الخبرة</TableHead>
                <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-32" /></TableCell>
                  </TableRow>
              ))}
              {!loading && orgMentors?.map((mentor) => {
                const mentorName = mentor.name || 'مرشد بلا اسم';
                return (
                <TableRow key={mentor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mentor.avatarUrl || `https://picsum.photos/seed/${mentor.id}/40/40`} alt={mentorName} />
                        <AvatarFallback>{mentorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{mentorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{mentor.expertise || 'خبرة عامة'}</TableCell>
                  <TableCell className="hidden md:table-cell">{mentor.email || '-'}</TableCell>
                  <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setMentorToAssign(mentor)}>
                          <User className="ml-2 h-4 w-4" />
                          تعيين لمستفيد
                      </Button>
                  </TableCell>
                </TableRow>
              )})}
              {!loading && (!orgMentors || orgMentors.length === 0) && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">لا يوجد مرشدون تابعون لهذه المنظمة.</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!mentorToAssign} onOpenChange={(isOpen) => { if (!isOpen) setMentorToAssign(null) }}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>تعيين المرشد: {mentorToAssign?.name}</DialogTitle>
                <DialogDescription>اختر مستفيدًا لتعيين هذا المرشد له.</DialogDescription>
            </DialogHeader>
            <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssignToBeneficiary)} className="space-y-4 pt-4">
                     <FormField
                        control={assignForm.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>المستفيد</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر مستفيدًا..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {beneficiaries && beneficiaries.length > 0 ? 
                                            beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>) :
                                            <SelectItem value="loading" disabled>لا يوجد مستفيدون في منظمتك</SelectItem>
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                        <Button type="submit">حفظ التعيين</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
