import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { SurveyQuestion } from "../../payload-types";
import type { ReferenceManager } from "../utils/reference-manager";
import { createServiceLogger } from "@kit/shared/logger";
import { v4 as uuidv4 } from "uuid";
import * as yaml from "js-yaml";

const { getLogger } = createServiceLogger("SEED-CONVERTER");

interface SurveyQuestionData {
	question: string;
	answers: Array<{ answer: string }>;
	questioncategory?: string;
	questionspin?: "positive" | "negative";
	type?: "scale" | "text_field";
}

interface SurveyData {
	title: string;
	slug?: string;
	description?: string;
	status: string;
	language: string;
	questions: SurveyQuestionData[];
}

export async function convertSurveyQuestions(
	referenceManager: ReferenceManager,
): Promise<void> {
	const logger = await getLogger();
	logger.info("Converting survey questions from YAML files...");

	try {
		// Read survey files from surveys directory
		const surveysDir = path.join(
			process.cwd(),
			"src/seed/seed-data-raw/surveys",
		);
		const files = await fs.readdir(surveysDir);
		const yamlFiles = files.filter(
			(f) => f.endsWith(".yaml") || f.endsWith(".yml"),
		);

		const allQuestions: Partial<SurveyQuestion>[] = [];
		const surveyToQuestionsMap = new Map<string, string[]>();

		for (const file of yamlFiles) {
			const filePath = path.join(surveysDir, file);
			const content = await fs.readFile(filePath, "utf-8");

			// Parse the YAML file
			const surveyData = yaml.load(content) as SurveyData;
			const surveySlug = surveyData.slug || file.replace(/\.(yaml|yml)$/, "");

			const questionIds: string[] = [];

			// Convert each question
			surveyData.questions.forEach((question, index) => {
				const questionId = uuidv4();
				questionIds.push(questionId);

				const surveyQuestion: Partial<SurveyQuestion> = {
					id: questionId,
					text: question.question,
					type: mapQuestionType(question),
					options:
						question.answers && question.answers.length > 0
							? question.answers.map((a) => a.answer)
							: undefined,
					required: true,
					order: index + 1,
					category: question.questioncategory || "general",
					scoring: question.questionspin === "negative" ? "reverse" : "normal",
					tags: [],
					_status: "published",
				};

				// For scale questions, set default scale if no options provided
				if (
					surveyQuestion.type === "scale" &&
					(!surveyQuestion.options || surveyQuestion.options.length === 0)
				) {
					if (question.question.toLowerCase().includes("recommend")) {
						// NPS-style question (0-10)
						surveyQuestion.options = Array.from({ length: 11 }, (_, i) =>
							i.toString(),
						);
						surveyQuestion.scaleMin = 0;
						surveyQuestion.scaleMax = 10;
					} else {
						// Default 5-point Likert scale
						surveyQuestion.options = [
							"Strongly Disagree",
							"Disagree",
							"Neutral",
							"Agree",
							"Strongly Agree",
						];
						surveyQuestion.scaleMin = 1;
						surveyQuestion.scaleMax = 5;
					}
				}

				allQuestions.push(surveyQuestion);

				// Add reference for future converters
				referenceManager.addMapping({
					type: "collection",
					collection: "survey-questions",
					originalId: `${surveySlug}-q${index + 1}`,
					identifier: questionId,
					newId: questionId,
				});
			});

			// Store mapping of survey to its questions for surveys converter
			surveyToQuestionsMap.set(surveySlug, questionIds);

			logger.info(
				`Processed survey "${surveyData.title}" with ${surveyData.questions.length} questions`,
			);
		}

		// Save to JSON
		const outputDir = path.join(process.cwd(), "src/seed/seed-data");
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(
			path.join(outputDir, "survey-questions.json"),
			JSON.stringify(allQuestions, null, 2),
		);

		// Save survey-to-questions mapping for surveys converter
		await fs.writeFile(
			path.join(outputDir, "survey-questions-mapping.json"),
			JSON.stringify(Object.fromEntries(surveyToQuestionsMap), null, 2),
		);

		logger.info(
			`Successfully converted ${allQuestions.length} survey questions from ${yamlFiles.length} survey files`,
		);
	} catch (error) {
		logger.error("Failed to convert survey questions", { error });
		throw error;
	}
}

function mapQuestionType(
	question: SurveyQuestionData,
):
	| "text"
	| "textarea"
	| "select"
	| "radio"
	| "checkbox"
	| "scale"
	| "email"
	| "number" {
	// Explicit type mapping
	if (question.type === "text_field") {
		return "textarea";
	}

	if (question.type === "scale") {
		return "scale";
	}

	// Infer type from question content and answers
	if (!question.answers || question.answers.length === 0) {
		// No answers provided - likely a text field
		if (question.question.toLowerCase().includes("email")) {
			return "email";
		}
		if (
			question.question.toLowerCase().includes("number") ||
			question.question.toLowerCase().includes("age") ||
			question.question.toLowerCase().includes("years")
		) {
			return "number";
		}
		// Default to textarea for open-ended questions
		return "textarea";
	}

	// Has answers - determine based on question pattern
	if (question.answers.length <= 2) {
		return "radio"; // Yes/No or similar binary choice
	}

	if (
		question.answers.some(
			(answerObj) =>
				answerObj.answer.toLowerCase().includes("disagree") ||
				answerObj.answer.toLowerCase().includes("agree") ||
				answerObj.answer.toLowerCase().includes("satisfied") ||
				/^\d+/.test(answerObj.answer), // Numeric scale
		)
	) {
		return "scale";
	}

	if (question.answers.length <= 5) {
		return "radio"; // Small set of options
	}

	return "select"; // Larger set of options
}
