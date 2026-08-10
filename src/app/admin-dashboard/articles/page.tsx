"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Article { id: string; title: string; excerpt: string; authorName: string; authorRole: string; publishedAt: string | null; tags: string[]; readTime: number; }

function formatDate(d: string | null, locale: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

const roleLabel: Record<string, string> = { mentor: 'مرشد', coach: 'مدرب' };
const roleLabelEn: Record<string, string> = { mentor: 'Mentor', coach: 'Coach' };

export default function AdminArticlesPage() {
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
  const tRoleLabel = lang === 'en' ? roleLabelEn : roleLabel;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/articles').then(r => r.json()).then(d => setArticles(d.articles || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("المقالات", "Articles")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bi("جميع المقالات المنشورة على المنصة", "All articles published on the platform")}</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{articles.length} {bi("مقالة", "articles")}</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{bi("المقالة", "Article")}</TableHead>
              <TableHead className="text-right">{bi("الكاتب", "Author")}</TableHead>
              <TableHead className="text-right">{bi("الدور", "Role")}</TableHead>
              <TableHead className="text-right">{bi("تاريخ النشر", "Published")}</TableHead>
              <TableHead className="text-right">{bi("وقت القراءة", "Read time")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : articles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{bi("لا توجد مقالات بعد.", "No articles yet.")}</p></TableCell></TableRow>
            ) : articles.map(a => (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-medium text-sm line-clamp-1">{a.title}</p>
                  {a.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.excerpt}</p>}
                </TableCell>
                <TableCell className="text-sm">{a.authorName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{tRoleLabel[a.authorRole] || a.authorRole}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(a.publishedAt, locale)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />{a.readTime} {bi("د", "min")}
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
