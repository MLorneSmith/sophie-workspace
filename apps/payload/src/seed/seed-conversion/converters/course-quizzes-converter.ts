import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkdownWithFrontmatter } from "../parsers/mdoc-parser-simple";
import type { ReferenceManager } from "../utils/reference-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuizMeta {
	title: string;
	description: string;
	timeLimit?: number;
	passingScore?: number;
	maxAttempts?: number;
	showCorrectAnswers?: boolean;
	randomizeQuestions?: boolean;
	course?: string;
	lesson?: string;
	sourceFile: string;
}

interface CourseQuizJson {
	id: string;
	title: string;
	description: string;
	instructions?: {
		root: {
			type: string;
			children: Array<{
				type: string;
				version: number;
				[k: string]: unknown;
			}>;
			direction: ('ltr' | 'rtl') | null;
			format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
			indent: number;
			version: number;
		};
		[k: string]: unknown;
	};
	timeLimit?: number;
	passingScore: number;
	maxAttempts: number;
	showCorrectAnswers: boolean;
	randomizeQuestions: boolean;
	questions: string[]; // References to quiz questions
	course?: string; // Reference to course
	lesson?: string; // Reference to lesson
	published: boolean;
	createdAt: string;
	updatedAt: string;
}

export async function convertCourseQuizzes(
	referenceManager: ReferenceManager,
): Promise<void> {

	const sourceDir = path.join(__dirname, "../../../seed/seed-data-raw/quizzes");
	const outputDir = path.join(__dirname, "../../../seed/seed-data");

	// Read quiz questions mapping to get question references
	const quizQuestionsMapping = await loadQuizQuestionsMapping();

	// Read all quiz files
	const quizFiles = await fs.readdir(sourceDir);
	const mdocFiles = quizFiles.filter((file) => file.endsWith(".mdoc"));

	const quizzes: CourseQuizJson[] = [];
	const warnings: string[] = [];

	for (const file of mdocFiles) {
		const filePath = path.join(sourceDir, file);
		const content = await fs.readFile(filePath, "utf-8");

		try {
			const { data: frontmatter, content: markdownContent } =
				parseMarkdownWithFrontmatter(content);

			// Extract quiz metadata
			const quizMeta: QuizMeta = {
				title:
					frontmatter.title ||
					file.replace("-quiz.mdoc", "").replace(".mdoc", ""),
				description: frontmatter.description || "",
				timeLimit: frontmatter.timeLimit
					? parseInt(frontmatter.timeLimit)
					: undefined,
				passingScore: frontmatter.passingScore
					? parseInt(frontmatter.passingScore)
					: 70,
				maxAttempts: frontmatter.maxAttempts
					? parseInt(frontmatter.maxAttempts)
					: 3,
				showCorrectAnswers: frontmatter.showCorrectAnswers ?? true,
				randomizeQuestions: frontmatter.randomizeQuestions ?? false,
				course: frontmatter.course || frontmatter.courseId,
				lesson: frontmatter.lesson || frontmatter.lessonId,
				sourceFile: file,
			};

			// Generate quiz ID from filename
			const quizId = file.replace("-quiz.mdoc", "").replace(".mdoc", "");

			// Convert instructions to Lexical format if present
			let instructions: {
				root: {
					type: string;
					children: Array<{
						type: string;
						version: number;
						[k: string]: unknown;
					}>;
					direction: ('ltr' | 'rtl') | null;
					format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
					indent: number;
					version: number;
				};
				[k: string]: unknown;
			} | undefined;
			if (markdownContent.trim()) {
				instructions = convertToSimpleLexical(markdownContent);
			}

			// Get question references for this quiz
			const questionRefs = getQuestionReferencesForQuiz(
				quizId,
				quizQuestionsMapping,
			);

			// Determine course reference
			const courseRef = determineCourseFromQuiz(quizId, quizMeta);

			// Determine lesson reference
			const lessonRef = determineLessonFromQuiz(quizId, quizMeta);

			// Build quiz object
			const quiz: CourseQuizJson = {
				id: quizId,
				title: quizMeta.title,
				description: quizMeta.description,
				passingScore: quizMeta.passingScore || 70,
				maxAttempts: quizMeta.maxAttempts || 3,
				showCorrectAnswers: quizMeta.showCorrectAnswers ?? true,
				randomizeQuestions: quizMeta.randomizeQuestions ?? false,
				questions: questionRefs,
				published: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Add optional fields
			if (instructions) {
				quiz.instructions = instructions;
			}

			if (quizMeta.timeLimit) {
				quiz.timeLimit = quizMeta.timeLimit;
			}

			if (courseRef) {
				quiz.course = `{ref:courses:${courseRef}}`;
			}

			if (lessonRef) {
				quiz.lesson = `{ref:course-lessons:${lessonRef}}`;
			}

			quizzes.push(quiz);

			// Add to reference manager
			referenceManager.addMapping({
				type: "course-quizzes",
				originalId: quizId,
				identifier: quizId,
			});
		} catch (error) {
			warnings.push(`Failed to parse quiz ${file}: ${error}`);
		}
	}

	// Successfully converted quizzes
	if (warnings.length > 0) {
		// Warnings occurred during conversion
	}

	// Save quizzes
	const outputPath = path.join(outputDir, "course-quizzes.json");
	await fs.writeFile(outputPath, JSON.stringify(quizzes, null, 2));
}

async function loadQuizQuestionsMapping(): Promise<Record<string, unknown>> {
	try {
		const mappingPath = path.join(
			__dirname,
			"../../../seed-data/quiz-questions-mapping.json",
		);
		const content = await fs.readFile(mappingPath, "utf-8");
		return JSON.parse(content);
	} catch (_error) {
		// Quiz questions mapping not found, quizzes will have empty question arrays
		return {};
	}
}

function getQuestionReferencesForQuiz(quizId: string, mapping: Record<string, unknown>): string[] {
	// Look for quiz in mapping
	if (mapping[quizId]) {
		return mapping[quizId].map(
			(questionId: string) => `{ref:quiz-questions:${questionId}}`,
		);
	}

	// Try variations of the quiz ID
	const variations = [
		quizId,
		`${quizId}-quiz`,
		quizId.replace("-quiz", ""),
		quizId.replace("quiz-", ""),
		// Convert kebab-case to other formats
		quizId.replace(/-/g, "_"),
		quizId.replace(/-/g, " "),
	];

	for (const variation of variations) {
		if (mapping[variation]) {
			return mapping[variation].map(
				(questionId: string) => `{ref:quiz-questions:${questionId}}`,
			);
		}
	}

	return [];
}

function determineCourseFromQuiz(
	quizId: string,
	meta: QuizMeta,
): string | undefined {
	// Check if course is explicitly set
	if (meta.course) {
		return meta.course;
	}

	// Map quiz names to courses based on content
	const quizToCourseMapping: Record<string, string> = {
		"our-process-quiz": "course-1",
		"structure-quiz": "course-2",
		"the-who-quiz": "course-2",
		"introductions-quiz": "course-2",
		"why-next-steps-quiz": "course-2",
		"idea-generation-quiz": "course-3",
		"using-stories-quiz": "course-3",
		"storyboards-in-film-quiz": "course-3",
		"storyboards-in-presentations-quiz": "course-3",
		"fact-persuasion-quiz": "course-4",
		"preparation-practice-quiz": "course-4",
		"performance-quiz": "course-4",
		"overview-elements-of-design-quiz": "course-5",
		"elements-of-design-detail-quiz": "course-5",
		"visual-perception-quiz": "course-5",
		"gestalt-principles-quiz": "course-5",
		"slide-composition-quiz": "course-6",
		"tables-vs-graphs-quiz": "course-7",
		"basic-graphs-quiz": "course-7",
		"specialist-graphs-quiz": "course-7",
	};

	return quizToCourseMapping[quizId];
}

function determineLessonFromQuiz(
	quizId: string,
	meta: QuizMeta,
): string | undefined {
	// Check if lesson is explicitly set
	if (meta.lesson) {
		return meta.lesson;
	}

	// Map quiz names to lessons (remove -quiz suffix)
	const lessonId = quizId.replace("-quiz", "");

	// Common lesson mappings
	const quizToLessonMapping: Record<string, string> = {
		"our-process-quiz": "our-process",
		"structure-quiz": "what-is-structure",
		"the-who-quiz": "the-who",
		"introductions-quiz": "the-why-introductions",
		"why-next-steps-quiz": "the-why-next-steps",
		"idea-generation-quiz": "idea-generation",
		"using-stories-quiz": "using-stories",
		"storyboards-in-film-quiz": "storyboards-film",
		"storyboards-in-presentations-quiz": "storyboards-presentations",
		"fact-persuasion-quiz": "fact-based-persuasion",
		"preparation-practice-quiz": "preparation-practice",
		"performance-quiz": "performance",
		"overview-elements-of-design-quiz": "fundamental-design-overview",
		"elements-of-design-detail-quiz": "fundamental-design-detail",
		"visual-perception-quiz": "visual-perception",
		"gestalt-principles-quiz": "gestalt-principles",
		"slide-composition-quiz": "slide-composition",
		"tables-vs-graphs-quiz": "tables-vs-graphs",
		"basic-graphs-quiz": "basic-graphs",
		"specialist-graphs-quiz": "specialist-graphs",
	};

	return quizToLessonMapping[quizId] || lessonId;
}

function convertToSimpleLexical(markdown: string): {
	root: {
		type: string;
		children: Array<{
			type: string;
			version: number;
			[k: string]: unknown;
		}>;
		direction: ('ltr' | 'rtl') | null;
		format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
		indent: number;
		version: number;
	};
	[k: string]: unknown;
} {
	// Split content into paragraphs
	const paragraphs = markdown
		.split("\n\n")
		.filter((p) => p.trim())
		.map((p) => p.trim());

	const children = paragraphs.map((paragraph) => {
		// Handle different types of content
		if (paragraph.startsWith("#")) {
			// Headers
			const level = paragraph.match(/^#+/)?.[0].length || 1;
			const text = paragraph.replace(/^#+\s*/, "");
			return {
				type: "heading",
				tag: `h${Math.min(level, 6)}`,
				children: [{ type: "text", text }],
			};
		}

		// Regular paragraph
		return {
			type: "paragraph",
			children: [{ type: "text", text: paragraph }],
		};
	});

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children,
		},
	};
}
