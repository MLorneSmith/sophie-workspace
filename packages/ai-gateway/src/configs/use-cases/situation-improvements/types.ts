import { z } from 'zod';

/**
 * Schema for a single improvement suggestion
 */
export const SituationImprovementSchema = z.object({
  id: z.string(),
  headline: z.string().max(50, 'Headline must be under 50 characters'),
  rationale: z.string(),
  summaryPoint: z.string(),
  supportingPoints: z.array(z.string()).min(2).max(3),
});

/**
 * Schema for the complete improvements response
 */
export const SituationImprovementsResponseSchema = z.object({
  improvements: z.array(SituationImprovementSchema),
});

/**
 * Type for a single improvement suggestion
 */
export type SituationImprovement = z.infer<typeof SituationImprovementSchema>;

/**
 * Type for the complete improvements response
 */
export type SituationImprovementsResponse = z.infer<
  typeof SituationImprovementsResponseSchema
>;

/**
 * Schema for the input parameters
 */
export const SituationImprovementsInputSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

/**
 * Type for the input parameters
 */
export type SituationImprovementsInput = z.infer<
  typeof SituationImprovementsInputSchema
>;
