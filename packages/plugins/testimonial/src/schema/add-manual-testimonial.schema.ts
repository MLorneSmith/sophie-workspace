import { z } from "zod";

// Simplified flat schema to reduce type complexity
export const AddManualTestimonialSchema = z.object({
	customer: z.object({
		name: z.string().min(1).max(255),
		company: z.string().optional(),
		avatarUrl: z.string().optional(),
	}),
	source: z.object({
		source: z.string().min(1).max(255),
		externalLink: z.string().optional(),
	}),
	content: z.object({
		text: z.string().min(30).max(5000),
		rating: z.number().int().min(1).max(5),
	}),
});

// Export simplified type for better memory usage
export type AddManualTestimonialData = {
	customer: {
		name: string;
		company?: string;
		avatarUrl?: string;
	};
	source: {
		source: string;
		externalLink?: string;
	};
	content: {
		text: string;
		rating: number;
	};
};
