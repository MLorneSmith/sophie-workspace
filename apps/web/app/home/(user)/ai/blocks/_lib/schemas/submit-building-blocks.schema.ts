import { z } from "zod";

export const SubmitBuildingBlocksSchema = z.object({
	title: z
		.string()
		.min(1, "Title is required")
		.max(200, "Title must be less than 200 characters"),
	audience: z
		.string()
		.min(1, "Audience is required")
		.max(200, "Audience must be less than 200 characters"),
	presentation_type: z.string().min(1, "Presentation type is required"),
	question_type: z.string().min(1, "Question type is required"),
	situation: z
		.string()
		.min(1, "Situation is required")
		.max(5000, "Situation must be less than 5000 characters"),
	complication: z
		.string()
		.min(1, "Complication is required")
		.max(5000, "Complication must be less than 5000 characters"),
	answer: z
		.string()
		.min(1, "Answer is required")
		.max(5000, "Answer must be less than 5000 characters"),
});

export type SubmitBuildingBlocksData = z.infer<
	typeof SubmitBuildingBlocksSchema
>;
