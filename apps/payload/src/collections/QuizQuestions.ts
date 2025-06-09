import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";

export const QuizQuestions: CollectionConfig = {
	slug: "quiz_questions",
	labels: {
		singular: "Quiz Question",
		plural: "Quiz Questions",
	},
	admin: {
		useAsTitle: "question",
		defaultColumns: ["question", "type"],
		description: "Questions for course quizzes",
	},
	access: {
		read: () => true,
	},
	versions: false, // Temporarily disable versioning for debugging
	fields: [
		{
			name: "question",
			type: "text",
			required: true,
		},
		{
			name: "type",
			type: "select",
			options: [
				{ label: "Multiple Choice", value: "multiple_choice" },
				// Future: add more question types as needed
			],
			defaultValue: "multiple_choice",
			required: true,
		},
		{
			name: "questionSlug",
			type: "text",
			required: true,
			// unique: true, // Temporarily remove to isolate queryability issue
			index: true, // Ensure the field is queryable
			admin: {
				readOnly: true,
				description:
					"Auto-generated unique slug for API lookups, derived from question text.",
			},
		},
		{
			name: "options",
			type: "array",
			required: true,
			fields: [
				{
					name: "text",
					type: "text",
					required: true,
				},
				{
					name: "isCorrect",
					type: "checkbox",
					defaultValue: false,
				},
			],
			validate: (options) => {
				if (!options || options.length < 1) {
					return "At least one option is required";
				}
				return true;
			},
		},
		{
			name: "explanation",
			type: "richText",
			editor: lexicalEditor(),
			required: false,
			admin: {
				description:
					"Optional explanation for this question (Lexical Rich Text)",
			},
		},
		{
			name: "order",
			type: "number",
			defaultValue: 0,
			admin: {
				description: "Order within the quiz (lower numbers appear first)",
			},
		},
	],
};
