import { z } from 'zod';

export const AddManualTestimonialSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(255),
    company: z.string().min(1).max(255).optional(),
    avatarUrl: z.string().url().optional(),
  }),
  source: z.object({
    source: z.string().min(1).max(255),
    externalLink: z.string().url().optional(),
  }),
  content: z.object({
    text: z.string().min(30).max(5000),
    rating: z.number().int().min(1).max(5),
  }),
});
