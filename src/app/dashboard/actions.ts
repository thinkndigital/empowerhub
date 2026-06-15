'use server';

import {
  type PersonalizedEmpowermentRecommendationsOutput,
} from '@/ai/flows/personalized-empowerment-recommendations-flow';

export async function getAiRecommendations(): Promise<
  PersonalizedEmpowermentRecommendationsOutput | { error: string }
> {
  // The AI feature is disabled to ensure successful deployment.
  // We return an error message to be displayed in the UI.
  console.warn(
    'AI recommender feature has been disabled to resolve a deployment issue.'
  );
  return { error: 'ميزة التوصيات غير متاحة حالياً.' };
}
