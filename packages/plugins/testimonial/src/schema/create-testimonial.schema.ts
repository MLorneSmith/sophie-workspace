import { z } from 'zod';

export const TextTestimonialFormSchema = z.object({
  type: z.literal('text'),
  customerName: z.string().min(1, 'Customer name is required').max(255),
  content: z
    .string()
    .min(10, 'Testimonial content must be at least 10 characters')
    .max(5000, 'Testimonial content must be less than 5000 characters'),
  rating: z.number().min(1).max(5),
});

export const VideoTestimonialSchema = z.object({
  type: z.literal('video'),
  customerName: z.string().min(1, 'Customer name is required').max(255),
  content: z.string().optional(),
  rating: z.number().min(1).max(5),
  video: z.custom<string>(),
});
