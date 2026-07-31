"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock } from "lucide-react";

interface Article { id: string; title: string; excerpt: string; authorName: string; authorRole: string; publishedAt: string | null; tags: string[]; readTime: number; }

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

const roleLabel: Record<string, string> = { mentor: 'مرشد', coach: 'مدرب' };

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/articles').then(r => r.json()).then(d => setArticles(d.articles || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المقالات</h1>
          <p className="text-sm text-muted-foreground mt-1">جميع المقالات المنشورة على المنصة</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{articles.length} مقالة</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المقالة</TableHead>
              <TableHead className="text-right">الكاتب</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              <TableHead className="text-right">تاريخ النشر</TableHead>
              <TableHead className="text-right">وقت القراءة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : articles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد مقالات بعد.</p></TableCell></TableRow>
            ) : articles.map(a => (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-medium text-sm line-clamp-1">{a.title}</p>
                  {a.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.excerpt}</p>}
                </TableCell>
                <TableCell className="text-sm">{a.authorName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{roleLabel[a.authorRole] || a.authorRole}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(a.publishedAt)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />{a.readTime} د
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
