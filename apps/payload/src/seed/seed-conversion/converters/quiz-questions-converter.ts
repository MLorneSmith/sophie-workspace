import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { QuizQuestion } from "../../payload-types";
import type { ReferenceManager } from "../utils/reference-manager";
import { createServiceLogger } from "@kit/shared/logger";
import { parseMdoc } from "../parsers/mdoc-parser";
import { v4 as uuidv4 } from "uuid";
import * as yaml from "js-yaml";

const { getLogger } = createServiceLogger("SEED-CONVERTER");

interface MdocQuizQuestion {
	question: string;
	questiontype: "single-answer" | "multi-answer";
	answers: Array<{
		answer: string;
		correct: boolean;
	}>;
}

interface MdocQuizData {
	frontmatter: {
		title: string;
		status: string;
		publishedAt: string;
		language: string;
		order: number;
	};
	questions: MdocQuizQuestion[];
}

export async function convertQuizQuestions(
	referenceManager: ReferenceManager,
): Promise<void> {
	const logger = await getLogger();
	logger.info("Converting quiz questions from mdoc files...");

	try {
		// Read quiz files from quizzes directory
		const quizzesDir = path.join(
			process.cwd(),
			"src/seed/seed-data-raw/quizzes",
		);
		const files = await fs.readdir(quizzesDir);
		const mdocFiles = files.filter((f) => f.endsWith(".mdoc"));

		const allQuestions: Partial<QuizQuestion>[] = [];
		const quizToQuestionsMap = new Map<string, string[]>();

		for (const file of mdocFiles) {
			const filePath = path.join(quizzesDir, file);
			const content = await fs.readFile(filePath, "utf-8");

			// Parse the mdoc file
			const quizData = parseMdocQuiz(content);
			const quizSlug = file.replace(".mdoc", "");

			const questionIds: string[] = [];

			// Convert each question
			quizData.questions.forEach((question, index) => {
				const questionId = uuidv4();
				questionIds.push(questionId);

				const quizQuestion: Partial<QuizQuestion> = {
					id: questionId,
					text: question.question,
					type:
						question.questiontype === "multi-answer"
							? "multipleChoice"
							: "singleChoice",
					options: question.answers.map((answer) => answer.answer),
					correctOptionIndices: question.answers
						.map((answer, idx) => (answer.correct ? idx : -1))
						.filter((idx) => idx !== -1),
					explanation: createLexicalExplanation(question),
					order: index + 1,
					points: 1,
					tags: [],
					_status: "published",
				};

				// For single choice questions, ensure only one correct answer
				if (
					question.questiontype === "single-answer" &&
					quizQuestion.correctOptionIndices &&
					quizQuestion.correctOptionIndices.length > 1
				) {
					logger.warn(
						`Quiz ${quizSlug} question ${index + 1} marked as single-answer but has multiple correct answers`,
					);
					// Take only the first correct answer
					quizQuestion.correctOptionIndices = [
						quizQuestion.correctOptionIndices[0],
					];
				}

				allQuestions.push(quizQuestion);

				// Add reference for future converters
				referenceManager.addMapping({
					type: "collection",
					collection: "quiz-questions",
					originalId: `${quizSlug}-q${index + 1}`,
					identifier: questionId,
					newId: questionId,
				});
			});

			// Store mapping of quiz to its questions for course-quizzes converter
			quizToQuestionsMap.set(quizSlug, questionIds);
		}

		// Also parse the TypeScript file if it exists for additional questions
		const tsFilePath = path.join(
			process.cwd(),
			"src/seed/seed-data-raw/quizzes-quiz-questions-truth.ts",
		);
		if (await fileExists(tsFilePath)) {
			const tsQuestions = await parseTypeScriptQuizQuestions(tsFilePath);

			for (const tsQuestion of tsQuestions) {
				// Check if we already have this question from mdoc
				const exists = allQuestions.some((q) => q.text === tsQuestion.text);
				if (!exists) {
					allQuestions.push(tsQuestion);
				}
			}
		}

		// Save to JSON
		const outputDir = path.join(process.cwd(), "src/seed/seed-data");
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(
			path.join(outputDir, "quiz-questions.json"),
			JSON.stringify(allQuestions, null, 2),
		);

		// Save quiz-to-questions mapping for course-quizzes converter
		await fs.writeFile(
			path.join(outputDir, "quiz-questions-mapping.json"),
			JSON.stringify(Object.fromEntries(quizToQuestionsMap), null, 2),
		);

		logger.info(
			`Successfully converted ${allQuestions.length} quiz questions from ${mdocFiles.length} quiz files`,
		);
	} catch (error) {
		logger.error("Failed to convert quiz questions", { error });
		throw error;
	}
}

