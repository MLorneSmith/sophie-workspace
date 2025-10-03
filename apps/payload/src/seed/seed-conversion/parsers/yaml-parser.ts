import yaml from "js-yaml";
import type { ParsedContent } from "../types";

export interface SurveyData {
	title: string;
	slug: string;
	description?: string;
	status: "draft" | "published";
	language: string;
	questions: Array<{
		question: string;
		answers: Array<{
			answer: string;
			value?: number;
		}>;
		questioncategory?: string;
		questionspin?: "positive" | "negative" | "neutral";
		type: "scale" | "multiple-choice" | "text" | "boolean";
	}>;
}

export function parseYamlFile(content: string): ParsedContent {
	try {
		const data = yaml.load(content) as SurveyData;

		// Extract any references
		const collectionReferences: Array<{
			collection: string;
			identifier: string;
		}> = [];

		// Surveys might reference lessons
		if (data.slug) {
			// Check if this survey is meant to be linked to a lesson
			// This would be determined by naming convention or additional metadata
		}

		return {
			frontmatter: data as unknown as Record<string, unknown>,
			content: "", // YAML files don't have separate content
			references: {
				media: [],
				downloads: [],
				collections: collectionReferences,
			},
		};
	} catch (error) {
		throw new Error(`Failed to parse YAML: ${error}`);
	}
}

export function convertSurveyToPayloadFormat(surveyData: SurveyData): any {
	return {
		title: surveyData.title,
		slug: surveyData.slug,
		description: surveyData.description || "",
		status: surveyData.status,
		language: surveyData.language,
		questions: surveyData.questions.map((q, index) => ({
			id: `question-${index + 1}`,
			question: q.question,
			questionType: mapQuestionType(q.type),
			questionCategory: q.questioncategory || "general",
			questionSpin: q.questionspin || "neutral",
			answers: q.answers.map((a, aIndex) => ({
				id: `answer-${index + 1}-${aIndex + 1}`,
				answer: a.answer,
				value: a.value || aIndex + 1,
			})),
		})),
	};
}

function mapQuestionType(type: string): string {
	const typeMap: Record<string, string> = {
		scale: "scale",
		"multiple-choice": "multipleChoice",
		text: "text",
		boolean: "boolean",
	};

	return typeMap[type] || "text";
}
