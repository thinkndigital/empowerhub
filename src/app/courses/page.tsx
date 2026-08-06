"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BookOpen, Users, Clock } from "lucide-react";
import { COURSE_CATEGORIES } from "@/lib/course-category";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  coverImageUrl: string;
  duration: string;
  coachName: string;
  coachAvatarUrl: string;
  enrollmentCount: number;
  level: string;
  language: string;
  tags: string[];
  category: string;
}

const LEVELS = ['الكل', 'مبتدئ', 'متوسط', 'متقدم'];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('الكل');
  const [categoryFilter, setCategoryFilter] = useState('الكل');

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await fetch('/api/public/courses?limit=48');
        const json = await res.json();
        setCourses(json.courses || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const categoryOptions = ['الكل', ...Array.from(new Set([
    ...COURSE_CATEGORIES,
    ...courses.map(c => c.category).filter(Boolean),
  ]))];

  const filtered = courses
    .filter(c => levelFilter === 'الكل' || c.level === levelFilter)
    .filter(c => categoryFilter === 'الكل' || c.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Page header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <span className="text-border/80 select-none">/</span>
            <span className="text-foreground font-medium">الدورات</span>
          </nav>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">دورات تدريبية</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">الدورات التدريبية</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
            محتوى تدريبي متخصص من مدربين معتمدين في مختلف المجالات
          </p>
        </div>
      </div>

      <div className="container py-10">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm font-medium text-muted-foreground shrink-0">تصفية حسب الفئة:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm font-medium text-muted-foreground shrink-0">المستوى:</span>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Courses grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">لا توجد دورات في هذه الفئة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(course => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col"
              >
                {/* Cover */}
                <div className="aspect-video bg-muted overflow-hidden">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/30" />
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {course.category && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground w-fit">
                        {course.category}
                      </span>
                    )}
                    {course.level && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary w-fit">
                        {course.level}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{course.description}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {course.coachName && (
                      <span>{course.coachName}</span>
                    )}
                    {course.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </div>
                    )}
                    {course.enrollmentCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.enrollmentCount}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="font-bold text-foreground">
                      {course.price ? `${course.price} د.أ` : 'مجاني'}
                    </span>
                    <Button size="sm" variant="outline">التفاصيل</Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