function parseMdocQuiz(content: string): MdocQuizData {
	// Use js-yaml to parse YAML frontmatter

	const lines = content.split("\n");
	const frontmatterStart = lines.findIndex((line) => line === "---");
	const frontmatterEnd = lines.findIndex(
		(line, index) => index > frontmatterStart && line === "---",
	);

	if (frontmatterStart === -1 || frontmatterEnd === -1) {
		throw new Error("Invalid mdoc format: missing frontmatter delimiters");
	}

	// Extract frontmatter YAML
	const frontmatterYaml = lines
		.slice(frontmatterStart + 1, frontmatterEnd)
		.join("\n");
	const frontmatter = yaml.load(frontmatterYaml);

	// Questions are in the frontmatter
	const questions: MdocQuizQuestion[] = frontmatter.questions || [];

	return {
		frontmatter: {
			title: frontmatter.title || "",
			status: frontmatter.status || "published",
			publishedAt: frontmatter.publishedAt || "",
			language: frontmatter.language || "en",
			order: frontmatter.order || 0,
		},
		questions,
	};
}

function createLexicalExplanation(question: MdocQuizQuestion): any {
	// Create a basic Lexical explanation structure
	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children: [
				{
					type: "paragraph",
					format: "",
					indent: 0,
					version: 1,
					children: [
						{
							type: "text",
							format: 0,
							style: "",
							mode: "normal",
							detail: 0,
							text: `The correct answer${question.questiontype === "multi-answer" ? "s are" : " is"}: ${question.answers
								.filter((a) => a.correct)
								.map((a) => a.answer)
								.join(", ")}`,
							version: 1,
						},
					],
				},
			],
		},
	};
}

async function parseTypeScriptQuizQuestions(
	filePath: string,
): Promise<Partial<QuizQuestion>[]> {
	const content = await fs.readFile(filePath, "utf-8");

	// Extract the quizzes array from the TypeScript file
	const quizzesMatch = content.match(/const quizzes = (\[[\s\S]*?\]);/);
	if (!quizzesMatch) {
		return [];
	}

	try {
		// Evaluate the JavaScript to get the actual data
		// This is safe because we control the file content
		const quizzesData = eval(quizzesMatch[1]);

		const questions: Partial<QuizQuestion>[] = [];

		for (const quiz of quizzesData) {
			if (quiz.questions) {
				quiz.questions.forEach((q: any, index: number) => {
					questions.push({
						id: q.id || uuidv4(),
						text: q.text,
						type: "singleChoice", // Default to single choice
						options: q.options || [
							"Option A",
							"Option B",
							"Option C",
							"Option D",
						],
						correctOptionIndices: [q.correctOptionIndex || 0],
						explanation:
							q.explanation ||
							createLexicalExplanation({
								question: q.text,
								questiontype: "single-answer",
								answers: [],
							}),
						order: index + 1,
						points: 1,
						tags: [],
						_status: "published",
					});
				});
			}
		}

		return questions;
	} catch (_error) {
		// If parsing fails, return empty array
		return [];
	}
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}
