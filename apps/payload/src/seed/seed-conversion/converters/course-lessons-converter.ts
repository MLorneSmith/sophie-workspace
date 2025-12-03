import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	DOWNLOAD_ID_MAP,
	LESSON_DOWNLOADS_MAPPING,
} from "../../seed-data-raw/mappings/download-mappings.js";
import { lessonQuizMapping } from "../../seed-data-raw/mappings/lesson-quiz-mappings";
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
	thumbnail?: string;
	lessonLength?: number;
	publishedAt?: string;
}

interface LexicalContent {
	root: {
		type: string;
		children: Array<{
			type: string;
			version: number;
			[k: string]: unknown;
		}>;
		direction: ("ltr" | "rtl") | null;
		format: "left" | "start" | "center" | "right" | "end" | "justify" | "";
		indent: number;
		version: number;
	};
	[k: string]: unknown;
}

interface CourseLessonJson {
	_ref: string;
	id: string;
	slug: string;
	title: string;
	description: string;
	content: LexicalContent;
	bunny_video_id?: string; // Bunny video ID extracted from shortcode
	youtube_video_id?: string; // YouTube video ID from frontmatter
	video_source_type?: string; // Video platform: 'youtube' | 'vimeo' | 'bunny'
	quiz_id?: string; // Reference to quiz (renamed from quiz)
	survey_id?: string; // Reference to survey (renamed from surveys, now singular)
	downloads?: string[]; // References to downloads
	lesson_number: number;
	estimated_duration?: number; // Renamed from duration
	course_id: string; // Reference to course (renamed from course)
	thumbnail?: string; // Reference to media
	publishedAt?: string; // Published date from frontmatter
	todo_complete_quiz?: boolean; // Parse from To-Do section
	todo?: LexicalContent; // General todo instructions
	todo_watch_content?: LexicalContent; // Content to watch
	todo_read_content?: LexicalContent; // Content to read
	todo_course_project?: LexicalContent; // Course project instructions
	_status: "draft" | "published"; // Payload draft status
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
				videoID: frontmatter.videoID
					? String(frontmatter.videoID)
					: frontmatter.video_id
						? String(frontmatter.video_id)
						: undefined,
				videoPlatform: frontmatter.videoPlatform
					? String(frontmatter.videoPlatform)
					: frontmatter.video_platform
						? String(frontmatter.video_platform)
						: "bunny",
				quizID: frontmatter.quizID
					? String(frontmatter.quizID)
					: frontmatter.quiz_id
						? String(frontmatter.quiz_id)
						: undefined,
				duration: frontmatter.duration
					? parseInt(String(frontmatter.duration))
					: undefined,
				order: frontmatter.order
					? parseInt(String(frontmatter.order))
					: undefined,
				sourceFile: file,
				thumbnail: frontmatter.image ? String(frontmatter.image) : undefined,
				lessonLength: frontmatter.lessonLength
					? parseInt(String(frontmatter.lessonLength))
					: undefined,
				publishedAt: frontmatter.publishedAt
					? String(frontmatter.publishedAt)
					: undefined,
			};

			// Determine course based on lesson numbering or directory structure
			const courseId = determineCourseFromLesson(file, frontmatter);

			// Extract bunny video ID from shortcode in content
			const bunnyVideoId = extractBunnyVideoId(markdownContent);

			// Extract action item sections before stripping them from content
			const todoContent = extractTodoSectionContent(markdownContent);
			const watchContent = extractWatchSection(markdownContent);
			const readContent = extractReadSection(markdownContent);
			const courseProjectContent = extractCourseProjectSection(markdownContent);

			// Strip action sections from main content to prevent duplication
			const strippedContent = stripActionSections(markdownContent);

			// Convert content to simple Lexical format (without action sections)
			const lexicalContent = convertToSimpleLexical(strippedContent);

			// Generate lesson ID
			const lessonId = file.replace(".mdoc", "");

			// Build lesson object
			const lessonNumber = lessonMeta.order || getOrderFromFilename(file);
			const lesson: CourseLessonJson = {
				_ref: lessonId,
				id: lessonId,
				slug: lessonId, // Use lessonId as slug (URL-friendly identifier)
				title: lessonMeta.title,
				description: lessonMeta.description,
				content: lexicalContent,
				lesson_number: lessonNumber,
				estimated_duration: lessonMeta.lessonLength || lessonMeta.duration,
				course_id: `{ref:courses:${courseId}}`,
				_status: "published" as const, // Use _status instead of published for Payload drafts
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Add bunny video ID if present (extracted from shortcode)
			if (bunnyVideoId) {
				lesson.bunny_video_id = bunnyVideoId;
			}

			// Add YouTube/Vimeo video ID if present (from frontmatter)
			if (lessonMeta.videoID) {
				lesson.youtube_video_id = lessonMeta.videoID;
				lesson.video_source_type = lessonMeta.videoPlatform || "youtube";
			}

			// Add quiz reference using lesson-quiz mapping
			const quizSlug = lessonQuizMapping[lessonId];
			if (quizSlug) {
				lesson.quiz_id = `{ref:course-quizzes:${quizSlug}}`;
			}

			// Add download references using lesson-downloads mapping
			const downloadKeys =
				LESSON_DOWNLOADS_MAPPING[
					lessonId as keyof typeof LESSON_DOWNLOADS_MAPPING
				];
			if (downloadKeys && downloadKeys.length > 0) {
				// Use download keys directly as references (not UUIDs)
				lesson.downloads = downloadKeys.map(
					(key: string) => `{ref:downloads:${key}}`,
				);
			}

			// Extract and add survey reference (singular)
			const surveyRef = extractSurveyReference(markdownContent, frontmatter);
			if (surveyRef) {
				lesson.survey_id = `{ref:surveys:${surveyRef}}`;
			}

			// Map thumbnail from frontmatter image field
			if (lessonMeta.thumbnail) {
				// Extract directory name from path (e.g., "our-process" from "/cms/images/our-process/image.png")
				const pathParts = lessonMeta.thumbnail.split("/").filter((p) => p);
				const lessonDir = pathParts[pathParts.length - 2]; // Get directory name before filename
				if (lessonDir && lessonDir !== "images") {
					// Map lesson directory names to media _ref values (using underscores)
					// Some media files have different naming conventions than lesson directories
					const mediaRefMap: Record<string, string> = {
						"lesson-0": "lesson_zero",
						"before-we-begin": "before_we_begin",
						"tools-and-resources": "tools_resources",
						"our-process": "1-our_process",
						"the-who": "2-the_who",
						"the-why-introductions": "3-the_why_introductions",
						"the-why-next-steps": "4-the_why_next_steps",
						"idea-generation": "5-idea_generation",
						"what-is-structure": "6-what_structure",
						"what-structure": "6-what_structure",
						"using-stories": "7-using_stories",
						"storyboards-film": "8-storyboards_in_film",
						"storyboards-in-film": "8-storyboards_in_film",
						"storyboards-presentations": "9-storyboards_in_presentations",
						"storyboards-in-presentations": "9-storyboards_in_presentations",
						"visual-perception": "10-visual_perception",
						"fundamental-design-overview": "11-overview_elements_design",
						"overview-elements-design": "11-overview_elements_design",
						"fundamental-design-detail": "12-detail_elements_of_design",
						"detail-elements-of-design": "12-detail_elements_of_design",
						"gestalt-principles": "13-gestalt_principles_of_perception",
						"slide-composition": "14-slide_composition",
						"fact-based-persuasion": "15-fact_based_persuasion_overview",
						"tables-vs-graphs": "16-tables_vs_graphs",
						"basic-graphs": "17-standard_graphs",
						"standard-graphs": "17-standard_graphs",
						"specialist-graphs": "18-specialist_graphs",
						"preparation-practice": "19-preparation_practice",
						performance: "20-performance",
					};

					const mediaRef = mediaRefMap[lessonDir] || lessonDir;
					lesson.thumbnail = `{ref:media:${mediaRef}}`;
				}
			}

			// Map publishedAt from frontmatter and convert to ISO format
			if (lessonMeta.publishedAt) {
				lesson.publishedAt = new Date(lessonMeta.publishedAt).toISOString();
			}

			// Parse To-Do section to determine todo_complete_quiz
			const todoCompleteQuiz = parseTodoSection(markdownContent);
			if (todoCompleteQuiz !== null) {
				lesson.todo_complete_quiz = todoCompleteQuiz;
			}

			// Add structured todo fields if they have content
			if (todoContent) {
				const todoLexical = textToLexicalRichText(todoContent);
				if (todoLexical) {
					lesson.todo = todoLexical;
				}
			}

			if (watchContent) {
				const watchLexical = textToLexicalRichText(watchContent);
				if (watchLexical) {
					lesson.todo_watch_content = watchLexical;
				}
			}

			if (readContent) {
				const readLexical = textToLexicalRichText(readContent);
				if (readLexical) {
					lesson.todo_read_content = readLexical;
				}
			}

			if (courseProjectContent) {
				const courseProjectLexical = textToLexicalRichText(courseProjectContent);
				if (courseProjectLexical) {
					lesson.todo_course_project = courseProjectLexical;
				}
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

	// Sort lessons by lesson_number
	lessons.sort((a, b) => a.lesson_number - b.lesson_number);

	// Successfully converted lessons
	if (warnings.length > 0) {
		// Warnings occurred during conversion
	}

	// Save lessons
	const outputPath = path.join(outputDir, "course-lessons.json");
	await fs.writeFile(outputPath, JSON.stringify(lessons, null, 2));
}

function determineCourseFromLesson(
	filename: string,
	frontmatter: Record<string, unknown>,
): string {
	// Check if course is explicitly set in frontmatter
	if (frontmatter.course || frontmatter.courseId) {
		const courseValue = frontmatter.course || frontmatter.courseId;
		// Ensure it's a string before returning
		return typeof courseValue === "string" ? courseValue : String(courseValue);
	}

	// All lessons belong to the single "Decks for Decision Makers" course
	return "decks-for-decision-makers";
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
		direction: ("ltr" | "rtl") | null;
		format: "left" | "start" | "center" | "right" | "end" | "justify" | "";
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

	const children = paragraphs
		.map((paragraph) => {
			// Handle different types of content
			if (paragraph.startsWith("#")) {
				// Headers
				const level = paragraph.match(/^#+/)?.[0].length || 1;
				const text = paragraph.replace(/^#+\s*/, "");
				return {
					type: "heading",
					tag: `h${Math.min(level, 6)}`,
					version: 1,
					children: [{ type: "text", text }],
				};
			} else if (paragraph.includes("{% bunny")) {
				// Video components - match self-closing shortcode format: {% bunny bunnyvideoid="UUID" /%}
				// Skip bunny shortcodes entirely - the video ID is already extracted to bunny_video_id field
				// Return null to filter out this paragraph
				return null;
			} else if (paragraph.includes("{% highlight")) {
				// Highlight components
				const highlightMatch = paragraph.match(/{% highlight\s+([^%]+)\s+%}/);
				if (highlightMatch) {
					return {
						type: "highlight",
						content: highlightMatch[1].trim(),
						version: 1,
						children: [{ type: "text", text: highlightMatch[1].trim() }],
					};
				}
			}

			// Regular paragraph
			return {
				type: "paragraph",
				version: 1,
				children: [{ type: "text", text: paragraph }],
			};
		})
		.filter((child): child is NonNullable<typeof child> => child !== null);

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			direction: null,
			children,
		},
	};
}

function extractDownloadReferences(content: string): string[] {
	const downloadRefs: string[] = [];

	// Parse {% r2file %} shortcodes
	const r2filePattern =
		/{%\s*r2file\s+awsurl="([^"]+)"\s+filedescription="([^"]+)"\s*\/%}/gi;
	const r2fileMatches = content.matchAll(r2filePattern);

	for (const match of r2fileMatches) {
		const awsUrl = match[1];
		if (awsUrl) {
			// Extract filename from URL to create download reference
			const urlPath = decodeURIComponent(awsUrl.split("/").pop() || "");
			const downloadId = urlPath
				.replace(/\.[^.]+$/, "")
				.toLowerCase()
				.replace(/\s+/g, "-");
			if (downloadId && !downloadRefs.includes(downloadId)) {
				downloadRefs.push(downloadId);
			}
		}
	}

	// Also look for standard download links
	const downloadPatterns = [
		/download[^\s]*['"]\s*:\s*['"](.*?)['"]/gi,
		/href=['"](.*?\.(?:pdf|docx?|xlsx?|pptx?|zip|rar))['"]/gi,
		/\[.*?\]\((.*?\.(?:pdf|docx?|xlsx?|pptx?|zip|rar))\)/gi,
	];

	downloadPatterns.forEach((pattern) => {
		const matches = content.matchAll(pattern);
		for (const match of matches) {
			const url = match[1];
			if (url) {
				const urlPath = decodeURIComponent(url.split("/").pop() || "");
				const downloadId = urlPath
					.replace(/\.[^.]+$/, "")
					.toLowerCase()
					.replace(/\s+/g, "-");
				if (downloadId && !downloadRefs.includes(downloadId)) {
					downloadRefs.push(downloadId);
				}
			}
		}
	});

	return downloadRefs;
}

function extractSurveyReference(
	content: string,
	frontmatter: Record<string, unknown>,
): string | null {
	// Check frontmatter for survey reference (singular)
	if (frontmatter.survey || frontmatter.surveyId) {
		const surveyValue = frontmatter.survey || frontmatter.surveyId;
		return String(surveyValue);
	}

	// Also check for surveys array (backwards compatibility, return first)
	if (frontmatter.surveys) {
		const surveys = Array.isArray(frontmatter.surveys)
			? frontmatter.surveys
			: [frontmatter.surveys];
		if (surveys.length > 0) {
			return String(surveys[0]);
		}
	}

	// Look for survey references in content
	const surveyPatterns = [
		/survey['"]\s*:\s*['"](.*?)['"]/gi,
		/\{%\s*survey\s+([^%]+)\s*%\}/gi,
	];

	for (const pattern of surveyPatterns) {
		const matches = content.matchAll(pattern);
		for (const match of matches) {
			const surveyId = match[1].trim();
			if (surveyId) {
				return surveyId;
			}
		}
	}

	return null;
}

function extractBunnyVideoId(content: string): string | null {
	// Extract bunny video ID from {% bunny bunnyvideoid="..." /%} shortcode
	const bunnyPattern = /{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i;
	const match = content.match(bunnyPattern);
	return match ? match[1] : null;
}

function parseTodoSection(content: string): boolean | null {
	// Look for "To-Do" section and check if it contains "Complete the lesson quiz"
	const todoSectionPattern =
		/To-Do\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n[A-Z][a-z]+\s*\n|$)/i;
	const todoMatch = content.match(todoSectionPattern);

	if (todoMatch) {
		const todoContent = todoMatch[1];
		// Check if it contains references to completing quiz
		const hasCompleteQuiz = /complete\s+the\s+lesson\s+quiz/i.test(todoContent);
		return hasCompleteQuiz;
	}

	// If no To-Do section found, return null (no information)
	return null;
}

/**
 * Extracts a specific section from lesson content.
 * Sections are identified by their header (e.g., "To-Do", "Watch", "Read")
 * and end at the next section header, markdown heading, or end of content.
 *
 * @param content - The full markdown content
 * @param sectionHeader - The section header to find (e.g., "To-Do", "Watch")
 * @returns The bullet point content of the section, "none" if the section contains "None", or null if not found
 */
function extractSection(content: string, sectionHeader: string): string | null {
	// Build regex pattern to match section header and capture content until next section
	// Sections can be plain text headers like "Watch" or use {% custombullet %} prefix for "Course Project"
	const escapedHeader = sectionHeader.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const sectionPattern = new RegExp(
		`(?:{% custombullet[^%]*%})?\\s*${escapedHeader}\\s*\\n([\\s\\S]*?)(?=\\n(?:{% custombullet[^%]*%})?\\s*(?:To-Do|Watch|Read|Course Project)\\s*\\n|\\n###|\\n{% r2file|$)`,
		"i",
	);

	const match = content.match(sectionPattern);
	if (!match) {
		return null;
	}

	const sectionContent = match[1].trim();

	// Return "none" if section contains only "None" or is empty
	// This ensures all lesson fields always exist with consistent structure
	if (!sectionContent || /^\s*-?\s*None\s*$/i.test(sectionContent)) {
		return "none";
	}

	// Extract bullet points (lines starting with -)
	const bulletPoints = sectionContent
		.split("\n")
		.filter((line) => line.trim().startsWith("-"))
		.map((line) => line.trim().replace(/^-\s*/, "").trim())
		.filter((line) => line && !/^None$/i.test(line));

	// Return "none" if no bullet points found (ensures field always exists)
	if (bulletPoints.length === 0) {
		return "none";
	}

	return bulletPoints.join("\n");
}

/**
 * Extracts To-Do section content (general instructions, not quiz-related)
 */
function extractTodoSectionContent(content: string): string | null {
	const todoContent = extractSection(content, "To-Do");
	if (!todoContent) {
		return null;
	}

	// If the section only has "none", return it as-is
	if (todoContent === "none") {
		return "none";
	}

	// Filter out "Complete the lesson quiz" as that's handled by todo_complete_quiz
	const filteredLines = todoContent
		.split("\n")
		.filter((line) => !/complete\s+the\s+lesson\s+quiz/i.test(line));

	// Return "none" if all content was filtered out, ensuring field always exists
	return filteredLines.length > 0 ? filteredLines.join("\n") : "none";
}

/**
 * Extracts Watch section content
 */
function extractWatchSection(content: string): string | null {
	return extractSection(content, "Watch");
}

/**
 * Extracts Read section content
 */
function extractReadSection(content: string): string | null {
	return extractSection(content, "Read");
}

/**
 * Extracts Course Project section content
 */
function extractCourseProjectSection(content: string): string | null {
	return extractSection(content, "Course Project");
}

/**
 * Parses a line of text and extracts markdown links, returning an array of Lexical text/link nodes.
 * Handles multiple links per line and preserves surrounding text.
 *
 * @param lineText - The text to parse for markdown links
 * @returns Array of Lexical nodes (text and link nodes)
 */
function parseMarkdownLinks(
	lineText: string,
): Array<{ type: string; text?: string; url?: string; children?: Array<{ type: string; text: string }> }> {
	const nodes: Array<{ type: string; text?: string; url?: string; children?: Array<{ type: string; text: string }> }> = [];
	const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: Intentional assignment in loop condition for regex matching
	while ((match = linkPattern.exec(lineText)) !== null) {
		// Add text before the link (if any)
		if (match.index > lastIndex) {
			const textBefore = lineText.substring(lastIndex, match.index);
			if (textBefore) {
				nodes.push({ type: "text", text: textBefore });
			}
		}

		// Add the link node
		const linkText = match[1];
		const linkUrl = match[2];
		nodes.push({
			type: "link",
			url: linkUrl,
			children: [{ type: "text", text: linkText }],
		});

		lastIndex = match.index + match[0].length;
	}

	// Add any remaining text after the last link
	if (lastIndex < lineText.length) {
		const textAfter = lineText.substring(lastIndex);
		if (textAfter) {
			nodes.push({ type: "text", text: textAfter });
		}
	}

	// If no links were found, return a single text node
	if (nodes.length === 0) {
		nodes.push({ type: "text", text: lineText });
	}

	return nodes;
}

/**
 * Converts plain text (bullet points) to Lexical richText format.
 * Creates a proper Lexical structure with list items.
 * Parses markdown links [text](url) into proper Lexical link nodes.
 * For "none" content, creates a bullet list with "None" text (capitalized).
 */
function textToLexicalRichText(text: string): LexicalContent | null {
	if (!text || !text.trim()) {
		return null;
	}

	// Special case: if text is exactly "none", create a bullet list with "None" (capitalized)
	// This ensures consistent rendering with actual content (both as bullet lists)
	if (text.trim().toLowerCase() === "none") {
		return {
			root: {
				type: "root",
				format: "",
				indent: 0,
				version: 1,
				direction: null,
				children: [
					{
						type: "list",
						version: 1,
						listType: "bullet",
						start: 1,
						tag: "ul",
						children: [
							{
								type: "listitem",
								version: 1,
								value: 1,
								children: [
									{
										type: "paragraph",
										version: 1,
										children: [{ type: "text", text: "None" }],
									},
								],
							},
						],
					},
				],
			},
		};
	}

	const lines = text.split("\n").filter((line) => line.trim());

	if (lines.length === 0) {
		return null;
	}

	// Create list items from the lines, parsing markdown links
	const listItems = lines.map((line) => ({
		type: "listitem",
		version: 1,
		value: 1,
		children: [
			{
				type: "paragraph",
				version: 1,
				children: parseMarkdownLinks(line.trim()),
			},
		],
	}));

	// Wrap in an unordered list
	const children = [
		{
			type: "list",
			version: 1,
			listType: "bullet",
			start: 1,
			tag: "ul",
			children: listItems,
		},
	];

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			direction: null,
			children,
		},
	};
}

