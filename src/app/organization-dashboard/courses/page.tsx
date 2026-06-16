"use client";

import { BookUp } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { collection, query, where, updateDoc, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

type Course = {
    id: string;
    title: string;
    category?: string;
};

type Beneficiary = {
    id: string;
    name: string;
};

export default function OrgCoursesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const ORG_ID = userProfile?.organizationId;
    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<Record<string, Set<string>>>({});
    const [assigning, setAssigning] = useState(false);

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"));
    }, [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !ORG_ID) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", ORG_ID));
    }, [firestore, ORG_ID]);
    const { data: beneficiaries, isLoading: beneficiariesLoading } = useCollection<Beneficiary>(beneficiariesQuery);

    const loading = coursesLoading || beneficiariesLoading;


    const toggleBeneficiary = (courseId: string, beneficiaryId: string) => {
        setSelectedBeneficiaries(prev => {
            const courseSet = new Set(prev[courseId] || []);
            if (courseSet.has(beneficiaryId)) courseSet.delete(beneficiaryId);
            else courseSet.add(beneficiaryId);
            return { ...prev, [courseId]: courseSet };
        });
    };

    const handleAssign = async (courseId: string, courseTitle: string) => {
        if (!firestore) return;
        const ids = Array.from(selectedBeneficiaries[courseId] || []);
        if (ids.length === 0) {
            toast({ variant: "destructive", title: "لم تختر أحداً", description: "اختر مستفيداً واحداً على الأقل." });
            return;
        }
        setAssigning(true);
        try {
            await Promise.all(ids.map(id =>
                updateDoc(doc(firestore, 'users', id), { assignedCourses: [courseId] })
            ));
            toast({ title: "تم التعيين!", description: `تم تعيين دورة "${courseTitle}" لـ ${ids.length} مستفيد.` });
            setSelectedBeneficiaries(prev => ({ ...prev, [courseId]: new Set() }));
        } catch {
            toast({ variant: "destructive", title: "خطأ!", description: "فشل التعيين." });
        } finally {
            setAssigning(false);
        }
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>الدورات التدريبية</CardTitle>
        <CardDescription>
          تعيين الدورات التدريبية للمستفيدين في منظمتك.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان الدورة</TableHead>
              <TableHead className="hidden md:table-cell">الفئة</TableHead>
              <TableHead className="text-center">عدد المعينين</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading && [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-[50px] mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-[150px] float-right" /></TableCell>
                </TableRow>
            ))}
            {!loading && courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                 <TableCell className="hidden md:table-cell">{course.category || 'غير مصنف'}</TableCell>
                <TableCell className="text-center">0</TableCell>
                <TableCell className="text-right">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <BookUp className="ml-2 h-4 w-4" />
                                تعيين لمستفيدين
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                             <DialogHeader>
                                <DialogTitle>تعيين دورة: {course.title}</DialogTitle>
                                <DialogDescription>
                                    اختر المستفيدين لتعيين هذه الدورة لهم.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-64 overflow-y-auto">
                                <p className="text-sm font-medium">قائمة المستفيدين</p>
                                <div className="space-y-2">
                                {beneficiaries && beneficiaries.length > 0 ? beneficiaries.map(b => (
                                    <div key={b.id} className="flex items-center space-x-2 space-x-reverse">
                                        <Checkbox
                                            id={`cb-${course.id}-${b.id}`}
                                            checked={selectedBeneficiaries[course.id]?.has(b.id) || false}
                                            onCheckedChange={() => toggleBeneficiary(course.id, b.id)}
                                        />
                                        <Label htmlFor={`cb-${course.id}-${b.id}`} className="font-normal">{b.name}</Label>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">لا يوجد مستفيدون في منظمتك.</p>
                                )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleAssign(course.id, course.title)} disabled={assigning || !beneficiaries || beneficiaries.length === 0}>
                                    {assigning ? "جاري التعيين..." : "تأكيد التعيين"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
            ))}
             {!loading && (!courses || courses.length === 0) && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">لا توجد دورات متاحة.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
