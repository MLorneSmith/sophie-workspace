import { z } from "zod";

/**
 * Workflow steps for SlideHeroes' presentation creation wizard.
 *
 * Steps: Profile → Assemble → Outline → Storyboard → Generate.
 */
export const WORKFLOW_STEPS = [
	"profile",
	"assemble",
	"outline",
	"storyboard",
	"generate",
] as const;

export const WorkflowStepSchema = z.enum(WORKFLOW_STEPS);
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

/**
 * Presentation types supported in the Assemble step.
 *
 * Source of truth aligns with `blocks/_config/formContent.ts`.
 */
export const PresentationTypeSchema = z.enum([
	"general",
	"sales",
	"consulting",
	"fundraising",
]);

/**
 * Convenience export for UI components.
 *
 * Note: derived from the schema's enum options.
 */
export const PRESENTATION_TYPES = PresentationTypeSchema.options;
export type PresentationType = z.infer<typeof PresentationTypeSchema>;

/**
 * Question types supported in the Assemble step.
 *
 * Source of truth aligns with `blocks/_config/formContent.ts`.
 */
export const QuestionTypeSchema = z.enum([
	"strategy",
	"assessment",
	"implementation",
	"diagnostic",
	"alternatives",
	"postmortem",
]);

/**
 * Convenience export for UI components.
 *
 * Note: derived from the schema's enum options.
 */
export const QUESTION_TYPES = QuestionTypeSchema.options;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * 1) PresentationProject — top-level project metadata.
 *
 * Represents the persistent presentation project entity that tracks workflow progress.
 */
export const PresentationProjectSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1),
	userId: z.string().min(1),
	currentStep: WorkflowStepSchema,
	completedSteps: z.array(WorkflowStepSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	templateId: z.string().min(1).nullable(),
});
export type PresentationProject = z.infer<typeof PresentationProjectSchema>;

/**
 * AudienceBriefAdaptiveAnswer — a single adaptive question + answer captured during Profile.
 */
export const AudienceBriefAdaptiveAnswerSchema = z.object({
	questionId: z.string().min(1),
	question: z.string().min(1),
	answer: z.string(),
});
export type AudienceBriefAdaptiveAnswer = z.infer<
	typeof AudienceBriefAdaptiveAnswerSchema
>;

/**
 * 2) AudienceBrief — output of the Profile step.
 *
 * This is the user-editable brief plus the structured/internal representation used
 * for downstream context injection.
 */
export const AudienceBriefSchema = z.object({
	id: z.string().uuid(),
	presentationId: z.string().min(1),
	personName: z.string().min(1),
	company: z.string().min(1).nullable(),
	title: z.string().min(1).nullable(),
	linkedinUrl: z.string().url().nullable(),
	// Raw enrichment payload from Netrows and/or other research sources.
	enrichmentData: z.record(z.string(), z.unknown()),
	adaptiveAnswers: z.array(AudienceBriefAdaptiveAnswerSchema),
	// Generated editable brief (markdown / rich text string).
	briefText: z.string(),
	// Structured view of the brief (e.g., key insights, comms style, priorities, concerns).
	briefStructured: z.record(z.string(), z.unknown()),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});
export type AudienceBrief = z.infer<typeof AudienceBriefSchema>;

/**
 * 4) ArgumentMapNode — Pyramid Principle tree node.
 *
 * Produced during Assemble step as the structured argument map.
 */
export const ArgumentMapNodeTypeSchema = z.enum([
	"claim",
	"support",
	"evidence",
]);
export type ArgumentMapNodeType = z.infer<typeof ArgumentMapNodeTypeSchema>;

type ArgumentMapNodeShape = {
	id: string;
	text: string;
	type: ArgumentMapNodeType;
	children: ArgumentMapNodeShape[];
};

export const ArgumentMapNodeSchema: z.ZodType<ArgumentMapNodeShape> = z.lazy(
	() =>
		z.object({
			id: z.string().uuid(),
			text: z.string().min(1),
			type: ArgumentMapNodeTypeSchema,
			children: z.array(ArgumentMapNodeSchema),
		}),
);
export type ArgumentMapNode = z.infer<typeof ArgumentMapNodeSchema>;

/**
 * 5) MaterialItem — uploaded/attached material.
 *
 * Captured during Assemble (Materials sub-step) and used as input context.
 */
export const MaterialItemTypeSchema = z.enum(["upload", "braindump", "link"]);
export type MaterialItemType = z.infer<typeof MaterialItemTypeSchema>;

