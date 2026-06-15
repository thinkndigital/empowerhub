'use server';
/**
 * @fileOverview This file now only contains the type definitions for the AI recommender
 * to prevent build failures. The runtime functionality is disabled.
 */

import {z} from 'zod';

const PersonalizedEmpowermentRecommendationsInputSchema = z.object({
  beneficiaryId: z.string().describe('The unique identifier for the beneficiary.'),
  currentProgress: z
    .string()
    .describe(
      "A summary of the beneficiary's current learning progress and achievements."
    ),
  skills: z
    .array(z.string())
    .describe('A list of key skills the beneficiary currently possesses.'),
  goals: z
    .string()
    .describe(
      "A detailed description of the beneficiary's career or personal development goals."
    ),
  completedModules: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the completed module.'),
        name: z.string().describe('Name of the completed module.'),
        category: z.string().describe('Category of the completed module.'),
      })
    )
    .describe('A list of training modules the beneficiary has already completed.'),
  availableModules: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the available module.'),
        name: z.string().describe('Name of the available module.'),
        description: z.string().describe('Description of the available module.'),
        category: z.string().describe('Category of the available module.'),
        link: z.string().url().describe('URL to access the available module.'),
      })
    )
    .describe('A list of all training modules currently available in the system.'),
  availableExternalResources: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the external resource.'),
        name: z.string().describe('Name of the external resource.'),
        description: z.string().describe('Description of the external resource.'),
        url: z.string().url().describe('URL to access the external resource.'),
        category: z.string().describe('Category of the external resource.'),
      })
    )
    .describe('A list of potential external resources relevant for empowerment.'),
  availableMentorshipTopics: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the mentorship topic.'),
        name: z.string().describe('Name of the mentorship topic.'),
        description: z.string().describe('Description of the mentorship topic.'),
      })
    )
    .describe('A list of potential mentorship topics for discussion with a mentor.'),
});

export type PersonalizedEmpowermentRecommendationsInput = z.infer<
  typeof PersonalizedEmpowermentRecommendationsInputSchema
>;

const PersonalizedEmpowermentRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        type: z
          .enum(['training_module', 'external_resource', 'mentorship_topic'])
          .describe('The type of recommendation.'),
        id: z.string().describe('The ID of the recommended item.'),
        title: z.string().describe('The title of the recommended item.'),
        description: z
          .string()
          .describe('A brief explanation of why this item is recommended.'),
        link: z.string().url().optional().describe('Optional URL for the recommendation.'),
        category: z.string().optional().describe('Optional category for the recommendation.'),
      })
    )
    .describe('A list of personalized recommendations.'),
});

export type PersonalizedEmpowermentRecommendationsOutput = z.infer<
  typeof PersonalizedEmpowermentRecommendationsOutputSchema
>;
