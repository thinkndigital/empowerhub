"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Clock, Tag, Calendar } from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
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

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchArticle() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/articles/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const json = await res.json();
        setArticle(json.article);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-700">المقال غير موجود</h1>
        <Button onClick={() => router.push('/articles')}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للمقالات
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Cover image */}
      {article.coverImageUrl && (
        <div className="w-full aspect-video max-h-[480px] overflow-hidden bg-gray-100">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.push('/articles')} className="mb-6 gap-2 text-slate-500">
          <ArrowRight className="h-4 w-4" />
          العودة للمقالات
        </Button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 leading-snug mb-4">{article.title}</h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-lg text-gray-500 mb-6 border-r-4 border-indigo-300 pr-4">{article.excerpt}</p>
        )}

        {/* Author card */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 mb-6">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={article.authorAvatarUrl} alt={article.authorName} />
            <AvatarFallback className="text-lg font-bold">{article.authorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{article.authorName}</span>
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[article.authorRole] || article.authorRole}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              {article.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(article.publishedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime} دقيقة قراءة
              </span>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <div className="prose prose-slate max-w-none text-slate-700 leading-loose text-base whitespace-pre-line">
          {article.content}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              الوسوم
            </p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
