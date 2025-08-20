import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkdownWithFrontmatter } from "../parsers/mdoc-parser-simple";
import type { ReferenceManager } from "../utils/reference-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LessonMeta {
	title: string;
	description: string;
	videoID?: string;
	videoPlatform?: string;
	quizID?: string;
	duration?: number;
	order?: number;
	sourceFile: string;
}

interface CourseLessonJson {
	id: string;
	title: string;
	description: string;
	content: {
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
	video?: {
		platform: string;
		videoId: string;
	};
	quiz?: string; // Reference to quiz
	surveys?: string[]; // References to surveys
	downloads?: string[]; // References to downloads
	order: number;
	duration?: number;
	course: string; // Reference to course
	published: boolean;
	createdAt: string;
	updatedAt: string;
}

export async function convertCourseLessons(
	referenceManager: ReferenceManager,
): Promise<void> {

	const sourceDir = path.join(__dirname, "../../../seed/seed-data-raw/lessons");
	const outputDir = path.join(__dirname, "../../../seed/seed-data");

	// Read all lesson files
	const lessonFiles = await fs.readdir(sourceDir);
	const mdocFiles = lessonFiles.filter((file) => file.endsWith(".mdoc"));

	const lessons: CourseLessonJson[] = [];
	const warnings: string[] = [];

	for (const file of mdocFiles) {
		const filePath = path.join(sourceDir, file);
		const content = await fs.readFile(filePath, "utf-8");

		try {
			const { data: frontmatter, content: markdownContent } =
				parseMarkdownWithFrontmatter(content);

			// Extract lesson metadata
			const lessonMeta: LessonMeta = {
				title: String(frontmatter.title || file.replace(".mdoc", "")),
				description: String(frontmatter.description || ""),
				videoID: frontmatter.videoID ? String(frontmatter.videoID) : 
					frontmatter.video_id ? String(frontmatter.video_id) : undefined,
				videoPlatform: frontmatter.videoPlatform ? String(frontmatter.videoPlatform) :
					frontmatter.video_platform ? String(frontmatter.video_platform) : "bunny",
				quizID: frontmatter.quizID ? String(frontmatter.quizID) :
					frontmatter.quiz_id ? String(frontmatter.quiz_id) : undefined,
				duration: frontmatter.duration
					? parseInt(String(frontmatter.duration))
					: undefined,
				order: frontmatter.order ? parseInt(String(frontmatter.order)) : undefined,
				sourceFile: file,
			};

			// Determine course based on lesson numbering or directory structure
			const courseId = determineCourseFromLesson(file, frontmatter);

			// Convert content to simple Lexical format
			const lexicalContent = convertToSimpleLexical(markdownContent);

			// Generate lesson ID
			const lessonId = file.replace(".mdoc", "");

			// Build lesson object
			const lesson: CourseLessonJson = {
				id: lessonId,
				title: lessonMeta.title,
				description: lessonMeta.description,
				content: lexicalContent,
				order: lessonMeta.order || getOrderFromFilename(file),
				duration: lessonMeta.duration,
				course: `{ref:courses:${courseId}}`,
				published: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Add video if present
			if (lessonMeta.videoID) {
				lesson.video = {
					platform: lessonMeta.videoPlatform || "bunny",
					videoId: lessonMeta.videoID,
				};
			}

			// Add quiz reference if present
			if (lessonMeta.quizID) {
				lesson.quiz = `{ref:course-quizzes:${lessonMeta.quizID}}`;
			}

			// Extract and add download references
			const downloadRefs = extractDownloadReferences(markdownContent);
			if (downloadRefs.length > 0) {
				lesson.downloads = downloadRefs.map((ref) => `{ref:downloads:${ref}}`);
			}

			// Extract and add survey references
			const surveyRefs = extractSurveyReferences(markdownContent, frontmatter);
			if (surveyRefs.length > 0) {
				lesson.surveys = surveyRefs.map((ref) => `{ref:surveys:${ref}}`);
			}

			lessons.push(lesson);

			// Add to reference manager
			referenceManager.addMapping({
				type: "collection",
				collection: "course-lessons",
				originalId: lessonId,
				identifier: lessonId,
			});
		} catch (error) {
			warnings.push(`Failed to parse lesson ${file}: ${error}`);
		}
	}

	// Sort lessons by order
	lessons.sort((a, b) => a.order - b.order);

	// Successfully converted lessons
	if (warnings.length > 0) {
		// Warnings occurred during conversion
	}

	// Save lessons
	const outputPath = path.join(outputDir, "course-lessons.json");
	await fs.writeFile(outputPath, JSON.stringify(lessons, null, 2));
}

function determineCourseFromLesson(filename: string, frontmatter: Record<string, unknown>): string {
	// Check if course is explicitly set in frontmatter
	if (frontmatter.course || frontmatter.courseId) {
		return frontmatter.course || frontmatter.courseId;
	}

	// Try to determine from lesson numbering pattern
	// Lessons are numbered like: 101, 102, 201, 202, etc.
	// Where first digit = course, remaining digits = lesson order
	const orderMatch = filename.match(/(\d+)/);
	if (orderMatch) {
		const orderNum = parseInt(orderMatch[1]);
		if (orderNum >= 100) {
			const courseNum = Math.floor(orderNum / 100);
			return `course-${courseNum}`;
		}
	}

	// Fallback mapping based on content or filename patterns
	const contentMappings: Record<string, string> = {
		"lesson-0": "course-1",
		"before-we-begin": "course-1",
		congratulations: "course-1",
		"before-you-go": "course-1",
		"our-process": "course-1",
		"what-is-structure": "course-2",
		"the-who": "course-2",
		"the-why-introductions": "course-2",
		"the-why-next-steps": "course-2",
		"idea-generation": "course-3",
		"using-stories": "course-3",
		"storyboards-film": "course-3",
		"storyboards-presentations": "course-3",
		"fact-based-persuasion": "course-4",
		"preparation-practice": "course-4",
		performance: "course-4",
		"fundamental-design-overview": "course-5",
		"fundamental-design-detail": "course-5",
		"visual-perception": "course-5",
		"gestalt-principles": "course-5",
		"slide-composition": "course-6",
		"tables-vs-graphs": "course-7",
		"basic-graphs": "course-7",
		"specialist-graphs": "course-7",
		"tools-and-resources": "course-8",
	};

	const baseName = filename.replace(".mdoc", "");
	return contentMappings[baseName] || "course-1";
}

function getOrderFromFilename(filename: string): number {
	// Try to extract order number from filename
	const orderMatch = filename.match(/(\d+)/);
	if (orderMatch) {
		const orderNum = parseInt(orderMatch[1]);
		if (orderNum >= 100) {
			// Return lesson number within course (last 2 digits)
			return orderNum % 100;
		}
		return orderNum;
	}

	// Fallback: use alphabetical order
	return filename.charCodeAt(0);
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
		} else if (paragraph.includes("{% bunny")) {
			// Video components
			const videoMatch = paragraph.match(/{% bunny\s+([^%]+)\s+%}/);
			if (videoMatch) {
				return {
					type: "bunny-video",
					videoId: videoMatch[1].trim(),
					children: [{ type: "text", text: "" }],
				};
			}
		} else if (paragraph.includes("{% highlight")) {
			// Highlight components
			const highlightMatch = paragraph.match(/{% highlight\s+([^%]+)\s+%}/);
			if (highlightMatch) {
				return {
					type: "highlight",
					content: highlightMatch[1].trim(),
					children: [{ type: "text", text: highlightMatch[1].trim() }],
				};
			}
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

function extractDownloadReferences(content: string): string[] {
	const downloadRefs: string[] = [];

	// Look for download links or references
	const downloadPatterns = [
		/download[^\s]*['"]\s*:\s*['"](.*?)['"]/gi,
		/href=['"](.*?\.(?:pdf|docx?|xlsx?|pptx?|zip|rar))['"]/gi,
		/\[.*?\]\((.*?\.(?:pdf|docx?|xlsx?|pptx?|zip|rar))\)/gi,
	];

	downloadPatterns.forEach((pattern) => {
		const matches = content.matchAll(pattern);
		for (const match of matches) {
			const url = match[1];
			if (url && !downloadRefs.includes(url)) {
				downloadRefs.push(url);
			}
		}
	});

	return downloadRefs;
}

function extractSurveyReferences(content: string, frontmatter: Record<string, unknown>): string[] {
	const surveyRefs: string[] = [];

	// Check frontmatter for survey references
	if (frontmatter.survey || frontmatter.surveyId) {
		surveyRefs.push(frontmatter.survey || frontmatter.surveyId);
	}

	if (frontmatter.surveys) {
		const surveys = Array.isArray(frontmatter.surveys)
			? frontmatter.surveys
			: [frontmatter.surveys];
		surveyRefs.push(...surveys);
	}

	// Look for survey references in content
	const surveyPatterns = [
		/survey['"]\s*:\s*['"](.*?)['"]/gi,
		/\{%\s*survey\s+([^%]+)\s*%\}/gi,
	];

	surveyPatterns.forEach((pattern) => {
		const matches = content.matchAll(pattern);
		for (const match of matches) {
			const surveyId = match[1].trim();
			if (surveyId && !surveyRefs.includes(surveyId)) {
				surveyRefs.push(surveyId);
			}
		}
	});

	return surveyRefs;
}
