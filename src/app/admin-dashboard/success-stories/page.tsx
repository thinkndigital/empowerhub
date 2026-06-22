"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

interface Story { id: string; beneficiaryName: string; beneficiaryRole: string; content: string; avatarUrl: string; stars: number; orgName: string; }

export default function AdminSuccessStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/success-stories').then(r => r.json()).then(d => setStories(d.stories || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">قصص النجاح</h1>
          <p className="text-sm text-muted-foreground mt-1">قصص النجاح المنشورة من جميع المنظمات</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{stories.length} قصة</Badge>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Quote className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">لا توجد قصص نجاح بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map(story => (
            <div key={story.id} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`h-3.5 w-3.5 ${j < story.stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">&ldquo;{story.content}&rdquo;</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={story.avatarUrl} alt={story.beneficiaryName} />
                  <AvatarFallback className="text-xs">{story.beneficiaryName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{story.beneficiaryName}</p>
                  <p className="text-xs text-muted-foreground truncate">{story.beneficiaryRole}{story.orgName ? ` · ${story.orgName}` : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
