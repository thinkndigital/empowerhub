"use client";

import { useState } from "react";
import { BookOpen, Bot, Globe, Sparkles, UserCheck } from "lucide-react";

import { getAiRecommendations } from "./actions";
import type { PersonalizedEmpowermentRecommendationsOutput } from "@/ai/flows/personalized-empowerment-recommendations-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Recommendation = PersonalizedEmpowermentRecommendationsOutput["recommendations"][0];

const iconMap = {
  training_module: <BookOpen className="h-5 w-5 text-primary" />,
  external_resource: <Globe className="h-5 w-5 text-accent-foreground" />,
  mentorship_topic: <UserCheck className="h-5 w-5 text-secondary-foreground" />,
};

export function AiRecommender() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);

    const result = await getAiRecommendations();

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: result.error,
      });
    } else {
      setRecommendations(result.recommendations);
    }
    setIsLoading(false);
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
           <Sparkles className="h-6 w-6 text-primary" />
           <CardTitle>توصيات مدعومة بالذكاء الاصطناعي</CardTitle>
        </div>
        <CardDescription>
          احصل على اقتراحات مخصصة لتسريع نموك.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingState />}
        {!isLoading && !recommendations && <InitialState onClick={handleGetRecommendations} />}
        {!isLoading && recommendations && <RecommendationsList recommendations={recommendations} />}
      </CardContent>
    </Card>
  );
}

function InitialState({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center p-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
      <div className="bg-primary/10 p-3 rounded-full">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold">هل أنت مستعد لاتخاذ خطوتك التالية؟</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        سيقوم مدربنا الذكي بتحليل تقدمك وأهدافك ليوصي بالموارد الأكثر تأثيرًا لك.
      </p>
      <Button onClick={onClick}>
        <Sparkles className="mr-2 h-4 w-4" />
        أنشئ مساري
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div key={rec.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="bg-muted p-2.5 rounded-full">
            {iconMap[rec.type]}
          </div>
          <div>
            <h4 className="font-semibold">{rec.title}</h4>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
            {rec.link && (
              <a href={rec.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 inline-block">
                عرض المصدر &rarr;
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