/**
 * Strips action item sections from markdown content.
 * Removes To-Do, Watch, Read, and Course Project sections to prevent duplication
 * in the main content field.
 */
function stripActionSections(content: string): string {
	// Remove To-Do section
	let result = content.replace(
		/To-Do\s*\n[\s\S]*?(?=\n(?:{% custombullet[^%]*%})?\s*(?:Watch|Read|Course Project)\s*\n|###|{% r2file|$)/i,
		"",
	);

	// Remove Watch section
	result = result.replace(
		/Watch\s*\n[\s\S]*?(?=\n(?:{% custombullet[^%]*%})?\s*(?:Read|Course Project)\s*\n|###|{% r2file|$)/i,
		"",
	);

	// Remove Read section
	result = result.replace(
		/Read\s*\n[\s\S]*?(?=\n(?:{% custombullet[^%]*%})?\s*(?:Course Project)\s*\n|###|{% r2file|$)/i,
		"",
	);

	// Remove Course Project section (with optional {% custombullet %} prefix)
	result = result.replace(
		/(?:{% custombullet[^%]*%})?\s*Course Project\s*\n[\s\S]*?(?=\n###|{% r2file|$)/i,
		"",
	);

	// Clean up multiple consecutive blank lines
	result = result.replace(/\n{3,}/g, "\n\n");

	return result.trim();
}
