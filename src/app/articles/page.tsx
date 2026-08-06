"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Clock, Tag } from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  authorRole: 'mentor' | 'coach';
  publishedAt: string | null;
  tags: string[];
  readTime: number;
}

const ROLE_LABELS: Record<string, string> = {
  mentor: 'مرشد',
  coach: 'مدرب',
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'coach'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const url = filter === 'all' ? '/api/public/articles' : `/api/public/articles?role=${filter}`;
        const res = await fetch(url);
        const json = await res.json();
        setArticles(json.articles || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [filter]);

  const filtered = articles.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.excerpt?.toLowerCase().includes(q) ||
      a.authorName?.toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Page header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <span className="text-border/80 select-none">/</span>
            <span className="text-foreground font-medium">المقالات</span>
          </nav>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">معرفة وخبرة</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">المقالات</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
            رؤى ومعرفة من مرشدين ومدربين متميزين
          </p>
        </div>
      </div>

      <div className="container py-10">
        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Filter tabs */}
          <div className="flex gap-2 bg-muted rounded-xl p-1">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'mentor', label: 'مرشدون' },
              { key: 'coach', label: 'مدربون' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === tab.key
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في المقالات..."
              className="pr-9"
            />
          </div>
        </div>

        {/* Articles grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded" />
                  <div className="h-3 bg-muted/60 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">لا توجد مقالات</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(article => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col"
              >
                {/* Cover */}
                <div className="aspect-video bg-muted overflow-hidden">
                  {article.coverImageUrl ? (
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-4xl opacity-20">📝</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1 gap-2">
                  {/* Title */}
                  <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{article.excerpt}</p>
                  )}

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author + Meta */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={article.authorAvatarUrl} alt={article.authorName} />
                      <AvatarFallback className="text-xs">{article.authorName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground truncate">{article.authorName}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {ROLE_LABELS[article.authorRole] || article.authorRole}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatDate(article.publishedAt)}</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />{article.readTime} د
                        </span>
                      </div>
                    </div>
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
