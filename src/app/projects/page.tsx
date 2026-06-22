"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapPin, Calendar, Building2 } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  organizationId: string;
  organizationName: string;
  type: string;
  location: string;
  deadline: string;
  publishedAt: string | null;
}

const PROJECT_TYPES = ['الكل', 'تدريب', 'تطوع', 'وظيفة', 'منحة', 'مبادرة', 'أخرى'];

const TYPE_COLORS: Record<string, string> = {
  'تدريب': 'bg-blue-100 text-blue-700',
  'تطوع': 'bg-green-100 text-green-700',
  'وظيفة': 'bg-purple-100 text-purple-700',
  'منحة': 'bg-yellow-100 text-yellow-700',
  'مبادرة': 'bg-orange-100 text-orange-700',
  'أخرى': 'bg-gray-100 text-gray-700',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('الكل');

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch('/api/public/projects');
        const json = await res.json();
        setProjects(json.projects || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const filtered = typeFilter === 'الكل'
    ? projects
    : projects.filter(p => p.type === typeFilter);

  function deadlineLabel(deadline: string) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: 'انتهى التقديم', color: 'text-red-500' };
    if (diff === 0) return { text: 'آخر يوم', color: 'text-orange-500' };
    if (diff <= 7) return { text: `${diff} أيام متبقية`, color: 'text-orange-500' };
    return { text: `${diff} يوم متبقي`, color: 'text-green-600' };
  }

  function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">الفرص والمشاريع</h1>
          <p className="text-indigo-200 text-lg">اكتشف فرص التدريب والتطوع والوظائف والمنح</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Filter */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm font-medium text-slate-600 shrink-0">تصفية حسب النوع:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">لا توجد فرص في هذه الفئة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(project => {
              const dl = project.deadline ? deadlineLabel(project.deadline) : null;
              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Cover */}
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {project.coverImageUrl ? (
                      <img
                        src={project.coverImageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-4xl opacity-20">💼</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1 gap-2">
                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_COLORS[project.type] || TYPE_COLORS['أخرى']}`}>
                        {project.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-800 line-clamp-2">{project.title}</h3>

                    {/* Description */}
                    <p className="text-gray-500 text-sm line-clamp-2 flex-1">{project.description}</p>

                    {/* Meta */}
                    <div className="space-y-1 text-xs text-gray-400">
                      {project.organizationName && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {project.organizationName}
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </div>
                      )}
                      {dl && (
                        <div className={`flex items-center gap-1 font-medium ${dl.color}`}>
                          <Calendar className="h-3 w-3" />
                          {dl.text}
                          {project.deadline && (
                            <span className="text-gray-400 font-normal">— {formatDate(project.deadline)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link href={`/projects/${project.id}`} className="mt-2">
                      <Button size="sm" className="w-full">
                        تقديم الآن
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
