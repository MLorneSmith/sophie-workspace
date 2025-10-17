import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { QuizQuestion } from "../../../../payload-types";
import type { ReferenceManager } from "../utils/reference-manager";
import { createServiceLogger } from "@kit/shared/logger";
import { parseMarkdownWithFrontmatter } from "../parsers/mdoc-parser-simple";
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

			const questionSlugs: string[] = [];

			// Convert each question
			quizData.questions.forEach((question, index) => {
				const questionId = uuidv4();

				// Generate slug from question text - this becomes the _ref identifier
				const questionSlug = `${quizSlug}-q${index + 1}`;
				questionSlugs.push(questionSlug);

				const quizQuestion: Partial<QuizQuestion> = {
					_ref: questionSlug, // ✅ Add _ref field for seeding engine
					id: questionId,
					question: question.question,
					type: "multiple_choice",
					questionSlug: questionSlug,
					options: question.answers.map((answer) => ({
						text: answer.answer,
						isCorrect: answer.correct,
					})),
					explanation: createLexicalExplanation(question),
					order: index + 1,
				} as Partial<QuizQuestion> & { _ref: string };

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
			// Use questionSlugs (the _ref identifiers) not UUIDs
			quizToQuestionsMap.set(quizSlug, questionSlugs);
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
				const exists = allQuestions.some((q) => q.question === tsQuestion.question);
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
	const frontmatter = yaml.load(frontmatterYaml) as Record<string, unknown>;

	// Questions are in the frontmatter
	const questions: MdocQuizQuestion[] = Array.isArray(frontmatter.questions)
		? frontmatter.questions
		: [];

	return {
		frontmatter: {
			title: String(frontmatter.title || ""),
			status: String(frontmatter.status || "published"),
			publishedAt: String(frontmatter.publishedAt || ""),
			language: String(frontmatter.language || "en"),
			order: typeof frontmatter.order === 'number' ? frontmatter.order : 0,
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
				const quizSlug = quiz.slug || "unknown-quiz";
				quiz.questions.forEach((q: any, index: number) => {
					// Handle both string array and object array options
					let options: Array<{ text: string; isCorrect: boolean }>;
					if (Array.isArray(q.options)) {
						if (typeof q.options[0] === "string") {
							// Convert string array to object array
							const correctIndex = q.correctOptionIndex || 0;
							options = q.options.map((opt: string, idx: number) => ({
								text: opt.replace(/\s*\(correct\)\s*/i, ""),
								isCorrect: idx === correctIndex || /\(correct\)/i.test(opt),
							}));
						} else {
							// Already in object format
							options = q.options;
						}
					} else {
						// No options provided, use defaults
						options = [
							{ text: "Option A", isCorrect: true },
							{ text: "Option B", isCorrect: false },
							{ text: "Option C", isCorrect: false },
							{ text: "Option D", isCorrect: false },
						];
					}

					// Generate questionSlug
					const questionSlug = `${quizSlug}-q${index + 1}`;

					const qId = q.id || uuidv4();
					questions.push({
						_ref: questionSlug, // ✅ Add _ref field for seeding engine
						id: qId,
						question: q.text,
						type: "multiple_choice",
						questionSlug: questionSlug,
						options,
						explanation:
							q.explanation ||
							createLexicalExplanation({
								question: q.text,
								questiontype: "single-answer",
								answers: [],
							}),
						order: index + 1,
					} as Partial<QuizQuestion> & { _ref: string });
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
