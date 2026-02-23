import { z } from "zod";

export const CompanyArchetypeSchema = z.enum([
	"in-trouble",
	"growing-fast",
	"in-transformation",
	"stable-mature",
	"industry-disruption",
]);

export const CompanyBriefSchema = z.object({
	companySnapshot: z.object({
		name: z.string().min(1),
		industry: z.string().min(1),
		size: z.string().min(1),
		marketPosition: z.string().min(1),
	}),
	currentSituation: z.object({
		summary: z.string().min(1),
		recentNews: z.array(z.string()),
		strategicFocus: z.string().min(1),
		challenges: z.array(z.string()),
		archetype: CompanyArchetypeSchema,
	}),
	industryContext: z.object({
		trends: z.array(z.string()),
		regulatory: z.string().min(1),
		competitors: z.array(z.string()),
	}),
	presentationImplications: z.object({
		framingAdvice: z.string().min(1),
		topicsToAcknowledge: z.array(z.string()),
		relevantBenchmarks: z.array(z.string()),
		avoidTopics: z.array(z.string()),
	}),
});

export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;
