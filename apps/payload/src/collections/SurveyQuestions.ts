import type { CollectionConfig } from "payload";
import type { SurveyQuestion } from "../../payload-types.js"; // Import the SurveyQuestion type

export const SurveyQuestions: CollectionConfig = {
	slug: "survey-questions",
	labels: {
		singular: "Survey Question",
		plural: "Survey Questions",
	},
	admin: {
		useAsTitle: "text",
		defaultColumns: ["text", "type", "category", "position"],
		description: "Questions for surveys",
	},
	access: {
		read: () => true, // Public read access
	},
	versions: {
		drafts: true,
	},
	fields: [
		{
			name: "questionSlug",
			type: "text",
			required: true,
			unique: true,
			index: true, // Ensure the field is queryable
			admin: {
				description: "Unique identifier for the survey question",
			},
		},
		{
			name: "text",
			type: "text",
			required: true,
			admin: {
				description: "The question text",
			},
		},
		{
			name: "type",
			type: "select",
			options: [
				{ label: "Multiple Choice", value: "multiple_choice" },
				{ label: "Text Field", value: "text_field" },
				{ label: "Textarea", value: "textarea" },
				{ label: "Scale", value: "scale" },
				// Future extensibility for other question types
			],
			defaultValue: "multiple_choice",
			required: true,
			admin: {
				description: "The type of question",
			},
		},
		{
			name: "description",
			type: "textarea",
			admin: {
				description: "Additional context or instructions for the question",
			},
		},
		{
			name: "required",
			type: "checkbox",
			defaultValue: true,
			admin: {
				description: "Whether this question requires an answer",
			},
		},
		{
			name: "options",
			type: "array",
			admin: {
				description: "Answer options for this question",
			},
			fields: [
				{
					name: "option",
					type: "text",
					required: true,
				},
			],
			validate: (options, args: { data?: Partial<SurveyQuestion> }) => {
				// Only apply validation if the type is multiple_choice or scale
				if (
					args?.data?.type === "multiple_choice" ||
					args?.data?.type === "scale"
				) {
					if (!options || options.length < 2) {
						return "At least two options are required";
					}
				}
				return true;
			},
		},
		{
			name: "category",
			type: "text",
			required: true,
			admin: {
				description:
					"The category this question belongs to (e.g., Structure, Story, Style)",
			},
		},
		{
			name: "questionspin", // Keeping the original name for now, but noted as potential typo
			type: "select",
			options: [
				{ label: "Positive", value: "Positive" },
				{ label: "Negative", value: "Negative" },
			],
			defaultValue: "Positive",
			required: true,
			admin: {
				description:
					"Whether a high score is positive or negative for this question",
			},
		},
		{
			name: "position",
			type: "number",
			defaultValue: 0,
			admin: {
				description: "Position in the survey (lower numbers appear first)",
			},
		},
	],
};
