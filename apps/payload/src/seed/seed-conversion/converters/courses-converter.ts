import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { Course } from "../../payload-types";
import type { ReferenceManager } from "../utils/reference-manager";
import { createServiceLogger } from "@kit/shared/logger";

const { getLogger } = createServiceLogger("SEED-CONVERTER");

interface RawLesson {
	lessonNumber: number;
	title: string;
	chapter: string;
}

interface CourseInfo {
	id: number;
	title: string;
	slug: string;
	description: string;
	chapters: Set<string>;
	lessonCount: number;
	firstLessonNumber: number;
	lastLessonNumber: number;
}

export async function convertCourses(
	referenceManager: ReferenceManager,
): Promise<void> {
	const logger = await getLogger();
	logger.info("Converting courses from lesson data...");

	try {
		// Read lesson files to infer courses
		const lessonsDir = path.join(
			process.cwd(),
			"src/seed/seed-data-raw/lessons",
		);
		const lessonFiles = await fs.readdir(lessonsDir);
		const mdocFiles = lessonFiles.filter((f) => f.endsWith(".mdoc"));

		// Parse lesson metadata
		const lessons: RawLesson[] = [];
		for (const file of mdocFiles) {
			const content = await fs.readFile(path.join(lessonsDir, file), "utf-8");
			const match = content.match(/^---\n([\s\S]*?)\n---/);
			if (match) {
				const frontmatter = match[1];
				const lessonNumber = parseInt(
					frontmatter.match(/lessonNumber:\s*(\d+)/)?.[1] || "0",
				);
				const title =
					frontmatter.match(/title:\s*["']?(.+?)["']?\n/)?.[1] || "";
				const chapter =
					frontmatter.match(/chapter:\s*["']?(.+?)["']?\n/)?.[1] || "";

				if (lessonNumber > 0) {
					lessons.push({ lessonNumber, title, chapter });
				}
			}
		}

		// Group lessons by course (first digit of lesson number)
		const courseMap = new Map<number, CourseInfo>();

		for (const lesson of lessons) {
			const courseId = Math.floor(lesson.lessonNumber / 100);

			if (!courseMap.has(courseId)) {
				courseMap.set(courseId, {
					id: courseId,
					title: getCourseTitle(courseId),
					slug: getCourseSlug(courseId),
					description: getCourseDescription(courseId),
					chapters: new Set<string>(),
					lessonCount: 0,
					firstLessonNumber: lesson.lessonNumber,
					lastLessonNumber: lesson.lessonNumber,
				});
			}

			const course = courseMap.get(courseId);
			if (!course) continue;
			course.chapters.add(lesson.chapter);
			course.lessonCount++;
			course.firstLessonNumber = Math.min(
				course.firstLessonNumber,
				lesson.lessonNumber,
			);
			course.lastLessonNumber = Math.max(
				course.lastLessonNumber,
				lesson.lessonNumber,
			);
		}

		// Convert to course objects
		const courses: Partial<Course>[] = [];

		for (const [courseId, courseInfo] of courseMap) {
			const course: Partial<Course> = {
				slug: courseInfo.slug,
				title: courseInfo.title,
				description: courseInfo.description,
				duration: courseInfo.lessonCount * 10, // Estimate 10 minutes per lesson
				level: getCourseLevel(courseId),
				sortOrder: courseId,
				status: "published",
				enrollmentLimit: null,
				courseCode: `DDM${courseId}`,
				credits: null,
				prerequisites: getCoursePrerequisites(courseId),
				learningOutcomes: getCourseLearningOutcomes(courseId),
				instructor: null,
				assistantInstructors: [],
				courseLessons: [], // Will be populated by course-lessons converter
				courseQuizzes: [], // Will be populated by course-quizzes converter
				enrollmentStartDate: null,
				enrollmentEndDate: null,
				courseStartDate: null,
				courseEndDate: null,
				thumbnail: null,
				tags: getCourseTags(courseInfo.chapters),
				category: getCourseCategory(courseId),
				certificateTemplate: null,
				completionCriteria: {
					minimumProgress: 80,
					requireAllLessons: true,
					requireAllQuizzes: true,
					minimumQuizScore: 70,
					customRequirements: null,
				},
				enableDiscussions: false,
				enableCertificates: true,
				_status: "published",
			};

			courses.push(course);

			// Add reference for future converters
			referenceManager.addMapping({
				type: "collection",
				collection: "courses",
				originalId: courseInfo.slug,
				identifier: courseInfo.slug,
				newId: courseInfo.slug,
			});
		}

		// Save to JSON
		const outputDir = path.join(process.cwd(), "src/seed/seed-data");
		await fs.mkdir(outputDir, { recursive: true });
		await fs.writeFile(
			path.join(outputDir, "courses.json"),
			JSON.stringify(courses, null, 2),
		);

		logger.info(`Successfully converted ${courses.length} courses`);
	} catch (error) {
		logger.error("Failed to convert courses", { error });
		throw error;
	}
}

function getCourseTitle(courseId: number): string {
	const titles: Record<number, string> = {
		1: "Getting Started",
		2: "The Start",
		3: "Structure",
		4: "Storytelling",
		5: "Design",
		6: "Facts & Data",
		7: "Performance",
		8: "Conclusion",
	};
	return titles[courseId] || `Course ${courseId}`;
}

function getCourseSlug(courseId: number): string {
	const slugs: Record<number, string> = {
		1: "getting-started",
		2: "the-start",
		3: "structure",
		4: "storytelling",
		5: "design",
		6: "facts-and-data",
		7: "performance",
		8: "conclusion",
	};
	return slugs[courseId] || `course-${courseId}`;
}

function getCourseDescription(courseId: number): string {
	const descriptions: Record<number, string> = {
		1: "Introduction to presentation design fundamentals and course structure. Learn the tools and resources you'll need to create compelling presentations.",
		2: "Understand your audience and purpose. Master the foundational process of defining who you're presenting to and why your message matters.",
		3: "Build a solid framework for your presentations. Learn how to generate ideas and create logical, compelling structures.",
		4: "Harness the power of narrative. Discover how to use stories and storyboards to make your presentations memorable and engaging.",
		5: "Master visual design principles. Learn fundamental design elements, Gestalt principles, and composition techniques for professional slides.",
		6: "Present data effectively. Transform complex information into clear, persuasive visual stories using tables, graphs, and data visualization.",
		7: "Deliver with confidence. Master preparation techniques and performance skills to present with impact.",
		8: "Wrap up your learning journey. Review key concepts and prepare for your next steps in presentation mastery.",
	};
	return descriptions[courseId] || "";
}

function getCourseLevel(
	courseId: number,
): "beginner" | "intermediate" | "advanced" {
	if (courseId <= 2) return "beginner";
	if (courseId <= 6) return "intermediate";
	return "advanced";
}

function getCoursePrerequisites(courseId: number): string | null {
	if (courseId === 1) return null;
	if (courseId === 2) return "Completion of Getting Started course";
	return `Completion of courses 1-${courseId - 1}`;
}

function getCourseLearningOutcomes(courseId: number): string[] {
	const outcomes: Record<number, string[]> = {
		1: [
			"Understand the course structure and learning approach",
			"Set up necessary tools and resources",
			"Navigate course materials effectively",
		],
		2: [
			"Define your target audience clearly",
			"Articulate your presentation's purpose",
			"Apply a systematic process to presentation development",
		],
		3: [
			"Generate compelling ideas for presentations",
			"Create logical and engaging presentation structures",
			"Organize content for maximum impact",
		],
		4: [
			"Integrate stories into presentations effectively",
			"Create visual storyboards for planning",
			"Use narrative techniques to enhance engagement",
		],
		5: [
			"Apply fundamental design principles",
			"Use Gestalt principles in slide design",
			"Create visually balanced compositions",
			"Choose appropriate visual elements",
		],
		6: [
			"Choose between tables and graphs appropriately",
			"Create clear and effective data visualizations",
			"Use data to support persuasive arguments",
			"Design specialist graphs for complex data",
		],
		7: [
			"Prepare thoroughly for presentations",
			"Practice effectively using proven techniques",
			"Deliver presentations with confidence and impact",
		],
		8: [
			"Synthesize learning from the entire course",
			"Create an action plan for continued improvement",
			"Apply presentation skills in real-world contexts",
		],
	};
	return outcomes[courseId] || [];
}

function getCourseTags(chapters: Set<string>): string[] {
	const tags: string[] = [];

	// Add chapter-based tags
	for (const chapter of chapters) {
		tags.push(chapter.replace(/-/g, " "));
	}

	// Add common tags
	tags.push(
		"presentation design",
		"visual communication",
		"business communication",
	);

	return [...new Set(tags)]; // Remove duplicates
}

function getCourseCategory(courseId: number): string {
	if (courseId <= 2) return "foundation";
	if (courseId <= 4) return "content-development";
	if (courseId <= 6) return "visual-design";
	return "delivery";
}