export const MaterialItemSchema = z.object({
	id: z.string().uuid(),
	type: MaterialItemTypeSchema,
	name: z.string().min(1),
	// Extracted text for uploads, raw text for braindump, URL for links.
	content: z.string().nullable(),
	mimeType: z.string().min(1).nullable(),
	fileUrl: z.string().url().nullable(),
});
export type MaterialItem = z.infer<typeof MaterialItemSchema>;

/**
 * 3) AssembleOutput — output of the Assemble step.
 *
 * Contains the framing (presentation type, SC) and the Pyramid Principle argument map.
 */
export const AssembleOutputSchema = z.object({
	presentationId: z.string().min(1),
	presentationType: PresentationTypeSchema,
	situation: z.string(),
	complication: z.string(),
	questionType: QuestionTypeSchema,
	argumentMap: ArgumentMapNodeSchema,
	materials: z.array(MaterialItemSchema),
});
export type AssembleOutput = z.infer<typeof AssembleOutputSchema>;

/**
 * 7) OutlineSection — a single narrative section within the Outline artifact.
 *
 * Produced/edited during Outline step.
 */
export const OutlineSectionTypeSchema = z.enum([
	"introduction",
	"body",
	"conclusion",
	"nextSteps",
]);
export type OutlineSectionType = z.infer<typeof OutlineSectionTypeSchema>;

export const OutlineSectionSchema = z.object({
	id: z.string().uuid(),
	type: OutlineSectionTypeSchema,
	title: z.string(),
	// Rich text representation (stored as a TipTap JSON string).
	content: z.string(),
	supportingPoints: z.array(z.string()),
	order: z.number().int().nonnegative(),
});
export type OutlineSection = z.infer<typeof OutlineSectionSchema>;

/**
 * 6) OutlineContent — output of the Outline step.
 */
export const OutlineContentSchema = z.object({
	presentationId: z.string().min(1),
	sections: z.array(OutlineSectionSchema),
	updatedAt: z.string().datetime(),
});
export type OutlineContent = z.infer<typeof OutlineContentSchema>;

/**
 * 10) ContentBlock — a block of slide content within a storyboard slide.
 *
 * Produced/edited during Storyboard step.
 */
export const ContentBlockTypeSchema = z.enum([
	"text",
	"chart",
	"image",
	"table",
	"quote",
	"statistic",
]);
export type ContentBlockType = z.infer<typeof ContentBlockTypeSchema>;

export const ContentBlockSchema = z.object({
	id: z.string().uuid(),
	type: ContentBlockTypeSchema,
	// Text content or structured data serialized as JSON string.
	content: z.string(),
	order: z.number().int().nonnegative(),
});
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

/**
 * 9) StoryboardSlide — a single slide definition in the storyboard.
 *
 * Produced/edited during Storyboard step.
 */
export const StoryboardSlideSchema = z.object({
	id: z.string().uuid(),
	order: z.number().int().nonnegative(),
	purpose: z.string(),
	takeawayHeadline: z.string(),
	contentBlocks: z.array(ContentBlockSchema),
	layout: z.string().min(1),
	speakerNotes: z.string().nullable(),
	outlineSectionId: z.string().min(1).nullable(),
});
export type StoryboardSlide = z.infer<typeof StoryboardSlideSchema>;

/**
 * 8) StoryboardContent — output of the Storyboard step.
 */
export const StoryboardContentSchema = z.object({
	presentationId: z.string().min(1),
	slides: z.array(StoryboardSlideSchema),
	updatedAt: z.string().datetime(),
});
export type StoryboardContent = z.infer<typeof StoryboardContentSchema>;

/**
 * 11) GenerateOutput — output of the Generate step.
 *
 * Captures template selection and export metadata.
 */
export const ExportFormatSchema = z.enum(["pptx", "pdf"]);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const GenerateOutputSchema = z.object({
	presentationId: z.string().min(1),
	templateId: z.string().min(1),
	exportFormat: ExportFormatSchema,
	exportUrl: z.string().url().nullable(),
	generatedAt: z.string().datetime().nullable(),
});
export type GenerateOutput = z.infer<typeof GenerateOutputSchema>;

/**
 * LLM outline response schema for validating RAG path output.
 *
 * Used to validate the JSON response from the LLM when generating outlines
 * with deck content as context.
 */
export const LLMSectionSchema = z.object({
	title: z.string(),
	content: z.string(),
});
export type LLMSection = z.infer<typeof LLMSectionSchema>;

export const LLMOutlineResponseSchema = z.object({
	sections: z.array(LLMSectionSchema),
});
export type LLMOutlineResponse = z.infer<typeof LLMOutlineResponseSchema>;
