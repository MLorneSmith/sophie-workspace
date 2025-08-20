import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import type { ReferenceManager } from "../utils/reference-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SurveyMeta {
	title: string;
	description: string;
	anonymous?: boolean;
	multipleSubmissions?: boolean;
	course?: string;
	lesson?: string;
	completionMessage?: string;
	sourceFile: string;
}

interface SurveyJson {
	id: string;
	title: string;
	description: string;
	instructions?: any; // Lexical JSON
	anonymous: boolean;
	multipleSubmissions: boolean;
	questions: string[]; // References to survey questions
	course?: string; // Reference to course
	lesson?: string; // Reference to lesson
	completionMessage?: any; // Lexical JSON
	published: boolean;
	createdAt: string;
	updatedAt: string;
}

export async function convertSurveys(
	referenceManager: ReferenceManager,
): Promise<void> {
	console.log("  📊 Converting surveys...");

	const sourceDir = path.join(__dirname, "../../../seed/seed-data-raw/surveys");
	const outputDir = path.join(__dirname, "../../../seed/seed-data");

	// Read survey questions mapping to get question references
	const surveyQuestionsMapping = await loadSurveyQuestionsMapping();

	// Read all survey files
	const surveyFiles = await fs.readdir(sourceDir);
	const yamlFiles = surveyFiles.filter(
		(file) => file.endsWith(".yaml") && !file.includes("Zone.Identifier"),
	);

	const surveys: SurveyJson[] = [];
	const warnings: string[] = [];

	for (const file of yamlFiles) {
		const filePath = path.join(sourceDir, file);
		const content = await fs.readFile(filePath, "utf-8");

		try {
			const surveyData = yaml.load(content) as any;

			if (!surveyData || typeof surveyData !== "object") {
				warnings.push(`Invalid YAML structure in ${file}`);
				continue;
			}

			// Extract survey metadata
			const surveyMeta: SurveyMeta = {
				title: surveyData.title || surveyData.name || file.replace(".yaml", ""),
				description: surveyData.description || "",
				anonymous: surveyData.anonymous ?? true,
				multipleSubmissions: surveyData.multipleSubmissions ?? false,
				course: surveyData.course || surveyData.courseId,
				lesson: surveyData.lesson || surveyData.lessonId,
				completionMessage: surveyData.completionMessage,
				sourceFile: file,
			};

			// Generate survey ID from filename
			const surveyId = file.replace(".yaml", "");

			// Convert instructions to Lexical format if present
			let instructions;
			if (surveyData.instructions) {
				instructions = convertTextToSimpleLexical(surveyData.instructions);
			}

			// Convert completion message to Lexical format if present
			let completionMessage;
			if (surveyMeta.completionMessage) {
				completionMessage = convertTextToSimpleLexical(
					surveyMeta.completionMessage,
				);
			}

			// Get question references for this survey
			const questionRefs = getQuestionReferencesForSurvey(
				surveyId,
				surveyQuestionsMapping,
			);

			// Determine course and lesson references
			const courseRef = determineCourseFromSurvey(surveyId, surveyMeta);
			const lessonRef = determineLessonFromSurvey(surveyId, surveyMeta);

			// Build survey object
			const survey: SurveyJson = {
				id: surveyId,
				title: surveyMeta.title,
				description: surveyMeta.description,
				anonymous: surveyMeta.anonymous ?? true,
				multipleSubmissions: surveyMeta.multipleSubmissions ?? false,
				questions: questionRefs,
				published: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Add optional fields
			if (instructions) {
				survey.instructions = instructions;
			}

			if (completionMessage) {
				survey.completionMessage = completionMessage;
			}

			if (courseRef) {
				survey.course = `{ref:courses:${courseRef}}`;
			}

			if (lessonRef) {
				survey.lesson = `{ref:course-lessons:${lessonRef}}`;
			}

			surveys.push(survey);

			// Add to reference manager
			referenceManager.addMapping({
				type: "collection",
				collection: "surveys",
				originalId: surveyId,
				identifier: surveyId,
			});
		} catch (error) {
			warnings.push(`Failed to parse survey ${file}: ${error}`);
			console.log(`    ⚠️  Warning: ${warnings[warnings.length - 1]}`);
		}
	}

	console.log(`    ✅ Converted ${surveys.length} surveys`);
	if (warnings.length > 0) {
		console.log(`    ⚠️  ${warnings.length} warnings`);
	}

	// Save surveys
	const outputPath = path.join(outputDir, "surveys.json");
	await fs.writeFile(outputPath, JSON.stringify(surveys, null, 2));
}

async function loadSurveyQuestionsMapping(): Promise<any> {
	try {
		const mappingPath = path.join(
			__dirname,
			"../../../seed-data/survey-questions-mapping.json",
		);
		const content = await fs.readFile(mappingPath, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.log(
			"    ⚠️  Survey questions mapping not found, surveys will have empty question arrays",
		);
		return {};
	}
}

function getQuestionReferencesForSurvey(
	surveyId: string,
	mapping: any,
): string[] {
	// Look for survey in mapping
	if (mapping[surveyId]) {
		return mapping[surveyId].map(
			(questionId: string) => `{ref:survey-questions:${questionId}}`,
		);
	}

	// Try variations of the survey ID
	const variations = [
		surveyId,
		`${surveyId}-survey`,
		surveyId.replace("-survey", ""),
		surveyId.replace("survey-", ""),
		// Convert kebab-case to other formats
		surveyId.replace(/-/g, "_"),
		surveyId.replace(/-/g, " "),
	];

	for (const variation of variations) {
		if (mapping[variation]) {
			return mapping[variation].map(
				(questionId: string) => `{ref:survey-questions:${questionId}}`,
			);
		}
	}

	return [];
}

function determineCourseFromSurvey(
	surveyId: string,
	meta: SurveyMeta,
): string | undefined {
	// Check if course is explicitly set
	if (meta.course) {
		return meta.course;
	}

	// Map survey names to courses based on content
	const surveyToCourseMapping: Record<string, string> = {
		"self-assessment": "course-1", // General assessment
		feedback: "course-8", // End-of-course feedback
		"three-quick-questions": "course-1", // Quick intro survey
	};

	return surveyToCourseMapping[surveyId];
}

function determineLessonFromSurvey(
	surveyId: string,
	meta: SurveyMeta,
): string | undefined {
	// Check if lesson is explicitly set
	if (meta.lesson) {
		return meta.lesson;
	}

	// Map survey names to lessons based on typical placement
	const surveyToLessonMapping: Record<string, string> = {
		"self-assessment": "before-we-begin", // Pre-course assessment
		feedback: "before-you-go", // Post-course feedback
		"three-quick-questions": "lesson-0", // Initial questions
	};

	return surveyToLessonMapping[surveyId];
}

function convertTextToSimpleLexical(text: string): any {
	// Handle simple text conversion to Lexical format
	if (typeof text !== "string") {
		text = String(text);
	}

	// Split into paragraphs if there are line breaks
	const paragraphs = text
		.split("\n\n")
		.filter((p) => p.trim())
		.map((p) => p.trim());

	const children = paragraphs.map((paragraph) => ({
		type: "paragraph",
		children: [{ type: "text", text: paragraph }],
	}));

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
