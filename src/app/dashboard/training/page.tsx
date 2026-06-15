"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookMarked, PlayCircle, BookHeart } from "lucide-react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";

type Course = {
    id: string;
    title: string;
    description?: string;
    category?: string;
    status: "منشورة" | "مسودة";
};

const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="col-span-full flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
            <BookHeart className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">{description}</p>
    </div>
);


export default function TrainingPage() {
    const firestore = useFirestore();

    // In a real app, this would also filter by courses assigned to the user
    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"), where("status", "==", "منشورة"));
    }, [firestore]);

    const { data: courses, isLoading: loading } = useCollection<Course>(coursesQuery);

    // In a real app, this data would be fetched for the user. For now, it's reset.
    const courseProgress: { [key: string]: number } = {};
    
    const inProgressCourses = courses?.filter(c => (courseProgress[c.id] || 0) < 100 && (courseProgress[c.id] || 0) > 0) || [];
    const notStartedCourses = courses?.filter(c => (courseProgress[c.id] || 0) === 0) || [];
    const completedCourses = courses?.filter(c => (courseProgress[c.id] || 0) === 100) || [];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الدورات التدريبية</h1>
        <p className="text-muted-foreground">
          الدورات المتاحة لك.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {loading && [...Array(2)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
                    <CardContent><Skeleton className="h-6 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
            {[...inProgressCourses, ...notStartedCourses].map((course) => {
                const progress = courseProgress[course.id] || 0;
                return (
                    <Card key={course.id}>
                        <CardHeader>
                            <CardTitle>{course.title}</CardTitle>
                            <CardDescription>{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground">{progress}% مكتمل</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" asChild>
                                <Link href={`/dashboard/training/${course.id}`}>
                                    <PlayCircle className="ml-2 h-4 w-4" />
                                    {progress > 0 ? 'متابعة الدورة' : 'ابدأ الدورة'}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
             {!loading && courses?.length === 0 && (
                <EmptyState 
                    title="لا توجد دورات معينة"
                    description="لم يتم تعيين أي دورات لك بعد. تواصل مع مدير منظمتك لطلب الوصول إلى الدورات التدريبية."
                />
             )}
        </div>
      </div>
      
       <div>
        <h2 className="text-2xl font-bold tracking-tight">الدورات المكتملة</h2>
        <p className="text-muted-foreground">
          أحسنت! استمر في التعلم والنمو.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {loading && [...Array(1)].map((_, i) => (
                <Card key={i} className="bg-muted/50">
                    <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
            {completedCourses.map((course) => (
                <Card key={course.id} className="bg-muted/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-md">
                                <BookMarked className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{course.title}</CardTitle>
                        </div>
                        <CardDescription className="pt-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                         <Button variant="secondary" className="w-full" asChild>
                           <Link href={`/dashboard/training/${course.id}`}>
                                مراجعة الدورة
                           </Link>
                         </Button>
                    </CardFooter>
                </Card>
            ))}
            {!loading && completedCourses.length === 0 && (
                <EmptyState 
                    title="لم تكمل أي دورات بعد"
                    description="عندما تنتهي من إحدى الدورات، ستظهر هنا. استمر في التقدم!"
                />
            )}
        </div>
      </div>
    </div>
  );
}
