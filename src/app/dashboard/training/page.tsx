"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookMarked, PlayCircle, BookHeart, Clock, BarChart3, CheckCircle2, Search } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect, useCallback } from "react";

type Course = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  progress?: number;
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="col-span-full flex flex-col items-center justify-center text-center p-12 bg-muted/40 rounded-xl border border-dashed border-border">
    <div className="p-4 bg-primary/10 rounded-full mb-4">
      <BookHeart className="h-10 w-10 text-primary" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">{description}</p>
  </div>
);

const CourseCard = ({ course, progress, completed = false }: { course: Course; progress: number; completed?: boolean }) => (
  <Card className={`card-hover flex flex-col border-0 shadow-sm ${completed ? "bg-muted/30" : "bg-card"}`}>
    <CardHeader>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? "bg-primary/10" : "bg-primary"}`}>
            {completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <PlayCircle className="h-5 w-5 text-white" />}
          </div>
          <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
        </div>
        {course.category && <Badge variant="outline" className="text-xs shrink-0">{course.category}</Badge>}
      </div>
      {course.description && (
        <CardDescription className="text-sm leading-relaxed line-clamp-2 pr-12">{course.description}</CardDescription>
      )}
    </CardHeader>
    <CardContent className="flex-grow">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />التقدم</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        {!completed && progress > 0 && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Clock className="h-3 w-3" />جارٍ — تبقى {100 - progress}% للإكمال
          </p>
        )}
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full" variant={completed ? "secondary" : "default"} asChild>
        <Link href={`/dashboard/training/${course.id}`}>
          {completed
            ? <><BookMarked className="ml-2 h-4 w-4" />مراجعة الدورة</>
            : progress > 0
              ? <><PlayCircle className="ml-2 h-4 w-4" />متابعة الدورة</>
              : <><PlayCircle className="ml-2 h-4 w-4" />ابدأ الدورة</>}
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const SkeletonCard = () => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-6 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-2 w-full mt-2" />
      <Skeleton className="h-10 w-full mt-2" />
    </CardContent>
  </Card>
);

export default function TrainingPage() {
  const { user: authUser, loading: authLoading } = useUser();
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const headers = { authorization: `Bearer ${token}` };

      const [cRes, pRes] = await Promise.all([
        fetch('/api/beneficiary/courses', { headers }),
        fetch(`/api/beneficiary/courses/progress`, { headers }).catch(() => ({ ok: false, json: async () => ({}) })),
      ]);

      const cJson = await cRes.json();
      setCourses(cJson.courses || []);

      if ((pRes as Response).ok) {
        const pJson = await (pRes as Response).json();
        setProgressMap(pJson.progressMap || {});
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) fetchData();
  }, [authLoading, authUser, fetchData]);

  const filtered = useMemo(() => {
    if (!courses) return [];
    return courses.filter(c =>
      !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.category || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [courses, search]);

  const inProgress = filtered.filter(c => (progressMap[c.id] || 0) > 0 && (progressMap[c.id] || 0) < 100);
  const notStarted = filtered.filter(c => !progressMap[c.id] || progressMap[c.id] === 0);
  const completedC = filtered.filter(c => (progressMap[c.id] || 0) >= 100);
  const totalCourses = courses.length;
  const totalCompleted = courses.filter(c => (progressMap[c.id] || 0) >= 100).length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الدورات التدريبية</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "جاري التحميل..." : `${totalCompleted} من ${totalCourses} دورات مكتملة`}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن دورة..." className="pr-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {!loading && totalCourses > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-l from-primary/5 to-accent/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">التقدم الإجمالي في مساري التعليمي</span>
              <span className="text-sm font-bold text-primary">{Math.round((totalCompleted / totalCourses) * 100)}%</span>
            </div>
            <Progress value={Math.round((totalCompleted / totalCourses) * 100)} className="h-3" />
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />{totalCompleted} مكتملة</span>
              <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3 text-accent" />{inProgress.length} جارية</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{notStarted.length} لم تبدأ</span>
            </div>
          </CardContent>
        </Card>
      )}

      {(loading || inProgress.length > 0) && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-accent" />جارية</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? [...Array(2)].map((_, i) => <SkeletonCard key={i} />) : inProgress.map(c => <CourseCard key={c.id} course={c} progress={progressMap[c.id] || 0} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookHeart className="h-5 w-5 text-primary" />الدورات المتاحة</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            : notStarted.length > 0
              ? notStarted.map(c => <CourseCard key={c.id} course={c} progress={0} />)
              : <EmptyState title="لا توجد دورات متاحة" description="لم يتم تعيين أي دورات لك بعد. تواصل مع مدير منظمتك." />}
        </div>
      </section>

      {(loading || completedC.length > 0) && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />مكتملة
            {completedC.length > 0 && <Badge className="bg-primary/10 text-primary border-primary/20">{completedC.length}</Badge>}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? <SkeletonCard /> : completedC.map(c => <CourseCard key={c.id} course={c} progress={100} completed />)}
          </div>
        </section>
      )}
    </div>
  );
}
